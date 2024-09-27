import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, ChevronRight } from 'lucide-react';
import { Icon } from '@iconify/react';

interface SoulmateProps {
  profileData: {
    AGE: string;
    GENDER: string;
    SEEKING: string;
    TELEGRAM: string;
    PROFILE_NAME: string;
    "PROFILE DESCRIPTION": string;
    token_uri: string;
  };
}

export const Soulmate: React.FC<SoulmateProps> = ({ profileData }) => {
  const [isHovered, setIsHovered] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const getContrastColor = (bgColor: string) => {
    // 简单的对比度计算逻辑，可以根据需要调整
    const r = parseInt(bgColor.slice(1, 3), 16);
    const g = parseInt(bgColor.slice(3, 5), 16);
    const b = parseInt(bgColor.slice(5, 7), 16);
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return (yiq >= 128) ? '#000000' : '#FFFFFF';
  };

  const handleLike = () => {
    // 处理点赞逻辑
    console.log('Liked profile:', profileData.PROFILE_NAME);
  };

  return (
    <div className="relative w-72 h-auto max-h-[calc(100vh-16rem)] z-30" style={{ perspective: '1500px' }}>
      <div 
        className="w-full h-full" 
        style={{ 
          transformStyle: 'preserve-3d', 
          transform: `rotateY(-20deg) ${isHovered ? 'scale(1.05)' : ''}`,
          transition: 'transform 0.3s ease'
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        ref={cardRef}
      >
        <motion.div
          initial={{ x: 300, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="rounded-2xl shadow-lg overflow-hidden h-full"
          style={{
            transformStyle: 'preserve-3d',
            transform: 'translateZ(20px)',
            backgroundColor: '#FFFFFF',
          }}
        >
          <div 
            className="relative w-full h-full flex flex-col justify-start items-center p-6 cursor-pointer overflow-y-auto px-6"
            style={{
              color: '#000000',
              maxHeight: 'calc(100vh - 16rem)',
            }}
          >
            <motion.div
              className="absolute top-4 right-4 z-10 flex items-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              onClick={handleLike}
            >
              <Heart
                fill="none"
                stroke="#FF69B4"
                size={28}
              />
            </motion.div>

            <motion.img 
              src={profileData.token_uri}
              alt={profileData.PROFILE_NAME}
              className="w-24 h-24 rounded-full mb-4 flex-shrink-0"
              whileHover={{ scale: 1.1 }}
            />
            <motion.h2 
              className="text-2xl font-bold mb-2 text-center w-full flex-shrink-0"
              whileHover={{ scale: 1.05 }}
            >
              {profileData.PROFILE_NAME.length > 20 
                ? profileData.PROFILE_NAME.slice(0, 20) + '...'
                : profileData.PROFILE_NAME
              }
            </motion.h2>
            <motion.p 
              className="text-sm mb-4 text-center w-full flex-shrink-0"
              whileHover={{ scale: 1.05 }}
            >
              {profileData["PROFILE DESCRIPTION"].length > 50
                ? profileData["PROFILE DESCRIPTION"].slice(0, 50) + '...'
                : profileData["PROFILE DESCRIPTION"].split(' ').map((word, index) => (
                    <React.Fragment key={index}>
                      {word}
                      {index !== 0 && (index + 1) % 5 === 0 && <br />}
                      {index !== 0 && (index + 1) % 5 !== 0 && ' '}
                    </React.Fragment>
                  ))
              }
            </motion.p>
            <motion.div 
              className="w-full space-y-2 px-4"
              initial={{ x: 300 }}
              animate={{ x: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30, delay: 0.4 }}
            >
              <motion.div className="flex items-center p-2 bg-gray-100 rounded" whileHover={{ scale: 1.05 }}>
                <Icon icon="mdi:cake-variant" className="mr-2" />
                <span>Age: {profileData.AGE}</span>
              </motion.div>
              <motion.div className="flex items-center p-2 bg-gray-100 rounded" whileHover={{ scale: 1.05 }}>
                <Icon icon="mdi:gender-male-female" className="mr-2" />
                <span>Gender: {profileData.GENDER === "false" ? "Female" : "Male"}</span>
              </motion.div>
              <motion.div className="flex items-center p-2 bg-gray-100 rounded" whileHover={{ scale: 1.05 }}>
                <Icon icon="mdi:heart-search" className="mr-2" />
                <span>Seeking: {profileData.SEEKING === "2" ? "Both" : (profileData.SEEKING === "0" ? "Male" : "Female")}</span>
              </motion.div>
              <motion.a
                href={`https://t.me/${profileData.TELEGRAM}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center p-2 bg-gray-100 rounded"
                whileHover={{ scale: 1.05 }}
              >
                <Icon icon="mdi:telegram" className="mr-2" />
                <span>Telegram: {profileData.TELEGRAM}</span>
              </motion.a>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};