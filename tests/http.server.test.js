const request = require('supertest');
const { createHttpServer } = require('../src/http');

describe('createHttpServer', () => {
    let server;

    afterEach((done) => {
        if (!server) return done();
        server.close(done);
    });

    it('escucha en un puerto efimero', async () => {
        server = createHttpServer(0);
        await new Promise((resolve) => server.once('listening', resolve));

        const { port } = server.address();
        const res = await request(`http://127.0.0.1:${port}`).get('/api/health');
        expect(res.status).toBe(201);
        expect(res.body.data.status).toBe('ok2');
    });
});
