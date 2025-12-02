export default () => ({
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  logLevel: process.env.LOG_LEVEL || 'debug',
  database: {
    url: process.env.DATABASE_URL || '',
    ssl: process.env.DATABASE_SSL === 'true'
  },
  redis: {
    url: process.env.REDIS_URL || ''
  },
  auth: {
    jwtSecret: process.env.JWT_SECRET || 'change-me'
  }
});
