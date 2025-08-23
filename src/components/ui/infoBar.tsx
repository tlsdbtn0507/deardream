'use client';

import styles from '../css/infoBar.module.css';
import { pageImageUrl } from '@/utils/supabase/client';

type Props = {
  /** D-Day 숫자 (예: 7 이면 D-7) */
  dday: number | string;
  /** 남은 소식 개수 */
  remainingCount: number | string;
  /** 아이콘 경로를 커스텀하고 싶을 때 */
  icons?: {
    time?: string;
    gift?: string;
  };
};

export default function InfoBar({ dday, remainingCount, icons }: Props) {
  const timeIcon = icons?.time ?? pageImageUrl('/time.png') as string;
  const giftIcon = icons?.gift ?? pageImageUrl('/gift.png') as string;

  return (
    <div className={styles.infoBar}>
      <InfoItem
        icon={timeIcon}
        alt="기한"
        label={<>가족책자<br />완성까지</>}
        badge={`D-${dday}`}
        badgeClass="dDay"
      />
      <InfoItem
        icon={giftIcon}
        alt="남은소식"
        label="남은 소식"
        badge={`${remainingCount}개`}
      />
    </div>
  );
}

function InfoItem({
  icon,
  alt,
  label,
  badge,
  badgeClass,
}: {
  icon: string;
  alt: string;
  label: React.ReactNode;
  badge: string | number;
  badgeClass?: 'dDay' | string;
}) {
  return (
    <div className={styles.infoItem}>
      <img src={icon} alt={alt} className={styles.infoIcon} />
      <span className={styles.infoText}>{label}</span>
      <div
        className={`${styles.infoBadge} ${badgeClass === 'dDay' ? styles.dDayBadge : ''}`}
        aria-label={typeof label === 'string' ? label : undefined}
      >
        {badge}
      </div>
    </div>
  );
}