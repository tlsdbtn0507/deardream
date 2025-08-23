'use client';
import styles from './page.module.css';
import BottomNavigation from '@/components/bottomNavigation';
import NewsTopNav from '@/components/newsTopNav';
import GreenBanner from '@/components/greenBanner';

import { useState, useEffect, useRef } from 'react';
import { pageImageUrl, writePost } from '@/utils/supabase/client';
import { useFeed } from '@/components/context/feedContext';
import { useRouter } from 'next/navigation';
import { Relation } from '@/utils/types';

type UserInfoForWrite = {
  nickName: string;
  profile_image: string;
  relation: Relation;
};

type EssentialInfo = { author_id: string; family_id: string } | null;

export default function PreviewPage() {
  const [selectedNav, setSelectedNav] = useState('write');
  const [postData, setPostData] = useState<{
    text: string;
    images: string[];
    authorName: string;
    authorRole: string;
    date: string;
  } | null>(null);

  // ✅ 렌더 중 직접 localStorage 접근 금지 → state로 들고 다님
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [essential, setEssential] = useState<EssentialInfo>(null);

  const [fetching, setFetching] = useState(false);
  const { addPost } = useFeed();
  const imageGridRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // 🔹 mount 시 스토리지에서 필요한 값만 state에 적재
  useEffect(() => {
    // previewData
    const saved = sessionStorage.getItem('previewData');
    if (saved) {
      try { setPostData(JSON.parse(saved)); } catch { }
    }

    // userWritingInfo → profile_image
    const u = localStorage.getItem('userWritingInfo');
    if (u) {
      try {
        const parsed: UserInfoForWrite = JSON.parse(u);
        setProfileImage(parsed?.profile_image || null);
      } catch { }
    }

    // essentialInfo → author_id, family_id
    const e = localStorage.getItem('essentialInfo');
    if (e) {
      try {
        const parsed = JSON.parse(e);
        if (parsed?.author_id && parsed?.family_id) {
          setEssential({ author_id: parsed.author_id, family_id: parsed.family_id });
        }
      } catch { }
    }
  }, []);

  // (옵션) previewData가 없으면 작성 페이지로 돌려보내기
  useEffect(() => {
    if (postData === null) {
      const saved = sessionStorage.getItem('previewData');
      if (!saved) {
        // 사용자가 바로 접근했을 때 가드
        // router.replace('/news/write');
      }
    }
  }, [postData, router]);

  // 이미지 바 위치 조정(네 코드 유지)
  useEffect(() => {
    const adjustDividerPosition = () => {
      if (imageGridRef.current && postData?.images.length && postData.images.length > 1) {
        const grid = imageGridRef.current;
        const gridStyle = window.getComputedStyle(grid);
        const gap = parseFloat(gridStyle.gap || '0.5rem') * 16;

        let firstRowHeight = 0;
        if (postData.images.length === 3) {
          firstRowHeight = grid.children[0]?.clientHeight || 0;
        } else if (postData.images.length === 4) {
          firstRowHeight = grid.children[0]?.clientHeight || 0;
        }

        if (firstRowHeight > 0) {
          grid.style.setProperty('--divider-top', `${firstRowHeight + gap / 2}px`);
        }
      }
    };

    const timer = setTimeout(adjustDividerPosition, 100);
    return () => clearTimeout(timer);
  }, [postData?.images]);

  const handleBackClick = () => router.back();

  // ✅ 업로드: state만 사용 + 라우팅 후 다음 프레임에서 정리
  const handleUpload = async () => {
    if (!postData) return;
    if (!essential?.author_id || !essential?.family_id) {
      alert('작성자 정보를 불러오지 못했어요. 페이지를 새로고침 후 다시 시도해주세요.');
      return;
    }

    setFetching(true);
    try {
      await writePost({
        author_id: essential.author_id,
        family_id: essential.family_id,
        body: postData.text,
        images: postData.images,
      });

      alert('소식이 성공적으로 업로드되었습니다!');
      router.push('/main');

      // 🔸 라우팅이 시작된 다음 프레임에서 정리 (재렌더-경합 방지)
      requestAnimationFrame(() => {
        sessionStorage.removeItem('previewData');
        localStorage.removeItem('userWritingInfo');
        localStorage.removeItem('essentialInfo');
        setFetching(false);
      });
    } catch (error) {
      alert('소식 업로드 중 오류가 발생했습니다. 다시 시도해주세요.');
      setFetching(false);
    }
  };

  if (!postData) return <div>로딩 중...</div>;

  const backGroundImg = pageImageUrl('hanji.png');

  return (
    <div className={styles.container}>
      <NewsTopNav title="소식 쓰기" onBackClick={handleBackClick} />
      <GreenBanner text="선물할 책자 미리 보기" icon="/gift.png" iconAlt="선물" />

      <div className={styles.content}>
        <div className={styles.newsCard} style={{ backgroundImage: `url(${backGroundImg})` }}>
          {/* 프로필/텍스트 */}
          <div className={styles.profileSectionWithText}>
            {profileImage ? (
              <img
                className={styles.profileImage}
                src={profileImage}
                alt=""
                onError={(e) => { e.currentTarget.style.visibility = 'hidden'; }}
              />
            ) : null}

            <div className={styles.profileInfo}>
              <div className={styles.date}>{postData.date}</div>
              <div className={styles.authorInfo}>
                <span className={styles.authorRole}>{postData.authorRole}</span>
                <span className={styles.authorName}>{postData.authorName}</span>
              </div>
            </div>

            <div className={styles.textContent}>{postData.text}</div>
          </div>

          {/* 이미지 그리드 (네 코드 유지) */}
          {postData.images.length > 0 && (
            <div
              ref={imageGridRef}
              className={`${styles.imageGrid} ${postData.images.length === 1
                  ? styles.single
                  : postData.images.length === 3
                    ? styles.triple
                    : styles.multiple
                }`}
            >
              {postData.images.map((image, i) => (
                <div key={i} className={styles.imageContainer}>
                  <img
                    src={image}
                    alt={`이미지 ${i + 1}`}
                    className={styles.newsImage}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      target.nextElementSibling?.classList.add(styles.show);
                    }}
                  />
                  <div className={styles.imagePlaceholder}>
                    <span>이미지 {i + 1}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <button disabled={fetching} className={styles.uploadButton} onClick={handleUpload}>
        {fetching ? '업로드 중...' : '올리기'}
      </button>

      <BottomNavigation
        selectedNav="write"
        onNavChange={setSelectedNav}
        onHomeClick={() => (window.location.href = '/')}
      />
    </div>
  );
}