export default `/* lexical grammar */
%lex
%%

" "+                   return 'SPACE'
"+"                   return 'PLUS'
"-"|"."                   return 'SEPARATOR'
([0-9]+("."[0-9]+)?\b)|"LÁ"  return 'NUMBER'
[a-zA-Z\u00C0-\u017F]+([₀₁₂₃₄₅₆₇₈₉]|\d){0,2}    return 'SIGN'


// any other characters will throw an error
.                     return 'INVALID'

/lex

%start expressions

%% /* language grammar */

expressions
  : phrase
  | expressions SPACE expressions
;

phrase
  : numberphrase
  | signphrase
;

signphrase 
  : signphrase SEPARATOR signphrase
  | SIGN
;

numberphrase 
  : numberphrase PLUS numberphrase 
  | NUMBER 
;
`;
