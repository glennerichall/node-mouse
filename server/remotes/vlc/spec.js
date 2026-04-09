export const VLC_APP_SPEC = {
  linux: {
    commands: ['vlc'],
    processNames: ['vlc', 'vlc.bin'],
    windowClasses: ['vlc'],
    windowNames: ['vlc', 'vlc media player'],
  },
  darwin: {
    apps: ['VLC', 'VLC media player'],
  },
  win32: {
    commands: ['vlc'],
    windowTitles: ['VLC media player', 'VLC'],
  },
};
