import ical from 'ical-generator';

export interface CalendarEntry {
  summary: string;
  description?: string;
  url?: string;
  date: Date;
}

export function buildCalendar(name: string, events: CalendarEntry[]): string {
  const cal = ical({ name });

  for (const e of events) {
    e.date.setUTCHours(12);
    // Google Calendar does not support URL field.

    if (e.url) {
      e.description ??= '';
      e.description += ` ( ${e.url} )`;
    }

    cal.createEvent({
      ...e,
      description: e.description,
      allDay: true,
      start: e.date,
    });
  }

  return cal.toString();
}
