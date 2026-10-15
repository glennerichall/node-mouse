import RemoteMouseFocus, {activateMatchingWindow} from '../../native/gnome-shell/remote-mouse-focus@velor/extension.js';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

let activated = false;
const workspace = {
  activate_with_focus(window, timestamp) {
    activated = window && timestamp === 123;
  },
};
const matchingWindow = {
  get_wm_class: () => 'Google-chrome',
  get_wm_class_instance: () => 'google-chrome',
  get_title: () => 'New Tab - Google Chrome',
  get_workspace: () => workspace,
};
const matchingActor = {get_meta_window: () => matchingWindow};

assert(activateMatchingWindow([matchingActor], 'Google Chrome', 123), 'title matching failed');
assert(activated, 'matching window was not activated');
assert(!activateMatchingWindow([matchingActor], 'Firefox', 123), 'unrelated window matched');

const extension = new RemoteMouseFocus();
globalThis.global = {
  get_window_actors: () => [matchingActor],
  get_current_time: () => 123,
};
assert(extension.ActivateByClass('google-chrome'), 'extension activation failed');

print('GNOME focus extension GJS test passed');
