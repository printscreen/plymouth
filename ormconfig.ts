import { DataSource } from 'typeorm';
import configuration from './src/config/configuration';

const config = configuration();

export const connectionSource = new DataSource({
  migrationsTableName: 'migrations',
  type: 'postgres',
  host: config.db.postgres.write.host,
  port: config.db.postgres.write.port,
  username: config.db.postgres.write.user,
  password: config.db.postgres.write.password,
  database: config.db.postgres.database,
  logging: false,
  synchronize: false,
  name: 'default',
  entities: ['src/**/**.entity{.ts,.js}'],
  migrations: ['src/shared/database/migrations/**/*{.ts,.js}'],
  subscribers: ['src/subscriber/**/*{.ts,.js}'],
});
