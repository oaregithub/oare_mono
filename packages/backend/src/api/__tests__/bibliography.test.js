import app from '@/app';
import { API_PATH } from '@/setupRoutes';
import request from 'supertest';
import sl from '@/serviceLocator';

describe('GET /bibliography/query', () => {
  const mockBibliographyDao = {

  };

  const setup = () => {
    sl.set('BibliographyDao', mockBibliographyDao);
  };

  beforeEach(setup);

  // const sendRequest = () => request(app).get(PATH);

  it('TODO /bibliography/query', async () => {
    expect('ABC').toBe('ABC');
  });
});

describe('GET /bibliography/style', () => {
  const mockBibliographyDao = {

  };

  const setup = () => {
  };

  beforeEach(setup);

  // const sendRequest = () => request(app).get(PATH);

  it('TODO /bibliography/style', async () => {
    expect('ABC').toBe('ABC');
  });
});
