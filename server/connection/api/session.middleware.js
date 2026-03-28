import express from "express";

export const createSessionCreationMiddleware = ({
                                            cookieName,
                                            cookieMaxAgeMs,
                                            secureCookies = true,
                                        }) => (req, res, next) => {
    res.createSession = (token) => {
        res.cookie(cookieName, token,
            {
                signed: true,
                httpOnly: true,
                secure: secureCookies,
                sameSite: 'lax',
                maxAge: cookieMaxAgeMs,
                path: '/',
            });
    }
    next();
}

export function createSessionValidationMiddleware({
                                                      tokenManager,
                                                      cookieName
                                                  }) {
    return (req, res, next) => {
        const token = req.signedCookies && req.signedCookies[cookieName];
        if (!tokenManager.isValid(token)) {
            res.status(401).type('text/plain').send('Unauthorized');
            return;
        }
        req.sessionToken = token;
        next();
    }
}

export function createEntryRouter(tokenManager) {
    const router = express.Router();

    router.get('/:token', (req, res) => {
        if (tokenManager.isValid(req.params.token)) {
            res.createSession(req.params.token);
            res.redirect('/');
        } else {
            res.status(401).type('text/plain').send('Unauthorized');
        }
    });

    return router;
}