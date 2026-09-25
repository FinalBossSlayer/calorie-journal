import { useTranslation } from 'react-i18next';

import { PlaceholderScreen } from '@/features/common/PlaceholderScreen';

export default function HistoryScreen() {
  const { t } = useTranslation();
  return <PlaceholderScreen title={t('tabs.history')} description={t('placeholder.history')} />;
}
