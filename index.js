const { initDb } = require('./src/db');
const { createHttpServer } = require('./src/http');
const { createTcpServer } = require('./src/tcp');

const HTTP_PORT = Number(process.env.HTTP_PORT) || 80;
const TCP_PORT = Number(process.env.TCP_PORT) || 6061;

initDb();
createHttpServer(HTTP_PORT);
createTcpServer(TCP_PORT);
