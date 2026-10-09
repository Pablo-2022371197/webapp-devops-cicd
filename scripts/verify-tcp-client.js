const net = require('net');

const host = process.argv[2] || '127.0.0.1';
const port = Number(process.argv[3] || 6061);
const message = process.argv[4] || '{get:users}';

const client = net.createConnection({ host, port }, () => {
    client.write(`${message}\n`);
});

client.on('data', (data) => {
    console.log(data.toString().trim());
    client.destroy();
});

client.on('error', (err) => {
    console.error(err.message);
    process.exit(1);
});
