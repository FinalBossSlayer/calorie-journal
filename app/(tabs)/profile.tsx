import { useTranslation } from 'react-i18next';

import { PlaceholderScreen } from '@/features/common/PlaceholderScreen';

export default function ProfileScreen() {
  const { t } = useTranslation();
  return <PlaceholderScreen title={t('tabs.profile')} description={t('placeholder.profile')} />;
}
