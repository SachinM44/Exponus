import React from 'react';

export interface AvatarProps {
  name: string;
  src?: string;
  size?: 'sm' | 'small' | 'medium' | 'large';
}

const Avatar: React.FC<AvatarProps> = ({ name, src, size = 'medium' }) => {
  const sizeClasses = {
    sm: 'h-8 w-8 text-xs',
    small: 'h-8 w-8 text-xs',
    medium: 'h-12 w-12 text-sm',
    large: 'h-16 w-16 text-base',
  };

  const initials = name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div
      className={`${
        sizeClasses[size]
      } rounded-full flex items-center justify-center bg-blue-500 text-white font-medium overflow-hidden`}
    >
      {src ? (
        <img
          src={src}
          alt={name}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
            e.currentTarget.parentElement!.textContent = initials;
          }}
        />
      ) : (
        initials
      )}
    </div>
  );
};

export default Avatar; 