<!-- Documentation accurate as of Wed, Feb 19, 2025 @ 3 PM -->

# K-Today Schedule Tracker Architecture

## Overview
K-Today is a real-time class schedule tracking application designed to help students navigate their school day. Rather than just showing a static schedule, it actively tracks the current period, remaining time, and upcoming classes to reduce the cognitive load on students during transitions.

## Key Design Decisions

### Real-Time Updates
The application updates every second to provide accurate countdown timers. This was chosen over less frequent updates to ensure students can make split-second decisions about when to start packing up or transitioning to their next class.

### Data Structure
- `ScheduleData`: Uses timestamps in minutes since midnight for precise timing calculations
- `ClassData`: Separates class information from timing information to allow for schedule changes without affecting class details
- Events are stored with normalized block names (lowercase, no spaces) to ensure reliable lookups

### State Management
The application uses four key pieces of state:
- `currentBlock`: The current period or schedule state
- `currentClass`: Detailed information about the current class
- `nextClass`: Look-ahead information for the upcoming class
- `timeRemaining`: Dynamic countdown to next transition

### Smart Transition Handling
The system includes special handling for:
- Passing periods (looks ahead to find the next actual class)
- End of day conditions
- Special schedule messages (e.g., holidays, special events)
- Pre-school and post-school states

### Time Calculations
Uses three different time granularities:
- Day level (for schedule selection)
- Minutes (for period determination)
- Seconds (for countdown accuracy)

## Implementation Notes

### Event Finding Algorithm
The current block finder works backwards through the day's events because:
1. It's more efficient (especially later in the day)
2. Prevents edge cases with forward scanning
3. Naturally handles the "last event of day" case

### Class Information Display
Classes include emojis and room numbers to help with:
- Quick visual recognition
- Spatial orientation in the school
- Accessibility (emoji serve as visual anchors)

### Error States
The application gracefully handles:
- Missing class data
- Special schedule days
- Transitions between school days
- Network failures during data fetch

## Configuration
The application expects two JSON files:
- `dates.json`: Contains the daily schedule information
- `myClasses.json`: Contains class-specific information

This separation allows for:
- Different schedule configurations (half days, special events)
- Personal class schedules
- Easy schedule updates without affecting class information
