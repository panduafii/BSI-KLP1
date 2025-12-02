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
  const nim = process.env.ADMIN_NIM || '00000001';
  const email = process.env.ADMIN_EMAIL || nim;
  const password = process.env.ADMIN_PASSWORD || 'admin123';
  const existing = await repo.findOne({ where: { nim } });
  if (existing) {
    console.log('Admin already exists:', existing.nim);
    await ds.destroy();
    return;
  }
  const passwordHash = await bcrypt.hash(password, 10);
  const user = repo.create({ nim, email: email.toLowerCase(), passwordHash, role: UserRole.ADMIN });
  await repo.save(user);
  console.log('Created admin user', nim);
  await ds.destroy();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
