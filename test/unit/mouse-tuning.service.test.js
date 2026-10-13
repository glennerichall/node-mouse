import {createMouseTuningService} from '../../server/services/mouse-tuning/createMouseTuningService.js';

describe('mouse tuning service', () => {
  it('records only movements belonging to the calibration device and stores the fitted transfer', () => {
    const service = createMouseTuningService({now: () => 1000});
    const session = service.createSession('device-1');

    expect(service.recordMovement({
      sessionId: session.id,
      deviceSessionId: 'other-device',
      rawDx: 2,
      rawDy: 0,
      adjustedDx: 4,
      adjustedDy: 0,
      elapsedMs: 10,
    })).toBe(false);
    expect(service.recordMovement({
      sessionId: session.id,
      deviceSessionId: 'device-1',
      rawDx: 2,
      rawDy: 0,
      adjustedDx: 4,
      adjustedDy: 0,
      elapsedMs: 10,
    })).toBe(true);
    expect(service.setTransferFunction(session.id, [1, 2, 3, 4])).toBe(true);
    expect(service.getSessionForDevice('device-1').transferFunction).toEqual([1, 2, 3, 4]);
    expect(service.readEvents(session.id).events).toHaveLength(1);
  });
});
