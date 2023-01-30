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
  editorMarkup.forEach((piece, idx) => {
    let startChar: number | undefined;
    let endChar: number | undefined;
    const prefixMatches = piece.text.match(/\[/g);
    if (prefixMatches) {
      startChar = piece.text.indexOf('[');
      damageStatus = true;
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

    if (startChar && startChar !== 0) {
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
      endChar !== piece.text.replace('[', '').replace(']', '').length
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
    }
  });

  let partialDamageStatus = false;
  editorMarkup.forEach((piece, idx) => {
    let startChar: number | undefined;
    let endChar: number | undefined;
    const prefixMatches = piece.text.match(/⸢/g);
    if (prefixMatches) {
      startChar = piece.text.indexOf('⸢');
      partialDamageStatus = true;
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

    if (startChar && startChar !== 0) {
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
      endChar !== piece.text.replace('⸢', '').replace('⸣', '').length
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
    const doubleMatches = piece.text.match(/:.+:/); // Prevents errors when markup opens and closes on same sign
    if (matches && !doubleMatches) {
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
    const doubleMatches = piece.text.match(/\*.+\*/); // Prevents errors when markup opens and closes on same sign
    if (matches && !doubleMatches) {
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
    const doubleMatches = piece.text.match(/;.+;/); // Prevents errors when markup opens and closes on same sign
    if (matches && !doubleMatches) {
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
    if (piece.text.includes('?')) {
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
    if (piece.text.includes('!!')) {
      editorMarkup[idx] = {
        ...editorMarkup[idx],
        markup: [...editorMarkup[idx].markup, { type: 'isCollatedReading' }],
      };
    }
  });

  editorMarkup.forEach((piece, idx) => {
    if (piece.text.includes('!') && !piece.text.includes('!!')) {
      editorMarkup[idx] = {
        ...editorMarkup[idx],
        markup: [...editorMarkup[idx].markup, { type: 'isEmendedReading' }],
      };
    }
  });

  return editorMarkup;
};
