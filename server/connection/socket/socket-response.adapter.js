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

    const end = (body) => {
        if (ended) return response;
        ended = true;
        acknowledge?.(body);
        return response;
    };

    const response = {
        get statusCode() {
            return statusCode;
        },
        status(code) {
            statusCode = Number(code) || 200;
            return response;
        },
        send(body) {
            return end(body);
        },
        end,
        sendStatus(code) {
            statusCode = Number(code) || 200;
            return end(STATUS_TEXT[statusCode] ?? String(statusCode));
        },
    };
    return response;
}
