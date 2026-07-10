import type { ScheduleItem, EmergencyContact } from '../types';

/**
 * Event data is bundled as static content (edit + redeploy) to keep the
 * running cost at exactly $0. For a 1-week event this is simpler and cheaper
 * than a database read path. Times are ISO 8601 with an explicit offset.
 */
export const SCHEDULE: ScheduleItem[] = [
  {
    id: 's1',
    titleKey: 'schedule.items.s1.title',
    locationKey: 'schedule.items.s1.location',
    start: '2026-07-07T08:30:00+02:00',
    end: '2026-07-07T09:30:00+02:00',
  },
  {
    id: 's2',
    titleKey: 'schedule.items.s2.title',
    locationKey: 'schedule.items.s2.location',
    start: '2026-07-07T09:30:00+02:00',
    end: '2026-07-07T10:30:00+02:00',
  },
  {
    id: 's3',
    titleKey: 'schedule.items.s3.title',
    locationKey: 'schedule.items.s3.location',
    start: '2026-07-07T11:00:00+02:00',
    end: '2026-07-07T13:00:00+02:00',
  },
  {
    id: 's4',
    titleKey: 'schedule.items.s4.title',
    locationKey: 'schedule.items.s4.location',
    start: '2026-07-07T13:00:00+02:00',
    end: '2026-07-07T14:30:00+02:00',
  },
  {
    id: 's5',
    titleKey: 'schedule.items.s5.title',
    locationKey: 'schedule.items.s5.location',
    start: '2026-07-08T14:30:00+02:00',
    end: '2026-07-08T17:00:00+02:00',
  },
  {
    id: 's6',
    titleKey: 'schedule.items.s6.title',
    locationKey: 'schedule.items.s6.location',
    start: '2026-07-08T19:30:00+02:00',
    end: '2026-07-08T22:00:00+02:00',
  },
];

export const EMERGENCY_CONTACTS: EmergencyContact[] = [
  { id: 'c1', nameKey: 'contacts.items.c1.name', roleKey: 'contacts.items.c1.role', phone: '+34600000001' },
  { id: 'c2', nameKey: 'contacts.items.c2.name', roleKey: 'contacts.items.c2.role', phone: '+34600000002' },
  { id: 'c5', nameKey: 'contacts.items.c5.name', roleKey: 'contacts.items.c5.role', phone: '112' },
];
