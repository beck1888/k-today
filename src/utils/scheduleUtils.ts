import { ClassData, ClassInfo, Event } from '../types/schedule';

export const getDayAbbreviation = () => {
  const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  return days[new Date().getDay()];
};

export const getMinutesIntoDay = () => {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
};

export const getSecondsIntoDay = () => {
  const now = new Date();
  return now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
};

export const formatTimeRemaining = (secondsRemaining: number): string => {
  const hours = Math.floor(secondsRemaining / 3600);
  const minutes = Math.floor((secondsRemaining % 3600) / 60);
  const seconds = secondsRemaining % 60;

  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s remaining`;
  if (minutes > 0) return `${minutes}m ${seconds}s remaining`;
  return `${seconds}s remaining`;
};

export const formatCountdown = (secondsRemaining: number): string => {
  const hours = Math.floor(secondsRemaining / 3600);
  const minutes = Math.floor((secondsRemaining % 3600) / 60);
  const seconds = secondsRemaining % 60;
  
  if (hours > 0) {
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

export const findNextSignificantClass = (
  events: Event[],
  currentIndex: number,
  classes: ClassData
): ClassInfo | null => {
  for (let i = currentIndex + 1; i < events.length; i++) {
    const blockName = events[i].name.toLowerCase().replace(/\s+/g, '');
    if (blockName !== 'passingperiod' && classes[blockName]) {
      return classes[blockName];
    }
  }
  return null;
};

export const findFirstClassOfDay = (
  events: Event[],
  classes: ClassData
): ClassInfo | null => {
  for (let i = 0; i < events.length; i++) {
    const blockName = events[i].name.toLowerCase().replace(/\s+/g, '');
    if (blockName !== 'passingperiod' && classes[blockName]) {
      return classes[blockName];
    }
  }
  return null;
};

export const findRemainingClasses = (
  events: Event[],
  currentIndex: number,
  classes: ClassData
): ClassInfo[] => {
  const remainingClasses: ClassInfo[] = [];
  for (let i = currentIndex + 1; i < events.length; i++) {
    const blockName = events[i].name.toLowerCase().replace(/\s+/g, '');
    if (blockName !== 'passingperiod' && classes[blockName]) {
      remainingClasses.push(classes[blockName]);
    }
  }
  return remainingClasses;
};
