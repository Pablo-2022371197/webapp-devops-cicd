const db = require('./db');
const { formatResponse, formatError } = require('./format');

const VALID_ENTITIES = new Set(['users', 'products']);
const COMMAND_REGEX = /^\{(insert|get):([a-z]+)(?::([\s\S]+))?\}$/;

const parseMessage = (raw) => {
    const line = raw.trim();
    const match = line.match(COMMAND_REGEX);
    if (!match) {
        return { error: formatError('Formato invalido. Use {insert:entidad:json} o {get:entidad} o {get:entidad:id}') };
    }

    const [, action, entity, rest] = match;
    if (!VALID_ENTITIES.has(entity)) {
        return { error: formatError('Entidad invalida. Use users o products') };
    }

    return { action, entity, rest: rest !== undefined ? rest.trim() : undefined };
};

const handleInsert = (entity, payload, callback) => {
    let body;
    try {
        body = JSON.parse(payload);
    } catch {
        return callback(formatError('JSON invalido en insert'));
    }

    if (entity === 'users') {
        const { name, email } = body;
        if (!name || !email) {
            return callback(formatError('users requiere name y email'));
        }
        return db.insertUser({ name, email }, (err, row) => {
            if (err) return callback(formatError('Error al insertar usuario', 500));
            callback(formatResponse(row));
        });
    }

    const { name, price } = body;
    if (!name || price === undefined) {
        return callback(formatError('products requiere name y price'));
    }
    return db.insertProduct({ name, price }, (err, row) => {
        if (err) return callback(formatError('Error al insertar producto', 500));
        callback(formatResponse(row));
    });
};

const handleGet = (entity, rest, callback) => {
    if (rest === undefined || rest === '') {
        if (entity === 'users') {
            return db.getAllUsers((err, rows) => {
                if (err) return callback(formatError('Error al obtener usuarios', 500));
                callback(formatResponse(rows));
            });
        }
        return db.getAllProducts((err, rows) => {
            if (err) return callback(formatError('Error al obtener productos', 500));
            callback(formatResponse(rows));
        });
    }

    const id = rest;
    if (!/^\d+$/.test(id)) {
        return callback(formatError('Id invalido'));
    }

    if (entity === 'users') {
        return db.getUserById(id, (err, row) => {
            if (err) return callback(formatError('Error al obtener usuario', 500));
            if (!row) return callback(formatResponse({}, 404));
            callback(formatResponse(row));
        });
    }

    return db.getProductById(id, (err, row) => {
        if (err) return callback(formatError('Error al obtener producto', 500));
        if (!row) return callback(formatResponse({}, 404));
        callback(formatResponse(row));
    });
};

const executeMessage = (raw, callback) => {
    const parsed = parseMessage(raw);
    if (parsed.error) {
        return callback(parsed.error);
    }

    const { action, entity, rest } = parsed;

    if (action === 'insert') {
        if (!rest) {
            return callback(formatError('insert requiere JSON despues de la entidad'));
        }
        return handleInsert(entity, rest, callback);
    }

    return handleGet(entity, rest, callback);
};

module.exports = { parseMessage, executeMessage };
