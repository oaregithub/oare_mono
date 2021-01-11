import fs from 'fs';
import path from 'path';

const { Parser } = require('jison');

const bnf = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'spellingGrammar.jison'),
  'utf-8',
);
const parser = new Parser(bnf);

describe('spelling grammar test', () => {
  it('parses number phrase', () => {
    console.log(parser.generate());
  });
});
