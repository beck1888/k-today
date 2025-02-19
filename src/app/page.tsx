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

interface ClassInfo {
  className: string;
  classEmoji: string;
  teacher: string | null;
  room: string | null;
}

interface ClassData {
  [key: string]: ClassInfo;
}

export default function Home() {
  const [schedule, setSchedule] = useState<ScheduleData | null>(null);
  const [classes, setClasses] = useState<ClassData | null>(null);
  const [currentBlock, setCurrentBlock] = useState<string>('Loading...');
  const [currentClass, setCurrentClass] = useState<ClassInfo | null>(null);

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
        const blockName = events[i].name.toLowerCase().replace(/\s+/g, '');
        if (classes && classes[blockName]) {
          setCurrentClass(classes[blockName]);
        } else {
          setCurrentClass(null);
        }
        return `Current: ${events[i].name} (Until ${Math.floor(events[i + 1].timestamp / 60)}:${String(events[i + 1].timestamp % 60).padStart(2, '0')})`;
      }
    }
    return 'School has not started';
  };

  useEffect(() => {
    Promise.all([
      fetch('/data/dates.json').then(res => res.json()),
      fetch('/data/myClasses.json').then(res => res.json())
    ]).then(([scheduleData, classData]) => {
      setSchedule(scheduleData);
      setClasses(classData);
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
      {currentClass && (
        <div className="mt-4 p-4 bg-gray-100 rounded-lg">
          <p className="text-2xl">{currentClass.classEmoji} {currentClass.className}</p>
          {currentClass.teacher && <p>Teacher: {currentClass.teacher}</p>}
          {currentClass.room && <p>Room: {currentClass.room}</p>}
        </div>
      )}
    </div>
  );
}
