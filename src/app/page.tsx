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
    const day = days[new Date().getDay()];
    console.log('Current day determined:', day);
    return day;
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
    console.log('Looking for next significant class after index:', currentIndex);
    for (let i = currentIndex + 1; i < events.length; i++) {
      const blockName = events[i].name.toLowerCase().replace(/\s+/g, '');
      console.log('Checking block:', events[i].name);
      if (blockName !== 'passingperiod' && classes[blockName]) {
        console.log('Found next significant class:', classes[blockName].className);
        return classes[blockName];
      }
    }
    console.log('No more significant classes found for today');
    return null;
  };

  const getCurrentBlock = (daySchedule: DaySchedule, currentTime: number) => {
    console.log('Getting current block for time:', currentTime);
    const events = daySchedule.events;
    
    for (let i = events.length - 1; i >= 0; i--) {
      if (currentTime >= events[i].timestamp * 60) {
        if (i === events.length - 1) {
          console.log('School day is over');
          setTimeRemaining('');
          setNextClass(null);
          setCurrentClass(null);
          return 'Schoolday Over';
        }
        
        const currentBlockName = events[i].name.toLowerCase().replace(/\s+/g, '');
        console.log('Current block found:', events[i].name);
        
        if (classes) {
          const currentClassInfo = classes[currentBlockName] || null;
          console.log('Current class info:', currentClassInfo);
          setCurrentClass(currentClassInfo);
          
          const nextBlockName = events[i + 1].name.toLowerCase().replace(/\s+/g, '');
          console.log('Next block name:', events[i + 1].name);
          
          if (nextBlockName === 'endofday') {
            console.log('Next block is end of day');
            setNextClass(null);
          } else if (nextBlockName === 'passingperiod') {
            console.log('Next block is passing period, looking for next significant class');
            setNextClass(findNextSignificantClass(events, i + 1, classes));
          } else {
            const nextClassInfo = classes[nextBlockName] || null;
            console.log('Next class info:', nextClassInfo);
            setNextClass(nextClassInfo);
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
    console.log('School has not started yet');
    setTimeRemaining('');
    setNextClass(null);
    return 'School has not started';
  };

  useEffect(() => {
    console.log('Initiating data fetch...');
    Promise.all([
      fetch('/data/dates.json').then(res => res.json()),
      fetch('/data/myClasses.json').then(res => res.json())
    ]).then(([scheduleData, classData]) => {
      console.log('Data fetched successfully');
      console.log('Schedule data:', scheduleData);
      console.log('Class data:', classData);
      setSchedule(scheduleData);
      setClasses(classData);
    }).catch(error => {
      console.error('Error fetching data:', error);
    });
  }, []);

  useEffect(() => {
    if (schedule) {
      console.log('Schedule update triggered');
      const day = getDayAbbreviation();
      const currentTime = getMinutesIntoDay();
      const daySchedule = schedule[day];
      
      if (daySchedule.message) {
        console.log('Special message found for today:', daySchedule.message);
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
    <div className="p-4 max-w-2xl mx-auto">
      <div className="mb-4 p-4 bg-gray-100 rounded-lg">
        <p className="text-lg font-semibold">Day: {getDayAbbreviation()}</p>
        <p className="text-sm text-gray-600">Minutes into day: {getMinutesIntoDay()}</p>
      </div>

      {schedule && schedule[getDayAbbreviation()].message ? (
        <div className="p-4 bg-yellow-100 rounded-lg">
          <p className="text-xl font-bold">{schedule[getDayAbbreviation()].message}</p>
        </div>
      ) : (
        <>
          <div className="mb-4 p-4 bg-blue-100 rounded-lg">
            <p className="text-xl font-bold">{currentBlock}</p>
            {timeRemaining && (
              <p className="text-blue-600 font-medium mt-2">{timeRemaining}</p>
            )}
          </div>

          {currentClass ? (
            <div className="mb-4 p-4 bg-white shadow-lg rounded-lg border border-gray-200">
              <h2 className="text-lg font-semibold mb-2">Current Class</h2>
              <p className="text-2xl mb-2">{currentClass.classEmoji} {currentClass.className}</p>
              {currentClass.teacher && <p className="text-gray-700">Teacher: {currentClass.teacher}</p>}
              {currentClass.room && <p className="text-gray-700">Room: {currentClass.room}</p>}
            </div>
          ) : (
            <div className="mb-4 p-4 bg-gray-100 rounded-lg">
              <p className="text-gray-600">No current class</p>
            </div>
          )}

          {nextClass ? (
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <h2 className="text-lg font-semibold mb-2">Next Class</h2>
              <p className="text-xl">{nextClass.classEmoji} {nextClass.className}</p>
              {nextClass.teacher && <p className="text-gray-700">Teacher: {nextClass.teacher}</p>}
              {nextClass.room && <p className="text-gray-700">Room: {nextClass.room}</p>}
            </div>
          ) : (
            <div className="p-4 bg-gray-100 rounded-lg">
              <p className="text-gray-600">No next class</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
