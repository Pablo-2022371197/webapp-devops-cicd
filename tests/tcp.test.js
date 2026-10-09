const net = require('net');
const path = require('path');
const os = require('os');
const fs = require('fs');
const db = require('../src/db');
const { createTcpServer } = require('../src/tcp');

const sendCommand = (port, payload) =>
    new Promise((resolve, reject) => {
        const socket = net.connect({ port, host: '127.0.0.1' }, () => {
            socket.write(payload);
        });

        let buffer = '';
        socket.on('data', (chunk) => {
            buffer += chunk.toString();
            if (buffer.includes('\n')) {
                socket.end();
            }
        });
        socket.on('end', () => {
            try {
                resolve(JSON.parse(buffer.trim()));
            } catch (err) {
                reject(err);
            }
        });
        socket.on('error', reject);
    });

describe('servidor TCP', () => {
    let server;
    let port;
    let testDbPath;

    beforeAll((done) => {
        testDbPath = path.join(os.tmpdir(), `intro-devops-tcp-${Date.now()}.sqlite`);
        db.initDb(testDbPath);
        server = createTcpServer(0);
        server.once('listening', () => {
            port = server.address().port;
            done();
        });
    });

    afterAll((done) => {
        server.close(() => {
            db.closeDb((err) => {
                if (fs.existsSync(testDbPath)) {
                    fs.unlinkSync(testDbPath);
                }
                done(err);
            });
        });
    });

    beforeEach((done) => {
        db.emptyDatabase(done);
    });

    it('responde get:users por socket', async () => {
        const res = await sendCommand(port, '{get:users}\n');
        expect(res.statusCode).toBe(200);
        expect(res.data).toEqual([]);
    });

    it('inserta usuario y lo lista', async () => {
        const created = await sendCommand(
            port,
            '{insert:users:{"name":"Ana","email":"ana@mail.com"}}\n'
        );
        expect(created.data.name).toBe('Ana');

        const list = await sendCommand(port, '{get:users}\n');
        expect(list.data).toHaveLength(1);
    });

    it('ignora lineas vacias y responde el comando siguiente', async () => {
        const res = await sendCommand(port, '\n{get:products}\n');
        expect(res.statusCode).toBe(200);
        expect(res.data).toEqual([]);
    });
});
