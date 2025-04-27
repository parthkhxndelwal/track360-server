'use client';

import React from 'react';
import { Video } from 'lucide-react';

interface DefaultThumbnailProps {
  title?: string;
  className?: string;
}

const DefaultThumbnail: React.FC<DefaultThumbnailProps> = ({ 
  title = 'Video', 
  className = 'w-full h-full'
}) => {
  // Create a random but consistent color based on the title
  const getColor = (text: string) => {
    const colors = [
      '#3498db', '#2ecc71', '#e74c3c', '#f39c12', 
      '#9b59b6', '#1abc9c', '#d35400', '#c0392b'
    ];
    
    // Simple hash function to get consistent color for the same title
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      hash = text.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    return colors[Math.abs(hash) % colors.length];
  };

  const bgColor = getColor(title);
  
  return (
    <div 
      className={`flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-800 ${className}`}
      style={{ backgroundColor: bgColor + '33' }} // Adding 33 for transparency
    >
      <Video className="h-12 w-12 text-white" style={{ color: bgColor }} />
      <div className="mt-2 text-sm font-medium text-white text-center px-2" style={{ color: bgColor }}>
        {title.length > 20 ? title.substring(0, 20) + '...' : title}
      </div>
    </div>
  );
};

export default DefaultThumbnail; 