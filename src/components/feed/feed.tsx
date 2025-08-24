// src/components/feed/feed.tsx
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import FeedCard from './feedCard';
import { PostType } from '@/utils/types';

class Feed {
  private currentImageIndex = 1;             // 1-based
  private totalImages = 0;
  private userImages: string[] = [];
  private isAnimating = false;
  private slideClass: string | null = null;

  private readonly ANIM_MS = 220;
  private animTimer: number | null = null;
  private startedAt = 0;

  constructor(images: string[]) {
    this.userImages = images;
    this.totalImages = images.length;
  }

  private endAnimSafely = () => {
    this.slideClass = 'slideCenter';
    this.isAnimating = false;
    this.animTimer = null;
  };

  // 사용하기 편한 배경 헬퍼 (index: 1-based, 양끝 래핑)
  getBgAt = (index: number) => {
    if (this.totalImages === 0) return 'none';
    const N = this.totalImages;
    // 1..N 로 래핑
    const i = ((index - 1 + N) % N) + 1;
    if (i <= this.userImages.length) {
      return `url("${this.userImages[i - 1]}")`;
    }
    return 'url("/family.png")';
  };
  getCurrentBg = () => this.getBgAt(this.currentImageIndex);
  getNextBg = () => this.getBgAt(this.currentImageIndex + 1);
  getPrevBg = () => this.getBgAt(this.currentImageIndex - 1);

  nextImage = () => {
    const now = Date.now();
    if (this.isAnimating && now - this.startedAt > this.ANIM_MS * 3) this.endAnimSafely();
    if (this.isAnimating || this.totalImages === 0) return;
    this.isAnimating = true;
    this.startedAt = now;
    this.slideClass = 'slideLeft';
    if (this.animTimer) clearTimeout(this.animTimer);
    this.animTimer = window.setTimeout(() => {
      this.currentImageIndex =
        this.currentImageIndex === this.totalImages ? 1 : this.currentImageIndex + 1;
      this.endAnimSafely();
    }, this.ANIM_MS + 40);
  };

  prevImage = () => {
    const now = Date.now();
    if (this.isAnimating && now - this.startedAt > this.ANIM_MS * 3) this.endAnimSafely();
    if (this.isAnimating || this.totalImages === 0) return;
    this.isAnimating = true;
    this.startedAt = now;
    this.slideClass = 'slideRight';
    if (this.animTimer) clearTimeout(this.animTimer);
    this.animTimer = window.setTimeout(() => {
      this.currentImageIndex =
        this.currentImageIndex === 1 ? this.totalImages : this.currentImageIndex - 1;
      this.endAnimSafely();
    }, this.ANIM_MS + 40);
  };

  getCurrentImageIndex = () => this.currentImageIndex;
  getTotalImages = () => this.totalImages;
  getIsAnimating = () => this.isAnimating;
  getSlideClass = () => this.slideClass;

  updateImages = (images: string[]) => {
    this.userImages = images;
    this.totalImages = images.length;
    if (this.totalImages === 0) this.currentImageIndex = 0;
    else if (this.currentImageIndex > this.totalImages) this.currentImageIndex = 1;
  };
}

export default function FeedComponent({
  postProps,
  onDelete,
}: {
  postProps: PostType;
  onDelete?: (id: string) => void;
}) {
  const [feed] = useState(() => new Feed(postProps.images));
  const [currentImageIndex, setCurrentImageIndex] = useState(feed.getCurrentImageIndex());
  const [isAnimating, setIsAnimating] = useState(feed.getIsAnimating());
  const isMountedRef = useRef(true);
  const ANIM_MS = 220;

  useEffect(() => { feed.updateImages(postProps.images); }, [postProps.images, feed]);
  useEffect(() => () => { isMountedRef.current = false; }, []);

  const syncFromFeed = () => {
    if (!isMountedRef.current) return;
    setCurrentImageIndex(feed.getCurrentImageIndex());
    setIsAnimating(feed.getIsAnimating());
  };

  const nextImage = useCallback(() => {
    feed.nextImage();
    setTimeout(syncFromFeed, ANIM_MS + 60);
    setTimeout(() => feed.getIsAnimating() && syncFromFeed(), ANIM_MS * 3);
  }, [feed]);

  const prevImage = useCallback(() => {
    feed.prevImage();
    setTimeout(syncFromFeed, ANIM_MS + 60);
    setTimeout(() => feed.getIsAnimating() && syncFromFeed(), ANIM_MS * 3);
  }, [feed]);

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
      getCurrentBg={feed.getCurrentBg}
      getNextBg={feed.getNextBg}
      getPrevBg={feed.getPrevBg}
      isAnimating={isAnimating}
      date={postProps.created_at}
      commentCount={postProps.images.length || 0}
      text={postProps.body}
      onDelete={onDelete}
    />
  );
}