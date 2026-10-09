const net = require('net');
const http = require('http');

const tcpSend = (message) =>
    new Promise((resolve, reject) => {
        const client = net.createConnection({ host: '127.0.0.1', port: 6061 }, () => {
            client.write(`${message}\n`);
        });
        let data = '';
        client.on('data', (chunk) => {
            data += chunk.toString();
            client.end();
        });
        client.on('close', () => resolve(data.trim()));
        client.on('error', reject);
    });

const httpGet = (path) =>
    new Promise((resolve, reject) => {
        http.get(`http://127.0.0.1:8080${path}`, (res) => {
            let body = '';
            res.on('data', (chunk) => {
                body += chunk;
            });
            res.on('end', () => resolve(JSON.parse(body)));
        }).on('error', reject);
    });

(async () => {
    const insertMsg = '{insert:users:{"name":"TcpUser","email":"tcp@test.com"}}';
    const insertResp = await tcpSend(insertMsg);
    console.log('TCP insert:', insertResp);

    const httpUsers = await httpGet('/users');
    console.log('HTTP /users:', JSON.stringify(httpUsers));

    const getMsg = '{get:users}';
    const getResp = await tcpSend(getMsg);
    console.log('TCP get all:', getResp);

    process.exit(0);
})().catch((err) => {
    console.error(err);
    process.exit(1);
});
