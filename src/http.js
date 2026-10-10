const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const db = require('./db');
const { formatResponse, formatError } = require('./format');

const isValidId = (id) => /^\d+$/.test(String(id));

const registerRoutes = (app) => {
    app.get('/users', (req, res) => {
        db.getAllUsers((err, rows) => {
            if (err) {
                return res.status(500).json(formatError('Error al obtener usuarios', 500));
            }
            res.json(formatResponse(rows));
        });
    });

    app.get('/users/:id', (req, res) => {
        if (!isValidId(req.params.id)) {
            return res.status(400).json(formatError('Id invalido'));
        }
        db.getUserById(req.params.id, (err, row) => {
            if (err) {
                return res.status(500).json(formatError('Error al obtener usuario', 500));
            }
            if (!row) {
                return res.status(404).json(formatResponse({}, 404));
            }
            res.json(formatResponse(row));
        });
    });

    app.post('/users', (req, res) => {
        const { name, email } = req.body || {};
        if (!name || !email) {
            return res.status(400).json(formatError('Se requieren name y email'));
        }
        db.insertUser({ name, email }, (err, row) => {
            if (err) {
                return res.status(500).json(formatError('Error al insertar usuario', 500));
            }
            res.status(201).json(formatResponse(row, 201));
        });
    });

    app.put('/users/:id', (req, res) => {
        if (!isValidId(req.params.id)) {
            return res.status(400).json(formatError('Id invalido'));
        }
        const { name, email } = req.body || {};
        if (!name || !email) {
            return res.status(400).json(formatError('Se requieren name y email'));
        }
        db.updateUser(req.params.id, { name, email }, (err, row) => {
            if (err) {
                return res.status(500).json(formatError('Error al actualizar usuario', 500));
            }
            if (!row) {
                return res.status(404).json(formatResponse({}, 404));
            }
            res.json(formatResponse(row));
        });
    });

    app.delete('/users/:id', (req, res) => {
        if (!isValidId(req.params.id)) {
            return res.status(400).json(formatError('Id invalido'));
        }
        db.deleteUser(req.params.id, (err, changes) => {
            if (err) {
                return res.status(500).json(formatError('Error al eliminar usuario', 500));
            }
            if (!changes) {
                return res.status(404).json(formatResponse({}, 404));
            }
            res.json(formatResponse({ message: 'Usuario eliminado' }));
        });
    });

    app.get('/products', (req, res) => {
        db.getAllProducts((err, rows) => {
            if (err) {
                return res.status(500).json(formatError('Error al obtener productos', 500));
            }
            res.json(formatResponse(rows));
        });
    });

    app.get('/products/:id', (req, res) => {
        if (!isValidId(req.params.id)) {
            return res.status(400).json(formatError('Id invalido'));
        }
        db.getProductById(req.params.id, (err, row) => {
            if (err) {
                return res.status(500).json(formatError('Error al obtener producto', 500));
            }
            if (!row) {
                return res.status(404).json(formatResponse({}, 404));
            }
            res.json(formatResponse(row));
        });
    });

    app.post('/products', (req, res) => {
        const { name, price } = req.body || {};
        if (!name || price === undefined) {
            return res.status(400).json(formatError('Se requieren name y price'));
        }
        if (typeof price !== 'number' || Number.isNaN(price)) {
            return res.status(400).json(formatError('price debe ser un numero valido'));
        }
        db.insertProduct({ name, price }, (err, row) => {
            if (err) {
                return res.status(500).json(formatError('Error al insertar producto', 500));
            }
            res.status(201).json(formatResponse(row, 201));
        });
    });

    app.put('/products/:id', (req, res) => {
        if (!isValidId(req.params.id)) {
            return res.status(400).json(formatError('Id invalido'));
        }
        const { name, price } = req.body || {};
        if (!name || price === undefined) {
            return res.status(400).json(formatError('Se requieren name y price'));
        }
        if (typeof price !== 'number' || Number.isNaN(price)) {
            return res.status(400).json(formatError('price debe ser un numero valido'));
        }
        db.updateProduct(req.params.id, { name, price }, (err, row) => {
            if (err) {
                return res.status(500).json(formatError('Error al actualizar producto', 500));
            }
            if (!row) {
                return res.status(404).json(formatResponse({}, 404));
            }
            res.json(formatResponse(row));
        });
    });

    app.delete('/products/:id', (req, res) => {
        if (!isValidId(req.params.id)) {
            return res.status(400).json(formatError('Id invalido'));
        }
        db.deleteProduct(req.params.id, (err, changes) => {
            if (err) {
                return res.status(500).json(formatError('Error al eliminar producto', 500));
            }
            if (!changes) {
                return res.status(404).json(formatResponse({}, 404));
            }
            res.json(formatResponse({ message: 'Producto eliminado' }));
        });
    });

    app.get('/health', (req, res) => {
        res.status(201).json(formatResponse({ status: 'ok2' }, 201));
    });

    app.get('/backup', (req, res) => {
        const dbPath = db.getDbPath();
        const backupPath = path.join(path.dirname(dbPath), 'backup_database.sqlite');

        fs.copyFile(dbPath, backupPath, (err) => {
            if (err) {
                return res.status(500).json({ statusCode: 500, data: 'Error al hacer backup' });
            }

            res.download(backupPath, 'backup_database.sqlite', (downloadErr) => {
                if (downloadErr) {
                    console.error('Error al descargar:', downloadErr);
                }
            });
        });
    });

    app.delete('/empty', (req, res) => {
        db.emptyDatabase((err) => {
            if (err) {
                return res.status(500).json(formatError('Error al vaciar la base de datos', 500));
            }
            res.json(formatResponse({ message: 'Base de datos vaciada completamente' }));
        });
    });

    app.use((req, res) => {
        res.status(404).json(formatError('Ruta no encontrada', 404));
    });
};

const createApp = () => {
    const app = express();
    app.use(cors());
    app.use(express.json());

    const api = express.Router();
    registerRoutes(api);
    app.use('/api', api);

    app.use((req, res) => {
        res.status(404).json(formatError('Ruta no encontrada', 404));
    });

    return app;
};

const createHttpServer = (port) => {
    const app = createApp();
    return app.listen(port, () => {
        console.log(`Servidor HTTP corriendo en el puerto ${port}`);
    });
};

module.exports = { createApp, createHttpServer };
