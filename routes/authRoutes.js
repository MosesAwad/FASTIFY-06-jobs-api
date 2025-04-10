const { registerOpts, loginOpts } = require('../schemas/authSchemas');

async function authRoutes(fastify, options) {
    const { userModel } = options;
    const authController = require('../controllers/authController')(userModel);
  
    fastify.setErrorHandler(authController.errorHandler);
    fastify.post('/register', registerOpts, authController.register);
    fastify.post('/login', loginOpts, authController.login);
}

module.exports = authRoutes;

/*
    NOTES

    Note 1
      .pop() → gets " users.email" from the end of that array.
      ?.trim() → this is the optional chaining operator.

      The optional chaining operator ensures that if .pop() 
      returns undefined (like if the array was empty), calling .trim() won't throw an error.
*/
