expect.extend({
  toHaveErrorToken(tokens) {
    if (tokens.map((t) => t.classifier).includes('ERROR')) {
      return {
        pass: true,
        message: () => 'Expected tokens to have an error token',
      };
    }
    return {
      pass: false,
      message: () => 'Expected tokens not to have an error token',
    };
  },
});
