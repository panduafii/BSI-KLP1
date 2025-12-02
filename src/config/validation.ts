import * as Joi from 'joi';

export const validationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'test', 'production').default('development'),
  PORT: Joi.number().port().default(3000),
  DATABASE_URL: Joi.string()
    .uri({ scheme: [/postgres/] })
    .required(),
  DATABASE_SSL: Joi.string().valid('true', 'false').optional(),
  JWT_SECRET: Joi.string().min(10).required(),
  JWT_EXPIRES: Joi.string().optional(),
  LOG_LEVEL: Joi.string().valid('debug', 'info', 'warn', 'error').default('debug')
});
