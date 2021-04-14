// eslint-disable-next-line quotes
const numberRegex = `"1/2"|"1/3"|"1/4"|"1/5"|"1/6"|"2/3"|"3/4"|"5/6"|([½⅓¼⅕⅙⅔¾⅚])|([0-9]+("."[0-9]+)?\b)|"LÁ"`;

export default `/* lexical grammar */
%lex
%%

" "+                   return 'SPACE'
"+"                   return '+'
"."                   return '.'
"-"                   return '-'
"(.)"                 return 'DETSEPARATOR'
"{-}"                 return 'COMPSEPARATOR'
([0-9]+("."[0-9]+)?\b|"LÁ")("+"([0-9]+("."[0-9]+)?\b|"LÁ"))+ return 'NUMBERPHRASE'
[0-9]+               return 'DIGITS'
[\u00C0-\u017FĂAĀÂBDEĒÊGḪHIĪÎYKLMNPQRSṢŠTṬUŪÛÚWZăaāâbdeēêgḫhiīîyklmnpqrsṣštṭuūûúwz,]+([₀₁₂₃₄₅₆₇₈₉]|[0-9]){0,2}  return 'SIGN'
"("                 return "("
")"                 return ")"
"{"                 return "{"
"}"                 return "}"
"="                 return "="


// any other characters will throw an error
.                     return 'INVALID'

/lex

%start expressions

%% /* language grammar */

expressions
  : phrase
  | expressions SPACE phrase
;

separator
  : '.'
  | '-'
;

phrase
  : opt_detphrase opt_beginning_number signphrase opt_signsuffix
  | DIGITS compphrase opt_compphrase_suffix
  | NUMBERPHRASE
  | DIGITS
;

opt_compphrase_suffix
  : '-' signphrase
  | /* empty */
;

opt_signsuffix
  : signsuffix
  | /* empty */
;

opt_beginning_number
  : beginning_number
  | /* empty */
;

beginning_number
  : DIGITS separator
;

signsuffix
  : detphrase
  | compphrase opt_compphrase_suffix
;

signphrase 
  : signphrase separator SIGN
  | SIGN
;


opt_detphrase
  : detphrase
  | /* empty */
;

detphrase
  : detsign
  | detphrase detsign
  | detphrase DETSEPARATOR detsign
;

detsign
  : '(' SIGN ')'
;

opt_compphrase
  : compphrase
  | /* empty */
;

compphrase
  : compsign
  | compphrase COMPSEPARATOR compsign
;

compsign
  : '{' SIGN '}'
;
`;
