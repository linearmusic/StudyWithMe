import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

const ActivityHeatmap = ({ studySessions = [], className = '' }) => {
  const { isDark } = useTheme();

  // Generate dates for the last 365 days
  const generateDateRange = () => {
    const dates = [];
    const today = new Date();
    
    for (let i = 364; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      dates.push(new Date(date));
    }
    
    return dates;
  };

  // Calculate study time for each date
  const getStudyDataByDate = () => {
    const studyByDate = {};
    
    studySessions.forEach(session => {
      const date = new Date(session.startTime);
      const dateKey = date.toDateString();
      
      if (!studyByDate[dateKey]) {
        studyByDate[dateKey] = 0;
      }
      studyByDate[dateKey] += session.duration || 0;
    });
    
    return studyByDate;
  };

  const dates = generateDateRange();
  const studyData = getStudyDataByDate();

  // Get intensity level based on study time
  const getIntensityLevel = (studyTime) => {
    if (studyTime === 0) return 0;
    if (studyTime < 30 * 60 * 1000) return 1; // Less than 30 min
    if (studyTime < 60 * 60 * 1000) return 2; // 30-60 min
    if (studyTime < 2 * 60 * 60 * 1000) return 3; // 1-2 hours
    return 4; // 2+ hours
  };

  // Get color class based on intensity
  const getColorClass = (level) => {
    if (isDark) {
      switch (level) {
        case 0: return 'bg-gray-800 border-gray-700';
        case 1: return 'bg-green-900 border-green-800';
        case 2: return 'bg-green-700 border-green-600';
        case 3: return 'bg-green-500 border-green-400';
        case 4: return 'bg-green-300 border-green-200';
        default: return 'bg-gray-800 border-gray-700';
      }
    } else {
      switch (level) {
        case 0: return 'bg-gray-100 border-gray-200';
        case 1: return 'bg-green-100 border-green-200';
        case 2: return 'bg-green-300 border-green-400';
        case 3: return 'bg-green-500 border-green-600';
        case 4: return 'bg-green-700 border-green-800';
        default: return 'bg-gray-100 border-gray-200';
      }
    }
  };

  // Format time for tooltip
  const formatTime = (milliseconds) => {
    const hours = Math.floor(milliseconds / (1000 * 60 * 60));
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  // Group dates by weeks
  const groupDatesByWeeks = () => {
    const weeks = [];
    let currentWeek = [];
    
    dates.forEach((date, index) => {
      currentWeek.push(date);
      
      if (currentWeek.length === 7 || index === dates.length - 1) {
        weeks.push([...currentWeek]);
        currentWeek = [];
      }
    });
    
    return weeks;
  };

  const weeks = groupDatesByWeeks();
  const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Calculate total study time and streak
  const totalStudyTime = Object.values(studyData).reduce((sum, time) => sum + time, 0);
  const currentStreak = calculateCurrentStreak(studyData, dates);

  function calculateCurrentStreak(studyData, dates) {
    let streak = 0;
    for (let i = dates.length - 1; i >= 0; i--) {
      const dateKey = dates[i].toDateString();
      if (studyData[dateKey] && studyData[dateKey] > 0) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  }

  return (
    <div className={className}>
      {/* Header with stats */}
      <div className="flex justify-between items-center mb-4">
        <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Your Activity
        </h3>
        <div className="flex space-x-4 text-sm">
          <div className="flex items-center">
            <span className="text-orange-500">🔥</span>
            <span className={`ml-1 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              {currentStreak} Days Active Streak
            </span>
          </div>
          <div className="flex items-center">
            <span className="text-blue-500">🚀</span>
            <span className={`ml-1 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              {formatTime(totalStudyTime)} Total
            </span>
          </div>
        </div>
      </div>

      {/* Activity grid */}
      <div className="overflow-x-auto">
        <div className="inline-flex flex-col space-y-1">
          {/* Month labels */}
          <div className="flex ml-8">
            {weeks.map((week, weekIndex) => {
              const firstDay = week[0];
              const showMonth = firstDay.getDate() <= 7;
              
              return (
                <div key={weekIndex} className="w-3 text-xs text-center">
                  {showMonth && (
                    <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>
                      {monthLabels[firstDay.getMonth()]}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Grid with day labels */}
          <div className="flex">
            {/* Day labels */}
            <div className="flex flex-col space-y-1 mr-2">
              {dayLabels.map((day, index) => (
                <div 
                  key={day}
                  className={`h-3 flex items-center text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}
                  style={{ fontSize: '10px' }}
                >
                  {index % 2 === 1 && day}
                </div>
              ))}
            </div>

            {/* Activity squares */}
            <div className="flex space-x-1">
              {weeks.map((week, weekIndex) => (
                <div key={weekIndex} className="flex flex-col space-y-1">
                  {week.map((date, dayIndex) => {
                    const dateKey = date.toDateString();
                    const studyTime = studyData[dateKey] || 0;
                    const level = getIntensityLevel(studyTime);
                    
                    return (
                      <div
                        key={date.toISOString()}
                        className={`w-3 h-3 border rounded-sm cursor-pointer transition-all hover:ring-1 hover:ring-blue-500 ${getColorClass(level)}`}
                        title={`${date.toLocaleDateString()}: ${studyTime > 0 ? formatTime(studyTime) : 'No study time'}`}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-between mt-4">
        <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          Less
        </span>
        <div className="flex items-center space-x-1">
          {[0, 1, 2, 3, 4].map(level => (
            <div
              key={level}
              className={`w-3 h-3 border rounded-sm ${getColorClass(level)}`}
            />
          ))}
        </div>
        <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          More
        </span>
      </div>
    </div>
  );
};

export default ActivityHeatmap;