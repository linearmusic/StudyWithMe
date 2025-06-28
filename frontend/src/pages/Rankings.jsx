import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import Avatar from '../components/Avatar';
import { HiStar, HiClock, HiFire, HiTrendingUp, HiUsers } from 'react-icons/hi';
import axios from 'axios';

const Rankings = () => {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const [rankings, setRankings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState('total');
  const [myRank, setMyRank] = useState(null);

  useEffect(() => {
    fetchRankings();
  }, [timeFilter]);

  const fetchRankings = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/users/rankings?filter=${timeFilter}`);
      setRankings(response.data.rankings);
      setMyRank(response.data.myRank);
    } catch (error) {
      console.error('Error fetching rankings:', error);
      setRankings([]);
      setMyRank(null);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (milliseconds) => {
    const hours = Math.floor(milliseconds / (1000 * 60 * 60));
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const getRankIcon = (rank) => {
    switch (rank) {
      case 1:
        return <span className="text-yellow-500 text-xl">🥇</span>;
      case 2:
        return <span className="text-gray-400 text-xl">🥈</span>;
      case 3:
        return <span className="text-orange-600 text-xl">🥉</span>;
      default:
        return (
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
            isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-600'
          }`}>
            {rank}
          </div>
        );
    }
  };

  const getTimeLabel = () => {
    switch (timeFilter) {
      case 'weekly':
        return 'This Week';
      case 'monthly':
        return 'This Month';
      default:
        return 'All Time';
    }
  };

  const getStudyTime = (user) => {
    switch (timeFilter) {
      case 'weekly':
        return user.weeklyStudyTime || 0;
      case 'monthly':
        return user.monthlyStudyTime || 0;
      default:
        return user.totalStudyTime || 0;
    }
  };

  if (loading) {
    return (
      <div className={`min-h-screen transition-colors ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <span className="text-4xl mr-3">🏆</span>
            <h1 className={`text-3xl font-bold transition-colors ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>
              Study Rankings
            </h1>
          </div>
          <p className={`transition-colors ${
            isDark ? 'text-gray-400' : 'text-gray-600'
          }`}>
            See how you stack up against other study warriors!
          </p>
        </div>

        <div className={`rounded-lg shadow-md p-6 mb-6 transition-colors ${
          isDark ? 'bg-gray-800' : 'bg-white'
        }`}>
          <div className="flex items-center justify-between">
            <h2 className={`text-lg font-semibold transition-colors ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>
              {getTimeLabel()} Leaderboard
            </h2>
            
            <div className="flex space-x-2">
              {[
                { key: 'total', label: 'All Time', icon: HiClock },
                { key: 'weekly', label: 'Weekly', icon: HiFire },
                { key: 'monthly', label: 'Monthly', icon: HiTrendingUp }
              ].map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setTimeFilter(key)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    timeFilter === key
                      ? 'bg-blue-600 text-white'
                      : isDark
                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {myRank && (
          <div className={`rounded-lg shadow-md p-4 mb-6 border-2 border-blue-500 transition-colors ${
            isDark ? 'bg-gray-800' : 'bg-white'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <HiStar className="w-5 h-5 text-blue-500" />
                  <span className={`font-medium transition-colors ${
                    isDark ? 'text-white' : 'text-gray-900'
                  }`}>
                    Your Rank
                  </span>
                </div>
                {getRankIcon(myRank.rank)}
                <Avatar user={user} size="md" />
                <div>
                  <h3 className={`font-semibold transition-colors ${
                    isDark ? 'text-white' : 'text-gray-900'
                  }`}>
                    {user?.username}
                  </h3>
                  <p className={`text-sm transition-colors ${
                    isDark ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    {formatDuration(getStudyTime(myRank))}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className={`text-2xl font-bold transition-colors ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>
                  #{myRank.rank}
                </div>
                <div className={`text-sm transition-colors ${
                  isDark ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  of {rankings.length}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className={`rounded-lg shadow-md overflow-hidden transition-colors ${
          isDark ? 'bg-gray-800' : 'bg-white'
        }`}>
          {rankings.length > 0 ? (
            <div className={`divide-y transition-colors ${
              isDark ? 'divide-gray-700' : 'divide-gray-200'
            }`}>
              {rankings.map((rankedUser, index) => {
                const rank = index + 1;
                const isCurrentUser = rankedUser.id === user?.id;
                
                return (
                  <div
                    key={rankedUser.id}
                    className={`p-6 transition-colors ${
                      isCurrentUser 
                        ? isDark 
                          ? 'bg-blue-900/20' 
                          : 'bg-blue-50'
                        : isDark 
                          ? 'hover:bg-gray-700' 
                          : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        {getRankIcon(rank)}
                        
                        <Avatar user={rankedUser} size="md" />
                        
                        <div>
                          <Link
                            to={`/profile/${rankedUser.id}`}
                            className={`font-semibold transition-colors hover:text-blue-600 ${
                              isDark ? 'text-white hover:text-blue-400' : 'text-gray-900 hover:text-blue-600'
                            }`}
                          >
                            {rankedUser.username}
                            {isCurrentUser && (
                              <span className="ml-2 px-2 py-1 text-xs bg-blue-600 text-white rounded-full">
                                You
                              </span>
                            )}
                          </Link>
                          <div className="flex items-center space-x-4 mt-1">
                            <div className={`flex items-center text-sm transition-colors ${
                              isDark ? 'text-gray-400' : 'text-gray-600'
                            }`}>
                              <HiClock className="w-4 h-4 mr-1" />
                              <span>{formatDuration(getStudyTime(rankedUser))}</span>
                            </div>
                            {rankedUser.currentStreak > 0 && (
                              <div className={`flex items-center text-sm transition-colors ${
                                isDark ? 'text-gray-400' : 'text-gray-600'
                              }`}>
                                <HiFire className="w-4 h-4 mr-1 text-orange-500" />
                                <span>{rankedUser.currentStreak} day streak</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className={`text-xl font-bold transition-colors ${
                          isDark ? 'text-white' : 'text-gray-900'
                        }`}>
                          #{rank}
                        </div>
                        {rank <= 3 && (
                          <div className={`text-xs font-medium transition-colors ${
                            rank === 1 ? 'text-yellow-500' :
                            rank === 2 ? 'text-gray-400' :
                            'text-orange-600'
                          }`}>
                            {rank === 1 ? 'Champion' : rank === 2 ? 'Runner-up' : 'Third Place'}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-12 text-center">
              <HiUsers className={`w-16 h-16 mx-auto mb-4 transition-colors ${
                isDark ? 'text-gray-600' : 'text-gray-300'
              }`} />
              <h3 className={`text-lg font-medium mb-2 transition-colors ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>
                No rankings yet
              </h3>
              <p className={`transition-colors ${
                isDark ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Start studying to appear on the leaderboard!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Rankings; 