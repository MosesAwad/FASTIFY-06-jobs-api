const { StatusCodes } = require('http-status-codes');
const { BadRequestError, NotFoundError } = require('../errors');
const authPlugin = require('../plugins/authentication');


async function jobRoutes(fastify, options) {
    const { jobModel } = options;

	// Register auth plugin
	fastify.register(authPlugin);

	fastify.setErrorHandler((err, request, reply) => {
		console.log(err)
		let customError = {
			statusCode: err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR,
			msg: err.message || 'Something went wrong, try again later',
		};
	
		// Handle SQLite UNIQUE constraint violation
		if (err.code === 'SQLITE_CONSTRAINT') {
			customError.statusCode = StatusCodes.BAD_REQUEST;
			if (err.message.includes('CHECK constraint failed')) {
				const fieldMessage = err.message.split(':').pop()?.trim();
				const field = fieldMessage?.trim().split(' ')[0];
				const values = fieldMessage?.trim().split('(').pop()
				customError.msg = `Invalid value for the '${field}' field. Please ensure the value is one of the allowed options: (${values}.`;
			}
			else {
				customError.msg = 'Database constraint violation';
			}
		}
		reply.status(customError.statusCode).send({ error: customError.msg });
	})

	// POST create job
	fastify.post('/jobs', async (request, reply) => {
		const jobData = {
			...request.body,
			createdBy: request.user.userId	// Note 1
		}
		const job = await jobModel.createJob(jobData);
		reply.send(job);
	});

	// GET all jobs (only the ones created by the user)
	fastify.get('/jobs', async (request, reply) => {
		const {user: {userId}} = request;
		const jobs = await jobModel.getAllJobs({ userId });
		reply.send({ jobs, numOfJobs: jobs.length });
	})

	// GET single job
	fastify.get('/jobs/:id', async (request, reply) => {
		const {params: {id: jobId}, user: {userId}} = request;
		const job = await jobModel.getSingleJob({ jobId, userId });
		if (!job) {
			throw new NotFoundError(`No job with id of ${jobId} was found!`);
		}
		reply.send(job);
	})

	// PATCH update job
	fastify.patch('/jobs/:id', async (request, reply) => {
		const {
			body: payload,
			params: {id: jobId},
			user: { userId }
		} = request;
		const updatedJob = await jobModel.updateJob({ jobId, userId }, payload);
		if (!updatedJob) {
			throw new NotFoundError(`No job with id of ${jobId} was found!`);
		}
		reply.send(updatedJob);
	})
}

module.exports = jobRoutes;

/*
	NOTES

	Note 1

	This is added as an assurance mechanism to make sure that no user can create a job on behalf of 
	another user. So essentially, we always assign createdBy to the userId we decode from the JWT. So 
	regardless of whether the original request had a createdBy field in the json (scenario 1) or not 
	(scenario 2), this would add a createdBy (scenario 1) or override it (scenario 2) with the value 
	equally to none other than the user's id.

*/
