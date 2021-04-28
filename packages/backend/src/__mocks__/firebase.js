export default {
  auth: () => ({
    verifyIdToken: () =>
      Promise.resolve({
        uid: 'userUid',
      }),
  }),
};
