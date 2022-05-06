import knex, { Knex } from 'knex';

type ProductionUrlMode = 'read' | 'write' | 'migration';

const getProductionUrl = (mode: ProductionUrlMode) => {
  if (mode === 'read') {
    return process.env.OARE_DB_URL_READ;
  } else if (mode === 'write') {
    return process.env.OARE_DB_URL_WRITE;
  } else {
    return process.env.OARE_DB_URL;
  }
};

export const knexConfig = (mode: ProductionUrlMode): Knex.Config => {
  return {
    client: 'mysql',
    connection:
      process.env.NODE_ENV === 'production'
        ? getProductionUrl(mode)
        : {
            host: 'localhost',
            user: 'root',
            port: 3306,
            password: 'example',
            database: 'oarebyue_0.3',
          },
    pool: { min: 0, max: 10 },
  };
};
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
  } else {
    return knexReadInstance;
  }
};
