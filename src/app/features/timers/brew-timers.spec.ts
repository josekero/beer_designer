import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BrewTimer, BrewTimers } from './brew-timers';

describe('BrewTimers', () => {
  const storage = new Map<string, string>();
  let timers: BrewTimers;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-13T09:00:00Z'));
    storage.clear();
    vi.stubGlobal('localStorage', {
      getItem: vi.fn((key: string) => storage.get(key) ?? null),
      setItem: vi.fn((key: string, value: string) => storage.set(key, value)),
    });
    timers = new BrewTimers();
  });

  afterEach(() => {
    timers.ngOnDestroy();
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('starts with a boil countdown and a whirlpool stopwatch', () => {
    expect(timers.timers()).toHaveLength(2);
    expect(timers.timers()[0]).toMatchObject({
      label: 'Hervido',
      mode: 'countdown',
      displaySeconds: 3600,
    });
    expect(timers.timers()[1]).toMatchObject({
      label: 'Whirlpool',
      mode: 'stopwatch',
      displaySeconds: 0,
    });
    expect(timers.format(65)).toBe('01:05');
    expect(timers.format(3661)).toBe('01:01:01');
  });

  it('counts down against real time and marks completion', () => {
    const id = timers.timers()[0].id;
    timers.updateDuration(id, 0, 3);
    timers.start(id);
    vi.advanceTimersByTime(2000);
    expect(timers.timers()[0]).toMatchObject({
      displaySeconds: 1,
      running: true,
      completed: false,
    });
    vi.advanceTimersByTime(1000);
    expect(timers.timers()[0]).toMatchObject({
      displaySeconds: 0,
      running: false,
      completed: true,
    });
    timers.reset(id);
    expect(timers.timers()[0]).toMatchObject({ displaySeconds: 3, completed: false });
  });

  it('runs, pauses and resets a forward stopwatch', () => {
    const id = timers.timers()[1].id;
    timers.start(id);
    vi.advanceTimersByTime(2500);
    expect(timers.timers()[1].displaySeconds).toBe(2);
    timers.pause(id);
    vi.advanceTimersByTime(2000);
    expect(timers.timers()[1].displaySeconds).toBe(2);
    timers.reset(id);
    expect(timers.timers()[1].displaySeconds).toBe(0);
  });

  it('edits labels and modes and allows at most three timers', () => {
    const firstId = timers.timers()[0].id;
    timers.updateLabel(firstId, 'Primera adición Mosaic');
    timers.changeMode(firstId, 'stopwatch');
    expect(timers.timers()[0]).toMatchObject({
      label: 'Primera adición Mosaic',
      mode: 'stopwatch',
      displaySeconds: 0,
    });
    timers.changeMode(firstId, 'countdown');
    expect(timers.timers()[0].displaySeconds).toBe(3600);

    timers.addTimer();
    timers.addTimer();
    expect(timers.timers()).toHaveLength(3);
    timers.removeTimer(timers.timers()[2].id);
    expect(timers.timers()).toHaveLength(2);
    expect(globalThis.localStorage.setItem).toHaveBeenCalled();
  });

  it('restores persisted running timers and catches up after reload', () => {
    timers.ngOnDestroy();
    const stored: BrewTimer = {
      id: 'persisted',
      label: 'Whirlpool',
      mode: 'stopwatch',
      durationMinutes: 0,
      durationSeconds: 0,
      displaySeconds: 4,
      anchorSeconds: 4,
      anchorEpochMs: Date.now(),
      running: true,
      completed: false,
    };
    storage.set('beer-designer.brew-timers', JSON.stringify([stored]));
    timers = new BrewTimers();
    vi.advanceTimersByTime(3000);
    expect(timers.timers()[0].displaySeconds).toBe(7);
  });
});
