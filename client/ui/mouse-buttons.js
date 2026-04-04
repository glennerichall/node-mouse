import { emitWithTimestamp } from '../core/socket-emit.js';
import { REMOTE_EVENT_MOUSE_BUTTON } from '../../utils/shared/remoteCommands.js';

export function bindMouseButtons(socket, { btnLeft, btnRight }) {
  function bindHoldButton(buttonNode, button) {
    if (!buttonNode) {
      return;
    }

    let isPressed = false;
    let activeTouchId = null;

    const press = () => {
      if (isPressed) {
        return;
      }

      isPressed = true;
      console.log('[mouse-buttons] emit down', { button });
      emitWithTimestamp(socket, REMOTE_EVENT_MOUSE_BUTTON, { button, state: 'down' });
    };

    const release = () => {
      if (!isPressed) {
        return;
      }

      isPressed = false;
      activeTouchId = null;
      console.log('[mouse-buttons] emit up', { button });
      emitWithTimestamp(socket, REMOTE_EVENT_MOUSE_BUTTON, { button, state: 'up' });
    };

    const onDocumentTouchEnd = (event) => {
      if (activeTouchId === null) {
        return;
      }

      const touchStillActive = Array.from(event.touches || []).some((touch) => touch.identifier === activeTouchId);
      if (!touchStillActive) {
        release();
      }
    };

    const onDocumentMouseUp = () => {
      release();
    };

    buttonNode.addEventListener('pointerdown', (event) => {
      event.preventDefault();
      buttonNode.setPointerCapture?.(event.pointerId);
      press();
    });

    buttonNode.addEventListener('pointerup', (event) => {
      event.preventDefault();
      buttonNode.releasePointerCapture?.(event.pointerId);
      release();
    });

    buttonNode.addEventListener('mousedown', (event) => {
      event.preventDefault();
      press();
    });

    buttonNode.addEventListener('mouseup', (event) => {
      event.preventDefault();
      release();
    });

    buttonNode.addEventListener('mouseleave', release);
    buttonNode.addEventListener('touchstart', (event) => {
      event.preventDefault();
      activeTouchId = event.changedTouches?.[0]?.identifier ?? null;
      press();
    }, { passive: false });
    buttonNode.addEventListener('touchend', (event) => {
      event.preventDefault();
      release();
    }, { passive: false });
    buttonNode.addEventListener('touchcancel', release, { passive: false });
    buttonNode.addEventListener('pointercancel', release);
    buttonNode.addEventListener('lostpointercapture', release);
    document.addEventListener('touchend', onDocumentTouchEnd, { passive: false });
    document.addEventListener('touchcancel', onDocumentTouchEnd, { passive: false });
    document.addEventListener('mouseup', onDocumentMouseUp);
  }

  bindHoldButton(btnLeft, 'left');
  bindHoldButton(btnRight, 'right');
}
