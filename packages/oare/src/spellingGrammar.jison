/* lexical grammar */
%lex
%%

\s+                   return 'SPACE'
"+"                   return '+'
"-"                   return '-'
"."                   return '.'
([0-9]+("."[0-9]+)?\b)|"LÁ"  return 'NUMBER'
[a-zA-Z\u00C0-\u017F]+[₀₁₂₃₄₅₆₇₈₉]{0,2}    return 'SIGN'

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
  : signphrase '-' signphrase
  | signphrase '.' signphrase
  | SIGN
;

numberphrase 
  : numberphrase '+' numberphrase 
  | NUMBER 
;