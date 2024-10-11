import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { cn } from "@/lib/utils";
import { Header } from "@/components/Header";
import { HomeInfo } from "@/components/HomeInfo";
import { AddProfile } from "@/components/AddProfile";
import { Soulmate } from "@/pages/Soulmate"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { useState, Suspense } from 'react'
import '@fontsource/pacifico';
import '@fontsource/roboto';
import { BrowserRouter as Router, Route, Routes, useNavigate } from 'react-router-dom';
import { WalletSelectorProvider, useWalletSelector } from '@/components/WalletSelector';
import { checkProfileExists } from "./view-functions/checkProfileExists";
import FullScreenLoading from '@/components/FullScreenLoading'
import { match } from "@/entry-functions/match"
import { getExistProfileId } from "@/view-functions/getExistProfileId"
import { getTransaction } from "@/view-functions/getTransaction";
import { useToast } from "@/components/ui/use-toast"
import { MODULE_ADDRESS } from "@/constants";
import { useTranslation } from 'react-i18next';

function AppContent() {
  const { t } = useTranslation();
  const { connected, account, signAndSubmitTransaction } = useWallet();
  const { setIsDialogOpen } = useWalletSelector();
  const [isFullScreenLoading, setIsFullScreenLoading] = useState(false);
  const [isAddProfile, setIsAddProfile] = useState(false)
  const [showProfileAlert, setShowProfileAlert] = useState(false);
  const { toast } = useToast()
  const navigate = useNavigate();

  const handleFindSoulmate = async () => {
    if (!connected) {
      setIsDialogOpen(true);
    } else {
      try {
        setIsFullScreenLoading(true)
        const exists = await checkProfileExists({ accountAddress: connected ? account?.address?.toString() || '' : '' });
        if (exists === true) {
          const profileId = await getExistProfileId({ accountAddress: connected ? account?.address?.toString() || '' : '' });
          if (profileId) {
            setIsFullScreenLoading(false)
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
          setShowProfileAlert(true);
        }
      } catch (error) {
        console.error('Error during find soulmate process:', error);
        toast({
          title: t("error"),
          description: t("an_error_occurred_please_try_again"),
          variant: "destructive",
        });
      } finally {
        setIsFullScreenLoading(false)
      }
    }
  };

  return (
    <div className="w-screen min-h-screen bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 overflow-hidden">
      {isFullScreenLoading && <FullScreenLoading />}
      <Header />
      {isAddProfile ? <AddProfile /> : <HomeInfo onFindSoulmate={handleFindSoulmate} />}
      <footer className="text-center py-8 text-white">
        <p>{t("copyright_notice", { year: 2024 })}</p>
      </footer>
      <AlertDialog open={showProfileAlert} onOpenChange={setShowProfileAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("alert_title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("create_profile_before_finding_soulmate")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowProfileAlert(false)}>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                setShowProfileAlert(false);
                setIsAddProfile(true);
              }}
              className={cn(
                "bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500",
                "text-white hover:from-pink-600 hover:via-purple-600 hover:to-indigo-600"
              )}
            >{t("create_profile")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function App() {
  return (
    <Suspense fallback={<FullScreenLoading />}>
      <WalletSelectorProvider>
        <Router>
          <Routes>
            <Route path="/" element={<AppContent />} />
            <Route path="/soulmate/:id" element={<Soulmate />} />
          </Routes>
        </Router>
      </WalletSelectorProvider>
    </Suspense>
  );
}

export default App;
