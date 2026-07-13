import 'dotenv/config';
import { Sequelize } from 'sequelize';
import pg from 'pg';

// Reuse one instance across HMR reloads in dev
const globalRef = globalThis;

export const sequelize =
  globalRef.__sequelize ||
  new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    dialectModule: pg,
    logging: false,
    pool: { max: 10, min: 0, idle: 10000 },
  });

if (!globalRef.__sequelize) globalRef.__sequelize = sequelize;
