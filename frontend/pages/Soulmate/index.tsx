import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, ChevronRight } from 'lucide-react';
import { Icon } from '@iconify/react';
import { useParams, useNavigate } from 'react-router-dom';
import { getProfile } from '@/view-functions/getProfile';
import { Header } from "@/components/Header";
import FullScreenLoading from '@/components/FullScreenLoading';

export const Soulmate: React.FC = () => {
  const [profileData, setProfileData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfileData = async () => {
      setIsLoading(true);
      try {
        const profileData = await getProfile(id || '');
        if (profileData && profileData.token_properties) {
          const properties = profileData.token_properties;
          setProfileData({
            AGE: properties.AGE,
            GENDER: properties.GENDER,
            SEEKING: properties.SEEKING,
            TELEGRAM: properties.TELEGRAM,
            PROFILE_NAME: properties.PROFILE_NAME,
            PROFILE_DESCRIPTION: properties["PROFILE DESCRIPTION"],
            token_uri: profileData.token_uri
          });
        } else {
          console.error('Profile data not found or invalid');
        }
      } catch (error) {
        console.error('Error fetching profile data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfileData();
  }, [id]);

  const [isHovered, setIsHovered] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const cardVariants = {
    hidden: { opacity: 0, rotateY: 720, scale: 0.5 },
    visible: {
      opacity: 1,
      rotateY: -20,
      scale: 1,
      y: [0, -50, 0],
      transition: {
        type: 'spring',
        duration: 2,
        bounce: 0.5,
        rotateY: { duration: 1.5 },
        y: { duration: 0.5, delay: 1.5 }
      }
    }
  };

  const glowingBorderVariants = {
    initial: { opacity: 0, scale: 1, rotateY: -15 },
    animate: {
      opacity: [0, 1, 0],
      scale: [1, 1, 1],
      rotateY: [-15, -20, -15],
      boxShadow: [
        '0 0 5px #FF69B4',
        '0 0 20px #8A2BE2', 
        '0 0 40px #4B0082',
        '0 0 20px #8A2BE2',
        '0 0 5px #FF69B4'
      ],
      filter: ['brightness(150%)', 'brightness(150%)', 'brightness(150%)'],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  return (
    <div className="w-screen min-h-screen bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 p-4 overflow-hidden">
      <Header />
      <div className="flex justify-center items-center min-h-[calc(100vh-10rem)]">
        {isLoading ? (
          <FullScreenLoading />
        ) : !profileData ? (
          <div className="text-white text-2xl">No suitable soulmate found</div>
        ) : (
          <motion.div
            className="relative w-72 h-auto z-30"
            style={{ perspective: '1500px' }}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Enhanced glowing border effect */}
            <motion.div
              className="absolute inset-0 rounded-2xl"
              style={{
                background: 'linear-gradient(45deg, #ff69b4, #8a2be2, #4b0082)',
                zIndex: -1,
              }}
              variants={glowingBorderVariants}
              initial="initial"
              animate="animate"
            />
            <div 
              className="w-full h-full" 
              style={{ 
                transformStyle: 'preserve-3d', 
                transition: 'transform 0.3s ease',
                transform: `rotateY(-15deg) ${isHovered ? 'scale(1.05)' : ''}`,
              }}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              ref={cardRef}
            >
              <motion.div
                className="rounded-2xl shadow-lg overflow-hidden h-full relative"
                style={{
                  transformStyle: 'preserve-3d',
                  transform: 'translateZ(20px)',
                  backgroundColor: '#FFFFFF',
                }}
                animate={{ scale: isHovered ? 1.05 : 1 }}
              >
                <div className="absolute inset-0 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 animate-flow"></div>
                </div>
                <div 
                  className="relative w-full flex flex-col justify-start items-center p-6 cursor-pointer overflow-y-auto px-6"
                  style={{
                    color: '#000000',
                    height: 'auto',
                    minHeight: '100%',
                    border: '2px solid #FFFFFF',
                    background: 'white',
                    backgroundClip: 'padding-box'
                  }}
                >
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
                    {profileData.PROFILE_DESCRIPTION}
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
                      <span>Telegram: @{profileData.TELEGRAM}</span>
                    </motion.a>
                  </motion.div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};