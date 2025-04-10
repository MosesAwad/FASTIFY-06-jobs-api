const bcrypt = require('bcryptjs')
const { StatusCodes } = require('http-status-codes');
const CustomError = require('../errors');

const responseSchema = {
  200: {
    type: 'object',
    properties: {
      user: {
        type: 'object',
        properties: {
          name: { type: 'string' }
        },
        required: ['name']
      },
      token: { type: 'string' }
    },
    required: ['user', 'token']
  }
}

const registerOpts =  {
    schema: {
        body: {
            type: 'object',
            properties: {
                name: { type: 'string', minLength: 3, maxLength: 50 },
                email: { type: 'string', format: 'email' },
                password: { type: 'string', minLength: 6 }
            },
            required: ['name', 'email', 'password']
        },
        response: responseSchema
    }
}

const loginOpts = {
    schema: {
      body: {
        type: 'object',
        properties: {
          'email': { type: 'string', },
          'password': { type: 'string' }
        },
        required: ["email", "password"]
      },
      response: responseSchema
    }
}

async function authRoutes(fastify, options) {
    const { userModel } = options;

    // Register error handler
    fastify.setErrorHandler((err, request, reply) => {
        // console.log(JSON.stringify(err, null, 2));
        console.log(err)
        let customError = {
            statusCode: err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR,
            msg: err.message || 'Something went wrong, try again later',
        };

        // Handle SQLite UNIQUE constraint violation
        if (err.code === 'SQLITE_CONSTRAINT') {
          customError.statusCode = StatusCodes.BAD_REQUEST;
          if (err.message.includes('UNIQUE constraint failed')) {
            const field = err.message.split(':').pop()?.trim(); // Note 1
            customError.msg = `Duplicate value for field: ${field}`;
          } else {
            customError.msg = 'Database constraint violation';
          }
        }
        return reply.status(customError.statusCode).send({ error: customError.msg });
    });

    // POST endpoint (register user)
    fastify.post('/register', registerOpts, async (request, reply) => {
        const user = await userModel.createUser(request.body);
        const token = userModel.createJWT(user);
        reply.send({ token });
    })

    // POST endpoint (login user)
    fastify.post('/login', loginOpts, async (request, reply) => {
        const { email, password } = request.body;
        const user = await userModel.findByEmail(email);
        if (!user) {
          throw new CustomError.UnauthenticatedError('Invalid credentials') 
        }
        const isPasswordCorrect = await userModel.comparePassword(password, user.password);
        if (!isPasswordCorrect) {
          throw new CustomError.UnauthenticatedError('Invalid credentials');
        }
        const token = userModel.createJWT(user);
        reply.send({ user: { name: user.name }, token });
     })
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
