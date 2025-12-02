import 'reflect-metadata';
import { config as loadEnv } from 'dotenv';
import * as bcrypt from 'bcrypt';
import { DataSource } from 'typeorm';

import options from '../src/database/typeorm.config';
import { User, UserRole } from '../src/modules/users/user.entity';

loadEnv();

async function main() {
  const ds = new DataSource({ ...(options as any), entities: [...(options as any).entities, User] });
  await ds.initialize();
  const repo = ds.getRepository(User);

  const defaultPassword = process.env.DEMO_PASSWORD || 'kelompok1';
  await upsertUser(repo, '19452025', UserRole.ADMIN, process.env.ADMIN_PASSWORD || defaultPassword);
  await upsertUser(repo, '22523026', UserRole.STUDENT, process.env.USER_PASSWORD || defaultPassword);

  await ds.destroy();
}

async function upsertUser(repo: any, nim: string, role: UserRole, password: string) {
  let user = await repo.findOne({ where: { nim } });
  if (user) {
    user.role = role;
    user.passwordHash = await bcrypt.hash(password, 10);
    await repo.save(user);
    console.log('Updated user', nim, 'role', role);
    return;
  }
  user = repo.create({ nim, email: nim, role, passwordHash: await bcrypt.hash(password, 10) });
  await repo.save(user);
  console.log('Created user', nim, 'role', role);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
