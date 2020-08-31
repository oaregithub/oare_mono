import * as dotenv from 'dotenv';
import fs from 'fs';

let path;
switch (process.env.DB_VERSION) {
  case '0.3':
    path = `${__dirname}/../.env.3`;
    break;
  default:
    path = `${__dirname}/../.env`;
    break;
}

if (fs.existsSync(path)) {
  const envConfig = dotenv.parse(fs.readFileSync(path));

  Object.keys(envConfig).forEach((k) => {
    process.env[k] = envConfig[k];
  });
}
