import ical from 'ical-generator';

export interface CalendarEntry {
  summary: string;
  description?: string;
  url?: string;
  date: Date;
}

const fromDate = () => {
  const d = new Date();
  d.setTime(d.getTime() - 365 * 24 * 60 * 60 * 1000);
  return d;
};

export function buildCalendar(name: string, events: CalendarEntry[]): string {
  const cal = ical({ name });
  const from = fromDate();

  for (const e of events) {
    if (e.date < from) {
      // Skip entries older than a year
      continue;
    }

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
