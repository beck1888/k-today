export interface Event {
  name: string;
  timestamp: number;
}

export interface DaySchedule {
  events: Event[];
  message?: string;
}

export interface ScheduleData {
  [key: string]: DaySchedule;
}

export interface ClassInfo {
  className: string;
  classEmoji: string;
  teacher: string | null;
  room: string | null;
}

export interface ClassData {
  [key: string]: ClassInfo;
}
