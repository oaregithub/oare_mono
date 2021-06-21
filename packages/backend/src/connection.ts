import knex from 'knex';

export const knexConfig: knex.Config = {
  client: 'mysql',
  connection:
    process.env.ENVIRON === 'production'
      ? process.env.OARE_DB_URL
      : {
          host: 'localhost',
          user: 'root',
          port: 3306,
          password: 'example',
          database: 'oarebyue_0.3',
        },
  pool: { min: 0, max: 10 },
};

export default knex(knexConfig);
