jest.mock('./src/firebase', () => ({
  auth: () => ({
    verifyIdToken: () =>
      Promise.resolve({
        uid: 'userUid',
      }),
  }),
}));
