import { useState, useEffect, useRef } from 'react'
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Upload, Loader2 } from 'lucide-react'
import { Icon } from '@iconify/react'
import { motion } from 'framer-motion'
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import axios from 'axios'
import { useToast } from "@/components/ui/use-toast"
import { useWallet } from "@aptos-labs/wallet-adapter-react"
import { mintProfile } from "@/entry-functions/mintProfile"
import FullScreenLoading from '@/components/FullScreenLoading'
import { useTranslation } from 'react-i18next'
import { getAddrAmount } from '@/view-functions/getAddrAmount'
import { getFaucet } from "@/entry-functions/faucet"
import { getExistProfileId } from "@/view-functions/getExistProfileId"
import { match } from "@/entry-functions/match"
import { getTransaction } from "@/view-functions/getTransaction"
import { MODULE_ADDRESS } from "@/constants"
import { useNavigate } from 'react-router-dom'

const formSchema = z.object({
  nickname: z.string().min(1, "Required"),
  age: z.number().min(0).max(100).int().positive("Age must be a positive integer"),
  gender: z.enum(["0", "1"]),
  seeking: z.enum(["0", "1", "2"]),
  telegram: z.string().min(5, "Telegram must contain at least 5 characters").max(32, "Telegram must contain at most 32 character(s)").regex(/^[0-9a-z_]+$/, "Only 0-9, a-z, and underscore are allowed").optional(),
  about: z.string().max(100, "Description must be 100 characters or less").optional(),
})

const cardVariants = {
  hidden: { opacity: 0, y: 50 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

export function AddProfile() {
  const { t, i18n } = useTranslation()
  const { connected, account } = useWallet();
  const [nickname, setNickname] = useState('')
  const [about, setAbout] = useState('')
  const [avatar, setAvatar] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isFullScreenLoading, setIsFullScreenLoading] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const { toast } = useToast()
  const { signAndSubmitTransaction } = useWallet()
  const navigate = useNavigate()
  const cardRef = useRef<HTMLDivElement>(null)

  const { register, handleSubmit, formState: { errors, touchedFields }, trigger, watch, setValue } = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nickname: '',
      age: undefined,
      gender: undefined,
      seeking: undefined,
      telegram: '',
      about: '',
    },
    mode: 'onChange'
  })

  const watchNickname = watch("nickname")
  const watchAge = watch("age")
  const watchGender = watch("gender")
  const watchAbout = watch("about")
  const watchSeeking = watch("seeking")
  const watchTelegram = watch("telegram")

  useEffect(() => {
    setNickname(watchNickname || '')
    setAbout(watchAbout || '')
  }, [watchNickname, watchAbout])

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      
      if (!file.type.startsWith('image/')) {
        toast({
          title: t("error"),
          description: t("please_upload_an_image_file"),
          variant: "destructive",
        });
        return;
      }
      
      if (file.size > 2 * 1024 * 1024) {
        toast({
          title: t("error"),
          description: t("image_size_should_not_exceed_2mb"),
          variant: "destructive",
        });
        return;
      }

      setIsFullScreenLoading(true);
      try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await axios.post('https://api.pinata.cloud/pinning/pinFileToIPFS', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${import.meta.env.VITE_PINATA_JWT}`,
          },
        });

        const url = `https://gateway.pinata.cloud/ipfs/${response.data.IpfsHash}`;
        setAvatar(url);
      } catch (error) {
        console.error('Error uploading file: ', error);
        toast({
          title: t("error"),
          description: t("failed_to_upload_image"),
          variant: "destructive",
        });
      } finally {
        setIsFullScreenLoading(false);
      }
    }
    // Reset the file input value to allow re-uploading the same file
    event.target.value = '';
  }

  const handleMint = async (data: z.infer<typeof formSchema>) => {
    if (!connected) {
      toast({
        title: t("wallet_not_connected"),
        description: t("please_connect_your_wallet_to_mint_a_profile"),
        variant: "destructive",
      });
      return;
    }

    setIsFullScreenLoading(true);

    try {
      const balance = await getAddrAmount(account?.address ?? "");
      const requiredGas = 0.1;

      // testnet operate
      if (balance < requiredGas) {
        await getFaucet(account?.address ?? "");
      }

      setIsFullScreenLoading(false);
      // Proceed with minting the profile
      const payload = mintProfile({
        name: data.nickname,
        age: data.age,
        gender: parseInt(data.gender),
        seeking: parseInt(data.seeking),
        description: data.about || "",
        tg: data.telegram || "",
        photo: avatar
      });

      const response = await signAndSubmitTransaction(payload);
      console.log(response);

      // match
      setIsFullScreenLoading(true);
      const profileId = await getExistProfileId({ accountAddress: connected ? account?.address?.toString() || '' : '' });
      if (profileId) {
        setIsFullScreenLoading(false)
        const payload = match({ profile: profileId });
        const response = await signAndSubmitTransaction(payload);
        console.log('Match transaction response:', response);
        const res = await getTransaction(response?.hash || "");
        if (res?.events && res?.events.length) {
          const ev = res.events.find((i:any) => i.type === `${MODULE_ADDRESS}::date::MatchedEvent`);
          // match
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
    } catch (error) {
      console.error('Error minting profile: ', error);
      toast({
        title: t("error"),
        description: t("failed_to_mint_profile_please_try_again"),
        variant: "destructive",
      });
    } finally {
      setIsFullScreenLoading(false);
    }
  }

  return (
    <div className="w-screen min-h-screen bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 overflow-hidden">
      <div className="container mx-auto min-h-screen z-10 sm:mt-12 mt-2">
        <div className="grid grid-cols-1 md:grid-cols-12 sm:gap-8">
          {isFullScreenLoading && <FullScreenLoading />}
          <div className="w-full md:col-span-4 h-[80vh] overflow-y-auto flex justify-center items-center">
            <motion.div
              className="relative w-full max-w-[86%] min-h-[50%] max-h-[100%] z-30"
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
                  transform: `rotateY(-15deg) ${isHovered ? 'scale(1.05)' : ''}`,
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
                    className="relative w-full h-full flex flex-col justify-start items-center p-6 cursor-pointer overflow-y-auto px-6"
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
                      ) : avatar ? (
                        <img 
                          src={avatar} 
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
                      className="text-3xl font-bold mb-2 text-center w-full flex-shrink-0 text-gray-600"
                      whileHover={{ scale: 1.05 }}
                    >
                      {watchNickname && watchNickname.length > 20 
                        ? watchNickname.slice(0, 20) + '...'
                        : watchNickname || t('your_nickname')
                      }
                    </motion.h2>
                    <motion.p 
                      className="text-lg mb-4 text-center w-full flex-shrink-0 text-gray-600"
                      whileHover={{ scale: 1.05 }}
                    >
                      {watchAbout || t('introduce_about_yourself')}
                    </motion.p>
                    <motion.div 
                      className="w-full space-y-4 px-4"
                      initial={{ x: 300 }}
                      animate={{ x: 0 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 30, delay: 0.4 }}
                    >
                      {watchAge ? (
                        <motion.div 
                          className="flex items-center p-3 bg-purple-100 rounded" 
                          whileHover={{ scale: 1.05 }}
                          initial={{ x: 300 }}
                          animate={{ x: 0 }}
                          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        >
                          <Icon icon="mdi:cake-variant" className="mr-2 text-xl text-purple-600" />
                          <span className="text-lg text-gray-600">{t('age')}: {watchAge}</span>
                        </motion.div>
                      ): ""}
                      {watchGender !== undefined ? (
                        <motion.div 
                          className="flex items-center p-3 bg-purple-100 rounded" 
                          whileHover={{ scale: 1.05 }}
                          initial={{ x: 300 }}
                          animate={{ x: 0 }}
                          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        >
                          <Icon icon="mdi:gender-male-female" className="mr-2 text-xl text-purple-600" />
                          <span className="text-lg text-gray-600">{t('gender')}: {watchGender === '0' ? t("female") : t("male")}</span>
                        </motion.div>
                      ) : ""}
                      {watchTelegram && (
                        <motion.a
                          href={`https://t.me/${watchTelegram}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center p-3 bg-purple-100 rounded"
                          whileHover={{ scale: 1.05 }}
                          initial={{ x: 300 }}
                          animate={{ x: 0 }}
                          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        >
                          <Icon icon="mdi:telegram" className="mr-2 text-xl text-purple-600" />
                          <span className="text-lg text-gray-600">{t('telegram')}: @{watchTelegram}</span>
                        </motion.a>
                      )}
                    </motion.div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
          <div className="w-full md:col-span-8 bg-white h-[80vh] overflow-y-auto rounded-3xl shadow-xl sm:mt-8 mt-4">
            <div className="p-8 flex justify-between items-center bg-white transition-shadow duration-300 sticky top-0 z-10" id="stickyHeader">
              <h2 className="text-2xl font-bold text-purple-600">{t('edit_your_card')}</h2>
              <button 
               onClick={(e) => {
                e.preventDefault();
                handleSubmit((data) => handleMint(data as unknown as z.infer<typeof formSchema>))(e);
               }} 
               className="px-4 py-2 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 animate-gradient-x text-white rounded-md hover:scale-105 transition-all duration-300">
                {t('mint_to_meet')}
              </button>
            </div>
            <form onSubmit={handleSubmit((data) => handleMint(data as unknown as z.infer<typeof formSchema>))} className="space-y-6 px-8 pt-2 pb-10">
              <div className='flex flex-col gap-2'>
                <Label htmlFor="nickname" className='flex items-center text-purple-600'>
                  <Icon icon="mdi:account" className="w-4 h-4 mr-2" />
                  {t('nickname')}
                </Label>
                <Input id="nickname" {...register("nickname")} className="text-purple-600" />
                {errors.nickname && <span className="text-red-500">{t(errors.nickname.message as string)}</span>}
              </div>
              <div className='flex flex-col gap-2'>
                <Label htmlFor="age" className='flex items-center text-purple-600'>
                  <Icon icon="mdi:order-numeric-ascending" className="w-4 h-4 mr-2" />
                  {t('age')}
                </Label>
                <Input id="age" type="number" {...register("age", { valueAsNumber: true })} className="text-purple-600" />
                {errors.age && <span className="text-red-500">{t(errors.age.message as string)}</span>}
              </div>
              <div className='flex flex-col gap-2'>
                <Label htmlFor="avatar" className='flex items-center text-purple-600'>
                  <Icon icon="mdi:image" className="w-4 h-4 mr-2" />
                  {t('upload_avatar')}
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="avatar"
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                  />
                  <Label
                    htmlFor="avatar"
                    className="cursor-pointer flex items-center justify-center px-4 py-2 bg-purple-100 text-purple-600 rounded-md hover:bg-purple-200 transition-colors duration-300"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {t('upload')}
                  </Label>
                  {avatar && <span className="text-sm text-gray-500">{t('uploaded')}</span>}
                </div>
              </div>
              <div className='flex flex-col gap-2'>
                <Label htmlFor="gender" className='flex items-center text-purple-600'>
                  <Icon icon="mdi:gender-male-female" className="w-4 h-4 mr-2" />
                  {t('gender')}
                </Label>
                <Select onValueChange={(value: any) => {
                  console.log("test", value)
                  setValue("gender", value, { shouldValidate: true });
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('select')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">{t('male')}</SelectItem>
                    <SelectItem value="0">{t('female')}</SelectItem>
                  </SelectContent>
                </Select>
                {errors.gender && <span className="text-red-500">{t('required')}</span>}
              </div>
              <div className='flex flex-col gap-2'>
                <Label htmlFor="seeking" className='flex items-center text-purple-600'>
                  <Icon icon="la:user-friends" className="w-4 h-4 mr-2" />
                  {t('what_kind_of_friends_do_you_want_to_find')}
                </Label>
                <Select onValueChange={(value:any) => {
                  setValue("seeking", value, { shouldValidate: true });
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('select')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">{t('female')}</SelectItem>
                    <SelectItem value="1">{t('male')}</SelectItem>
                    <SelectItem value="2">{t('both')}</SelectItem>
                  </SelectContent>
                </Select>
                {errors.seeking && <span className="text-red-500">{t('required')}</span>}
              </div>
              <div className='flex flex-col gap-2'>
                <Label htmlFor="telegram" className='flex items-center text-purple-600'>
                  <Icon icon="mdi:telegram" className="w-4 h-4 mr-2" />
                  {t('telegram')}
                </Label>
                <Input id="telegram" {...register("telegram")} className="text-purple-600" />
                {errors.telegram && <span className="text-red-500">{t(errors.telegram.message as string)}</span>}
              </div>
              <div className='flex flex-col gap-2'>
                <Label htmlFor="about" className='flex items-center text-purple-600'>
                  <Icon icon="mdi:card-bulleted-outline" className="w-4 h-4 mr-2" />
                  {t('introduce_yourself')}
                </Label>
                <Textarea 
                  id="about" 
                  {...register("about")}
                  className="text-purple-600" 
                  maxLength={100}
                />
                <span className="text-sm text-gray-500">{watchAbout?.length || 0}/100</span>
                {errors.about && <span className="text-red-500">{t(errors.about.message as string)}</span>}
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddProfile;