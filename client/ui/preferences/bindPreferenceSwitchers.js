import {
  mountHandednessSwitcher,
  mountRemoteAutoHideSwitcher,
  mountThemeSwitcher,
} from './switchers.js';

export function bindPreferenceSwitchers(services) {
  const preferenceView = services.getPreferenceView();
  const i18n = services.getI18n();

  i18n.mountLanguageSwitcher();

  mountThemeSwitcher({
    theme: preferenceView.getTheme(),
    t: i18n.t,
    onChange(theme) {
      preferenceView.setTheme(theme);
    },
  });

  mountHandednessSwitcher({
    handedness: preferenceView.getHandedness(),
    t: i18n.t,
    onChange(handedness) {
      preferenceView.setHandedness(handedness);
    },
  });

  mountRemoteAutoHideSwitcher({
    enabled: preferenceView.getRemoteAutoHide(),
    t: i18n.t,
    onChange(value) {
      preferenceView.setRemoteAutoHide(value);
    },
  });
}
