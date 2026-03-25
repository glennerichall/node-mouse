export function bindMouseButtons(socket, { btnLeft, btnRight }) {
  btnLeft.addEventListener('click', () => socket.emit('mouse:click', { button: 'left' }));
  btnRight.addEventListener('click', () => socket.emit('mouse:click', { button: 'right' }));
}
