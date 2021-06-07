export default {
  '/profile': {
    patch: {
      summary:
        "Update a user's profile information, including email and display name",
      requestBody: {
        description:
          "An object describing the changes that should be made to the user's profile",
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                firstName: {
                  type: 'string',
                },
                lastName: {
                  type: 'string',
                },
                email: {
                  type: 'string',
                },
              },
            },
          },
        },
      },
      responses: {
        204: {
          description:
            "The user's profile information was successfully updated.",
        },
      },
    },
  },
};
