'use client';
import { useEffect, useState } from 'react';

/**
 * Represents a scheduled event in the day
 * Events use minutes since midnight for precise timing calculations
 */
interface Event {
  name: string;
  timestamp: number;
}

/**
 * Represents a complete day's schedule
 * Can include special messages for non-standard days (holidays, etc.)
 */
interface DaySchedule {
  events: Event[];
  message?: string;
}

/**
 * Maps day abbreviations to their schedules
 * Allows for different schedules on different days
 */
interface ScheduleData {
  [key: string]: DaySchedule;
}

/**
 * Detailed information about a specific class
 * Separates presentation data from scheduling data
 */
interface ClassInfo {
  className: string;
  classEmoji: string;
  teacher: string | null;
  room: string | null;
}

/**
 * Maps normalized block names to class information
 * Block names are lowercase with no spaces for reliable lookups
 */
interface ClassData {
  [key: string]: ClassInfo;
}

/**
 * Main component for the schedule tracking application
 * Provides real-time updates of current and upcoming classes
 */
export default function Home() {
  // Core state management for tracking schedule progression
  const [schedule, setSchedule] = useState<ScheduleData | null>(null);
  const [classes, setClasses] = useState<ClassData | null>(null);
  const [currentBlock, setCurrentBlock] = useState<string>('Loading...');
  const [currentClass, setCurrentClass] = useState<ClassInfo | null>(null);
  const [nextClass, setNextClass] = useState<ClassInfo | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<string>('');

  /**
   * Converts current day to three-letter abbreviation
   * Used for looking up the correct schedule in ScheduleData
   */
  const getDayAbbreviation = () => {
    const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    const day = days[new Date().getDay()];
    console.log('Current day determined:', day);
    return day;
  };

  /**
   * Calculates minutes elapsed since midnight
   * Used for period determination at minute granularity
   */
  const getMinutesIntoDay = () => {
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
  };

  /**
   * Calculates seconds elapsed since midnight
   * Used for accurate countdown displays
   */
  const getSecondsIntoDay = () => {
    const now = new Date();
    return now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
  };

  /**
   * Looks ahead in the schedule to find the next actual class
   * Skips over passing periods to show students their next destination
   * @param events List of all events in the day
   * @param currentIndex Current position in events array
   * @param classes Available class information
   */
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

  /**
   * Determines current schedule state and updates related information
   * Works backwards through events for efficiency and edge case handling
   * Updates current class, next class, and remaining time states
   * @param daySchedule Schedule for the current day
   * @param currentTime Current time in seconds since midnight
   */
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

  /**
   * Initial data fetch effect
   * Loads schedule and class information from JSON files
   */
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

  /**
   * Schedule update effect
   * Triggers updates when schedule data changes
   * Handles special messages for non-standard days
   */
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

  /**
   * Real-time update effect
   * Updates the display every second for accurate countdowns
   * Cleanly handles component unmounting
   */
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

  // Render section remains unchanged
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
