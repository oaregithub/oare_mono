import axios from 'axios';

const host =
  process.env.NODE_ENV === 'development' ? 'http://localhost:8081' : '';

export default axios.create({
  baseURL: `${host}/api/v2`,
});
