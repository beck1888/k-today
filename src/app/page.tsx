'use client';
import { useEffect, useState } from 'react';
import Image from 'next/image';
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
          return 'The school day has concluded';
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
    <>
      <div className="max-w-2xl mx-auto space-y-4">
        {schedule && schedule[getDayAbbreviation()].message ? (
          <div className="card p-6 border-accent-secondary">
            <p className="text-2xl font-bold text-accent-secondary">{schedule[getDayAbbreviation()].message}</p>
          </div>
        ) : (
          <>
            <div className="card p-6">
              <p className="text-xl font-bold text-accent-primary">{currentBlock}</p>
              {timeRemaining && (
                <p className="text-accent-secondary font-medium mt-2 animate-pulse-slow">{timeRemaining}</p>
              )}
            </div>

            {currentClass ? (
              <div className="card p-6 glass">
                <h2 className="text-sm uppercase tracking-wider text-gray-400 mb-2">Current Class</h2>
                <p className="text-2xl mb-3">
                  <span className="mr-2">{currentClass.classEmoji} </span>
                  <span className="font-semibold">{currentClass.className}</span>
                </p>
                {currentClass.teacher && (
                  <p className="text-gray-400 flex items-center">
                    <span className="inline-flex items-center w-24 text-gray-500">
                      <Image src="/icons/person.svg" alt="" width={16} height={16} className="mr-2" />
                      Teacher:
                    </span>
                    <span className="ml-2">{currentClass.teacher}</span>
                  </p>
                )}
                {currentClass.room && (
                  <p className="text-gray-400 flex items-center">
                    <span className="inline-flex items-center w-24 text-gray-500">
                      <Image src="/icons/door.svg" alt="" width={16} height={16} className="mr-2" />
                      Room:
                    </span>
                    <span className="ml-2">{currentClass.room}</span>
                  </p>
                )}
              </div>
            ) : (
              <div className="card p-6">
                <p className="text-gray-500">No current class</p>
              </div>
            )}

            {nextClass ? (
              <div className="card p-6 border-accent-secondary/30">
                <h2 className="text-sm uppercase tracking-wider text-gray-400 mb-2">Next Class</h2>
                <p className="text-xl mb-3">
                  <span className="mr-2">{nextClass.classEmoji}</span>
                  <span className="font-semibold">{nextClass.className}</span>
                </p>
                {nextClass.teacher && (
                  <p className="text-gray-400 flex items-center">
                    <span className="inline-flex items-center w-24 text-gray-500">
                      <Image src="/icons/person.svg" alt="" width={16} height={16} className="mr-2" />
                      Teacher:
                    </span>
                    <span className="ml-2">{nextClass.teacher}</span>
                  </p>
                )}
                {nextClass.room && (
                  <p className="text-gray-400 flex items-center">
                    <span className="inline-flex items-center w-24 text-gray-500">
                      <Image src="/icons/door.svg" alt="" width={16} height={16} className="mr-2" />
                      Room:
                    </span>
                    <span className="ml-2">{nextClass.room}</span>
                  </p>
                )}
              </div>
            ) : (
              <div className="card p-6">
                <p className="text-gray-500">No next class</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Time info fixed at bottom left */}
      <div className="fixed bottom-4 left-4 text-xs text-gray-500 space-y-0.5">
        <p>{getDayAbbreviation()}</p>
        <p>{getMinutesIntoDay()} minutes into day</p>
        {renderTime && (
          <p>Initial render: {renderTime}ms</p>
        )}
      </div>
    </>
  );
}
