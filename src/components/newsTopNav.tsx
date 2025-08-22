'use client';
import { pageImageUrl } from '@/utils/supabase/client';

import styles from './css/newsTopNav.module.css';

interface TopNavigationProps {
  title: string;
  onBackClick?: () => void;
  onHelpClick?: () => void;
  showHelpButton?: boolean;
  helpIcon?: string;
}

export default function NewsTopNav({
  title,
  onBackClick,
  onHelpClick,
  showHelpButton = false,
  helpIcon = "/help2.png"
}: TopNavigationProps) {
  return (
    <header className={styles.header}>
      <div className={styles.topBar}>
        <button className={styles.backButton} onClick={onBackClick}>
          <img src={pageImageUrl("back.png")} alt="뒤로가기" onError={(e) => { e.currentTarget.style.visibility = 'hidden'; }} />
        </button>
        <h1 className={styles.title}>{title}</h1>
        {showHelpButton && (
          <button className={styles.helpButton} onClick={onHelpClick}>
            <img src={helpIcon} alt="도움말" onError={(e) => { e.currentTarget.style.visibility = 'hidden'; }} />
          </button>
        )}
      </div>
    </header>
  );
}
