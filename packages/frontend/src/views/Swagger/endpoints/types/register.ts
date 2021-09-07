import { loginPayload } from './login';
import { user } from './user';

export const registerPayload = {
  firstName: {
    type: 'string',
  },
  lastName: {
    type: 'string',
  },
  ...loginPayload,
};

export const registerResponse = {
  user: {
    type: 'object',
    properties: user,
  },
  firebaseToken: {
    type: 'string',
  },
};
