import { EditorMarkup } from '@oare/types';

export const applyMarkup = async (rowText: string): Promise<EditorMarkup[]> => {
  const determinativeAltMatches = rowText.match(/%((!")|(!!")|(\?'))/g) || [];
  determinativeAltMatches.forEach(match => {
    const newText = match.replace('%', '$');
    rowText = rowText.replace(match, newText);
  });

  const words = rowText.split(/[\s]+/).filter(word => word !== '');
  const pieces = words.map((word, index) => ({
    postMatches: word.match(/[\s\-.+%]+/g) || [],
    signs: word.split(/[-.+%]+/),
    wordIndex: index,
  }));
  const editorMarkup: EditorMarkup[] = pieces.flatMap(piece =>
    piece.signs.map((sign, idx) => ({
      text: sign,
      markup: [],
      post: piece.postMatches[idx] || '',
      wordIndex: piece.wordIndex,
    }))
  );

  let damageStatus = false;
  let pieceWithStart: number;
  let currentStartValue = 0;
  editorMarkup.forEach((piece, idx) => {
    let startChar: number | undefined;
    let endChar: number | undefined;
    const prefixMatches = piece.text.match(/\[/g);
    if (prefixMatches) {
      startChar = piece.text.indexOf('[');
      currentStartValue = startChar;
      damageStatus = true;
      pieceWithStart = idx;
    }

    if (damageStatus) {
      editorMarkup[idx] = {
        ...editorMarkup[idx],
        markup: [...editorMarkup[idx].markup, { type: 'damage' }],
      };
    }

    const postfixMatches = piece.text.match(/\]/g);
    if (postfixMatches) {
      endChar = piece.text.replace('[', '').indexOf(']');
      damageStatus = false;
    }

    if (startChar) {
      editorMarkup[idx] = {
        ...editorMarkup[idx],
        markup: [
          ...editorMarkup[idx].markup.filter(mark => mark.type !== 'damage'),
          {
            type: 'damage',
            startChar,
          },
        ],
      };
    }

    if (
      endChar &&
      ((endChar !== piece.text.replace('[', '').replace(']', '').length &&
        currentStartValue === 0) ||
        currentStartValue > 0)
    ) {
      const originalStartDamageRow = editorMarkup[idx].markup.filter(
        mark => mark.type === 'damage'
      )[0];
      editorMarkup[idx] = {
        ...editorMarkup[idx],
        markup: [
          ...editorMarkup[idx].markup.filter(mark => mark.type !== 'damage'),
          {
            ...originalStartDamageRow,
            endChar,
          },
        ],
      };
      const originalEndDamageRow = editorMarkup[pieceWithStart].markup.filter(
        mark => mark.type === 'damage'
      )[0];
      editorMarkup[pieceWithStart] = {
        ...editorMarkup[pieceWithStart],
        markup: [
          ...editorMarkup[pieceWithStart].markup.filter(
            mark => mark.type !== 'damage'
          ),
          {
            ...originalEndDamageRow,
            startChar: currentStartValue,
          },
        ],
      };
    }
  });

  let partialDamageStatus = false;
  let partialPieceWithStart: number;
  let currentPartialStartValue = 0;
  editorMarkup.forEach((piece, idx) => {
    let startChar: number | undefined;
    let endChar: number | undefined;
    const prefixMatches = piece.text.match(/⸢/g);
    if (prefixMatches) {
      startChar = piece.text.indexOf('⸢');
      currentPartialStartValue = startChar;
      partialDamageStatus = true;
      partialPieceWithStart = idx;
    }

    if (partialDamageStatus) {
      editorMarkup[idx] = {
        ...editorMarkup[idx],
        markup: [...editorMarkup[idx].markup, { type: 'partialDamage' }],
      };
    }

    const postfixMatches = piece.text.match(/⸣/g);
    if (postfixMatches) {
      endChar = piece.text.replace('⸢', '').indexOf('⸣');
      partialDamageStatus = false;
    }

    if (startChar) {
      editorMarkup[idx] = {
        ...editorMarkup[idx],
        markup: [
          ...editorMarkup[idx].markup.filter(
            mark => mark.type !== 'partialDamage'
          ),
          {
            type: 'partialDamage',
            startChar,
          },
        ],
      };
    }

    if (
      endChar &&
      ((endChar !== piece.text.replace('⸢', '').replace('⸣', '').length &&
        currentPartialStartValue === 0) ||
        currentPartialStartValue > 0)
    ) {
      const originalStartDamageRow = editorMarkup[idx].markup.filter(
        mark => mark.type === 'partialDamage'
      )[0];
      editorMarkup[idx] = {
        ...editorMarkup[idx],
        markup: [
          ...editorMarkup[idx].markup.filter(
            mark => mark.type !== 'partialDamage'
          ),
          {
            ...originalStartDamageRow,
            endChar,
          },
        ],
      };
      const originalEndDamageRow = editorMarkup[
        partialPieceWithStart
      ].markup.filter(mark => mark.type === 'partialDamage')[0];
      editorMarkup[partialPieceWithStart] = {
        ...editorMarkup[partialPieceWithStart],
        markup: [
          ...editorMarkup[partialPieceWithStart].markup.filter(
            mark => mark.type !== 'partialDamage'
          ),
          {
            ...originalEndDamageRow,
            startChar: currentPartialStartValue,
          },
        ],
      };
    }
  });

  editorMarkup.forEach((piece, idx) => {
    const undeterminedSignsMatches = piece.text.match(/x+/g) || [];
    if (undeterminedSignsMatches) {
      undeterminedSignsMatches.forEach(match => {
        editorMarkup[idx] = {
          ...editorMarkup[idx],
          markup: [
            ...editorMarkup[idx].markup,
            { type: 'undeterminedSigns', numValue: match.length },
          ],
        };
      });
    }

    const unknownSignsMatches = piece.text.match(/@/g) || [];
    if (unknownSignsMatches) {
      unknownSignsMatches.forEach(_ => {
        editorMarkup[idx] = {
          ...editorMarkup[idx],
          markup: [
            ...editorMarkup[idx].markup,
            { type: 'undeterminedSigns', numValue: -1 },
          ],
        };
      });
    }
  });

  let superfluousStatus = 0;
  editorMarkup.forEach((piece, idx) => {
    const prefixMatches = piece.text.match(/«/g);
    if (prefixMatches) {
      superfluousStatus += prefixMatches.length;
    }

    if (superfluousStatus > 0) {
      editorMarkup[idx] = {
        ...editorMarkup[idx],
        markup: [...editorMarkup[idx].markup, { type: 'superfluous' }],
      };
    }

    const postfixMatches = piece.text.match(/»/g);
    if (postfixMatches) {
      superfluousStatus -= postfixMatches.length;
    }
  });

  let omittedStatus = 0;
  editorMarkup.forEach((piece, idx) => {
    const prefixMatches = piece.text.match(/‹/g);
    if (prefixMatches) {
      omittedStatus += prefixMatches.length;
    }

    if (omittedStatus > 0) {
      editorMarkup[idx] = {
        ...editorMarkup[idx],
        markup: [...editorMarkup[idx].markup, { type: 'omitted' }],
      };
    }

    const postfixMatches = piece.text.match(/›/g);
    if (postfixMatches) {
      omittedStatus -= postfixMatches.length;
    }
  });

  let erasureStatus = 0;
  editorMarkup.forEach((piece, idx) => {
    const prefixMatches = piece.text.match(/\{/g);
    if (prefixMatches) {
      erasureStatus += prefixMatches.length;
    }

    if (erasureStatus > 0) {
      editorMarkup[idx] = {
        ...editorMarkup[idx],
        markup: [...editorMarkup[idx].markup, { type: 'erasure' }],
      };
    }

    const postfixMatches = piece.text.match(/\}/g);
    if (postfixMatches) {
      erasureStatus -= postfixMatches.length;
    }
  });

  let isUninterpretedStatus = false;
  editorMarkup.forEach((piece, idx) => {
    const matches = piece.text.match(/:/);
    if (matches || isUninterpretedStatus) {
      editorMarkup[idx] = {
        ...editorMarkup[idx],
        markup: [...editorMarkup[idx].markup, { type: 'isUninterpreted' }],
      };
    }
    if (matches) {
      isUninterpretedStatus = !isUninterpretedStatus;
    }
  });

  let isWrittenOverErasureStatus = false;
  editorMarkup.forEach((piece, idx) => {
    const matches = piece.text.match(/\*/);
    if (matches || isWrittenOverErasureStatus) {
      editorMarkup[idx] = {
        ...editorMarkup[idx],
        markup: [...editorMarkup[idx].markup, { type: 'isWrittenOverErasure' }],
      };
    }
    if (matches) {
      isWrittenOverErasureStatus = !isWrittenOverErasureStatus;
    }
  });

  let phoneticComplementStatus = false;
  editorMarkup.forEach((piece, idx) => {
    const matches = piece.text.match(/;/);
    if (matches || phoneticComplementStatus) {
      editorMarkup[idx] = {
        ...editorMarkup[idx],
        markup: [...editorMarkup[idx].markup, { type: 'phoneticComplement' }],
      };
    }
    if (matches) {
      phoneticComplementStatus = !phoneticComplementStatus;
    }
  });

  editorMarkup.forEach((piece, idx) => {
    const match = piece.text.match(/".+"/);
    if (match) {
      const innerMatches = piece.text.match(/"/g) || [];
      let altReading = match[0];
      innerMatches.forEach(_ => {
        altReading = altReading.replace('"', '');
      });
      editorMarkup[idx] = {
        ...editorMarkup[idx],
        markup: [
          ...editorMarkup[idx].markup,
          {
            type: 'originalSign',
            altReading,
            isDeterminative: piece.text.includes('$'),
          },
        ],
      };
    }
  });

  editorMarkup.forEach((piece, idx) => {
    const match = piece.text.match(/'.+'/);
    if (match) {
      const innerMatches = piece.text.match(/'/g) || [];
      let altReading = match[0];
      innerMatches.forEach(_ => {
        altReading = altReading.replace("'", '');
      });
      editorMarkup[idx] = {
        ...editorMarkup[idx],
        markup: [
          ...editorMarkup[idx].markup,
          {
            type: 'alternateSign',
            altReading,
            isDeterminative: piece.text.includes('$'),
          },
        ],
      };
    }
  });

  editorMarkup.forEach((piece, idx) => {
    if (piece.text.endsWith('?') || piece.text.includes("?'")) {
      editorMarkup[idx] = {
        ...editorMarkup[idx],
        markup: [...editorMarkup[idx].markup, { type: 'uncertain' }],
      };
    }
  });

  let lineHasWrittenBelowLine = false;
  editorMarkup.forEach((piece, idx) => {
    if (piece.text.startsWith('/') || lineHasWrittenBelowLine) {
      lineHasWrittenBelowLine = true;
      editorMarkup[idx] = {
        ...editorMarkup[idx],
        markup: [
          ...editorMarkup[idx].markup,
          { type: 'isWrittenBelowTheLine' },
        ],
      };
    }
  });

  let lineHasWrittenAboveLine = false;
  editorMarkup.forEach((piece, idx) => {
    if (piece.text.startsWith('\\') || lineHasWrittenAboveLine) {
      lineHasWrittenAboveLine = true;
      editorMarkup[idx] = {
        ...editorMarkup[idx],
        markup: [
          ...editorMarkup[idx].markup,
          { type: 'isWrittenAboveTheLine' },
        ],
      };
    }
  });

  editorMarkup.forEach((piece, idx) => {
    if (piece.text.endsWith('!!') || piece.text.includes('!!"')) {
      editorMarkup[idx] = {
        ...editorMarkup[idx],
        markup: [...editorMarkup[idx].markup, { type: 'isCollatedReading' }],
      };
    }
  });

  editorMarkup.forEach((piece, idx) => {
    if (
      (piece.text.endsWith('!') && !piece.text.endsWith('!!')) ||
      (piece.text.includes('!"') && !piece.text.includes('!!'))
    ) {
      editorMarkup[idx] = {
        ...editorMarkup[idx],
        markup: [...editorMarkup[idx].markup, { type: 'isEmendedReading' }],
      };
    }
  });

  return editorMarkup;
};
