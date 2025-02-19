'use client';

export default function Home() {
  const getDayAbbreviation = () => {
    const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    return days[new Date().getDay()];
  };

  const getMinutesIntoDay = () => {
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
  };

  return (
    <div>
      <p>Day of week: {getDayAbbreviation()}</p>
      <p>Minutes into the day: {getMinutesIntoDay()}</p>
    </div>
  );
}
