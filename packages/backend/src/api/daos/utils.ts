import fs from 'fs';
import path from 'path';

export default function getQueryString(fileName: string) {
  return fs.readFileSync(path.join(__dirname, '../sql/', fileName)).toString();
}
