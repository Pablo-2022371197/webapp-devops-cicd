const formatResponse = (data, statusCode = 200) => ({
    statusCode,
    data
});

const formatError = (message, statusCode = 400) => ({
    statusCode,
    data: { message }
});

module.exports = { formatResponse, formatError };
