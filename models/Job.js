
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
}

module.exports = Job;