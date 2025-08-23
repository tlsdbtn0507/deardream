'use client';
import styles from './page.module.css';
import BottomNavigation from '@/components/bottomNavigation';

import { useState, useEffect } from 'react';
import {
  pageImageUrl,
  fetchUserInfo,
  fetchUserFamily,
  supabase
} from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { Relation, relationLabel } from "@/utils/types";
import { srcToBlob } from '@/utils/util';

type NavKey = 'message' | 'home' | 'write';

type UserInfoForWrite = {
  nickName: string;
  profile_image: string;
  relation: Relation;
};

type FamilyMember = {
  family_id: string;
  user_id: string;
  role: 'owner' | 'member' | 'admin' | string;
  nickname: string | null;
  joined_at: string;
  relation: Relation;
  profile_image: string | null;
}

export default function WriteNewsPage() {
  const [selectedNav, setSelectedNav] = useState<NavKey>('write');
  const [text, setText] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [working, setWorking] = useState(false);

  const [userInfoForWriting, setUserInfoForWriting] = useState<UserInfoForWrite>(
    {
      nickName:'',
      profile_image:'',
      relation:''
    }
  );

  const router = useRouter();

  const handleBackClick = () => router.back();

  const makeDateString = () => {
    const today = new Date();
    const dateString = `${today.getFullYear()}.${String(today.getMonth() + 1).padStart(2, '0')}.${String(today.getDate()).padStart(2, '0')}`;
    return dateString
  }

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    if (value.length <= 100) {
      setText(value);
    }
  };

  const getUserInfoFromLocal = () => {
    // 로컬 스토리지에서 사용자 정보 가져오기
    const { user } = JSON.parse(localStorage.getItem("sb-raksukmfixcxokoqewyn-auth-token") as string);
    const { id: userId } = user;
    return userId;
  }
  
  useEffect(() => {
    const userId = getUserInfoFromLocal();

    const fetchFamAndUserInfo = async (userId:string) => {
      const userInfo = await fetchUserInfo(userId);
      const familyInfo = await fetchUserFamily(userId) as FamilyMember[];
      if (!userInfo) {
        alert("로그인 후 사용해주세요.");
        router.push("/login");
        return
      }
      if (!familyInfo) {
        alert("가족 정보를 가져올 수 없습니다.");
        router.push("/main");
        return
      }

      const userObj: UserInfoForWrite = {
        nickName: familyInfo[0].nickname ?? userInfo.full_name,
        profile_image: userInfo.profile_image,
        relation: relationLabel(familyInfo[0].relation) as Relation
      };

      localStorage.setItem("userWritingInfo", JSON.stringify(userObj));

      console.log("User information for writing:", userObj,familyInfo);

      setUserInfoForWriting(userObj);
      localStorage.setItem("essentialInfo",
        JSON.stringify({ author_id: userInfo.user_id, family_id: familyInfo[0].family_id }));
    };

    const isEssentialHas = localStorage.getItem("essentialInfo");

    if (!isEssentialHas) {
      fetchFamAndUserInfo(userId);
      return
    }
    const userObj = localStorage.getItem("userWritingInfo") as string;
    setUserInfoForWriting(JSON.parse(userObj));
    // if (userObj) {
    // }

  }, [router]);;

  useEffect(() => {
    //세션스토리지에 사진이 있으면 초기화 하지 말고 렌더링
    const savedImages = sessionStorage.getItem('previewData');
    if (savedImages) {
      const { images } = JSON.parse(savedImages);
      setImages(images);
      setText(JSON.parse(savedImages).text || '');
    }
  },[])

  const handleAddPhoto = () => {
    // 이미지 추가 로직 (최대 4개까지)
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = true; // 여러 파일 선택 가능
    input.onchange = (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (files) {
        const fileArray = Array.from(files);
        const remainingSlots = 4 - images.length;
        const filesToAdd = fileArray.slice(0, remainingSlots);

        if (filesToAdd.length > 0) {
          const newImages: string[] = [];
          let loadedCount = 0;

          filesToAdd.forEach((file) => {
            const reader = new FileReader();
            reader.onload = (e) => {
              const result = e.target?.result as string;
              newImages.push(result);
              loadedCount++;

              if (loadedCount === filesToAdd.length) {
                const updatedImages = [...images, ...newImages];
                setImages(updatedImages);
                // 가장 최근에 추가된 이미지(마지막 이미지)로 인덱스 설정
                setCurrentImageIndex(updatedImages.length - 1);
              }
            };
            reader.readAsDataURL(file);
          });
        }
      }
    };
    input.click();
  };

  const handleRemoveImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    setImages(newImages);
    if (currentImageIndex >= newImages.length) {
      setCurrentImageIndex(Math.max(0, newImages.length - 1));
    }
  };

  const handlePrevImage = () => {
    setCurrentImageIndex(prev => prev > 0 ? prev - 1 : images.length - 1);
  };

  const handleNextImage = () => {
    setCurrentImageIndex(prev => prev < images.length - 1 ? prev + 1 : 0);
  };

  async function saveImgsToStorage(imgs: string[]) {
    const bucket = "avatars"; // ← 실제 버킷명 확인!
    const prefix = "posts";

    const urls: string[] = [];
    for (const src of imgs) {
      const blob = await srcToBlob(src);
      const extFromMime = (blob.type.split("/")[1] || "bin").split("+")[0];
      const path = `${prefix}/${Date.now()}_${crypto.randomUUID()}.${extFromMime}`;

      const { error } = await supabase
        .storage.from(bucket)
        .upload(path, blob, { upsert: true, contentType: blob.type });

      if (error) throw error;

      const { data } = supabase.storage.from(bucket).getPublicUrl(path);
      urls.push(data.publicUrl);
    }
    return urls;
  }


  const handleComplete = async () => {
    setWorking(true);
    // 작성 완료 로직
    const imageUrls = await saveImgsToStorage(images);
    // 미리보기 데이터를 세션스토리지에 저장
    const previewData = {
      text: text.trim(),
      images: imageUrls,
      authorName: userInfoForWriting.nickName,
      authorRole: userInfoForWriting.relation,
    };

    sessionStorage.setItem('previewData', JSON.stringify(previewData));
    setWorking(false);
    // 미리보기 페이지로 이동
    // window.location.href = '/news/preview';
    router.push('/news/preview');
  };

  const handleHelpClick = () => {
    setShowOnboarding(true);
  };

  const handleCloseOnboarding = () => {
    setShowOnboarding(false);
  };
  
  const canSubmit = text.trim().length > 0 || images.length > 0;

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.topBar}>
          <button className={styles.backButton} onClick={handleBackClick}>
            { pageImageUrl("/back.png") &&<img onError={(e) => { e.currentTarget.style.visibility = 'hidden'; }} src={pageImageUrl("/back.png")} alt="뒤로가기" />}
          </button>
          <h1 className={styles.title}>소식 쓰기</h1>
          <button className={styles.helpButton} onClick={handleHelpClick}>
            { pageImageUrl("/help2.png") &&<img onError={(e) => { e.currentTarget.style.visibility = 'hidden'; }} src={pageImageUrl("/help2.png")} alt="도움말" />}
          </button>
        </div>
      </header>

      {/* Prompt Banner */}
      <div className={styles.promptBanner}>
        {pageImageUrl("/gift.png") && <img onError={(e) => { e.currentTarget.style.visibility = 'hidden'; }} src={pageImageUrl("/gift.png")} alt="선물" className={styles.giftIcon} />}
        <span>함께 가장 가고싶은 장소를 알려주세요!</span>
      </div>

      {/* User Info */}
      <div className={styles.userInfo}>
        {userInfoForWriting && <img onError={(e) => { e.currentTarget.style.visibility = 'hidden'; }} className={styles.profileImage} src={userInfoForWriting.profile_image} alt="" />}
        <div className={styles.userDetails}>
          <span className={styles.username}>{userInfoForWriting.nickName}</span>
          <span className={styles.userTag}>{userInfoForWriting.relation}</span>
        </div>
        <div className={styles.date}>{makeDateString()}</div>
      </div>

      {/* Image Upload Area */}
      <div className={styles.imageArea}>
        <div className={styles.imageContainer}>
          {images.length > 0 ? (
            <img
              src={images[currentImageIndex]}
              alt="업로드된 이미지"
              className={styles.uploadedImage}
              onError={(e) => { e.currentTarget.style.visibility = 'hidden'; }}
            />
          ) : null}

          {/* 제거 버튼 - 이미지가 있을 때만 표시 */}
          {images.length > 0 && (
            <button
              className={styles.removeButton}
              onClick={() => handleRemoveImage(currentImageIndex)}
            >
              ✕
            </button>
          )}

          {/* 네비게이션 버튼 - 이미지가 2개 이상일 때만 표시 */}
          {images.length > 1 && (
            <>
              <button className={`${styles.navButton} ${styles.navButtonLeft}`} onClick={handlePrevImage}>
                ‹
              </button>
              <button className={`${styles.navButton} ${styles.navButtonRight}`} onClick={handleNextImage}>
                ›
              </button>
            </>
          )}
        </div>

        {/* 이미지 점 - 이미지가 있을 때만 표시 */}
        {images.length > 0 && (
          <div className={styles.imageDots}>
            {images.map((_, index) => (
              <div
                key={index}
                className={`${styles.dot} ${index === currentImageIndex ? styles.active : ''}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Add Photo Button */}
      <button
        className={`${styles.addPhotoButton} ${images.length >= 4 ? styles.disabled : ''}`}
        onClick={handleAddPhoto}
        disabled={images.length >= 4}
      >
        {images.length >= 4 ? '더 이상 추가할 수 없습니다' : '사진 추가하기 +'}
      </button>

      {/* Text Input */}
      <div className={styles.textInputContainer}>
        <textarea
          className={styles.textInput}
          placeholder={text.length === 0 ? "소식을 적어주세요." : ""}
          value={text}
          onChange={handleTextChange}
          maxLength={100}
        />
        <div className={styles.characterCount}>
          {text.length}/100
        </div>
      </div>

      {/* Complete Button */}
      <button
        className={styles.completeButton}
        onClick={handleComplete}
        disabled={!canSubmit || working}
      >
        { working ? '작성 중...' : '작성 완료'}
      </button>

      {/* Bottom Navigation */}
      <BottomNavigation
        selectedNav={selectedNav}
        onNavChange={setSelectedNav}
        onHomeClick={() => window.location.href = '/'}
      />

      {/* Onboarding Modal */}
      {showOnboarding && (
        <div className={styles.onboardingOverlay} onClick={handleCloseOnboarding}>
          {
            pageImageUrl("/write-onboarding.png") && (
              <img
                src={pageImageUrl("/write-onboarding.png")}
                alt="소식쓰기 가이드"
                className={styles.onboardingImage}
                onClick={handleCloseOnboarding}
                onError={(e) => { e.currentTarget.style.visibility = 'hidden'; }}
              />
            )}
        </div>
      )}
    </div>
  );
}
