const fs = require('fs');
const path = require('path');

const LINE_NUMBER = 41;
const FILE_LOCATION = path.join(
  __dirname,
  '..',
  '..',
  '..',
  'node_modules',
  'knex',
  'lib',
  'config-resolver.js'
);
const FIX_STRING =
  '\t\tDialect = require(`knex/lib/dialects/${resolvedClientName}/index.js`);'; //eslint-disable-line

const data = fs.readFileSync(FILE_LOCATION).toString().split('\n');
data[LINE_NUMBER - 1] = FIX_STRING;

fs.writeFileSync(FILE_LOCATION, data.join('\n'));
