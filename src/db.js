const sqlite3 = require('sqlite3').verbose();
const path = require('path');

let dbPath = path.join(__dirname, '..', 'database.sqlite');
let db;

const initDb = (customPath) => {
    if (customPath) {
        dbPath = customPath;
    }
    db = new sqlite3.Database(dbPath);
    db.serialize(() => {
        db.run('CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, email TEXT)');
        db.run('CREATE TABLE IF NOT EXISTS products (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, price REAL)');
    });
    return db;
};

const getDbPath = () => dbPath;

const getAllUsers = (callback) => {
    db.all('SELECT * FROM users', [], (err, rows) => callback(err, rows || []));
};

const getUserById = (id, callback) => {
    db.get('SELECT * FROM users WHERE id = ?', [id], (err, row) => callback(err, row));
};

const insertUser = ({ name, email }, callback) => {
    db.run('INSERT INTO users (name, email) VALUES (?, ?)', [name, email], function (err) {
        callback(err, { id: this.lastID, name, email });
    });
};

const deleteUser = (id, callback) => {
    db.run('DELETE FROM users WHERE id = ?', [id], function (err) {
        callback(err, this.changes);
    });
};

const updateUser = (id, { name, email }, callback) => {
    db.run(
        'UPDATE users SET name = ?, email = ? WHERE id = ?',
        [name, email, id],
        function (err) {
            if (err) return callback(err);
            if (this.changes === 0) return callback(null, null);
            callback(null, { id: Number(id), name, email });
        }
    );
};

const getAllProducts = (callback) => {
    db.all('SELECT * FROM products', [], (err, rows) => callback(err, rows || []));
};

const getProductById = (id, callback) => {
    db.get('SELECT * FROM products WHERE id = ?', [id], (err, row) => callback(err, row));
};

const insertProduct = ({ name, price }, callback) => {
    db.run('INSERT INTO products (name, price) VALUES (?, ?)', [name, price], function (err) {
        callback(err, { id: this.lastID, name, price });
    });
};

const deleteProduct = (id, callback) => {
    db.run('DELETE FROM products WHERE id = ?', [id], function (err) {
        callback(err, this.changes);
    });
};

const updateProduct = (id, { name, price }, callback) => {
    db.run(
        'UPDATE products SET name = ?, price = ? WHERE id = ?',
        [name, price, id],
        function (err) {
            if (err) return callback(err);
            if (this.changes === 0) return callback(null, null);
            callback(null, { id: Number(id), name, price });
        }
    );
};

const emptyDatabase = (callback) => {
    db.serialize(() => {
        db.run('DELETE FROM users');
        db.run('DELETE FROM products', (err) => callback(err));
    });
};

const closeDb = (callback) => {
    if (!db) return callback();
    db.close(callback);
};

module.exports = {
    initDb,
    closeDb,
    getDbPath,
    getAllUsers,
    getUserById,
    insertUser,
    deleteUser,
    updateUser,
    getAllProducts,
    getProductById,
    insertProduct,
    deleteProduct,
    updateProduct,
    emptyDatabase
};
