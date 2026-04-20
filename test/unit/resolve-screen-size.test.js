import {
  parseXdpyinfoScreenSize,
  parseXrandrScreenSize,
} from '../../server/os/linux/screen.js';

describe('resolve screen size', () => {
  it('parses the current screen size from xrandr output', () => {
    expect(parseXrandrScreenSize('Screen 0: minimum 8 x 8, current 1920 x 1080, maximum 32767 x 32767')).toEqual({
      width: 1920,
      height: 1080,
    });
  });

  it('parses the current screen size from xdpyinfo output', () => {
    expect(parseXdpyinfoScreenSize('  dimensions:    1280x720 pixels (338x190 millimeters)')).toEqual({
      width: 1280,
      height: 720,
    });
  });
});
