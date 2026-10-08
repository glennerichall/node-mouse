const STATUS_TEXT = {
    200: 'OK',
    201: 'Created',
    204: 'No Content',
    400: 'Bad Request',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Not Found',
    500: 'Internal Server Error',
};

/** Express-like response facade for a Socket.IO acknowledgement callback. */
export function createSocketResponse(acknowledge) {
    let statusCode = 200;
    let ended = false;

    const validateStatus = (code) => {
        const value = Number(code);
        if (!Number.isInteger(value) || value < 100 || value > 999) {
            throw new RangeError(`Invalid HTTP status code: ${code}`);
        }
        return value;
    };

    const end = (body) => {
        if (ended) return response;
        ended = true;
        acknowledge?.(statusCode === 204 || statusCode === 304 ? undefined : body);
        return response;
    };

    const response = {
        get statusCode() {
            return statusCode;
        },
        get ended() {
            return ended;
        },
        status(code) {
            statusCode = validateStatus(code);
            return response;
        },
        send(body) {
            return end(body);
        },
        end,
        sendStatus(code) {
            statusCode = validateStatus(code);
            return end(statusCode === 204 || statusCode === 304
                ? undefined
                : STATUS_TEXT[statusCode] ?? String(statusCode));
        },
    };
    return response;
}
