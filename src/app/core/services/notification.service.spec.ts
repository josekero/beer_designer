import { TestBed } from '@angular/core/testing';
import { NotificationService } from './notification.service';

describe('NotificationService', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('publishes every notification type and dismisses one explicitly', () => {
    const service = TestBed.inject(NotificationService);
    service.success('Saved');
    service.error('Failed');
    service.info('Working');
    expect(service.notifications().map(item => item.type)).toEqual(['success', 'error', 'info']);
    service.dismiss(2);
    expect(service.notifications().map(item => item.message)).toEqual(['Saved', 'Working']);
  });

  it('automatically dismisses notifications', () => {
    const service = TestBed.inject(NotificationService);
    service.success('Saved');
    vi.advanceTimersByTime(4500);
    expect(service.notifications()).toEqual([]);
  });
});
