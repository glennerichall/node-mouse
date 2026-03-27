import { emitWithTimestamp } from '../core/socket-emit.js';

export function bindMouseButtons(socket, { btnLeft, btnRight }) {
  btnLeft.addEventListener('click', () => emitWithTimestamp(socket, 'mouse:click', { button: 'left' }));
  btnRight.addEventListener('click', () => emitWithTimestamp(socket, 'mouse:click', { button: 'right' }));
}
