'use client';
import { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

import styles from './page.module.css';
import NewsTopNav from '@/components/newsTopNav';
import BottomNavigation from '@/components/bottomNavigation';
import GreenBanner from '@/components/greenBanner';
import { pageImageUrl } from '@/utils/supabase/client';

interface NewsItem {
  id: string;
  authorName: string;
  authorRole: string;
  date: string;
  text: string;
  images: string[];
}

export default function ArchiveDetailPage() {
  const [selectedNav, setSelectedNav] = useState('message');
  const [currentPage, setCurrentPage] = useState(1);
  const router = useRouter();
  const searchParams = useSearchParams();
  const month = searchParams.get('month') || '2025. 07';

  const groupFeedsIntoPages = (feeds: NewsItem[]) => {
    const pages: NewsItem[][] = [];
    for (let i = 0; i < feeds.length; i += 1) {
      pages.push(feeds.slice(i, i + 1));
    }
    return pages;
  };

  // 샘플 데이터(렌더 시 pageImageUrl로 변환해서 사용)
  const newsItems: NewsItem[] = [
    {
      id: '1',
      authorName: '김주영',
      authorRole: '손녀',
      date: `2025\n${month.split('.')[1]}.19`,
      text:
        '할머니 저 주영이에요~ 오늘은 여름을 맞아 다같이 계곡에 다녀 왔어요ㅎㅎ 수박을 먹는데 할머니 생각이 많이 났어요. 조만간 맛있는 수박사서 할머니 뵈러갈게요~ 건강 잘챙기구 계셔요!',
      images: [pageImageUrl('trip.png') as string, pageImageUrl('rice.png') as string, pageImageUrl('ham.png') as string],
    },
    {
      id: '2',
      authorName: '김민수',
      authorRole: '아들',
      date: `2025\n${month.split('.')[1]}.20`,
      text:
        '엄마 오늘 점심에 맛있는 김치찌개 먹었어요. 엄마가 만드시던 맛이 그리워서 직접 만들어봤는데 생각보다 잘 나왔어요!',
      images: ["https://raksukmfixcxokoqewyn.supabase.co/storage/v1/object/public/avatars/0663cfa9-5a52-4c56-afc4-65fc2162a220/1755937449013"],
    },
    {
      id: '3',
      authorName: '박영희',
      authorRole: '딸',
      date: `2025\n${month.split('.')[1]}.21`,
      text:
        '어머니 오늘 정원에서 꽃을 심었어요. 봄에 예쁘게 피어날 거예요. 어머니도 꼭 보러 오세요!',
      images: ["https://raksukmfixcxokoqewyn.supabase.co/storage/v1/object/public/avatars/be70e929-39ad-4ae0-8ce1-36310b350862/1755934917302", "https://raksukmfixcxokoqewyn.supabase.co/storage/v1/object/public/avatars/recipients/qkqh/1755750666738_0820.png"],
    },
  ];

  const handleBackClick = () => {
    window.history.back();
  };

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage((p) => p - 1);
  };

  const pages = groupFeedsIntoPages(newsItems);

  const handleNextPage = () => {
    if (currentPage < pages.length + 2) setCurrentPage((p) => p + 1);
  };

  const handleGoBack = () => {
    router.push('/news/archive');
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <NewsTopNav title="소식함" onBackClick={handleBackClick} />

      {/* Green Banner */}
      <GreenBanner
        text={`우리 가족의 ${month} 이야기`}
        icon={"https://raksukmfixcxokoqewyn.supabase.co/storage/v1/object/public/avatars/page/gift.png"}
        iconAlt="선물"
        iconPosition="left"
      />

      {/* Main Content */}
      <div className={styles.content}>
        {currentPage === 1 ? (
          // 첫 페이지: 표지
          <div className={styles.coverCard}>
            <img
              src={pageImageUrl('cover.png')}
              alt="표지"
              className={styles.coverImage}
            />
          </div>
        ) : currentPage === pages.length + 2 ? (
          // 마지막 페이지: 달력
          <div className={styles.calendarCard}>
            <img
              src="https://raksukmfixcxokoqewyn.supabase.co/storage/v1/object/public/avatars/page/calendar%20(1).png"
              alt="달력"
              className={styles.calendarImage}
            />
          </div>
        ) : (
          pages[currentPage - 2] && (
            <div className={styles.newsCard}>
              {pages[currentPage - 2].map((feed, feedIndex) => (
                <div key={feed.id} className={styles.feedItem}>
                  {/* Profile Section with Text */}
                  <div className={styles.profileSectionWithText}>
                    <img className={styles.profileImage} src="https://raksukmfixcxokoqewyn.supabase.co/storage/v1/object/public/avatars/message/202504/picOfGrandFa.png"/>
                    <div className={styles.profileInfo}>
                      <div className={styles.date}>{feed.date}</div>
                      <div className={styles.authorInfo}>
                        <span className={styles.authorRole}>{feed.authorRole}</span>
                        <span className={styles.authorName}>{feed.authorName}</span>
                      </div>
                    </div>
                    <div className={styles.textContent}>{feed.text}</div>
                  </div>

                  {/* Image Content */}
                  {feed.images.length > 0 && (
                    <div className={styles.imageGridContainer}>
                      <div className={styles.imageSection}>
                        {feed.images.map((image, idx) => (
                          <div key={idx} className={styles.imageContainer}>
                            <img
                              src={image}
                              alt={`이미지 ${idx + 1}`}
                              className={styles.newsImage}
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                target.nextElementSibling?.classList.add(styles.show);
                              }}
                            />
                            <div className={styles.imagePlaceholder}>
                              <span>이미지 {idx + 1}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 구분선 */}
                  {feedIndex < pages[currentPage - 2].length - 1 && (
                    <div className={styles.feedDivider} />
                  )}
                </div>
              ))}
            </div>
          )
        )}
      </div>

      {/* Pagination */}
      <div className={styles.pagination}>
        <button className={styles.pageButton} onClick={handlePrevPage}>
          <img src={pageImageUrl('back.png')} alt="이전" />
        </button>
        <span className={styles.pageInfo}>{currentPage}/{pages.length + 2}</span>
        <button className={styles.pageButton} onClick={handleNextPage}>
          <img src={pageImageUrl('right.png')} alt="다음" />
        </button>
      </div>

      {/* Go Back Button */}
      <button className={styles.goBackButton} onClick={handleGoBack}>
        돌아가기
      </button>

      {/* Bottom Navigation */}
      <BottomNavigation
        selectedNav="message"
        onNavChange={setSelectedNav}
        onHomeClick={() => (window.location.href = '/')}
      />
    </div>
  );
}