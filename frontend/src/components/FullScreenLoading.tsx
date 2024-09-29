import React from 'react';
import { Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const FullScreenLoading: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex flex-col items-center justify-center z-50">
      <Loader2 className="h-8 w-8 animate-spin text-white mb-4" />
      <div className="text-white text-xl">
        {t('loading')}
        <span className="animate-pulse"> .</span>
        <span className="animate-pulse" style={{ animationDelay: '0.2s' }}>.</span>
        <span className="animate-pulse" style={{ animationDelay: '0.4s' }}>.</span>
      </div>
    </div>
  );
};

export default FullScreenLoading;