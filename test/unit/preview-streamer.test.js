import {jest} from '@jest/globals';
import {createPreviewStreamer} from '../../server/remotes/preview/createPreviewStreamer.js';

function createFixture() {
  const capture = jest.fn(() => ({image: Buffer.alloc(16), byteWidth: 8}));
  const getScreenInfo = jest.fn(async () => ({width: 1920, height: 1080}));
  const queuedFrames = [];
  const socket = {
    connected: true,
    conn: {transport: {writable: true}},
    emit: jest.fn((...args) => queuedFrames.push(args)),
    volatile: {
      emit: jest.fn((...args) => {
        if (socket.conn.transport.writable) {
          queuedFrames.push(args);
        }
      }),
    },
  };
  const streamer = createPreviewStreamer({
    getConfig: () => ({preview: {width: 2, height: 2, fps: 20}}),
    getRobot: () => ({getMousePos: () => ({x: 100, y: 100}), screen: {capture}}),
    getSystem: () => ({getScreenInfo}),
  });
  return {streamer, socket, capture, getScreenInfo, queuedFrames};
}

describe('preview streamer', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('does not accumulate frames while the transport is blocked and resumes when writable', async () => {
    const {streamer, socket, capture, queuedFrames} = createFixture();
    const session = streamer.startForSocket(socket);
    socket.conn.transport.writable = false;
    await jest.advanceTimersByTimeAsync(5000);
    expect(queuedFrames).toHaveLength(0);
    expect(capture).not.toHaveBeenCalled();
    socket.conn.transport.writable = true;
    await jest.advanceTimersByTimeAsync(50);
    expect(queuedFrames).toHaveLength(1);
    session.stop();
    expect(jest.getTimerCount()).toBe(0);
  });

  it('drops a frame if the transport becomes blocked during screen detection', async () => {
    const {streamer, socket, getScreenInfo, queuedFrames} = createFixture();
    getScreenInfo.mockImplementation(async () => {
      socket.conn.transport.writable = false;
      return {width: 1920, height: 1080};
    });
    const session = streamer.startForSocket(socket);
    await jest.advanceTimersByTimeAsync(50);
    expect(queuedFrames).toHaveLength(0);
    session.stop();
  });

  it('does not capture or reschedule when stopped during screen detection', async () => {
    const {streamer, socket, getScreenInfo, capture, queuedFrames} = createFixture();
    let resolveScreen;
    getScreenInfo.mockReturnValue(new Promise((resolve) => { resolveScreen = resolve; }));
    const session = streamer.startForSocket(socket);
    await jest.advanceTimersByTimeAsync(50);
    session.stop();
    resolveScreen({width: 1920, height: 1080});
    await jest.advanceTimersByTimeAsync(0);
    expect(capture).not.toHaveBeenCalled();
    expect(queuedFrames).toHaveLength(0);
    expect(jest.getTimerCount()).toBe(0);
  });
});
