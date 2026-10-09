const { initDb } = require('../src/db');
const { executeMessage } = require('../src/protocol');

initDb();

const run = (msg) =>
    new Promise((resolve) => {
        executeMessage(msg, resolve);
    });

(async () => {
    const insert = await run('{insert:users:{"name":"Ana","email":"ana@test.com"}}');
    console.log('insert', JSON.stringify(insert));

    const getOne = await run('{get:users:1}');
    console.log('get:users:1', JSON.stringify(getOne));

    const getAll = await run('{get:users}');
    console.log('get:users', JSON.stringify(getAll));

    const product = await run('{insert:products:{"name":"Laptop","price":10}}');
    console.log('insert product', JSON.stringify(product));

    const bad = await run('{invalid}');
    console.log('invalid', JSON.stringify(bad));

    process.exit(0);
})();
