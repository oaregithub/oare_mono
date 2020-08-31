import knex from 'knex';

export default knex({
  client: 'mysql',
  connection: process.env.OARE_DB_URL,
  pool: { min: 0, max: 10 },
});
