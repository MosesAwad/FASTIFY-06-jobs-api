
class Job {
	constructor (db) {
		this.db = db;
	}

	async initTable() {
		await this.db.exec('PRAGMA foreign_keys = ON;'); // to force FOREIGN_KEY Enforcement
		await this.db.exec(`
		  	CREATE TABLE IF NOT EXISTS jobs (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				role TEXT NOT NULL CHECK(length(role) <= 100),
				company TEXT NOT NULL CHECK(length(company) <= 50),
				status TEXT NOT NULL CHECK(status IN ('interview', 'pending', 'declined')) DEFAULT 'pending',
				created_by INTEGER NOT NULL,
				created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
				updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
				FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
		  )
		`);
	}

	async createJob({ role, company, status, createdBy }) {
		const { lastID } = await this.db.run(
		  `INSERT INTO jobs (role, company, status, created_by)
		   VALUES (?, ?, ?, ?)`,
		  [role, company, status, createdBy]
		);
		return { id: lastID, role, company, status, createdBy };
	}

	async getAllJobs({ userId }) {	// only the ones created by the user of course
		return this.db.all(
			`SELECT jobs.*, users.name AS creator_name 
			FROM jobs
			INNER JOIN users ON jobs.created_by = users.id
			WHERE jobs.created_by = ?`,
			[userId]
		);
	}

	async getSingleJob({ jobId, userId }) {
		return this.db.get(
			`SELECT * FROM jobs WHERE id= ? AND created_by = ?`,
			[jobId, userId]
		);
	}

	/*
		* STATUS MUST BE IN ENUM VALS
		* UPDATED_AT

	*/
	async updateJob({ jobId, userId }, payload) {
		const allowedFields = ['role', 'company', 'status'];
		const keys = Object.keys(payload).filter((key) => allowedFields.includes(key))
		const values = keys.map((key) => payload[key]);

		let setClause = 'updated_at = CURRENT_TIMESTAMP';
		if (keys.length) {
			setClause += ', '
			setClause += keys.map((key) => `${key} = ?`).join(', ');
		}
		console.log(setClause);
		const query = `UPDATE jobs SET ${setClause} WHERE id = ? AND created_by = ? RETURNING *`;
		console.log(query);
		const result = await this.db.get(query, ...values, jobId, userId);
		console.log(result);
		return result;
	}
}

module.exports = Job;