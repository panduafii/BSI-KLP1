import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class HealthService {
  constructor(private readonly dataSource: DataSource) {}

  async check() {
    const dbOk = await this.isDbUp();
    return {
      status: 'ok',
      db: dbOk ? 'up' : 'down'
    };
  }

  private async isDbUp() {
    try {
      if (!this.dataSource.isInitialized) {
        await this.dataSource.initialize();
      }
      await this.dataSource.query('SELECT 1');
      return true;
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('DB health check failed', err);
      return false;
    }
  }
}
