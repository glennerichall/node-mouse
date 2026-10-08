import {createMouseMoveDispatcher} from '../../services/input/createMouseMoveDispatcher.js';
import Router from 'router';

const moves = new WeakMap();
const getInput = (request) => request.services.getInputController();
const getMove = (request, mouse) => {
    let move = moves.get(request.socket);
    if (!move) {
        move = createMouseMoveDispatcher(mouse);
        moves.set(request.socket, move);
    }
    return move;
};
export const mouseRouter = Router()
    .post(`/movements`, async (request, response) => {
        const {mouse} = getInput(request);
        getMove(request, mouse)(request.body);
        response.send({ok: true});
    })
    .post(`/clicks`, (request, response) => {
        getInput(request).mouse.click(request.body.button);
        response.send({ok: true});
    })
    .post(`/buttons`, (request, response) => {
        getInput(request).mouse.setButtonState(request.body.button, request.body.state);
        response.send({ok: true});
    })
    .post(`/scrolls`, (request, response) => {
        getInput(request).mouse.scroll(Number(request.body.dy) || 0);
        response.send({ok: true});
    })
export const keyboardRouter = Router()
    .post(`/texts`, (request, response) => {
        getInput(request).keyboard.typeText(request.body.text);
        response.send({ok: true});
    })
    .post(`/keys`, (request, response) => {
        getInput(request).keyboard.pressSpecialKey(request.body.key, request.body.modifiers);
        response.send({ok: true});
    });
