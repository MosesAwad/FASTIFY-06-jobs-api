const sqlite3 = require('sqlite3').verbose()    // verbose means display log messages to file/console
const { open } = require('sqlite')  // the modern async api, without it callback hell


const connectDB = async (dbName) => {
    const db = await open({
        filename: `./db/${dbName}.db`,
        driver: sqlite3.Database,
        mode: sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE // Note 1
    });
    return db;
}

module.exports = connectDB;
