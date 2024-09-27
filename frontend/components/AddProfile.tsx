import { useState, useEffect } from 'react'
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
  nickname: z.string().min(1, "Nickname is required"),
  age: z.number().min(0).max(100).int().positive("Age must be a positive integer"),
  gender: z.boolean(),
  seeking: z.enum(["0", "1", "2"]),
  telegram: z.string().min(5, "Telegram must contain at least 5 characters").max(32, "Telegram must contain at most 32 character(s)").regex(/^[0-9a-z_]+$/, "Only 0-9, a-z, and underscore are allowed").optional(),
  about: z.string().max(100, "Description must be 100 characters or less").optional(),
})

export function AddProfile() {
  const { t } = useTranslation()
  const { connected, account } = useWallet();
  const [nickname, setNickname] = useState('')
  const [about, setAbout] = useState('')
  const [avatar, setAvatar] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isFullScreenLoading, setIsFullScreenLoading] = useState(false)
  const { toast } = useToast()
  const { signAndSubmitTransaction } = useWallet()
  const navigate = useNavigate()

  const { register, handleSubmit, formState: { errors, touchedFields }, trigger, watch, setValue } = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nickname: '',
      age: 18,
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
          title: t("Error"),
          description: t("Please upload an image file."),
          variant: "destructive",
        });
        return;
      }
      
      if (file.size > 2 * 1024 * 1024) {
        toast({
          title: t("Error"),
          description: t("Image size should not exceed 2MB."),
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
          title: t("Error"),
          description: t("Failed to upload image."),
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
        title: t("Wallet not connected"),
        description: t("Please connect your wallet to mint a profile."),
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
        gender: data.gender,
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
              title: "Error",
              description: "Failed to match. Please try again.",
              variant: "destructive",
            });
          }
        }
      } else {
        console.error('Failed to get profile ID');
        toast({
          title: "Error",
          description: "Failed to get profile ID. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error minting profile: ', error);
      toast({
        title: t("Error"),
        description: t("Failed to mint profile. Please try again."),
        variant: "destructive",
      });
    } finally {
      setIsFullScreenLoading(false);
    }
  }

  return (
    <div className="w-screen min-h-screen bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 p-4 overflow-hidden">
      <div className="container grid grid-cols-12 gap-8 mx-auto min-h-screen z-10 mt-12">
        {isFullScreenLoading && <FullScreenLoading />}
        <div className="w-full col-span-4 h-[80vh] overflow-y-auto flex justify-center rounded-3xl shadow-xl">
          <motion.div 
            className={`bg-white shadow-lg p-6 h-[80vh] overflow-y-auto w-full`} 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <motion.div 
              className="w-24 h-24 rounded-full mx-auto mb-4 relative"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              {isLoading ? (
                <div className="absolute inset-0 flex items-center justify-center text-gray-500">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : avatar ? (
                <motion.img 
                  src={avatar} 
                  alt="Avatar" 
                  className="w-full h-full object-cover rounded-full"
                  whileHover={{
                    scale: 1.1,
                  }}
                />
              ) : (
                <motion.div 
                  className="w-full h-full rounded-full bg-gray-200 flex items-center justify-center"
                  whileHover={{
                    scale: 1.1,
                  }}
                >
                  <svg width="100%" height="100%" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="50" cy="35" r="20" fill="#A0AEC0"/>
                    <path d="M50 60 C 20 60 10 90 10 100 L 90 100 C 90 90 80 60 50 60" fill="#A0AEC0"/>
                  </svg>
                </motion.div>
              )}
            </motion.div>
            <motion.h3 
              className="text-xl font-semibold text-center mb-2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <motion.span
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.6 }}
              >
                {watchNickname || t('Your Nickname')}
              </motion.span>
            </motion.h3>
            <motion.p 
              className="text-center mb-2 text-gray-600"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
            >
              <motion.span
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.8 }}
              >
                {watchGender !== undefined && (
                  <>
                    {watchGender ? (
                      <Icon icon="mdi:gender-male" className="inline-block mr-1" />
                    ) : (
                      <Icon icon="mdi:gender-female" className="inline-block mr-1" />
                    )}
                  </>
                )} 
                {watchGender !== undefined && ' • '}
                {watchAge || t('Age')}
              </motion.span>
            </motion.p>
            <motion.p 
              className="text-center mb-4 text-sm text-gray-500 whitespace-pre-wrap break-words"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.8 }}
            >
              <motion.span
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 1 }}
              >
                {watchAbout || t('Tell us about yourself...')}
              </motion.span>
            </motion.p>
            {watchTelegram && (
              <motion.div 
                className="text-center"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 1.2 }}
              >
                <a 
                  href={`https://t.me/${watchTelegram}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-3 py-2 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors duration-300"
                >
                  <Icon icon="mdi:telegram" className="w-5 h-5 mr-2 text-blue-500" />
                  <span className="text-gray-700">@{watchTelegram.length > 8 ? `${watchTelegram.slice(0, 8)}...` : watchTelegram}</span>
                </a>
              </motion.div>
            )}
          </motion.div>
        </div>
        <div className="w-full col-span-8 bg-white h-[80vh] overflow-y-auto rounded-3xl shadow-xl">
          <div className="p-8 flex justify-between items-center bg-white transition-shadow duration-300 sticky top-0 z-10" id="stickyHeader">
            <h2 className="text-2xl font-bold text-purple-600">{t('Edit Your Card')}</h2>
            <button 
             onClick={(e) => {
              e.preventDefault();
              handleSubmit((data) => handleMint(data as unknown as z.infer<typeof formSchema>))(e);
             }} 
             className="px-4 py-2 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 animate-gradient-x text-white rounded-md hover:scale-105 transition-all duration-300">
              {t('Mint to Meet')}
            </button>
          </div>
          <form onSubmit={handleSubmit((data) => handleMint(data as unknown as z.infer<typeof formSchema>))} className="space-y-6 px-8 pt-2 pb-10">
            <div className='flex flex-col gap-2'>
              <Label htmlFor="nickname" className='flex items-center text-purple-600'>
                <Icon icon="mdi:account" className="w-4 h-4 mr-2" />
                {t('Nickname')}
              </Label>
              <Input id="nickname" {...register("nickname")} className="text-purple-600" />
              {errors.nickname && <span className="text-red-500">{t(errors.nickname.message as string)}</span>}
            </div>
            <div className='flex flex-col gap-2'>
              <Label htmlFor="age" className='flex items-center text-purple-600'>
                <Icon icon="mdi:order-numeric-ascending" className="w-4 h-4 mr-2" />
                {t('Age')}
              </Label>
              <Input id="age" type="number" {...register("age", { valueAsNumber: true })} className="text-purple-600" />
              {errors.age && <span className="text-red-500">{t(errors.age.message as string)}</span>}
            </div>
            <div className='flex flex-col gap-2'>
              <Label htmlFor="gender" className='flex items-center text-purple-600'>
                <Icon icon="mdi:gender-male-female" className="w-4 h-4 mr-2" />
                {t('Gender')}
              </Label>
              <Select onValueChange={(value: string) => {
                setValue("gender", value === "true", { shouldValidate: true });
              }}>
                <SelectTrigger>
                  <SelectValue placeholder={t('Select')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">{t('Male')}</SelectItem>
                  <SelectItem value="false">{t('Female')}</SelectItem>
                </SelectContent>
              </Select>
              {errors.gender && <span className="text-red-500">{t('Gender is required')}</span>}
            </div>
            <div className='flex flex-col gap-2'>
              <Label htmlFor="seeking" className='flex items-center text-purple-600'>
                <Icon icon="la:user-friends" className="w-4 h-4 mr-2" />
                {t('What kind of friends do you want to find?')}
              </Label>
              <Select onValueChange={(value:any) => {
                setValue("seeking", value, { shouldValidate: true });
              }}>
                <SelectTrigger>
                  <SelectValue placeholder={t('Select')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">{t('Female')}</SelectItem>
                  <SelectItem value="1">{t('Male')}</SelectItem>
                  <SelectItem value="2">{t('Both')}</SelectItem>
                </SelectContent>
              </Select>
              {errors.seeking && <span className="text-red-500">{t('The value is required')}</span>}
            </div>
            <div className='flex flex-col gap-2'>
              <Label htmlFor="telegram" className='flex items-center text-purple-600'>
                <Icon icon="mdi:telegram" className="w-4 h-4 mr-2" />
                {t('Telegram')}
              </Label>
              <Input id="telegram" {...register("telegram")} className="text-purple-600" />
              {errors.telegram && <span className="text-red-500">{t(errors.telegram.message as string)}</span>}
            </div>
            <div className='flex flex-col gap-2'>
              <Label htmlFor="about" className='flex items-center text-purple-600'>
                <Icon icon="mdi:card-bulleted-outline" className="w-4 h-4 mr-2" />
                {t('Introduce Yourself')}
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
            <div className='flex flex-col gap-2'>
              <Label htmlFor="avatar" className='flex items-center text-purple-600'>
                <Icon icon="mdi:image" className="w-4 h-4 mr-2" />
                {t('Upload Avatar')}
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
                  {t('Upload')}
                </Label>
                {avatar && <span className="text-sm text-gray-500">{t('Uploaded!')}</span>}
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddProfile;