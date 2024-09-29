import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { Heart, ChevronRight, Loader2 } from 'lucide-react';
import { Icon } from '@iconify/react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getProfile } from '@/view-functions/getProfile';
import { Header } from "@/components/Header";
import FullScreenLoading from '@/components/FullScreenLoading';
import { Button } from "@/components/ui/button";
import { Toast } from "@/components/ui/toast";
import { useToast } from "@/components/ui/use-toast";
import { useTranslation } from 'react-i18next';

export const Soulmate: React.FC = () => {
  const { t } = useTranslation();
  const [profileData, setProfileData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

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

  // useEffect(() => {
  //   const fetchProfileData = async () => {
  //     setIsLoading(true);
  //     try {
  //       const profileData = await getProfile(id || '');
  //       if (profileData && profileData.token_properties) {
  //         const properties = profileData.token_properties;
  //         setProfileData({
  //           AGE: properties.AGE,
  //           GENDER: properties.GENDER,
  //           TELEGRAM: properties.TELEGRAM,
  //           PROFILE_NAME: properties.PROFILE_NAME,
  //           PROFILE_DESCRIPTION: properties["PROFILE DESCRIPTION"],
  //           token_uri: profileData.token_uri
  //         });
  //       } else {
  //         console.error('Profile data not found or invalid');
  //       }
  //     } catch (error) {
  //       console.error('Error fetching profile data:', error);
  //     } finally {
  //       setIsLoading(false);
  //     }
  //   };
  //   fetchProfileData();

  //   const timer = setTimeout(() => {
  //     toast({
  //       title: "Enhance Your Experience",
  //       description: (
  //         <div>
  //           <p>Complete your profile or unlock premium features for more matching opportunities!</p>
  //           <div className="mt-2">
  //             <button 
  //               onClick={() => navigate('/edit-profile')} 
  //               className="text-blue-500 hover:underline mr-4"
  //             >
  //               Edit Profile
  //             </button>
  //             <button 
  //               onClick={() => {
  //                 // Call API to upgrade to premium version here
  //                 console.log('Calling API to upgrade to premium version');
  //               }}
  //               className="text-purple-500 hover:underline"
  //             >
  //               Upgrade to Premium
  //             </button>
  //           </div>
  //         </div>
  //       ),
  //       duration: Infinity,
  //     });
  //   }, 3000);

  //   return () => clearTimeout(timer);
  // }, [id, navigate, toast]);

  const cardVariants = {
    hidden: { opacity: 0, rotateY: 720, scale: 0.5 },
    visible: {
      opacity: 1,
      rotateY: -30,
      scale: 1,
      y: [0, -20, 0],
      transition: {
        type: 'spring',
        duration: 2,
        bounce: 0.5,
        rotateY: { duration: 1.5 },
        y: { duration: 0.5, delay: 1.5 }
      }
    }
  };

  return (
    <div className="w-screen min-h-screen bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 p-4 overflow-hidden">
      <Header />
      <div className="w-full h-[80vh] overflow-y-auto flex justify-center items-center">
        {isLoading ? (
          <FullScreenLoading />
        ) : !profileData ? (
          <div className="text-white text-2xl">{t('no_suitable_soulmate_found')}</div>
        ) : (
          <motion.div
            className="relative max-w-2xl min-h-[50%] max-h-[100%] z-30"
            style={{ perspective: '1500px' }}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
          >
            <div 
              className="w-full h-full" 
              style={{ 
                transformStyle: 'preserve-3d', 
                transition: 'transform 0.3s ease',
                transform: `rotateY(-10deg) ${isHovered ? 'scale(1.02)' : ''}`,
              }}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              onMouseMove={(e) => {
                if (cardRef.current) {
                  const rect = cardRef.current.getBoundingClientRect();
                  const x = e.clientX - rect.left;
                  const y = e.clientY - rect.top;
                  const centerX = rect.width / 2;
                  const centerY = rect.height / 2;
                  const rotateX = (y - centerY) / 20;
                  const rotateY = (centerX - x) / 20;
                  cardRef.current.style.transform = `rotateY(-5deg) scale(1.02) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
                }
              }}
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
                  className="relative w-full h-full flex flex-col justify-start items-center p-6 cursor-pointer overflow-y-auto"
                  style={{
                    color: '#000000',
                    border: '2px solid #FFFFFF',
                    background: 'white',
                    backgroundClip: 'padding-box'
                  }}
                >
                  <motion.div 
                    className="w-32 h-32 rounded-full mb-4 flex-shrink-0"
                    whileHover={{ scale: 1.1 }}
                  >
                    {isLoading ? (
                      <div className="absolute inset-0 flex items-center justify-center text-purple-600">
                        <Loader2 className="h-8 w-8 animate-spin" />
                      </div>
                    ) : profileData.token_uri ? (
                      <img 
                        src={profileData.token_uri} 
                        alt="Avatar" 
                        className="w-full h-full object-cover rounded-full"
                      />
                    ) : (
                      <div className="w-full h-full rounded-full bg-purple-200 flex items-center justify-center">
                        <svg width="100%" height="100%" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                          <circle cx="50" cy="35" r="20" fill="#8B5CF6"/>
                          <path d="M50 60 C 20 60 10 90 10 100 L 90 100 C 90 90 80 60 50 60" fill="#8B5CF6"/>
                        </svg>
                      </div>
                    )}
                  </motion.div>
                  <motion.h2 
                    className="text-3xl font-bold mb-3 text-center w-full flex-shrink-0 text-gray-600"
                    whileHover={{ scale: 1.05 }}
                  >
                    {profileData.PROFILE_NAME && profileData.PROFILE_NAME.length > 25 
                      ? profileData.PROFILE_NAME.slice(0, 25) + '...'
                      : profileData.PROFILE_NAME || t('your_nickname')
                    }
                  </motion.h2>
                  <motion.p 
                    className="text-lg mb-4 text-center w-full flex-shrink-0 text-gray-600"
                    whileHover={{ scale: 1.05 }}
                  >
                    {profileData.PROFILE_DESCRIPTION || t('introduce_yourself')}
                  </motion.p>
                  <motion.div 
                    className="w-full space-y-4 px-4"
                    initial={{ x: 300 }}
                    animate={{ x: 0 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30, delay: 0.4 }}
                  >
                    {profileData.AGE && (
                      <motion.div 
                        className="flex items-center p-3 bg-purple-100 rounded-lg" 
                        whileHover={{ scale: 1.05 }}
                        initial={{ x: 300 }}
                        animate={{ x: 0 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                      >
                        <Icon icon="mdi:cake-variant" className="mr-3 text-xl text-purple-600" />
                        <span className="text-lg text-gray-600">{t('age')}: {profileData.AGE}</span>
                      </motion.div>
                    )}
                    {profileData.GENDER !== undefined && (
                      <motion.div 
                        className="flex items-center p-3 bg-purple-100 rounded-lg" 
                        whileHover={{ scale: 1.05 }}
                        initial={{ x: 300 }}
                        animate={{ x: 0 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                      >
                        <Icon icon="mdi:gender-male-female" className="mr-3 text-xl text-purple-600" />
                        <span className="text-lg text-gray-600">{t('gender')}: {profileData.GENDER === "false" ? t('female') : t('male')}</span>
                      </motion.div>
                    )}
                    {profileData.TELEGRAM && (
                      <motion.a
                        href={`https://t.me/${profileData.TELEGRAM}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center p-3 bg-purple-100 rounded-lg"
                        whileHover={{ scale: 1.05 }}
                        initial={{ x: 300 }}
                        animate={{ x: 0 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                      >
                        <Icon icon="mdi:telegram" className="mr-3 text-xl text-purple-600" />
                        <span className="text-lg text-gray-600">{t('telegram')}: @{profileData.TELEGRAM}</span>
                      </motion.a>
                    )}
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