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
  const [nextClass, setNextClass] = useState<ClassInfo | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<string>('');

  const getDayAbbreviation = () => {
    const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    return days[new Date().getDay()];
  };

  const getMinutesIntoDay = () => {
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
  };

  const getSecondsIntoDay = () => {
    const now = new Date();
    return now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
  };

  const findNextSignificantClass = (events: Event[], currentIndex: number, classes: ClassData) => {
    for (let i = currentIndex + 1; i < events.length; i++) {
      const blockName = events[i].name.toLowerCase().replace(/\s+/g, '');
      if (blockName !== 'passingperiod' && classes[blockName]) {
        return classes[blockName];
      }
    }
    return null;
  };

  const getCurrentBlock = (daySchedule: DaySchedule, currentTime: number) => {
    const events = daySchedule.events;
    
    for (let i = events.length - 1; i >= 0; i--) {
      if (currentTime >= events[i].timestamp * 60) {
        if (i === events.length - 1) {
          setTimeRemaining('');
          setNextClass(null);
          setCurrentClass(null);
          return 'Schoolday Over';
        }
        const currentBlockName = events[i].name.toLowerCase().replace(/\s+/g, '');
        if (classes) {
          setCurrentClass(classes[currentBlockName] || null);
          
          // Look ahead for next significant class
          const nextBlockName = events[i + 1].name.toLowerCase().replace(/\s+/g, '');
          if (nextBlockName === 'endofday') {
            setNextClass(null);
          } else if (nextBlockName === 'passingperiod') {
            setNextClass(findNextSignificantClass(events, i + 1, classes));
          } else {
            setNextClass(classes[nextBlockName] || null);
          }
        }
        
        const secondsRemaining = (events[i + 1].timestamp * 60) - currentTime;
        const hours = Math.floor(secondsRemaining / 3600);
        const minutes = Math.floor((secondsRemaining % 3600) / 60);
        const seconds = secondsRemaining % 60;
        
        setTimeRemaining(
          hours > 0 
            ? `${hours}h ${minutes}m ${seconds}s remaining`
            : minutes > 0
              ? `${minutes}m ${seconds}s remaining`
              : `${seconds}s remaining`
        );
        
        return `Current: ${events[i].name} (Until ${Math.floor(events[i + 1].timestamp / 60)}:${String(events[i + 1].timestamp % 60).padStart(2, '0')})`;
      }
    }
    setTimeRemaining('');
    setNextClass(null);
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

  useEffect(() => {
    // Initial update
    if (schedule) {
      const day = getDayAbbreviation();
      const currentTime = getSecondsIntoDay();
      const daySchedule = schedule[day];
      
      if (daySchedule.message) {
        setCurrentBlock(daySchedule.message);
        setTimeRemaining('');
      } else {
        setCurrentBlock(getCurrentBlock(daySchedule, currentTime));
      }
    }

    // Update every second
    const timer = setInterval(() => {
      if (schedule) {
        const day = getDayAbbreviation();
        const currentTime = getSecondsIntoDay();
        const daySchedule = schedule[day];
        
        if (daySchedule.message) {
          setCurrentBlock(daySchedule.message);
          setTimeRemaining('');
        } else {
          setCurrentBlock(getCurrentBlock(daySchedule, currentTime));
        }
      }
    }, 1000); // Update every second

    return () => clearInterval(timer);
  }, [schedule]);

  return (
    <div className="p-4">
      {schedule && schedule[getDayAbbreviation()].message ? (
        <p className="text-xl font-bold">No School Today</p>
      ) : (
        <>
          <p>Day of week: {getDayAbbreviation()}</p>
          <p>Minutes into the day: {getMinutesIntoDay()}</p>
          <p className="mt-4 text-lg font-bold">{currentBlock}</p>
          {timeRemaining && (
            <p className="text-blue-600 font-medium">{timeRemaining}</p>
          )}
          {currentClass && (
            <div className="mt-4 p-4 bg-gray-100 rounded-lg">
              <p className="text-2xl">{currentClass.classEmoji} {currentClass.className}</p>
              {currentClass.teacher !== null && <p>Teacher: {currentClass.teacher}</p>}
              {currentClass.room !== null && <p>Room: {currentClass.room}</p>}
            </div>
          )}
          {nextClass && (
            <div className="mt-4">
              <p className="text-gray-600">Next: {nextClass.classEmoji} {nextClass.className}</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
