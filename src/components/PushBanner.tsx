import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { requestPushPermission, isPushSubscribed } from '../services/push';
import { config } from '../config';

const DISMISS_KEY = 'bcn2026_push_dismissed';

export default function PushBanner() {
  const { t } = useTranslation();
  const [hidden, setHidden] = useState(
    () => !config.oneSignalAppId || localStorage.getItem(DISMISS_KEY) === '1',
  );

  useEffect(() => {
    isPushSubscribed().then((subscribed) => {
      if (subscribed) setHidden(true);
    });
  }, []);

  if (hidden) return null;

  const enable = () => {
    requestPushPermission();
    localStorage.setItem(DISMISS_KEY, '1');
    setHidden(true);
  };

  return (
    <div className="push-banner">
      <p>{t('push.prompt')}</p>
      <button onClick={enable}>{t('push.enable')}</button>
    </div>
  );
}
