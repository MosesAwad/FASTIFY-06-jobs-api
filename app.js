const fastify = require('fastify')({
    logger: true
});
const connectDB = require('./connect/connect');
const authRoutes = require('./routes/authRoutes.js');
const User = require('./models/User')
// const errorHandler = require('./plugins/errorHandler.js')

const { StatusCodes } = require('http-status-codes');

const start = async () => {
    try {
        // 1. Connect to DB
        const userDB = await connectDB('users');

        // 2. Initiliaze models
        const userModel = new User(userDB);
        await userModel.initTable();
    
        // 3. Register routes
        fastify.register(authRoutes, { userModel });

        // 4. Start server
        await fastify.listen({ port: 3000 });
        console.log('Server running on http://localhost:3000');
    }
    catch (err) {
        console.log(err.message);
        process.exit(1);
    }
}

start();