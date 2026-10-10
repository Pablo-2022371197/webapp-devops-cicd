const path = require('path');
const os = require('os');
const fs = require('fs');
const request = require('supertest');
const db = require('../src/db');
const { createApp } = require('../src/http');

describe('API HTTP — pruebas de endpoints', () => {
    let app;
    let testDbPath;

    beforeAll((done) => {
        testDbPath = path.join(os.tmpdir(), `intro-devops-test-${Date.now()}.sqlite`);
        db.initDb(testDbPath);
        app = createApp();
        done();
    });

    afterAll((done) => {
        db.closeDb((err) => {
            if (fs.existsSync(testDbPath)) {
                fs.unlinkSync(testDbPath);
            }
            const backupPath = path.join(path.dirname(testDbPath), 'backup_database.sqlite');
            if (fs.existsSync(backupPath)) {
                fs.unlinkSync(backupPath);
            }
            done(err);
        });
    });

    beforeEach((done) => {
        db.emptyDatabase(done);
    });

    // GET /health
    // Responde 200 con status ok
    describe('GET /api/health', () => {
        it('responde 200 con status ok', async () => {
            const res = await request(app).get('/api/health');
            expect(res.status).toBe(201);
            expect(res.body).toEqual({ statusCode: 200, data: { status: 'ok' } });
        });
    });

    // GET /users
    // Responde 200 con la lista de usuarios
    describe('GET /users', () => {
        it('lista usuarios vacios al inicio', async () => {
            const res = await request(app).get('/api/users');
            expect(res.status).toBe(200);
            expect(res.body.data).toEqual([]);
        });
    });

    // POST /users
    // Crea un usuario con datos validos
    // Responde 201 con el usuario creado
    // Responde 400 si falta email (error del consumidor)
    // Responde 400 si el cuerpo esta vacio
    // Responde 400 si el JSON mal formado
    describe('POST /users', () => {
        it('crea un usuario con datos validos', async () => {
            const res = await request(app)
                .post('/api/users')
                .send({ name: 'Ana', email: 'ana@mail.com' });

            expect(res.status).toBe(201);
            expect(res.body.statusCode).toBe(201);
            expect(res.body.data).toMatchObject({ name: 'Ana', email: 'ana@mail.com' });
            expect(res.body.data.id).toEqual(expect.any(Number));
        });

        it('falla si falta email (error del consumidor)', async () => {
            const res = await request(app).post('/api/users').send({ name: 'Sin email' });
            expect(res.status).toBe(400);
            expect(res.body.data.message).toMatch(/name y email/i);
        });

        it('falla con cuerpo vacio', async () => {
            const res = await request(app).post('/api/users').send({});
            expect(res.status).toBe(400);
        });

        it('falla con JSON mal formado', async () => {
            const res = await request(app)
                .post('/api/users')
                .set('Content-Type', 'application/json')
                .send('{name:invalido}');
            expect(res.status).toBeGreaterThanOrEqual(400);
        });
    });

    // GET /users/:id
    // Obtiene un usuario existente
    // Responde 200 con el usuario
    // Responde 404 si el id no existe
    // Responde 400 si el id no es numerico
    describe('GET /users/:id', () => {
        it('obtiene un usuario existente', async () => {
            const created = await request(app)
                .post('/api/users')
                .send({ name: 'Luis', email: 'luis@mail.com' });

            const res = await request(app).get(`/api/users/${created.body.data.id}`);
            expect(res.status).toBe(200);
            expect(res.body.data.email).toBe('luis@mail.com');
        });

        it('devuelve 404 si el id no existe', async () => {
            const res = await request(app).get('/api/users/9999');
            expect(res.status).toBe(404);
        });

        it('devuelve 400 si el id no es numerico', async () => {
            const res = await request(app).get('/api/users/abc');
            expect(res.status).toBe(400);
            expect(res.body.data.message).toMatch(/id invalido/i);
        });
    });

    // PUT /users/:id
    // Actualiza un usuario existente
    // Responde 200 con el usuario actualizado
    // Responde 404 si el id no existe
    // Responde 400 si el cuerpo esta incompleto
    describe('PUT /users/:id', () => {
        it('actualiza un usuario existente', async () => {
            const created = await request(app)
                .post('/api/users')
                .send({ name: 'Original', email: 'orig@mail.com' });

            const res = await request(app)
                .put(`/api/users/${created.body.data.id}`)
                .send({ name: 'Actualizado', email: 'nuevo@mail.com' });

            expect(res.status).toBe(200);
            expect(res.body.data).toMatchObject({
                name: 'Actualizado',
                email: 'nuevo@mail.com'
            });
        });

        it('devuelve 404 al actualizar id inexistente', async () => {
            const res = await request(app)
                .put('/api/users/8888')
                .send({ name: 'Nadie', email: 'nadie@mail.com' });
            expect(res.status).toBe(404);
        });

        it('devuelve 400 si el cuerpo esta incompleto', async () => {
            const created = await request(app)
                .post('/api/users')
                .send({ name: 'Pepe', email: 'pepe@mail.com' });

            const res = await request(app)
                .put(`/api/users/${created.body.data.id}`)
                .send({ name: 'Solo nombre' });

            expect(res.status).toBe(400);
        });

        it('devuelve 400 si el id de update no es numerico', async () => {
            const res = await request(app)
                .put('/api/users/abc')
                .send({ name: 'X', email: 'x@mail.com' });
            expect(res.status).toBe(400);
        });
    });

    // DELETE /users/:id
    // Elimina un usuario existente
    // Responde 200 con el usuario eliminado
    // Responde 404 si el id no existe
    describe('DELETE /users/:id', () => {
        it('elimina un usuario existente', async () => {
            const created = await request(app)
                .post('/api/users')
                .send({ name: 'Borrar', email: 'borrar@mail.com' });

            const res = await request(app).delete(`/api/users/${created.body.data.id}`);
            expect(res.status).toBe(200);
            expect(res.body.data.message).toMatch(/eliminado/i);

            const check = await request(app).get(`/api/users/${created.body.data.id}`);
            expect(check.status).toBe(404);
        });

        it('devuelve 404 al eliminar id que no existe', async () => {
            const res = await request(app).delete('/api/users/7777');
            expect(res.status).toBe(404);
        });

        it('devuelve 400 si el id de delete no es numerico', async () => {
            const res = await request(app).delete('/api/users/abc');
            expect(res.status).toBe(400);
        });
    });

    // GET /products y POST /products
    // Crea y lista productos
    // Responde 200 con la lista de productos
    // Responde 400 si el producto no tiene price
    // Responde 400 si el price no es un numero
    describe('GET /products y POST /products', () => {
        it('crea y lista productos', async () => {
            await request(app).post('/api/products').send({ name: 'Teclado', price: 49.99 });

            const res = await request(app).get('/api/products');
            expect(res.status).toBe(200);
            expect(res.body.data).toHaveLength(1);
            expect(res.body.data[0].name).toBe('Teclado');
        });

        it('rechaza producto sin price', async () => {
            const res = await request(app).post('/api/products').send({ name: 'Sin precio' });
            expect(res.status).toBe(400);
        });

        it('rechaza price que no es numero', async () => {
            const res = await request(app)
                .post('/api/products')
                .send({ name: 'Mouse', price: 'gratis' });
            expect(res.status).toBe(400);
            expect(res.body.data.message).toMatch(/numero/i);
        });
    });

    // GET /products/:id
    // Obtiene un producto existente
    // Responde 200 con el producto
    // Responde 404 si el id no existe
    describe('GET /products/:id', () => {
        it('obtiene producto por id', async () => {
            const created = await request(app)
                .post('/api/products')
                .send({ name: 'Monitor', price: 120 });

            const res = await request(app).get(`/api/products/${created.body.data.id}`);
            expect(res.status).toBe(200);
            expect(res.body.data.name).toBe('Monitor');
        });

        it('devuelve 404 si el producto no existe', async () => {
            const res = await request(app).get('/api/products/9999');
            expect(res.status).toBe(404);
        });

        it('devuelve 400 si el id no es numerico', async () => {
            const res = await request(app).get('/api/products/xyz');
            expect(res.status).toBe(400);
        });
    });

    // PUT /products/:id
    // Actualiza un producto existente
    // Responde 200 con el producto actualizado
    // Responde 404 si el id no existe
    describe('PUT /products/:id', () => {
        it('actualiza precio y nombre', async () => {
            const created = await request(app)
                .post('/api/products')
                .send({ name: 'Cable', price: 10 });

            const res = await request(app)
                .put(`/api/products/${created.body.data.id}`)
                .send({ name: 'Cable HDMI', price: 15.5 });

            expect(res.status).toBe(200);
            expect(res.body.data).toMatchObject({ name: 'Cable HDMI', price: 15.5 });
        });

        it('devuelve 404 al actualizar producto inexistente', async () => {
            const res = await request(app)
                .put('/api/products/8888')
                .send({ name: 'Nada', price: 1 });
            expect(res.status).toBe(404);
        });

        it('devuelve 400 si falta price en update', async () => {
            const created = await request(app)
                .post('/api/products')
                .send({ name: 'Temp', price: 2 });

            const res = await request(app)
                .put(`/api/products/${created.body.data.id}`)
                .send({ name: 'Sin precio' });
            expect(res.status).toBe(400);
        });

        it('devuelve 400 si price no es numero en update', async () => {
            const created = await request(app)
                .post('/api/products')
                .send({ name: 'Temp2', price: 2 });

            const res = await request(app)
                .put(`/api/products/${created.body.data.id}`)
                .send({ name: 'Temp2', price: 'caro' });
            expect(res.status).toBe(400);
        });
    });

    // DELETE /products/:id
    // Elimina un producto existente
    // Responde 200 con el producto eliminado
    // Responde 404 si el id no existe
    describe('DELETE /products/:id', () => {
        it('elimina producto existente', async () => {
            const created = await request(app)
                .post('/api/products')
                .send({ name: 'Temp', price: 1 });

            const res = await request(app).delete(`/api/products/${created.body.data.id}`);
            expect(res.status).toBe(200);

            const list = await request(app).get('/api/products');
            expect(list.body.data).toHaveLength(0);
        });

        it('devuelve 404 al eliminar producto inexistente', async () => {
            const res = await request(app).delete('/api/products/7777');
            expect(res.status).toBe(404);
        });

        it('devuelve 400 si el id de delete no es numerico', async () => {
            const res = await request(app).delete('/api/products/abc');
            expect(res.status).toBe(400);
        });
    });

    // GET /backup
    // Genera un archivo de respaldo descargable
    // Responde 200 con el archivo de respaldo
    // Responde 404 si el archivo de respaldo no existe
    describe('GET /backup', () => {
        it('genera archivo de respaldo descargable', async () => {
            await request(app).post('/api/users').send({ name: 'Backup', email: 'b@mail.com' });

            const res = await request(app).get('/api/backup');
            expect(res.status).toBe(200);
            expect(res.headers['content-disposition']).toMatch(/backup_database\.sqlite/);
        });
    });

    // DELETE /empty
    // Vacía users y products
    // Responde 200 con el mensaje de vacía
    // Responde 404 si la ruta no existe
    describe('DELETE /empty', () => {
        it('vacía users y products', async () => {
            await request(app).post('/api/users').send({ name: 'U', email: 'u@x.com' });
            await request(app).post('/api/products').send({ name: 'P', price: 1 });

            const res = await request(app).delete('/api/empty');
            expect(res.status).toBe(200);

            const users = await request(app).get('/api/users');
            const products = await request(app).get('/api/products');
            expect(users.body.data).toHaveLength(0);
            expect(products.body.data).toHaveLength(0);
        });
    });

    // Rutas inexistentes
    // Devuelve 404 para metodo o path invalido
    describe('Rutas inexistentes', () => {
        it('devuelve 404 para metodo o path invalido', async () => {
            const res = await request(app).get('/no-existe');
            expect(res.status).toBe(404);
            expect(res.body.data.message).toMatch(/no encontrada/i);
        });

        it('devuelve 404 para ruta /api inexistente', async () => {
            const res = await request(app).get('/api/no-existe');
            expect(res.status).toBe(404);
        });
    });

    describe('errores internos 500', () => {
        afterEach(() => {
            jest.restoreAllMocks();
        });

        it('GET /api/users responde 500 si falla la base', async () => {
            jest.spyOn(db, 'getAllUsers').mockImplementation((cb) => cb(new Error('db')));
            const res = await request(app).get('/api/users');
            expect(res.status).toBe(500);
        });

        it('GET /api/users/:id responde 500 si falla la base', async () => {
            jest.spyOn(db, 'getUserById').mockImplementation((id, cb) => cb(new Error('db')));
            const res = await request(app).get('/api/users/1');
            expect(res.status).toBe(500);
        });

        it('POST /api/users responde 500 si falla el insert', async () => {
            jest.spyOn(db, 'insertUser').mockImplementation((data, cb) => cb(new Error('db')));
            const res = await request(app).post('/api/users').send({ name: 'A', email: 'a@a.com' });
            expect(res.status).toBe(500);
        });

        it('PUT /api/users/:id responde 500 si falla el update', async () => {
            jest.spyOn(db, 'updateUser').mockImplementation((id, data, cb) => cb(new Error('db')));
            const res = await request(app).put('/api/users/1').send({ name: 'A', email: 'a@a.com' });
            expect(res.status).toBe(500);
        });

        it('DELETE /api/users/:id responde 500 si falla el delete', async () => {
            jest.spyOn(db, 'deleteUser').mockImplementation((id, cb) => cb(new Error('db')));
            const res = await request(app).delete('/api/users/1');
            expect(res.status).toBe(500);
        });

        it('GET /api/products responde 500 si falla la base', async () => {
            jest.spyOn(db, 'getAllProducts').mockImplementation((cb) => cb(new Error('db')));
            const res = await request(app).get('/api/products');
            expect(res.status).toBe(500);
        });

        it('GET /api/products/:id responde 500 si falla la base', async () => {
            jest.spyOn(db, 'getProductById').mockImplementation((id, cb) => cb(new Error('db')));
            const res = await request(app).get('/api/products/1');
            expect(res.status).toBe(500);
        });

        it('POST /api/products responde 500 si falla el insert', async () => {
            jest.spyOn(db, 'insertProduct').mockImplementation((data, cb) => cb(new Error('db')));
            const res = await request(app).post('/api/products').send({ name: 'P', price: 1 });
            expect(res.status).toBe(500);
        });

        it('PUT /api/products/:id responde 500 si falla el update', async () => {
            jest.spyOn(db, 'updateProduct').mockImplementation((id, data, cb) => cb(new Error('db')));
            const res = await request(app).put('/api/products/1').send({ name: 'P', price: 1 });
            expect(res.status).toBe(500);
        });

        it('DELETE /api/products/:id responde 500 si falla el delete', async () => {
            jest.spyOn(db, 'deleteProduct').mockImplementation((id, cb) => cb(new Error('db')));
            const res = await request(app).delete('/api/products/1');
            expect(res.status).toBe(500);
        });

        it('DELETE /api/empty responde 500 si falla vaciar', async () => {
            jest.spyOn(db, 'emptyDatabase').mockImplementation((cb) => cb(new Error('db')));
            const res = await request(app).delete('/api/empty');
            expect(res.status).toBe(500);
        });

        it('GET /api/backup responde 500 si falla la copia', async () => {
            jest.spyOn(fs, 'copyFile').mockImplementation((src, dest, cb) => cb(new Error('io')));
            const res = await request(app).get('/api/backup');
            expect(res.status).toBe(500);
        });
    });
});
