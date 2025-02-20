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
    
    // If before first event of the day
    if (currentTime < events[0].timestamp * 60) {
      setTimeRemaining('');
      setNextClass(null);
      setCurrentClass(null);
      return 'School has not started';
    }
    
    for (let i = events.length - 1; i >= 0; i--) {
      if (currentTime >= events[i].timestamp * 60) {
        if (i === events.length - 1) {
          setTimeRemaining('');
          setNextClass(null);
          setCurrentClass(null);
          return 'The school day has concluded';
        }
        
        const currentBlockName = events[i].name.toLowerCase().replace(/\s+/g, '').replace('kabshab', 'kabShab');
        
        if (classes) {
          const currentClassInfo = classes[currentBlockName] || {
            className: events[i].name,
            classEmoji: "📍",
            teacher: null,
            room: null
          };
          setCurrentClass(currentClassInfo);
          
          const nextClassInfo = findNextSignificantClass(events, i, classes);
          setNextClass(nextClassInfo);
        }
        
        const secondsRemaining = (events[i + 1].timestamp * 60) - currentTime;
        setTimeRemaining(formatTimeRemaining(secondsRemaining));
        
        return `Current: ${events[i].name} (Until ${Math.floor(events[i + 1].timestamp / 60)}:${String(events[i + 1].timestamp % 60).padStart(2, '0')})`;
      }
    }
    
    setTimeRemaining('');
    setNextClass(null);
    setCurrentClass(null);
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
              <div className="space-y-2">
                <p className="text-xl font-bold text-accent-primary">{currentBlock}</p>
                {currentClass && (
                  <>
                    <div className="flex items-center gap-2 mt-1">
                      <span>{currentClass.classEmoji}</span>
                      <span className="font-semibold">{currentClass.className}</span>
                    </div>
                    {(currentClass.teacher || currentClass.room) && (
                      <div className="text-sm text-gray-400 space-y-1">
                        {currentClass.teacher && (
                          <p className="flex items-center">
                            <Image src="/icons/person.svg" alt="" width={14} height={14} className="mr-2" />
                            {currentClass.teacher}
                          </p>
                        )}
                        {currentClass.room && (
                          <p className="flex items-center">
                            <Image src="/icons/door.svg" alt="" width={14} height={14} className="mr-2" />
                            {currentClass.room}
                          </p>
                        )}
                      </div>
                    )}
                  </>
                )}
                {timeRemaining && (
                  <p className="text-accent-secondary font-medium animate-pulse-slow">{timeRemaining}</p>
                )}
              </div>
            </div>

            {nextClass && (
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
