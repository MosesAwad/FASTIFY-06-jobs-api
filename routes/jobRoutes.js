
async function jobRoutes(fastify, options) {
    const { jobModel } = options;

    fastify.post('/jobs', async (request, reply) => {
		const job = await jobModel.createJob(request.body);
		reply.send(job);
	});
}

module.exports = jobRoutes;