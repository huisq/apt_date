import { WalletSelector } from "./WalletSelector";
import { useState } from 'react'
import { motion } from 'framer-motion'
import '@fontsource/pacifico';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Icon } from '@iconify/react';
import { useTranslation } from 'react-i18next';
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { Link } from 'react-router-dom';

export function Header() {
  const { i18n } = useTranslation();
  const [loadedText] = useState('Apt Date')
  const { network } = useWallet();
  
  const changeLanguage = (lng:string) => {
    i18n.changeLanguage(lng);
  };

  return (
    <div className="flex items-center justify-between px-4 py-2 max-w-screen-2xl mx-auto w-full flex-wrap">
      <div className='flex flex-col gap-2 md:gap-3'>
        <Link to="/">
          <motion.h1 
            className="text-3xl font-bold text-white drop-shadow-lg transition-all duration-300 cursor-pointer"
            style={{ fontFamily: 'Pacifico, cursive' }}
          >
            {loadedText.split('').map((char, index) => (
              <motion.span
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ 
                  duration: 0.5,
                  delay: index * 0.1,
                  type: "spring",
                  stiffness: 100
                }}
                style={{
                  display: "inline-block",
                  willChange: "transform"
                }}
              >
                {char === ' ' ? '\u00A0' : char}
              </motion.span>
            ))}
          </motion.h1>
        </Link>
      </div>

      <div className="flex gap-2 items-center flex-wrap">
        <DropdownMenu>
          <DropdownMenuTrigger asChild className="focus:outline-none">
            <button className="bg-white/10 p-2 rounded-xl cursor-pointer  hover:opacity-90">
              <Icon icon="ion:globe-outline" className="text-white h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => changeLanguage('en')}>
              English
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => changeLanguage('zh')}>
              简体中文
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        {
          network && (
            <div className="bg-white/10 py-1.5 px-3 rounded-xl cursor-pointer text-white hidden md:block">
              Aptos {network.name}
            </div>
          )
        }
        <WalletSelector />
      </div>
    </div>
  );
}
