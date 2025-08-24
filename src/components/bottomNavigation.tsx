'use client';

import styles from './css/bottomNavigation.module.css';
import { useRouter } from 'next/navigation';
import { useMemo } from 'react';
import { pageImageUrl } from '@/utils/supabase/client';

type NavKey = 'message' | 'home' | 'write';

interface BottomNavigationProps {
  selectedNav: NavKey;
  onNavChange: (nav: NavKey) => void;
  onHomeClick?: () => void;
  isPostFull?: boolean;
}

const NAV_ITEMS: Array<{
  key: NavKey;
  label: string;
  iconBase: string; // supabase 버킷에 있는 파일명(확장자/상태 제외)
  href?: string;
}> = [
    { key: 'message', label: '소식함', iconBase: 'message', href: '/news/archive' },
    { key: 'home', label: '홈', iconBase: 'home', href: "/main" },
    { key: 'write', label: '소식 쓰기', iconBase: 'write', href: '/news/write' },
  ];

export default function BottomNavigation({
  selectedNav,
  onNavChange,
  isPostFull
}: BottomNavigationProps) {
  const router = useRouter();

  // 선택 상태에 맞춰 아이콘 URL을 한 번에 계산
  const iconSrcMap = useMemo(() => {
    const map: Record<NavKey, string> = { message: '', home: '', write: '' };
    for (const item of NAV_ITEMS) {
      const filename = `${item.iconBase}${selectedNav === item.key ? '-s' : ''}.png`;
      map[item.key] = pageImageUrl(filename) as string;
    }
    return map;
  }, [selectedNav]);

  const handleNavClick = (key: NavKey) => {
    
    onNavChange(key);
    const to = NAV_ITEMS.find((i) => i.key === key)?.href;

    if (isPostFull && to === "/news/write") {
      alert('소식은 한 달에 20개만 작성할 수 있습니다.');
      return;
    }
    
    if (to) router.push(to);
  };

  return (
    <nav className={styles.bottomNav}>
      {NAV_ITEMS.map((item) => {
        const isActive = selectedNav === item.key;
        return (
          <div
            key={item.key}
            className={`${styles.navItem} ${isActive ? styles.active : ''}`}
            onClick={() => handleNavClick(item.key)}
          >
            <img
              src={iconSrcMap[item.key]}
              alt={item.label}
              className={styles.navIcon}
              onError={(e) => { e.currentTarget.style.visibility = 'hidden'; }}
            />
            <span className={styles.navLabel}>{item.label}</span>
          </div>
        );
      })}
    </nav>
  );
}