import {
  mountLanguageSwitcher,
  mountHandednessSwitcher,
  mountRemoteAutoHideSwitcher,
  mountThemeSwitcher,
} from './switchers.js';
import {
  APP_STATE_HANDEDNESS,
  APP_STATE_LOCALE,
  APP_STATE_REMOTE_AUTO_HIDE,
  APP_STATE_THEME,
} from '../../services/app-state/createAppStateService.js';

export function bindPreferenceSwitchers(services) {
  const appState = services.getAppState();
  const i18n = services.getI18n();

  mountLanguageSwitcher({
    locale: appState.get(APP_STATE_LOCALE),
    t: i18n.t,
    onChange(locale) {
      appState.set(APP_STATE_LOCALE, locale);
    },
  });

  mountThemeSwitcher({
    theme: appState.get(APP_STATE_THEME),
    t: i18n.t,
    onChange(theme) {
      appState.set(APP_STATE_THEME, theme);
    },
  });

  mountHandednessSwitcher({
    handedness: appState.get(APP_STATE_HANDEDNESS),
    t: i18n.t,
    onChange(handedness) {
      appState.set(APP_STATE_HANDEDNESS, handedness);
    },
  });

  mountRemoteAutoHideSwitcher({
    enabled: appState.get(APP_STATE_REMOTE_AUTO_HIDE),
    t: i18n.t,
    onChange(value) {
      appState.set(APP_STATE_REMOTE_AUTO_HIDE, value);
    },
  });
}
