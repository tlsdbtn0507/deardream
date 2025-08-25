'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { pageImageUrl, fetchFamilyMonth, newsImageUrl } from '@/utils/supabase/client';

import styles from './page.module.css';
import BottomNavigation from '@/components/bottomNavigation';
import TopNav from '@/components/topNav';
import GreenBanner from '@/components/greenBanner';


type Archive = { month: string; count: number; imageUrls: string[], thumbnail: string };

export default function ArchivePage() {
  const [selectedNav, setSelectedNav] = useState('message');
  const [currentPage, setCurrentPage] = useState(1);
  const [monthlyArchives, setMonthlyArchives] = useState<Array<Archive>>([]);
  const router = useRouter();

  // const monthlyArchives = [
  //   {
  //     month: '2025. 07',
  //     count: 13
  //   },
  //   {
  //     month: '2025. 06',
  //     count: 8
  //   },
  //   {
  //     month: '2025. 05',
  //     count: 19
  //   },
  //   {
  //     month: '2025. 04',
  //     count: 20
  //   },
  //   {
  //     month: '2025. 03',
  //     count: 18
  //   },
  //   {
  //     month: '2025. 02',
  //     count: 10
  //   }
  // ];
  useEffect(() => {
    const fetchMonthlyArchives = async () => {
      const { user } = JSON.parse(localStorage.getItem('sb-raksukmfixcxokoqewyn-auth-token') as string);
      const months = await fetchFamilyMonth(user.id);
      // return monthlyArchives.filter(archive => months.includes(archive.month));
      const monthUrls = await Promise.all(months.map(month => newsImageUrl(month)));

      setMonthlyArchives(months.map((month, idx) => ({
        //yyyymm -> yyyy.mm
        month: `${month.slice(0, 4)}.${month.slice(4, 6)}`,
        count: monthUrls[idx]?.length ?? 0,
        imageUrls: monthUrls[idx] ?? [],
        thumbnail: monthUrls[idx]?.[0] ?? ''
      })));

    };

    fetchMonthlyArchives();
  }, []);

  const handleBackClick = () => {
    router.back();
  };

  const handleArchiveClick = (month: string) => {
    // 월별 아카이브 상세 페이지로 이동
    router.push(`/news/archive/detail?month=${encodeURIComponent(month)}`);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < 3) {
      setCurrentPage(currentPage + 1);
    }
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <TopNav/>

      {/* Green Banner */}
      <GreenBanner
        text="한 권으로 잇는 가족의 마음,"
        icon="/eardreamlogo-w.png"
        iconAlt="로고"
        iconPosition="right"
        iconSize="large"
      />

      {/* Instructional Text */}
      <div className={styles.instructionText}>
        <span>눌러서 우리의 추억을 돌아 보는 건 어때요?</span>
      </div>

      {/* Main Content */}
      <div style={{ padding: '0 3rem 0 3rem' }} className={styles.content}>
        <div className={styles.archiveGrid}>
          { monthlyArchives.length > 0 ? monthlyArchives.map((archive, index) => (
            <div
              key={index}
              className={styles.archiveCard}
              onClick={() => handleArchiveClick(archive.month)}
            >
              <div className={styles.newsCount}>
                {archive.count}개의 소식이 있어요!
              </div>
              <img className={styles.familyImage} src={archive.thumbnail} style={{ width: '100%', height: '50%' ,borderRadius:'10%'}} alt="가족 사진" />
              <div className={styles.monthInfo}>
                <span>{archive.month}의 이야기</span>
                <img src={pageImageUrl('right.png')} alt="화살표" className={styles.arrowIcon} />
              </div>
            </div>
          )) : (
            <div className={styles.noArchives}>
              <span>아카이브가 없습니다.</span>
            </div>
          )}
        </div>
      </div>

      {/* Pagination */}
      <div className={styles.pagination}>

      </div>
      {/* <div className={styles.pagination}>
        <button className={styles.pageButton} onClick={handlePrevPage}>
          <img src={pageImageUrl('back.png')} alt="이전" />
        </button>
        <span className={styles.pageInfo}>{currentPage}/3</span>
        <button className={styles.pageButton} onClick={handleNextPage}>
          <img src={pageImageUrl('right.png')} alt="다음" />
        </button>
      </div> */}

      {/* Bottom Navigation */}
      <BottomNavigation
        selectedNav={"message"}
        onNavChange={setSelectedNav}
        onHomeClick={() => window.location.href = '/'}
      />
    </div>
  );
}
