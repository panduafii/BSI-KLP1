import { INestApplication, VersioningType } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { DataSource, DataSourceOptions } from 'typeorm';
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';

const TEST_DB_URL =
  process.env.TEST_DATABASE_URL || 'postgres://bsi_user:supersecret@localhost:5432/bsi_klp1_test';

describe('Bookings & Maintenance (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let room: any;
  let adminToken: string;
  let studentToken: string;
  let student2Token: string;
  let AppModule: any;
  let typeormOptions: any;
  let Room: any;

  const buildDataSource = () => {
    const base = typeormOptions as PostgresConnectionOptions;
    const opts: PostgresConnectionOptions = {
      ...base,
      type: 'postgres',
      url: TEST_DB_URL,
      migrations: ['src/database/migrations/*.ts'],
      logging: false
    };
    return new DataSource(opts as DataSourceOptions);
  };

  const truncateAll = async () => {
    const queryRunner = dataSource.createQueryRunner();
    await queryRunner.query(
      'TRUNCATE "notification_outbox", "audit_logs", "bookings", "maintenance_tickets", "rooms", "users" RESTART IDENTITY CASCADE;'
    );
    await queryRunner.release();
  };

  const registerAndLogin = async (nim: string, password: string, role: string) => {
    await request(app.getHttpServer())
      .post('/v1/auth/register')
      .send({ nim, password, role })
      .expect(201);

    const res = await request(app.getHttpServer())
      .post('/v1/auth/login')
      .send({ nim, password })
      .expect(201);
    if (!res.body.accessToken) {
      throw new Error('Login did not return accessToken');
    }
    return res.body.accessToken as string;
  };

  beforeAll(async () => {
    process.env.DATABASE_URL = TEST_DB_URL;
    process.env.NODE_ENV = 'test';
    process.env.JWT_SECRET = 'test-secret';

    ({ AppModule } = await import('../src/app.module'));
    typeormOptions = (await import('../src/database/typeorm.config')).default;
    ({ Room } = await import('../src/modules/rooms/room.entity'));
    process.env.TS_NODE = 'true';

    dataSource = buildDataSource();
    await dataSource.initialize();
    await dataSource.runMigrations();

    await truncateAll();

    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule]
    }).compile();

    app = moduleFixture.createNestApplication();
    app.enableVersioning({ type: VersioningType.URI, prefix: 'v', defaultVersion: '1' });
    await app.init();
  });

  beforeEach(async () => {
    await truncateAll();
    const roomRepo = dataSource.getRepository(Room);
    room = await roomRepo.save(
      roomRepo.create({
        code: 'R1',
        name: 'Test Room',
        capacity: 50,
        location: 'Building A'
      })
    );
    const ts = Date.now();
    adminToken = await registerAndLogin(`1000${ts}`.slice(0, 10), 'password123', 'admin');
    studentToken = await registerAndLogin(`2000${ts}`.slice(0, 10), 'password123', 'student');
    student2Token = await registerAndLogin(`3000${ts}`.slice(0, 10), 'password123', 'student');

    expect(adminToken).toBeDefined();
    expect(studentToken).toBeDefined();

    // console.debug('admin token', adminToken);
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
    if (dataSource && dataSource.isInitialized) {
      await dataSource.destroy();
    }
  });

  it('creates a booking successfully', async () => {
    const res = await request(app.getHttpServer())
      .post('/v1/bookings')
      .set('Content-Type', 'application/json')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        roomId: room.id,
        startTime: '2025-12-10T10:00:00Z',
        endTime: '2025-12-10T11:00:00Z',
        priority: 'NORMAL',
        purpose: 'Testing'
      })
      .expect(201);

    expect(res.body.status).toBe('PENDING');
    expect(res.body.roomId).toBe(room.id);
  });

  it('rejects overlapping booking with 409', async () => {
    await request(app.getHttpServer())
      .post('/v1/bookings')
      .set('Content-Type', 'application/json')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        roomId: room.id,
        startTime: '2025-12-10T10:00:00Z',
        endTime: '2025-12-10T11:00:00Z',
        priority: 'NORMAL',
        purpose: 'First'
      })
      .expect(201);

    await request(app.getHttpServer())
      .post('/v1/bookings')
      .set('Content-Type', 'application/json')
      .set('Authorization', `Bearer ${student2Token}`)
      .send({
        roomId: room.id,
        startTime: '2025-12-10T10:30:00Z',
        endTime: '2025-12-10T11:30:00Z',
        priority: 'NORMAL',
        purpose: 'Overlap'
      })
      .expect(409);
  });

  it('blocks booking when maintenance is open', async () => {
    await request(app.getHttpServer())
      .post('/v1/maintenance')
      .set('Content-Type', 'application/json')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ roomId: room.id, title: 'Leak', description: 'AC leaking' })
      .expect(201);

    await request(app.getHttpServer())
      .post('/v1/bookings')
      .set('Content-Type', 'application/json')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        roomId: room.id,
        startTime: '2025-12-11T10:00:00Z',
        endTime: '2025-12-11T11:00:00Z',
        priority: 'NORMAL',
        purpose: 'Should fail'
      })
      .expect(409);
  });

  it('approves pending booking as admin', async () => {
    const createRes = await request(app.getHttpServer())
      .post('/v1/bookings')
      .set('Content-Type', 'application/json')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        roomId: room.id,
        startTime: '2025-12-12T10:00:00Z',
        endTime: '2025-12-12T11:00:00Z',
        priority: 'NORMAL',
        purpose: 'Approve path'
      })
      .expect(201);

    const approveRes = await request(app.getHttpServer())
      .post(`/v1/bookings/${createRes.body.id}/approve`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(201);

    expect(approveRes.body.status).toBe('APPROVED');
    expect(approveRes.body.approvedBy).toBeTruthy();
  });
});
