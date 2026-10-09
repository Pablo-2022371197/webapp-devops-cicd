const { formatResponse, formatError } = require('../src/format');

describe('formatResponse / formatError', () => {
    it('formatea una respuesta 200 por defecto', () => {
        expect(formatResponse({ ok: true })).toEqual({
            statusCode: 200,
            data: { ok: true }
        });
    });

    it('permite statusCode personalizado', () => {
        expect(formatResponse({ id: 1 }, 201).statusCode).toBe(201);
    });

    it('formatea un error 400 por defecto', () => {
        expect(formatError('Faltan datos')).toEqual({
            statusCode: 400,
            data: { message: 'Faltan datos' }
        });
    });

    it('permite error 500', () => {
        expect(formatError('Fallo interno', 500).statusCode).toBe(500);
    });
});
