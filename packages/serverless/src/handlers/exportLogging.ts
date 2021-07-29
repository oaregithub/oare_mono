import { ScheduledHandler } from 'aws-lambda';

export const createSnapshot: ScheduledHandler = (event, context, callback) => {
  console.log('createSnaphost called'); // eslint-disable-line no-console
  console.log('event'); // eslint-disable-line no-console
  console.log(event); // eslint-disable-line no-console
  console.log('context'); // eslint-disable-line no-console
  console.log(context); // eslint-disable-line no-console
  callback();
};
