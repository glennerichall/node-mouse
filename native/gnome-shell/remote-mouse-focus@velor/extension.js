import Gio from 'gi://Gio';

const DBUS_INTERFACE = `
<node>
  <interface name="com.velor.RemoteMouseFocus">
    <method name="ActivateByClass">
      <arg name="className" type="s" direction="in" />
      <arg name="found" type="b" direction="out" />
    </method>
  </interface>
</node>`;

function includesIgnoreCase(value, expected) {
  return String(value || '').toLowerCase().includes(String(expected || '').toLowerCase());
}

function matchesWindow(window, pattern) {
  return includesIgnoreCase(window.get_wm_class(), pattern)
    || includesIgnoreCase(window.get_wm_class_instance(), pattern)
    || includesIgnoreCase(window.get_title(), pattern);
}

export function activateMatchingWindow(actors, pattern, timestamp) {
  for (const actor of actors || []) {
    const window = actor.get_meta_window();
    if (!matchesWindow(window, pattern)) continue;

    const workspace = window.get_workspace();
    if (workspace) {
      workspace.activate_with_focus(window, timestamp);
    } else {
      window.activate(timestamp);
    }
    return true;
  }

  return false;
}

export default class RemoteMouseFocus {
  enable() {
    this._dbus = Gio.DBusExportedObject.wrapJSObject(DBUS_INTERFACE, this);
    this._dbus.export(Gio.DBus.session, '/com/velor/RemoteMouseFocus');
  }

  disable() {
    this._dbus?.unexport();
    this._dbus = null;
  }

  ActivateByClass(className) {
    return activateMatchingWindow(
      global.get_window_actors(),
      className,
      global.get_current_time(),
    );
  }
}
