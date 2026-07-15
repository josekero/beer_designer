import { Component, OnDestroy, signal } from '@angular/core';
import { UiTranslatePipe } from '../../shared/pipes/ui-translate.pipe';

export type BrewTimerMode = 'countdown' | 'stopwatch';

export interface BrewTimer {
  id: string;
  label: string;
  mode: BrewTimerMode;
  durationMinutes: number;
  durationSeconds: number;
  displaySeconds: number;
  anchorSeconds: number;
  anchorEpochMs: number | null;
  running: boolean;
  completed: boolean;
}

const TIMER_STORAGE_KEY = 'beer-designer.brew-timers';
const MAX_TIMERS = 3;

@Component({
  selector: 'app-brew-timers',
  imports: [UiTranslatePipe],
  templateUrl: './brew-timers.html',
  styleUrl: './brew-timers.scss',
})
export class BrewTimers implements OnDestroy {
  private sequence = 0;
  readonly maxTimers = MAX_TIMERS;
  readonly timers = signal<BrewTimer[]>(this.loadTimers());
  private readonly ticker = globalThis.setInterval(() => this.tick(), 250);

  ngOnDestroy(): void {
    globalThis.clearInterval(this.ticker);
  }

  addTimer(): void {
    if (this.timers().length >= MAX_TIMERS) return;
    this.timers.update((timers) => [...timers, this.createTimer('Nueva adición', 'countdown', 10)]);
    this.persist();
  }

  removeTimer(id: string): void {
    this.timers.update((timers) => timers.filter((timer) => timer.id !== id));
    this.persist();
  }

  updateLabel(id: string, label: string): void {
    this.patch(id, { label });
    this.persist();
  }

  changeMode(id: string, mode: BrewTimerMode): void {
    const timer = this.find(id);
    if (!timer || timer.mode === mode) return;
    const displaySeconds = mode === 'countdown' ? this.configuredSeconds(timer) : 0;
    this.patch(id, {
      mode,
      displaySeconds,
      anchorSeconds: displaySeconds,
      anchorEpochMs: null,
      running: false,
      completed: false,
    });
    this.persist();
  }

  updateDuration(id: string, minutes: number, seconds: number): void {
    const timer = this.find(id);
    if (!timer || timer.running) return;
    const safeMinutes = Math.max(0, Math.floor(Number(minutes) || 0));
    const safeSeconds = Math.min(59, Math.max(0, Math.floor(Number(seconds) || 0)));
    const displaySeconds = safeMinutes * 60 + safeSeconds;
    this.patch(id, {
      durationMinutes: safeMinutes,
      durationSeconds: safeSeconds,
      displaySeconds,
      anchorSeconds: displaySeconds,
      completed: false,
    });
    this.persist();
  }

  start(id: string): void {
    const timer = this.find(id);
    if (!timer || timer.running || (timer.mode === 'countdown' && timer.displaySeconds <= 0))
      return;
    this.patch(id, {
      running: true,
      completed: false,
      anchorSeconds: timer.displaySeconds,
      anchorEpochMs: Date.now(),
    });
    this.persist();
  }

  pause(id: string): void {
    const timer = this.find(id);
    if (!timer?.running) return;
    this.tick();
    this.patch(id, { running: false, anchorEpochMs: null });
    this.persist();
  }

  reset(id: string): void {
    const timer = this.find(id);
    if (!timer) return;
    const displaySeconds = timer.mode === 'countdown' ? this.configuredSeconds(timer) : 0;
    this.patch(id, {
      displaySeconds,
      anchorSeconds: displaySeconds,
      anchorEpochMs: null,
      running: false,
      completed: false,
    });
    this.persist();
  }

  format(totalSeconds: number): string {
    const safeTotal = Math.max(0, Math.floor(totalSeconds));
    const hours = Math.floor(safeTotal / 3600);
    const minutes = Math.floor((safeTotal % 3600) / 60);
    const seconds = safeTotal % 60;
    return hours > 0
      ? `${this.pad(hours)}:${this.pad(minutes)}:${this.pad(seconds)}`
      : `${this.pad(minutes)}:${this.pad(seconds)}`;
  }

  private tick(): void {
    const now = Date.now();
    let changed = false;
    const timers = this.timers().map((timer) => {
      if (!timer.running || timer.anchorEpochMs === null) return timer;
      const elapsedSeconds = Math.floor((now - timer.anchorEpochMs) / 1000);
      const displaySeconds =
        timer.mode === 'countdown'
          ? Math.max(0, timer.anchorSeconds - elapsedSeconds)
          : timer.anchorSeconds + elapsedSeconds;
      if (displaySeconds === timer.displaySeconds) return timer;
      changed = true;
      if (timer.mode === 'countdown' && displaySeconds === 0) {
        return { ...timer, displaySeconds, running: false, completed: true, anchorEpochMs: null };
      }
      return { ...timer, displaySeconds };
    });
    if (changed) this.timers.set(timers);
  }

  private patch(id: string, changes: Partial<BrewTimer>): void {
    this.timers.update((timers) =>
      timers.map((timer) => (timer.id === id ? { ...timer, ...changes } : timer)),
    );
  }

  private find(id: string): BrewTimer | undefined {
    return this.timers().find((timer) => timer.id === id);
  }

  private configuredSeconds(timer: BrewTimer): number {
    return timer.durationMinutes * 60 + timer.durationSeconds;
  }

  private createTimer(label: string, mode: BrewTimerMode, minutes: number): BrewTimer {
    const displaySeconds = mode === 'countdown' ? minutes * 60 : 0;
    return {
      id: `timer-${Date.now()}-${this.sequence++}`,
      label,
      mode,
      durationMinutes: minutes,
      durationSeconds: 0,
      displaySeconds,
      anchorSeconds: displaySeconds,
      anchorEpochMs: null,
      running: false,
      completed: false,
    };
  }

  private loadTimers(): BrewTimer[] {
    try {
      const stored = globalThis.localStorage?.getItem(TIMER_STORAGE_KEY);
      if (stored) {
        const timers = JSON.parse(stored) as BrewTimer[];
        if (Array.isArray(timers) && timers.length > 0) return timers.slice(0, MAX_TIMERS);
      }
    } catch {
      // A clean set remains available when storage is blocked or malformed.
    }
    return [
      this.createTimer('Hervido', 'countdown', 60),
      this.createTimer('Whirlpool', 'stopwatch', 0),
    ];
  }

  private persist(): void {
    try {
      globalThis.localStorage?.setItem(TIMER_STORAGE_KEY, JSON.stringify(this.timers()));
    } catch {
      // Timers keep working in memory when storage is unavailable.
    }
  }

  private pad(value: number): string {
    return String(value).padStart(2, '0');
  }
}
