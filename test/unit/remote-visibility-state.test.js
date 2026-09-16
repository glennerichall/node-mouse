import fs from 'node:fs';
import {applyRemoteVisibilityState} from '../../client/ui/main/applyRemoteVisibilityState.js';
import {mergeAvailableRemotes} from '../../client/preferences/state.js';
import {APP_STATE_EFFECTIVE_SYSTEM_REMOTE_VISIBLE} from '../../client/services/app-state/createAppStateService.js';

describe('remote visibility state', () => {
  it('includes the system remote in local preferences', () => {
    expect(mergeAvailableRemotes([])).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: 'system',
        labelKey: 'preferences.remote.system',
      }),
    ]));
  });

  it('hides the system remote when disabled in local preferences', () => {
    const systemRoot = {hidden: false};
    const visibleRoot = {hidden: false};
    const services = {
      getAppState: () => ({
        get: (key) => key !== APP_STATE_EFFECTIVE_SYSTEM_REMOTE_VISIBLE,
      }),
    };
    const dom = {
      app: {classList: {toggle() {}}},
      remotes: {
        browser: {root: visibleRoot},
        keyboard: {},
        system: {root: systemRoot},
        samsung: {root: visibleRoot},
        vlc: {root: visibleRoot},
        preview: {root: visibleRoot},
      },
    };

    applyRemoteVisibilityState({services, dom});

    expect(systemRoot.hidden).toBe(true);
  });

  it('does not let the remote panel display rule override the hidden system remote', () => {
    const styles = fs.readFileSync(new URL('../../public/styles.css', import.meta.url), 'utf8');

    expect(styles).toContain('#system-controls[hidden],');
  });
});
