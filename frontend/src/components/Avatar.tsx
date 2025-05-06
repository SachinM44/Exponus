import React, { useState, useEffect } from 'react';

export interface AvatarProps {
  name: string | null | undefined;
  src?: string | null | undefined;
  size?: 'sm' | 'small' | 'medium' | 'large';
}

const Avatar: React.FC<AvatarProps> = ({ name, src, size = 'medium' }) => {
  const [imgError, setImgError] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string | null>(null);
  
  // Log debug info when src changes
  useEffect(() => {
    if (src) {
      console.log(`Avatar for ${name || 'Unknown'} is using src: ${src}`);
      if (src.startsWith('null') || src === 'undefined') {
        console.error(`Invalid avatar src for ${name || 'Unknown'}: ${src}`);
        setImgError(true);
        setDebugInfo(`Invalid src: ${src}`);
      } else {
        setImgError(false);
        setDebugInfo(null);
      }
    }
  }, [src, name]);
  
  const sizeClasses = {
    sm: 'h-8 w-8 text-xs',
    small: 'h-8 w-8 text-xs',
    medium: 'h-12 w-12 text-sm',
    large: 'h-16 w-16 text-base',
  };

  const displayName = name || 'User';
  const initials = displayName
    ? displayName
        .split(' ')
        .map(n => n && n[0])
        .filter(Boolean)
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '?';

  // Use different background colors based on the name
  const getColorClass = () => {
    if (!displayName) return 'bg-blue-500';
    
    // Generate a consistent color based on the name
    const hash = displayName.split('').reduce((acc, char) => {
      return char.charCodeAt(0) + ((acc << 5) - acc);
    }, 0);
    
    const colors = [
      'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 
      'bg-red-500', 'bg-purple-500', 'bg-pink-500', 
      'bg-indigo-500', 'bg-teal-500'
    ];
    
    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <div
      className={`${
        sizeClasses[size]
      } rounded-full flex items-center justify-center ${getColorClass()} text-white font-medium overflow-hidden`}
      title={debugInfo || displayName}
    >
      {src && !imgError ? (
        <img
          src={src}
          alt={displayName}
          className="w-full h-full object-cover"
          onError={(e) => {
            console.error('Avatar image failed to load:', src);
            setImgError(true);
            setDebugInfo(`Failed to load: ${src}`);
          }}
        />
      ) : (
        initials
      )}
    </div>
  );
};

export default Avatar;