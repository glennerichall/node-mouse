import {jest} from '@jest/globals';
import {createTaskManager} from '../../server/services/task-manager/createTaskManager.js';
import {createTaskRunner} from '../../server/services/task-runner/createTaskRunner.js';

describe('task manager', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-04-02T12:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('starts and stops the system tasks through the task runner', async () => {
    const taskRunner = createTaskRunner();
    const taskManager = createTaskManager({
      getTaskRunner: () => taskRunner,
      getUpdateManager: () => ({
        check: jest.fn(async () => ({})),
      }),
      getTokenManager: () => ({
        rotateIfNeeded: jest.fn(() => 'token'),
      }),
      getSystemConfig: () => ({
        updateCheck: {intervalMin: 5},
        entryPath: {rotateMin: 10},
      }),
    });

    await taskManager.start();

    expect(taskManager.getTasksSnapshot()).toEqual([
      expect.objectContaining({
        name: 'update-check',
        dueAt: '2026-04-02T12:05:00.000Z',
        delayMs: 300_000,
      }),
      expect.objectContaining({
        name: 'token-rotation',
        dueAt: '2026-04-02T12:10:00.000Z',
        delayMs: 600_000,
      }),
    ]);

    taskManager.stop();

    expect(taskManager.getTasksSnapshot()).toEqual([]);
  });

  it('uses rotateMin directly for token rotation scheduling', async () => {
    const taskRunner = createTaskRunner();
    const taskManager = createTaskManager({
      getTaskRunner: () => taskRunner,
      getUpdateManager: () => ({
        check: jest.fn(async () => ({})),
      }),
      getTokenManager: () => ({
        rotateIfNeeded: jest.fn(() => 'token'),
      }),
      getSystemConfig: () => ({
        updateCheck: {intervalMin: 5},
        entryPath: {rotateMin: 2, graceMin: 120},
      }),
    });

    await taskManager.start();

    expect(taskManager.getTasksSnapshot()).toEqual(expect.arrayContaining([
      expect.objectContaining({
        name: 'token-rotation',
        dueAt: '2026-04-02T12:02:00.000Z',
        delayMs: 120_000,
      }),
    ]));
  });
});
