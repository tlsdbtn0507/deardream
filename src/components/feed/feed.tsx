'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import FeedCard from './feedCard';
import { PostType } from '@/utils/types';

class Feed {
  private currentImageIndex: number = 1;
  private totalImages: number = 0;
  private userImages: string[] = [];
  private isAnimating: boolean = false;
  private slideClass: string | null = null;

  constructor(images: string[]) {
    this.userImages = images;
    this.totalImages = images.length;
  }

  // 이미지 슬라이드 함수들
  nextImage = () => {
    if (this.isAnimating || this.totalImages === 0) return;
    this.isAnimating = true;
    this.slideClass = 'slideLeft';

    setTimeout(() => {
      this.currentImageIndex = this.currentImageIndex === this.totalImages ? 1 : this.currentImageIndex + 1;
      this.slideClass = 'slideCenter';
      this.isAnimating = false;
    }, 400);
  };

  prevImage = () => {
    if (this.isAnimating || this.totalImages === 0) return;
    this.isAnimating = true;
    this.slideClass = 'slideRight';

    setTimeout(() => {
      this.currentImageIndex = this.currentImageIndex === 1 ? this.totalImages : this.currentImageIndex - 1;
      this.slideClass = 'slideCenter';
      this.isAnimating = false;
    }, 400);
  };

  // 현재 이미지에 따른 배경 이미지 설정
  getCurrentImage = () => {
    if (this.totalImages === 0) return 'none';
    if (this.currentImageIndex <= this.userImages.length) {
      return `url("${this.userImages[this.currentImageIndex - 1]}")`;
      // return this.userImages[this.currentImageIndex - 1];
    }
    return 'url("/family.png")';
  };

  // Getter 메서드들
  getCurrentImageIndex = () => this.currentImageIndex;
  getTotalImages = () => this.totalImages;
  getIsAnimating = () => this.isAnimating;
  getSlideClass = () => this.slideClass;

  // 이미지 업데이트
  updateImages = (images: string[]) => {
    this.userImages = images;
    this.totalImages = images.length;

    // 이미지가 없을 때 처리
    if (this.totalImages === 0) {
      this.currentImageIndex = 0;
    } else if (this.currentImageIndex > this.totalImages) {
      this.currentImageIndex = 1;
    }
  };
}

// React 컴포넌트 래퍼
export default function FeedComponent({ postProps, onDelete }: { postProps: PostType, onDelete?: (postId: string) => void }) {
  const [feed] = useState(() => new Feed(postProps.images));
  const [currentImageIndex, setCurrentImageIndex] = useState(feed.getCurrentImageIndex());
  const [isAnimating, setIsAnimating] = useState(feed.getIsAnimating());
  const [slideClass, setSlideClass] = useState(feed.getSlideClass());
  const isMountedRef = useRef(true);

  useEffect(() => {
    feed.updateImages(postProps.images);
  }, [postProps.images, feed]);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const nextImage = useCallback(() => {
    if (!isMountedRef.current) return;

    feed.nextImage();
    const timeoutId = setTimeout(() => {
      if (isMountedRef.current) {
        setCurrentImageIndex(feed.getCurrentImageIndex());
        setIsAnimating(feed.getIsAnimating());
        setSlideClass(feed.getSlideClass());
      }
    }, 400);

    return timeoutId;
  }, [feed]);

  const prevImage = useCallback(() => {
    if (!isMountedRef.current) return;

    feed.prevImage();
    const timeoutId = setTimeout(() => {
      if (isMountedRef.current) {
        setCurrentImageIndex(feed.getCurrentImageIndex());
        setIsAnimating(feed.getIsAnimating());
        setSlideClass(feed.getSlideClass());
      }
    }, 400);

    return timeoutId;
  }, [feed]);

  // Cleanup을 위한 useEffect
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  return (
    <FeedCard
      postId={postProps.id}
      authorName={postProps.author_name as string}
      authorRole={postProps.author_relation as string}
      authorAvatar={postProps.author_profile_image as string}
      currentImageIndex={currentImageIndex}
      totalImages={feed.getTotalImages()}
      onNextImage={nextImage}
      onPrevImage={prevImage}
      getCurrentImage={feed.getCurrentImage}
      isAnimating={isAnimating}
      setIsAnimating={setIsAnimating}
      slideClass={slideClass}
      setSlideClass={setSlideClass}
      date={postProps.created_at}
      commentCount={postProps.images.length || 0}
      text={postProps.body}
      onDelete={onDelete}
    />
  );
}
