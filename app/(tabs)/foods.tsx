import { useTranslation } from 'react-i18next';

import { PlaceholderScreen } from '@/features/common/PlaceholderScreen';

export default function FoodsScreen() {
  const { t } = useTranslation();
  return <PlaceholderScreen title={t('tabs.foods')} description={t('placeholder.foods')} />;
}
