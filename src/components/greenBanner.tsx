import React from 'react';
import styles from './css/greenBanner.module.css';

import { pageImageUrl } from '@/utils/supabase/client';

interface GreenBannerProps {
  text: string;
  icon?: string;
  iconAlt?: string;
  className?: string;
  iconPosition?: 'left' | 'right';
  iconSize?: 'small' | 'medium' | 'large';
}

const GreenBanner: React.FC<GreenBannerProps> = ({
  text,
  icon,
  iconAlt = "icon",
  className = "",
  iconPosition = "left",
  iconSize = "medium"
}) => {
  const getIconSizeClass = () => {
    switch (iconSize) {
      case 'small':
        return styles.bannerIconSmall;
      case 'large':
        return styles.bannerIconLarge;
      default:
        return styles.bannerIcon;
    }
  };

  return (
    <div className={`${styles.greenBanner} ${className}`}>
      {icon && iconPosition === 'left' && (
        <img
          src={pageImageUrl(icon)}
          alt={iconAlt}
          className={`${styles.bannerIcon} ${getIconSizeClass()}`}
          onError={(e) => { e.currentTarget.style.visibility = 'hidden'; }}
        />
      )}
      <span className={styles.bannerText}>{text}</span>
      {icon && iconPosition === 'right' && (
        <img
          src={pageImageUrl(icon)}
          alt={iconAlt}
          className={`${styles.bannerIcon} ${getIconSizeClass()}`}
          onError={(e) => { e.currentTarget.style.visibility = 'hidden'; }}
        />
      )}
    </div>
  );
};

export default GreenBanner;
