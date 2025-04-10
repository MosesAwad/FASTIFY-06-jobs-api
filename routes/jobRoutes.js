const authPlugin = require('../plugins/authentication');


async function jobRoutes(fastify, options) {
    const { jobModel } = options;

	// Register auth plugin
	fastify.register(authPlugin);

	fastify.post('/jobs', async (request, reply) => {
		const jobData = {
			...request.body,
			createdBy: request.user.userId	// Note 1
		}
		const job = await jobModel.createJob(jobData);
		reply.send(job);
	});
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
