import {
  APP_STATE_KEYBOARD_PREVIEW_ACTIVE,
  APP_STATE_PREVIEW_ACTIVITY_AT,
  APP_STATE_REMOTE_ACCORDION_EXPANDED_PANEL,
  createAppStateService,
  getAppStatePropertyChangedEventName,
} from '../../client/services/app-state/createAppStateService.js';

describe('client app state service', () => {
  it('stores flat state values and publishes property changes', () => {
    const appState = createAppStateService();
    const allChanges = [];
    const keyboardChanges = [];

    appState.subscribe((payload) => {
      allChanges.push(payload);
    });
    appState.subscribeProperty(APP_STATE_KEYBOARD_PREVIEW_ACTIVE, (payload) => {
      keyboardChanges.push(payload);
    });

    expect(appState.getSnapshot()).toEqual({
      [APP_STATE_PREVIEW_ACTIVITY_AT]: 0,
      [APP_STATE_KEYBOARD_PREVIEW_ACTIVE]: false,
      [APP_STATE_REMOTE_ACCORDION_EXPANDED_PANEL]: '',
    });

    expect(appState.set(APP_STATE_KEYBOARD_PREVIEW_ACTIVE, true)).toBe(true);
    expect(appState.set(APP_STATE_KEYBOARD_PREVIEW_ACTIVE, true)).toBe(true);

    expect(allChanges).toHaveLength(1);
    expect(keyboardChanges).toHaveLength(1);
    expect(keyboardChanges[0]).toEqual({
      property: APP_STATE_KEYBOARD_PREVIEW_ACTIVE,
      value: true,
      previousValue: false,
      state: {
        [APP_STATE_PREVIEW_ACTIVITY_AT]: 0,
        [APP_STATE_KEYBOARD_PREVIEW_ACTIVE]: true,
        [APP_STATE_REMOTE_ACCORDION_EXPANDED_PANEL]: '',
      },
    });
  });

  it('builds stable pubsub event names for state properties', () => {
    expect(getAppStatePropertyChangedEventName(APP_STATE_PREVIEW_ACTIVITY_AT))
      .toBe('app-state.previewActivityAt.changed');
  });
});
