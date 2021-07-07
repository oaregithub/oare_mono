import { ScheduledHandler } from 'aws-lambda';

export const run: ScheduledHandler = async (event, context) => {
  const time = new Date();
  console.log(`The new func named "${context.functionName}" ran at ${time}`); // eslint-disable-line no-console
};
