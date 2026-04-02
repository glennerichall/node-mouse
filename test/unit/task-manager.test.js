import {jest} from '@jest/globals';
import {createTaskManager} from '../../server/services/task-manager/createTaskManager.js';

describe('task manager', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-04-02T12:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('exposes scheduled tasks with due dates', () => {
    const taskManager = createTaskManager();
    const stop = taskManager.run(() => {}, 60_000, {name: 'update-check'});

    expect(taskManager.getTasksSnapshot()).toEqual([
      expect.objectContaining({
        name: 'update-check',
        dueAt: '2026-04-02T12:01:00.000Z',
        delayMs: 60_000,
        running: false,
      }),
    ]);

    stop();

    expect(taskManager.getTasksSnapshot()).toEqual([]);
  });

  it('marks a task as running while it executes and reschedules it afterwards', async () => {
    const taskManager = createTaskManager();
    let releaseTask;
    const taskPromise = new Promise((resolve) => {
      releaseTask = resolve;
    });

    taskManager.run(() => taskPromise, 5_000, {name: 'token-rotation'});

    await jest.advanceTimersByTimeAsync(5_000);

    expect(taskManager.getTasksSnapshot()).toEqual([
      expect.objectContaining({
        name: 'token-rotation',
        dueAt: null,
        delayMs: 5_000,
        running: true,
      }),
    ]);

    releaseTask();
    await Promise.resolve();

    expect(taskManager.getTasksSnapshot()).toEqual([
      expect.objectContaining({
        name: 'token-rotation',
        dueAt: '2026-04-02T12:00:10.000Z',
        delayMs: 5_000,
        running: false,
      }),
    ]);
  });
});
