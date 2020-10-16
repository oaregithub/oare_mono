import knex from 'knex';

export default knex({
  client: 'mysql',
  connection:
    process.env.NODE_ENV === 'development'
      ? {
          host: 'localhost',
          user: 'root',
          port: 3306,
          password: 'example',
          database: 'oarebyue_0.3',
        }
      : process.env.OARE_DB_URL,
  pool: { min: 0, max: 10 },
});
