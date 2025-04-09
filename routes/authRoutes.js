const bcrypt = require('bcryptjs')
const { StatusCodes } = require('http-status-codes');
const { BadRequestError } = require('../errors');

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
        response: {
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
    }
}

async function authRoutes(fastify, options) {
    const { userModel } = options;

    // Register error handler
    fastify.setErrorHandler((err, request, reply) => {
        let customError = {
            statusCode: err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR,
            msg: err.message || 'Something went wrong, try again later',
        };
        if (err.code === 'SQLITE_CONSTRAINT') {
            customError.statusCode = StatusCodes.BAD_REQUEST;
            customError.msg = "Validation failed for user creation due to the following reason: "
                + err.message.substring('SQLITE_CONSTRAINT:'.length).trim();
        }
        return reply.status(customError.statusCode).send({ msg: customError.msg });
    });

    // POST endpoint (register user)
    fastify.post('/register', registerOpts, async (request, reply) => {
        const { name, email, password } = request.body;
        const user = await userModel.createUser({ name, email, password });
        reply.send(user);
    })
}

module.exports = authRoutes;