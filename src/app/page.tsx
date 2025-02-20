'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { ClassData, ClassInfo, ScheduleData, DaySchedule } from '../types/schedule';
import {
  getDayAbbreviation,
  getMinutesIntoDay,
  getSecondsIntoDay,
  formatTimeRemaining,
  findNextSignificantClass,
  findRemainingClasses
} from '../utils/scheduleUtils';

export default function Home() {
  const [schedule, setSchedule] = useState<ScheduleData | null>(null);
  const [classes, setClasses] = useState<ClassData | null>(null);
  const [currentBlock, setCurrentBlock] = useState<string>('Loading...');
  const [currentClass, setCurrentClass] = useState<ClassInfo | null>(null);
  const [nextClass, setNextClass] = useState<ClassInfo | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [remainingClasses, setRemainingClasses] = useState<ClassInfo[]>([]);
  const [isLaterClassesExpanded, setIsLaterClassesExpanded] = useState(false);
  const [currentEventIndex, setCurrentEventIndex] = useState<number>(-1);
  const [nextEventIndex, setNextEventIndex] = useState<number>(-1);
  const [daySchedule, setDaySchedule] = useState<DaySchedule | null>(null);

  const getCurrentBlock = (daySchedule: DaySchedule, currentTime: number) => {
    const events = daySchedule.events;
    setDaySchedule(daySchedule);
    
    // If before first event of the day
    if (currentTime < events[0].timestamp * 60) {
      setCurrentEventIndex(-1);
      setNextEventIndex(0);
      setTimeRemaining(formatTimeRemaining(events[0].timestamp * 60 - currentTime));
      setCurrentClass(null);
      if (classes) {
        setNextClass(findNextSignificantClass(events, -1, classes));
        setRemainingClasses(findRemainingClasses(events, -1, classes));
      }
      return 'School has not started';
    }
    
    for (let i = events.length - 1; i >= 0; i--) {
      if (currentTime >= events[i].timestamp * 60) {
        setCurrentEventIndex(i);
        setNextEventIndex(i + 1);
        if (i === events.length - 1) {
          setTimeRemaining('');
          setNextClass(null);
          setCurrentClass(null);
          setRemainingClasses([]);
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
          setRemainingClasses(findRemainingClasses(events, i, classes));
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
    const startTime = performance.now();
    
    console.log('Hi there! 👋 If you are seeing this, you are probably interested in the code behind this project. Feel free to check out the source code on GitHub: https://github.com/beck1888/k-today');

    // Update the load time after initial data fetch
    Promise.all([
      fetch('/data/dates.json').then(res => res.json()),
      fetch('/data/myClasses.json').then(res => res.json())
    ]).then(([scheduleData, classData]) => {
      setSchedule(scheduleData);
      setClasses(classData);
      const loadTime = Math.round(performance.now() - startTime);
      
      console.groupCollapsed('📊 Initial Load Metrics');
      console.log('Day:', getDayAbbreviation());
      console.log('Minutes into day:', getMinutesIntoDay());
      console.log('Load time:', loadTime + 'ms');
      console.groupEnd();
    });
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
    <div className="max-w-2xl mx-auto space-y-4 no-select">
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
                    <span className="no-select">{currentClass.classEmoji}</span>
                    <span className="font-semibold selectable">{currentClass.className}</span>
                  </div>
                  <div className="text-sm text-gray-400 space-y-1">
                    <p className="flex items-center">
                      <Image src="/icons/clock.svg" alt="" width={14} height={14} className="mr-2 no-select" />
                      <span className="selectable">
                        {daySchedule && currentEventIndex !== -1 && nextEventIndex !== -1 ? 
                          `${Math.floor(daySchedule.events[currentEventIndex].timestamp / 60)}:${String(daySchedule.events[currentEventIndex].timestamp % 60).padStart(2, '0')} → ${Math.floor(daySchedule.events[nextEventIndex].timestamp / 60)}:${String(daySchedule.events[nextEventIndex].timestamp % 60).padStart(2, '0')}`
                          : 'N/A'
                        }
                      </span>
                    </p>
                    <p className="flex items-center">
                      <Image src="/icons/person.svg" alt="" width={14} height={14} className="mr-2 no-select" />
                      <span className="selectable">{currentClass.teacher || 'N/A'}</span>
                    </p>
                    <p className="flex items-center">
                      <Image src="/icons/door.svg" alt="" width={14} height={14} className="mr-2 no-select" />
                      <span className="selectable">{currentClass.room || 'N/A'}</span>
                    </p>
                  </div>
                </>
              )}
              {timeRemaining && (
                <p className="text-accent-secondary font-medium animate-pulse-slow">{timeRemaining}</p>
              )}
            </div>
          </div>

          {remainingClasses.length > 0 && (
            <>
              <div className="card p-6 border-accent-secondary/30">
                <h2 className="text-sm uppercase tracking-wider text-gray-400 mb-2">
                  Next Class
                </h2>
                <p className="text-xl mb-3">
                  <span className="mr-2 no-select">{remainingClasses[0].classEmoji}</span>
                  <span className="font-semibold selectable">{remainingClasses[0].className}</span>
                </p>
                <div className="space-y-2 text-gray-400">
                  <p className="flex items-center">
                    <Image src="/icons/clock.svg" alt="" width={14} height={14} className="mr-2 no-select" />
                    <span className="selectable">
                      {daySchedule && nextEventIndex !== -1 && nextEventIndex + 1 < daySchedule.events.length ? 
                        `${Math.floor(daySchedule.events[nextEventIndex].timestamp / 60)}:${String(daySchedule.events[nextEventIndex].timestamp % 60).padStart(2, '0')} → ${Math.floor(daySchedule.events[nextEventIndex + 1].timestamp / 60)}:${String(daySchedule.events[nextEventIndex + 1].timestamp % 60).padStart(2, '0')}`
                        : 'N/A'
                      }
                    </span>
                  </p>
                  <p className="flex items-center">
                    <Image src="/icons/person.svg" alt="" width={14} height={14} className="mr-2 no-select" />
                    <span className="selectable">{remainingClasses[0].teacher || 'N/A'}</span>
                  </p>
                  <p className="flex items-center">
                    <Image src="/icons/door.svg" alt="" width={14} height={14} className="mr-2 no-select" />
                    <span className="selectable">{remainingClasses[0].room || 'N/A'}</span>
                  </p>
                </div>
              </div>

              {remainingClasses.length > 1 && (
                <div className="card p-6 border-dark-300">
                  <button
                    onClick={() => setIsLaterClassesExpanded(!isLaterClassesExpanded)}
                    className="w-full flex items-center justify-between text-sm uppercase tracking-wider text-gray-400 mb-2"
                  >
                    <span>{remainingClasses.length - 1 > 10 ? 'Ten' : ['Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten'][remainingClasses.length - 1]} Other {remainingClasses.length - 1 === 1 ? 'Event' : 'Events'} Today</span>
                    <span className={`transition-transform duration-200 ${isLaterClassesExpanded ? 'rotate-180' : ''}`}>
                      ▼
                    </span>
                  </button>
                  
                  {isLaterClassesExpanded && (
                    <div className="space-y-4 mt-4">
                      {remainingClasses.slice(1).map((classInfo, index) => (
                        <div key={index} className="border-t border-dark-300 pt-4">
                          <p className="text-xl">
                            <span className="mr-2 no-select">{classInfo.classEmoji}</span>
                            <span className="font-semibold selectable">{classInfo.className}</span>
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
