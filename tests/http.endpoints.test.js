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
    describe('GET /health', () => {
        it('responde 200 con status ok', async () => {
            const res = await request(app).get('/health');
            expect(res.status).toBe(200);
            expect(res.body).toEqual({ statusCode: 200, data: { status: 'ok' } });
        });
    });

    // GET /users
    // Responde 200 con la lista de usuarios
    describe('GET /users', () => {
        it('lista usuarios vacios al inicio', async () => {
            const res = await request(app).get('/users');
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
                .post('/users')
                .send({ name: 'Ana', email: 'ana@mail.com' });

            expect(res.status).toBe(201);
            expect(res.body.statusCode).toBe(201);
            expect(res.body.data).toMatchObject({ name: 'Ana', email: 'ana@mail.com' });
            expect(res.body.data.id).toEqual(expect.any(Number));
        });

        it('falla si falta email (error del consumidor)', async () => {
            const res = await request(app).post('/users').send({ name: 'Sin email' });
            expect(res.status).toBe(400);
            expect(res.body.data.message).toMatch(/name y email/i);
        });

        it('falla con cuerpo vacio', async () => {
            const res = await request(app).post('/users').send({});
            expect(res.status).toBe(400);
        });

        it('falla con JSON mal formado', async () => {
            const res = await request(app)
                .post('/users')
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
                .post('/users')
                .send({ name: 'Luis', email: 'luis@mail.com' });

            const res = await request(app).get(`/users/${created.body.data.id}`);
            expect(res.status).toBe(200);
            expect(res.body.data.email).toBe('luis@mail.com');
        });

        it('devuelve 404 si el id no existe', async () => {
            const res = await request(app).get('/users/9999');
            expect(res.status).toBe(404);
        });

        it('devuelve 400 si el id no es numerico', async () => {
            const res = await request(app).get('/users/abc');
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
                .post('/users')
                .send({ name: 'Original', email: 'orig@mail.com' });

            const res = await request(app)
                .put(`/users/${created.body.data.id}`)
                .send({ name: 'Actualizado', email: 'nuevo@mail.com' });

            expect(res.status).toBe(200);
            expect(res.body.data).toMatchObject({
                name: 'Actualizado',
                email: 'nuevo@mail.com'
            });
        });

        it('devuelve 404 al actualizar id inexistente', async () => {
            const res = await request(app)
                .put('/users/8888')
                .send({ name: 'Nadie', email: 'nadie@mail.com' });
            expect(res.status).toBe(404);
        });

        it('devuelve 400 si el cuerpo esta incompleto', async () => {
            const created = await request(app)
                .post('/users')
                .send({ name: 'Pepe', email: 'pepe@mail.com' });

            const res = await request(app)
                .put(`/users/${created.body.data.id}`)
                .send({ name: 'Solo nombre' });

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
                .post('/users')
                .send({ name: 'Borrar', email: 'borrar@mail.com' });

            const res = await request(app).delete(`/users/${created.body.data.id}`);
            expect(res.status).toBe(200);
            expect(res.body.data.message).toMatch(/eliminado/i);

            const check = await request(app).get(`/users/${created.body.data.id}`);
            expect(check.status).toBe(404);
        });

        it('devuelve 404 al eliminar id que no existe', async () => {
            const res = await request(app).delete('/users/7777');
            expect(res.status).toBe(404);
        });
    });

    // GET /products y POST /products
    // Crea y lista productos
    // Responde 200 con la lista de productos
    // Responde 400 si el producto no tiene price
    // Responde 400 si el price no es un numero
    describe('GET /products y POST /products', () => {
        it('crea y lista productos', async () => {
            await request(app).post('/products').send({ name: 'Teclado', price: 49.99 });

            const res = await request(app).get('/products');
            expect(res.status).toBe(200);
            expect(res.body.data).toHaveLength(1);
            expect(res.body.data[0].name).toBe('Teclado');
        });

        it('rechaza producto sin price', async () => {
            const res = await request(app).post('/products').send({ name: 'Sin precio' });
            expect(res.status).toBe(400);
        });

        it('rechaza price que no es numero', async () => {
            const res = await request(app)
                .post('/products')
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
                .post('/products')
                .send({ name: 'Monitor', price: 120 });

            const res = await request(app).get(`/products/${created.body.data.id}`);
            expect(res.status).toBe(200);
            expect(res.body.data.name).toBe('Monitor');
        });
    });

    // PUT /products/:id
    // Actualiza un producto existente
    // Responde 200 con el producto actualizado
    // Responde 404 si el id no existe
    describe('PUT /products/:id', () => {
        it('actualiza precio y nombre', async () => {
            const created = await request(app)
                .post('/products')
                .send({ name: 'Cable', price: 10 });

            const res = await request(app)
                .put(`/products/${created.body.data.id}`)
                .send({ name: 'Cable HDMI', price: 15.5 });

            expect(res.status).toBe(200);
            expect(res.body.data).toMatchObject({ name: 'Cable HDMI', price: 15.5 });
        });
    });

    // DELETE /products/:id
    // Elimina un producto existente
    // Responde 200 con el producto eliminado
    // Responde 404 si el id no existe
    describe('DELETE /products/:id', () => {
        it('elimina producto existente', async () => {
            const created = await request(app)
                .post('/products')
                .send({ name: 'Temp', price: 1 });

            const res = await request(app).delete(`/products/${created.body.data.id}`);
            expect(res.status).toBe(200);

            const list = await request(app).get('/products');
            expect(list.body.data).toHaveLength(0);
        });
    });

    // GET /backup
    // Genera un archivo de respaldo descargable
    // Responde 200 con el archivo de respaldo
    // Responde 404 si el archivo de respaldo no existe
    describe('GET /backup', () => {
        it('genera archivo de respaldo descargable', async () => {
            await request(app).post('/users').send({ name: 'Backup', email: 'b@mail.com' });

            const res = await request(app).get('/backup');
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
            await request(app).post('/users').send({ name: 'U', email: 'u@x.com' });
            await request(app).post('/products').send({ name: 'P', price: 1 });

            const res = await request(app).delete('/empty');
            expect(res.status).toBe(200);

            const users = await request(app).get('/users');
            const products = await request(app).get('/products');
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
    });
});
