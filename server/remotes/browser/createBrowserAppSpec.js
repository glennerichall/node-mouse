export function createBrowserAppSpec(browser) {
  return {
    linux: {
      commands: browser.linuxCommands ?? [],
      flatpakAppId: browser.linuxFlatpakAppId,
      processNames: browser.linuxProcessNames ?? browser.linuxCommands ?? [],
      windowClasses: browser.linuxWindowClasses ?? [],
      windowNames: browser.linuxWindowNames ?? [],
    },
    darwin: {
      apps: browser.darwinApps ?? [],
    },
    win32: {
      commands: browser.winCommands ?? [],
      windowTitles: [browser.name, browser.shortLabel].filter(Boolean),
    },
  };
}
