import {applyPointerSpeedCurve} from '../../utils/math.js';

describe('pointer speed curve', () => {
  it('uses the slow-speed endpoint for slow movement', () => {
    expect(applyPointerSpeedCurve(1, 0, 100, 1.5, 4)).toEqual({dx: 1.5, dy: 0});
  });

  it('uses the fast-speed endpoint for fast movement', () => {
    expect(applyPointerSpeedCurve(10, 0, 10, 1.5, 4)).toEqual({dx: 40, dy: 0});
  });

  it('interpolates monotonically between the configured endpoints', () => {
    const {dx} = applyPointerSpeedCurve(4, 0, 10, 1.5, 4);

    expect(dx).toBeGreaterThan(4 * 1.5);
    expect(dx).toBeLessThan(4 * 4);
  });

  it('never lets the fast endpoint fall below the slow endpoint', () => {
    expect(applyPointerSpeedCurve(10, 0, 10, 4, 1)).toEqual({dx: 40, dy: 0});
  });
});
