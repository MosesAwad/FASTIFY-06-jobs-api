const bcrypt = require('bcryptjs')
const CustomError = require('../errors')
const { StatusCodes } = require('http-status-codes');

class User {
    constructor(db) {
        this.db = db;
    }

    async initTable() {
        await this.db.exec(`
            CREATE TABLE IF NOT EXISTS users(
                id INTEGER PRIMARY KEY,
                name STRING NOT NULL CHECK(length(name) >= 3 AND length(name) <= 50),
                email STRING NOT NULL UNIQUE CHECK(email LIKE '%@%.%'),
                password STRING NOT NULL CHECK(length(password) >= 6)
            )
            `);
    }

    async createUser({ name, email, password }) {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const { lastID } = await this.db.run(
            'INSERT INTO users (name, email, password) VALUES (?,?,?)',
            [name, email, hashedPassword]
        );

        const token = "temp token";
        return { user: { name }, token };
        // return { id: lastID, name, email, hashedPassword };
    }
}

module.exports = User;
