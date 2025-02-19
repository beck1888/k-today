<!-- Documentation accurate as of February 29, 2024 -->

# K-Today Schedule Tracker Architecture

## Overview
K-Today is a real-time class schedule tracking application that provides live updates of the current class period, countdown timers, and upcoming class information. It uses React with Next.js for efficient client-side rendering and real-time updates.

## Core Components

### State Management
The application maintains several key pieces of state:
- `schedule`: Contains the complete schedule data for all days
- `classes`: Stores class-specific information and metadata
- `currentBlock`: Tracks the current period status
- `currentClass`: Holds detailed information about the current class
- `nextClass`: Contains information about the upcoming class
- `timeRemaining`: Maintains the countdown to next transition
- `renderTime`: Performance metric for initial load

### Time Management
The system uses three time calculation utilities:
- `getDayAbbreviation()`: Returns current day code (MON, TUE, etc.)
- `getMinutesIntoDay()`: Calculates minutes elapsed since midnight
- `getSecondsIntoDay()`: Provides precise second-level timing for countdowns

### Update Cycle
- Initial data fetch occurs on component mount
- Schedule updates run every second via useEffect
- Performance metrics are captured for initial render

## Data Structure

### Schedule Format
```typescript
ScheduleData {
  [dayCode: string]: {
    events: Array<{
      name: string;
      timestamp: number;  // minutes since midnight
    }>;
    message?: string;  // for special days
  }
}
```

### Class Information
```typescript
ClassData {
  [blockId: string]: {
    className: string;
    classEmoji: string;
    teacher: string | null;
    room: string | null;
  }
}
```

## Key Algorithms

### Current Block Detection
Works backwards through the day's events to find the current period:
1. Compares current time against event timestamps
2. Handles special cases (school day over, not started)
3. Calculates remaining time until next transition

### Next Class Lookup
Implements smart next class detection:
1. Handles passing periods by looking ahead
2. Skips non-class events
3. Returns null for end-of-day conditions

## Error Handling
- Graceful degradation for missing schedule data
- Special day message display
- Null state handling for class information
- Performance monitoring with render time tracking

## UI Components
The interface is structured in layers:
1. Performance metrics (optional)
2. Day/time information
3. Current block status
4. Current class details
5. Next class preview

## Configuration
Uses two JSON data sources:
- `/data/dates.json`: Schedule definitions
- `/data/myClasses.json`: Class information

## Implementation Notes

### Performance Optimizations
- Client-side rendering for real-time updates
- Efficient timestamp comparisons
- Minimal state updates
- Performance monitoring built-in

### Time Display
- Formatted countdown strings
- 24-hour time format for schedules
- Granular updates for accuracy

### Special Cases
Handles various edge cases:
- School day boundaries
- Special schedule messages
- Missing class data
- Passing periods
- End of day conditions
