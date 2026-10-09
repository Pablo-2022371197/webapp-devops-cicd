const path = require('path');
const os = require('os');
const fs = require('fs');
const db = require('../src/db');
const { parseMessage, executeMessage } = require('../src/protocol');

const run = (msg) =>
    new Promise((resolve) => {
        executeMessage(msg, resolve);
    });

describe('protocolo TCP', () => {
    let testDbPath;

    beforeAll((done) => {
        testDbPath = path.join(os.tmpdir(), `intro-devops-protocol-${Date.now()}.sqlite`);
        db.initDb(testDbPath);
        done();
    });

    afterAll((done) => {
        db.closeDb((err) => {
            if (fs.existsSync(testDbPath)) {
                fs.unlinkSync(testDbPath);
            }
            done(err);
        });
    });

    beforeEach((done) => {
        db.emptyDatabase(done);
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('parseMessage', () => {
        it('rechaza formato invalido', () => {
            const parsed = parseMessage('hola');
            expect(parsed.error.statusCode).toBe(400);
        });

        it('rechaza entidad invalida', () => {
            const parsed = parseMessage('{get:orders}');
            expect(parsed.error.data.message).toMatch(/entidad invalida/i);
        });

        it('parsea get de listado', () => {
            expect(parseMessage('{get:users}')).toMatchObject({
                action: 'get',
                entity: 'users'
            });
        });
    });

    describe('executeMessage', () => {
        it('inserta y lista usuarios', async () => {
            const created = await run('{insert:users:{"name":"Ana","email":"ana@mail.com"}}');
            expect(created.statusCode).toBe(200);
            expect(created.data.name).toBe('Ana');

            const list = await run('{get:users}');
            expect(list.data).toHaveLength(1);
        });

        it('obtiene usuario por id y 404 si no existe', async () => {
            const created = await run('{insert:users:{"name":"Luis","email":"l@mail.com"}}');
            const found = await run(`{get:users:${created.data.id}}`);
            expect(found.statusCode).toBe(200);

            const missing = await run('{get:users:9999}');
            expect(missing.statusCode).toBe(404);
        });

        it('inserta y lista productos', async () => {
            const created = await run('{insert:products:{"name":"Laptop","price":10}}');
            expect(created.data.price).toBe(10);

            const list = await run('{get:products}');
            expect(list.data).toHaveLength(1);

            const found = await run(`{get:products:${created.data.id}}`);
            expect(found.data.name).toBe('Laptop');
        });

        it('rechaza insert sin JSON', async () => {
            const res = await run('{insert:users}');
            expect(res.statusCode).toBe(400);
        });

        it('rechaza JSON invalido', async () => {
            const res = await run('{insert:users:{name}}');
            expect(res.data.message).toMatch(/json invalido/i);
        });

        it('rechaza users incompleto', async () => {
            const res = await run('{insert:users:{"name":"SinEmail"}}');
            expect(res.data.message).toMatch(/name y email/i);
        });

        it('rechaza products incompleto', async () => {
            const res = await run('{insert:products:{"name":"SinPrecio"}}');
            expect(res.data.message).toMatch(/name y price/i);
        });

        it('rechaza id no numerico', async () => {
            const res = await run('{get:users:abc}');
            expect(res.data.message).toMatch(/id invalido/i);
        });

        it('devuelve 404 de producto inexistente', async () => {
            const res = await run('{get:products:42}');
            expect(res.statusCode).toBe(404);
        });

        it('propaga error 500 al insertar usuario', async () => {
            jest.spyOn(db, 'insertUser').mockImplementation((data, cb) => cb(new Error('db')));
            const res = await run('{insert:users:{"name":"A","email":"a@a.com"}}');
            expect(res.statusCode).toBe(500);
        });

        it('propaga error 500 al insertar producto', async () => {
            jest.spyOn(db, 'insertProduct').mockImplementation((data, cb) => cb(new Error('db')));
            const res = await run('{insert:products:{"name":"P","price":1}}');
            expect(res.statusCode).toBe(500);
        });

        it('propaga error 500 al listar usuarios', async () => {
            jest.spyOn(db, 'getAllUsers').mockImplementation((cb) => cb(new Error('db')));
            const res = await run('{get:users}');
            expect(res.statusCode).toBe(500);
        });

        it('propaga error 500 al listar productos', async () => {
            jest.spyOn(db, 'getAllProducts').mockImplementation((cb) => cb(new Error('db')));
            const res = await run('{get:products}');
            expect(res.statusCode).toBe(500);
        });

        it('propaga error 500 al obtener usuario', async () => {
            jest.spyOn(db, 'getUserById').mockImplementation((id, cb) => cb(new Error('db')));
            const res = await run('{get:users:1}');
            expect(res.statusCode).toBe(500);
        });

        it('propaga error 500 al obtener producto', async () => {
            jest.spyOn(db, 'getProductById').mockImplementation((id, cb) => cb(new Error('db')));
            const res = await run('{get:products:1}');
            expect(res.statusCode).toBe(500);
        });
    });
});
