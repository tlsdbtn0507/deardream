'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import FeedCard from './feedCard';
import { PostType } from '@/utils/types';

class Feed {
  private currentImageIndex = 1;
  private totalImages = 0;
  private userImages: string[] = [];
  private isAnimating = false;

  constructor(images: string[]) {
    this.userImages = images;
    this.totalImages = images.length;
  }

  nextImage = () => {
    if (this.isAnimating || this.totalImages === 0) return;
    this.isAnimating = true;
    setTimeout(() => {
      this.currentImageIndex =
        this.currentImageIndex === this.totalImages ? 1 : this.currentImageIndex + 1;
      this.isAnimating = false;
    }, 400);
  };

  prevImage = () => {
    if (this.isAnimating || this.totalImages === 0) return;
    this.isAnimating = true;
    setTimeout(() => {
      this.currentImageIndex =
        this.currentImageIndex === 1 ? this.totalImages : this.currentImageIndex - 1;
      this.isAnimating = false;
    }, 400);
  };

  getCurrentImage = () => {
    if (this.totalImages === 0) return 'none';
    if (this.currentImageIndex <= this.userImages.length) {
      return `url("${this.userImages[this.currentImageIndex - 1]}")`;
    }
    return 'url("/family.png")';
  };

  getCurrentImageIndex = () => this.currentImageIndex;
  getTotalImages = () => this.totalImages;
  getIsAnimating = () => this.isAnimating;

  updateImages = (images: string[]) => {
    this.userImages = images;
    this.totalImages = images.length;
    if (this.totalImages === 0) {
      this.currentImageIndex = 0;
    } else if (this.currentImageIndex > this.totalImages) {
      this.currentImageIndex = 1;
    }
  };
}

export default function FeedComponent({
  postProps,
  onDelete,
}: {
  postProps: PostType;
  onDelete?: (postId: string) => void;
}) {
  const [feed] = useState(() => new Feed(postProps.images));
  const [currentImageIndex, setCurrentImageIndex] = useState(feed.getCurrentImageIndex());
  const [isAnimating, setIsAnimating] = useState(feed.getIsAnimating());
  const isMountedRef = useRef(true);

  useEffect(() => {
    feed.updateImages(postProps.images);
  }, [postProps.images, feed]);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const nextImage = useCallback((): void => {
    if (!isMountedRef.current) return;
    feed.nextImage();
    setTimeout(() => {
      if (isMountedRef.current) {
        setCurrentImageIndex(feed.getCurrentImageIndex());
        setIsAnimating(feed.getIsAnimating());
      }
    }, 400);
  }, [feed]);

  const prevImage = useCallback((): void => {
    if (!isMountedRef.current) return;
    feed.prevImage();
    setTimeout(() => {
      if (isMountedRef.current) {
        setCurrentImageIndex(feed.getCurrentImageIndex());
        setIsAnimating(feed.getIsAnimating());
      }
    }, 400);
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
      getCurrentImage={feed.getCurrentImage}
      isAnimating={isAnimating}
      date={postProps.created_at}
      commentCount={postProps.images.length || 0}
      text={postProps.body}
      onDelete={onDelete}
    />
  );
}