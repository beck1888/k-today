'use client';
import { useEffect, useState } from 'react';
import { ClassData, ClassInfo, ScheduleData, DaySchedule } from '../types/schedule';
import {
  getDayAbbreviation,
  getMinutesIntoDay,
  getSecondsIntoDay,
  formatTimeRemaining,
  findNextSignificantClass
} from '../utils/scheduleUtils';

export default function Home() {
  const [renderTime, setRenderTime] = useState<number | null>(null);
  const [renderStartTime, setRenderStartTime] = useState<number | null>(null);
  const [schedule, setSchedule] = useState<ScheduleData | null>(null);
  const [classes, setClasses] = useState<ClassData | null>(null);
  const [currentBlock, setCurrentBlock] = useState<string>('Loading...');
  const [currentClass, setCurrentClass] = useState<ClassInfo | null>(null);
  const [nextClass, setNextClass] = useState<ClassInfo | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<string>('');

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
          const currentClassInfo = classes[currentBlockName] || null;
          setCurrentClass(currentClassInfo);
          
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
        setTimeRemaining(formatTimeRemaining(secondsRemaining));
        
        return `Current: ${events[i].name} (Until ${Math.floor(events[i + 1].timestamp / 60)}:${String(events[i + 1].timestamp % 60).padStart(2, '0')})`;
      }
    }
    
    setTimeRemaining('');
    setNextClass(null);
    return 'School has not started';
  };

  useEffect(() => {
    setRenderStartTime(performance.now());
    
    Promise.all([
      fetch('/data/dates.json').then(res => res.json()),
      fetch('/data/myClasses.json').then(res => res.json())
    ]).then(([scheduleData, classData]) => {
      setSchedule(scheduleData);
      setClasses(classData);
      const endTime = performance.now();
      setRenderTime(Math.round(endTime - renderStartTime!));
      setRenderStartTime(null);
    }).catch(() => setRenderStartTime(null));
  }, []);

  useEffect(() => {
    if (!schedule) return;

    const updateSchedule = () => {
      const day = getDayAbbreviation();
      const currentTime = getSecondsIntoDay();
      const daySchedule = schedule[day];
      
      if (daySchedule.message) {
        setCurrentBlock(daySchedule.message);
        setTimeRemaining('');
      } else {
        setCurrentBlock(getCurrentBlock(daySchedule, currentTime));
      }
    };

    updateSchedule();
    const timer = setInterval(updateSchedule, 1000);
    return () => clearInterval(timer);
  }, [schedule]);

  return (
    <div className="p-4 max-w-2xl mx-auto">
      {renderTime && (
        <div className="mb-4 p-2 bg-gray-50 rounded-lg text-xs text-gray-500 flex justify-between items-center">
          <span>Initial render time: {renderTime}ms</span>
          <button 
            onClick={() => setRenderTime(null)} 
            className="text-gray-400 hover:text-gray-600"
          >
            ×
          </button>
        </div>
      )
      }
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
