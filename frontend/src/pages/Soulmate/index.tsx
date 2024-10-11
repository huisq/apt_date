import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { Heart, ChevronRight, Loader2, HelpCircle } from 'lucide-react';
import { Icon } from '@iconify/react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getProfile } from '@/view-functions/getProfile';
import { Header } from "@/components/Header";
import FullScreenLoading from '@/components/FullScreenLoading';
import { Button } from "@/components/ui/button";
import { Toast } from "@/components/ui/toast";
import { useToast } from "@/components/ui/use-toast";
import { useTranslation } from 'react-i18next';
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { checkProfileExists } from '@/view-functions/checkProfileExists';
import { match } from "@/entry-functions/match"
import { getTransaction } from "@/view-functions/getTransaction";
import { MODULE_ADDRESS } from "@/constants";
import { getExistProfileId } from "@/view-functions/getExistProfileId"

export const Soulmate: React.FC = () => {
  const { t } = useTranslation();
  const [profileData, setProfileData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFullScreenLoading, setIsFullScreenLoading] = useState(false);
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { account, connected, signAndSubmitTransaction } = useWallet();
  const [showTips, setShowTips] = useState(false);
  const [toastInstance, setToastInstance] = useState<ReturnType<typeof toast> | null>(null)

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
  }, [id, navigate, toast]);

  const handleFindSoulmate = async () => {
    console.log('dsada', connected);
    if (!connected) {
      toast({
        title: t("error"),
        description: t("wallet_not_connected"),
        variant: "destructive",
      });
    } else {
      try {
        setIsFullScreenLoading(true);
        const exists = await checkProfileExists({ accountAddress: connected ? account?.address?.toString() || '' : '' });
        if (exists === true) {
          const profileId = await getExistProfileId({ accountAddress: connected ? account?.address?.toString() || '' : '' });
          if (profileId) {
            const payload = match({ profile: profileId });
            const response = await signAndSubmitTransaction(payload);
            console.log('Match transaction response:', response);
            const res = await getTransaction(response?.hash || "");
            if (res?.events && res?.events.length) {
              const ev = res.events.find((i:any) => i.type === `${MODULE_ADDRESS}::date::MatchedEvent`);
              if (ev.data.match_found) {
                navigate(`/soulmate/${ev.data.profileB}`);
              } else {
                toast({
                  title: t("error"),
                  description: t("failed_to_match_please_try_again"),
                  variant: "destructive",
                });
              }
            }
          } else {
            console.error('Failed to get profile ID');
            toast({
              title: t("error"),
              description: t("failed_to_get_profile_id_please_try_again"),
              variant: "destructive",
            });
          }
        } else {
          toast({
            title: t("error"),
            description: t("create_profile_before_finding_soulmate"),
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error('Error during find soulmate process:', error);
        toast({
          title: t("error"),
          description: t("an_error_occurred_please_try_again"),
          variant: "destructive",
        });
      } finally {
        setIsFullScreenLoading(false);
      }
    }
  };

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

  const toggleTips = () => {
    setShowTips(!showTips);
    if (!showTips) {
      const newToast = toast({
        title: "Tips",
        description: (
          <div className="text-2xs">
            <p>
              Haven't found the right person? <span 
                className="text-pink-500 cursor-pointer hover:underline"
                onClick={handleFindSoulmate}
              >
                <u className="cursor-pointer">Find</u>
              </span> the next person quickly🔥, or get your card <span 
                className="text-indigo-500 cursor-pointer hover:underline"
                onClick={() => {
                  // Get and copy link logic here
                  console.log('Getting and copying link');
                }}
              >
                <u className="cursor-pointer">Link</u>
              </span> and share it on your favorite social media to find that special someone!
            </p>
          </div>
        ),
        duration: Infinity,
      });
      setToastInstance(newToast)
    } else if (toastInstance) {
      toastInstance.dismiss()
      setToastInstance(null)
    }
  };

  return (
    <div className="w-screen min-h-screen bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 overflow-hidden">
      <Header />
      {isFullScreenLoading && <FullScreenLoading />}
      <div className="w-full flex justify-center items-center pt-12">
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
                transform: `rotateY(-6deg) ${isHovered ? 'scale(1.02)' : ''}`,
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
                  className="relative w-full h-full flex flex-col justify-start items-center p-6 px-8 cursor-pointer overflow-y-auto"
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
                    className="max-w-96 text-lg mb-4 text-center w-full flex-shrink-0 text-gray-600"
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
                        className="flex items-center p-3 px-6 bg-purple-100 rounded-lg" 
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
                        className="flex items-center p-3 px-6 bg-purple-100 rounded-lg" 
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
                        className="flex items-center p-3 px-6 bg-purple-100 rounded-lg"
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
      <Button
        variant="ghost"
        size="icon"
        className="fixed bottom-4 right-2 bg-transparent hover:bg-transparent hidden"
        onClick={toggleTips}
      >
        <HelpCircle className="h-6 w-6 text-white" />
      </Button>
    </div>
  );
};