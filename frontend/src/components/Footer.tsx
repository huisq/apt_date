import React from 'react';
import { useTranslation } from 'react-i18next';

const Footer: React.FC = () => {
  const { t } = useTranslation();

  return (
    <footer className="text-center py-8 text-white">
      <p>{t("copyright_notice", { year: 2024 })}</p>
    </footer>
  );
};

export default Footer;