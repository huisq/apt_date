import {
  APTOS_CONNECT_ACCOUNT_URL,
  AboutAptosConnect,
  AboutAptosConnectEducationScreen,
  AnyAptosWallet,
  AptosPrivacyPolicy,
  WalletItem,
  groupAndSortWallets,
  isAptosConnectWallet,
  isInstallRequired,
  truncateAddress,
  useWallet,
} from "@aptos-labs/wallet-adapter-react";
import { ArrowLeft, ArrowRight, ChevronDown, Copy, LogOut, User } from "lucide-react";
import { useCallback, useState, useEffect, createContext, useContext } from "react";
// Internal components
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/components/ui/use-toast";
import { useTranslation } from 'react-i18next';
import WebApp from '@twa-dev/sdk';

interface WalletSelectorContextType {
  isDialogOpen: boolean;
  setIsDialogOpen: (isOpen: boolean) => void;
}

const WalletSelectorContext = createContext<WalletSelectorContextType | undefined>(undefined);

const isTelegramMiniApp = !!WebApp.initData;

export const WalletSelectorProvider: React.FC<React.PropsWithChildren<{}>> = ({ children }) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <WalletSelectorContext.Provider value={{ isDialogOpen, setIsDialogOpen }}>
      {children}
    </WalletSelectorContext.Provider>
  );
};

export const useWalletSelector = () => {
  const context = useContext(WalletSelectorContext);
  if (context === undefined) {
    console.error('WalletSelectorContext is undefined. Make sure you are using WalletSelectorProvider.');
    throw new Error('useWalletSelector must be used within a WalletSelectorProvider');
  }
  return context;
};

export function WalletSelector() {
  const { t, i18n } = useTranslation();
  const { account, connected, disconnect, wallet } = useWallet();
  const { toast } = useToast();
  const { isDialogOpen, setIsDialogOpen } = useWalletSelector();
  const [languageChanged, setLanguageChanged] = useState(false);

  const closeDialog = useCallback(() => setIsDialogOpen(false), [setIsDialogOpen]);

  const copyAddress = useCallback(async () => {
    if (!account?.address) return;
    try {
      await navigator.clipboard.writeText(account.address);
      toast({
        title: t('success'),
        description: t('copied_wallet_address'),
      });
    } catch {
      toast({
        variant: "destructive",
        title: t('error'),
        description: t('failed_to_copy_wallet_address'),
      });
    }
  }, [account?.address, toast, t]);

  useEffect(() => {
    if (languageChanged) {
      setLanguageChanged(false);
    }
  }, [languageChanged]);

  const handleLanguageChange = (lng: string) => {
    i18n.changeLanguage(lng);
    setLanguageChanged(true);
  };

  return connected ? (
    <DropdownMenu>
      <DropdownMenuTrigger asChild className="focus:outline-none">
        <Button className="bg-white/10 p-2 rounded-xl cursor-pointer hover:opacity-90 hover:bg-gradient-to-r hover:from-pink-500 hover:via-purple-500 hover:to-indigo-500">{account?.ansName || truncateAddress(account?.address) || t('unknown')}</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onSelect={copyAddress} className="gap-2">
          <Copy className="h-4 w-4" /> {t('copy_address')}
        </DropdownMenuItem>
        {wallet && isAptosConnectWallet(wallet) && (
          <DropdownMenuItem asChild>
            <a href={APTOS_CONNECT_ACCOUNT_URL} target="_blank" rel="noopener noreferrer" className="flex gap-2">
              <User className="h-4 w-4" /> {t('account')}
            </a>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onSelect={disconnect} className="gap-2">
          <LogOut className="h-4 w-4" /> {t('disconnect')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  ) : (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild className="focus:outline-none">
        <Button className="bg-white/10 p-2 rounded-xl cursor-pointer hover:bg-gradient-to-r hover:from-pink-500 hover:via-purple-500 hover:to-indigo-500">{t('connect_wallet')}</Button>
      </DialogTrigger>
      <ConnectWalletDialog close={closeDialog} />
    </Dialog>
  );
}

interface ConnectWalletDialogProps {
  close: () => void;
}

function ConnectWalletDialog({ close }: ConnectWalletDialogProps) {
  const { wallets = [] } = useWallet();
  const { aptosConnectWallets, availableWallets, installableWallets } = groupAndSortWallets(wallets);
  const { t } = useTranslation();

  const hasAptosConnectWallets = !!aptosConnectWallets.length;

  return (
    <DialogContent className="max-h-screen overflow-auto">
      <AboutAptosConnect renderEducationScreen={renderEducationScreen(t)}>
        <DialogHeader>
          <DialogTitle className="flex flex-col text-center leading-snug">
            {hasAptosConnectWallets ? (
              isTelegramMiniApp ? (
                <span>{t('log_in_or_sign_up')}</span>
              ) : (
                <>
                  <span>{t('log_in_or_sign_up')}</span>
                  <span>{t('with_social_aptos_connect')}</span>
                </>
              )
            ) : (
              t('connect_wallet')
            )}
          </DialogTitle>
        </DialogHeader>
        <DialogDescription></DialogDescription>

        {hasAptosConnectWallets && !isTelegramMiniApp && (
          <div className="flex flex-col gap-2 pt-3">
            {aptosConnectWallets.map((wallet) => (
              <AptosConnectWalletRow key={wallet.name} wallet={wallet} onConnect={close} />
            ))}
            {/* <p className="flex gap-1 justify-center items-center text-muted-foreground text-sm">
              {t('learn_more_about')}{" "}
              <AboutAptosConnect.Trigger className="flex gap-1 py-3 items-center text-foreground">
                {t('aptos_connect')} <ArrowRight size={16} />
              </AboutAptosConnect.Trigger>
            </p>
            <AptosPrivacyPolicy className="flex flex-col items-center py-1">
              <p className="text-xs leading-5">
                <AptosPrivacyPolicy.Disclaimer />{" "}
                <AptosPrivacyPolicy.Link className="text-muted-foreground underline underline-offset-4" />
                <span className="text-muted-foreground">.</span>
              </p>
              <AptosPrivacyPolicy.PoweredBy className="flex gap-1.5 items-center text-xs leading-5 text-muted-foreground" />
            </AptosPrivacyPolicy> */}
            <div className="flex items-center gap-3 pt-4 text-muted-foreground">
              <div className="h-px w-full bg-secondary" />
              {t('or')}
              <div className="h-px w-full bg-secondary" />
            </div>
          </div>
        )}

        <div className="flex flex-col gap-3 pt-3">
          {availableWallets.map((wallet) => (
            <WalletRow key={wallet.name} wallet={wallet} onConnect={close} />
          ))}
          {!!installableWallets.length && !isTelegramMiniApp && (
            <Collapsible className="flex flex-col gap-3">
              <CollapsibleTrigger asChild>
                <Button size="sm" variant="ghost" className="gap-2">
                  {t('more_wallets')} <ChevronDown />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="flex flex-col gap-3">
                {installableWallets.map((wallet) => (
                  <WalletRow key={wallet.name} wallet={wallet} onConnect={close} />
                ))}
              </CollapsibleContent>
            </Collapsible>
          )}
        </div>
      </AboutAptosConnect>
    </DialogContent>
  );
}

interface WalletRowProps {
  wallet: AnyAptosWallet;
  onConnect?: () => void;
}

function WalletRow({ wallet, onConnect }: WalletRowProps) {
  const { t } = useTranslation();
  return (
    <WalletItem
      wallet={wallet}
      onConnect={onConnect}
      className="flex items-center justify-between px-4 py-3 gap-4 border rounded-md"
    >
      <div className="flex items-center gap-4">
        <WalletItem.Icon className="h-6 w-6" />
        <WalletItem.Name className="text-base font-normal" />
      </div>
      {isInstallRequired(wallet) ? (
        <Button size="sm" variant="ghost" asChild>
          <WalletItem.InstallLink>
            <a>{t('install')}</a>
          </WalletItem.InstallLink>
        </Button>
      ) : (
        <WalletItem.ConnectButton asChild>
          <Button size="sm">{t('connect')}</Button>
        </WalletItem.ConnectButton>
      )}
    </WalletItem>
  );
}

function AptosConnectWalletRow({ wallet, onConnect }: WalletRowProps) {
  return (
    <WalletItem wallet={wallet} onConnect={onConnect}>
      <WalletItem.ConnectButton asChild>
        <Button size="lg" variant="outline" className="w-full gap-4">
          <WalletItem.Icon className="h-5 w-5" />
          <WalletItem.Name className="text-base font-normal" />
        </Button>
      </WalletItem.ConnectButton>
    </WalletItem>
  );
}

function renderEducationScreen(t: any) {
  return (screen: AboutAptosConnectEducationScreen) => (
    <>
      <DialogHeader className="grid grid-cols-[1fr_4fr_1fr] items-center space-y-0">
        <Button variant="ghost" size="icon" onClick={screen.cancel}>
          <ArrowLeft />
        </Button>
        <DialogTitle className="leading-snug text-base text-center">{t('about_aptos_connect')}</DialogTitle>
      </DialogHeader>
      <DialogDescription></DialogDescription>

      <div className="flex h-[162px] pb-3 items-end justify-center">
        <screen.Graphic />
      </div>
      <div className="flex flex-col gap-2 text-center pb-4">
        <screen.Title className="text-xl" />
        <screen.Description className="text-sm text-muted-foreground [&>a]:underline [&>a]:underline-offset-4 [&>a]:text-foreground" />
      </div>

      <div className="grid grid-cols-3 items-center">
        <Button size="sm" variant="ghost" onClick={screen.back} className="justify-self-start">
          {t('back')}
        </Button>
        <div className="flex items-center gap-2 place-self-center">
          {screen.screenIndicators.map((ScreenIndicator, i) => (
            <ScreenIndicator key={i} className="py-4">
              <div className="h-0.5 w-6 transition-colors bg-muted [[data-active]>&]:bg-foreground" />
            </ScreenIndicator>
          ))}
        </div>
        <Button size="sm" variant="ghost" onClick={screen.next} className="gap-2 justify-self-end">
          {screen.screenIndex === screen.totalScreens - 1 ? t('finish') : t('next')}
          <ArrowRight size={16} />
        </Button>
      </div>
    </>
  );
}
