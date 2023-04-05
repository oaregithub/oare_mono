import knex, { Knex } from 'knex';

type ProductionUrlMode = 'read' | 'write' | 'migration';

const getConnection = (
  mode: ProductionUrlMode
): string | Knex.StaticConnectionConfig | undefined => {
  if (process.env.NODE_ENV === 'production') {
    if (mode === 'read') {
      return process.env.OARE_DB_URL_READ;
    }
    if (mode === 'write') {
      return process.env.OARE_DB_URL_WRITE;
    }
    return process.env.OARE_DB_URL;
  }

  if (process.env.DB_SOURCE === 'readonly') {
    return process.env.READONLY_DB_URL;
  }

  return {
    host: 'localhost',
    user: 'root',
    port: 3306,
    password: 'example',
    database: 'oarebyue_0.3',
  };
};

export const knexConfig = (mode: ProductionUrlMode): Knex.Config => ({
  client: 'mysql',
  connection: getConnection(mode),
  pool: { min: 0, max: 10 },
});
const knexWriteInstance = knex(knexConfig('write'));
const knexReadInstance = knex(knexConfig('read'));

let lastWrite: number | null = null;

export const knexWrite = () => {
  lastWrite = Date.now();
  return knexWriteInstance;
};

export const knexRead = () => {
  if (lastWrite && Date.now() < lastWrite + 45000) {
    return knexWriteInstance;
  }
  return knexReadInstance;
};
