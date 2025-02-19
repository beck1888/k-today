'use client';
import { useEffect, useState } from 'react';

interface Event {
  name: string;
  timestamp: number;
}

interface DaySchedule {
  events: Event[];
  message?: string;
}

interface ScheduleData {
  [key: string]: DaySchedule;
}

export default function Home() {
  const [schedule, setSchedule] = useState<ScheduleData | null>(null);
  const [currentBlock, setCurrentBlock] = useState<string>('Loading...');

  const getDayAbbreviation = () => {
    const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    return days[new Date().getDay()];
  };

  const getMinutesIntoDay = () => {
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
  };

  const getCurrentBlock = (daySchedule: DaySchedule, currentTime: number) => {
    const events = daySchedule.events;
    
    for (let i = events.length - 1; i >= 0; i--) {
      if (currentTime >= events[i].timestamp) {
        if (i === events.length - 1) {
          return 'School day has ended';
        }
        return `Current: ${events[i].name} (Until ${Math.floor(events[i + 1].timestamp / 60)}:${String(events[i + 1].timestamp % 60).padStart(2, '0')})`;
      }
    }
    return 'School has not started';
  };

  useEffect(() => {
    fetch('/data/dates.json')
      .then(res => res.json())
      .then((data: ScheduleData) => {
        setSchedule(data);
      });
  }, []);

  useEffect(() => {
    if (schedule) {
      const day = getDayAbbreviation();
      const currentTime = getMinutesIntoDay();
      const daySchedule = schedule[day];
      
      if (daySchedule.message) {
        setCurrentBlock(daySchedule.message);
      } else {
        setCurrentBlock(getCurrentBlock(daySchedule, currentTime));
      }
    }
  }, [schedule]);

  return (
    <div className="p-4">
      <p>Day of week: {getDayAbbreviation()}</p>
      <p>Minutes into the day: {getMinutesIntoDay()}</p>
      <p className="mt-4 text-lg font-bold">{currentBlock}</p>
    </div>
  );
}
