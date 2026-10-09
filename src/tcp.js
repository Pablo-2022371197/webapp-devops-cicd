const net = require('net');
const { executeMessage } = require('./protocol');

const createTcpServer = (port) => {
    const server = net.createServer((socket) => {
        let buffer = '';

        const flushLine = (line) => {
            const trimmed = line.trim();
            if (!trimmed) return;

            executeMessage(trimmed, (response) => {
                socket.write(`${JSON.stringify(response)}\n`);
            });
        };

        socket.on('data', (chunk) => {
            buffer += chunk.toString();
            let newlineIndex = buffer.indexOf('\n');

            while (newlineIndex >= 0) {
                const line = buffer.slice(0, newlineIndex);
                buffer = buffer.slice(newlineIndex + 1);
                flushLine(line);
                newlineIndex = buffer.indexOf('\n');
            }
        });

        socket.on('end', () => {
            if (buffer.trim()) {
                flushLine(buffer);
            }
        });
    });

    server.listen(port, () => {
        console.log(`Servidor TCP corriendo en el puerto ${port}`);
    });

    return server;
};

module.exports = { createTcpServer };
