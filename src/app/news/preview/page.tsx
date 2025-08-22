'use client';
import styles from './page.module.css';
import BottomNavigation from '@/components/bottomNavigation';
import NewsTopNav from '@/components/newsTopNav';
import GreenBanner from '@/components/greenBanner';

import { useState, useEffect, useRef } from 'react';
import { pageImageUrl, supabase, writePost } from '@/utils/supabase/client';
import { useFeed } from '@/components/context/feedContext';
import { useRouter } from "next/navigation";
import { Relation } from "@/utils/types";


type UserInfoForWrite = {
  nickName: string;
  profile_image: string;
  relation: Relation;
};

export default function PreviewPage() {
  const [selectedNav, setSelectedNav] = useState('write');
  const [postData, setPostData] = useState<{
    text: string;
    images: string[];
    authorName: string;
    authorRole: string;
    date: string;
  } | null>(null);
  const { addPost } = useFeed();
  const imageGridRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    // URL 파라미터나 세션스토리지에서 데이터 가져오기
    const savedData = sessionStorage.getItem('previewData');
    if (savedData) {
      setPostData(JSON.parse(savedData));
    }
  }, []);

  // 이미지 크기에 따라 바 위치 조정
  useEffect(() => {
    const adjustDividerPosition = () => {
      if (imageGridRef.current && postData?.images.length && postData.images.length > 1) {
        const grid = imageGridRef.current;
        const gridStyle = window.getComputedStyle(grid);
        const gap = parseFloat(gridStyle.gap || '0.5rem') * 16; // rem을 px로 변환

        // 첫 번째 행의 높이 계산 (이미지 개수에 따라)
        let firstRowHeight = 0;
        if (postData.images.length === 3) {
          // 3개 이미지: 첫 번째 행에 2개 이미지
          firstRowHeight = grid.children[0]?.clientHeight || 0;
        } else if (postData.images.length === 4) {
          // 4개 이미지: 첫 번째 행에 2개 이미지
          firstRowHeight = grid.children[0]?.clientHeight || 0;
        }

        // 바 위치를 첫 번째 행 아래로 설정
        if (firstRowHeight > 0) {
          grid.style.setProperty('--divider-top', `${firstRowHeight + gap / 2}px`);
        }
      }
    };

    // 이미지 로드 후 위치 조정
    const timer = setTimeout(adjustDividerPosition, 100);
    return () => clearTimeout(timer);
  }, [postData?.images]);

  const handleBackClick = () => {
    router.back();
  };


  const handleUpload = async () => {
    // 실제 업로드 로직 (Context에 추가)
    // const imageUrls = await saveImgsToStorage(postData!.images);
    const essentialInfo = JSON.parse(localStorage.getItem('essentialInfo') || '{}');
    if (postData) {
      try {
        await writePost({
          author_id: essentialInfo.author_id,
          family_id: essentialInfo.family_id,
          body: postData.text,
          images: postData.images,
        });
        // 세션스토리지에서 데이터 삭제
        sessionStorage.removeItem('previewData');
        localStorage.removeItem('userWritingInfo');
        localStorage.removeItem('essentialInfo');

        //
        alert("소식이 성공적으로 업로드되었습니다!");

        // 홈화면으로 이동
        router.push('/main');
      } catch (error) {
        console.error("Error uploading post:", error);
      }

    }
  };

  if (!postData) {
    return <div>로딩 중...</div>;
  }

  const { profile_image } = JSON.parse(localStorage.getItem("userWritingInfo") as string) as UserInfoForWrite;
  const backGroundImg = pageImageUrl('hanji.png');

  return (
    <div className={styles.container}>
      {/* Header */}
      <NewsTopNav title="소식 쓰기" onBackClick={handleBackClick}/>

      {/* Preview Banner */}
      <GreenBanner text="선물할 책자 미리 보기" icon="/gift.png" iconAlt="선물"/>

      {/* Main Content */}
      <div className={styles.content}>
        <div className={styles.newsCard} style={{ backgroundImage: `url(${backGroundImg})` }}>
          {/* Profile Section with Text */}
          <div className={styles.profileSectionWithText}>
            {profile_image && <img className={styles.profileImage} src={profile_image as string} alt="" onError={(e) => { e.currentTarget.style.visibility = 'hidden'; }} />}
            <div className={styles.profileInfo}>
              <div className={styles.date}>{postData.date}</div>
              <div className={styles.authorInfo}>
                <span className={styles.authorRole}>{postData.authorRole}</span>
                <span className={styles.authorName}>{postData.authorName}</span>
              </div>
            </div>
            {/* Text Content */}
            <div className={styles.textContent}>
              {postData.text}
            </div>
          </div>

          {/* Image Content */}
          {postData.images.length > 0 && (
            <div
              ref={imageGridRef}
              className={`${styles.imageGrid} ${postData.images.length === 1 ? styles.single :
                  postData.images.length === 3 ? styles.triple :
                    styles.multiple
                }`}
            >
              {postData.images.map((image, imageIndex) => (
                <div key={imageIndex} className={styles.imageContainer}>
                  <img
                    src={image}
                    alt={`이미지 ${imageIndex + 1}`}
                    className={styles.newsImage}
                    onError={(e) => {
                      // 이미지 로드 실패 시 placeholder 표시
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      target.nextElementSibling?.classList.add(styles.show);
                    }}
                  />
                  <div className={styles.imagePlaceholder}>
                    <span>이미지 {imageIndex + 1}</span>
                  </div>
                </div>
              ))}

            </div>
          )}
        </div>
      </div>

      {/* Upload Button */}
      <button className={styles.uploadButton} onClick={handleUpload}>
        올리기
      </button>

      {/* Bottom Navigation */}
      <BottomNavigation
        selectedNav={"write"}
        onNavChange={setSelectedNav}
        onHomeClick={() => window.location.href = '/'}
      />
    </div>
  );
}
