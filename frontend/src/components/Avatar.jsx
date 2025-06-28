import React, { useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

const Avatar = ({ 
  user, 
  size = 'md', 
  editable = false, 
  className = '',
  onClick = null 
}) => {
  const { updateUser } = useAuth();
  const { isDark } = useTheme();
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  const sizeClasses = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-12 h-12 text-lg',
    lg: 'w-16 h-16 text-xl',
    xl: 'w-24 h-24 text-2xl'
  };

  const getInitials = (username) => {
    if (!username) return '?';
    return username.charAt(0).toUpperCase();
  };

  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Check file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/users/upload-avatar`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        // Update user data with new avatar
        updateUser({ avatar: data.avatarUrl });
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'Failed to upload avatar');
      }
    } catch (error) {
      console.error('Avatar upload error:', error);
      alert('Failed to upload avatar');
    } finally {
      setIsUploading(false);
    }
  };

  const handleAvatarClick = () => {
    if (editable && !isUploading) {
      fileInputRef.current?.click();
    } else if (onClick) {
      onClick();
    }
  };

  const handleDeleteAvatar = async (e) => {
    e.stopPropagation();
    
    if (!confirm('Are you sure you want to delete your profile picture?')) {
      return;
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/users/delete-avatar`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        updateUser({ avatar: '' });
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'Failed to delete avatar');
      }
    } catch (error) {
      console.error('Avatar delete error:', error);
      alert('Failed to delete avatar');
    }
  };

  return (
    <div className={`relative ${className}`}>
      <div
        className={`
          ${sizeClasses[size]}
          rounded-full
          flex items-center justify-center
          font-semibold
          ${user?.avatar 
            ? 'bg-transparent border-2 border-gray-300 dark:border-gray-600' 
            : isDark 
              ? 'bg-blue-600 text-white' 
              : 'bg-blue-500 text-white'
          }
          ${editable || onClick ? 'cursor-pointer hover:opacity-80' : ''}
          ${isUploading ? 'opacity-50' : ''}
          transition-opacity duration-200
          overflow-hidden
        `}
        onClick={handleAvatarClick}
        title={editable ? 'Click to change profile picture' : user?.username}
      >
        {user?.avatar ? (
          <img
            src={`${import.meta.env.VITE_API_URL}${user.avatar}`}
            alt={user.username || 'Avatar'}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.parentElement.innerHTML = `<span class="text-inherit">${getInitials(user.username)}</span>`;
            }}
          />
        ) : (
          <span>{getInitials(user?.username)}</span>
        )}
        
        {isUploading && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-full">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
      </div>

      {editable && (
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
      )}

      {editable && user?.avatar && (
        <button
          onClick={handleDeleteAvatar}
          className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-xs transition-colors duration-200"
          title="Delete profile picture"
        >
          ×
        </button>
      )}
    </div>
  );
};

export default Avatar; 