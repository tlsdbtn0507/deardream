'use client';

import { useState, useRef } from 'react';
import { pageImageUrl, deletePost } from '@/utils/supabase/client';
import { relationLabel } from '@/utils/types';
import { useRouter } from 'next/navigation';

import styles from '../../app/main/main.module.css';

interface FeedCardProps {
  postId?: string;
  authorName: string;
  authorRole: string;
  authorAvatar: string;
  currentImageIndex: number;
  totalImages: number;
  onNextImage: () => void;
  onPrevImage: () => void;
  getCurrentImage: () => string;
  isAnimating: boolean;
  setIsAnimating: (animating: boolean) => void;
  slideClass: string | null;
  setSlideClass: (slideClass: string | null) => void;
  date?: string;
  commentCount?: number;
  text: string | null;
  onDelete?: (postId: string) => void;
}

export default function FeedCard({
  postId,
  authorName,
  authorRole,
  authorAvatar,
  currentImageIndex,
  totalImages,
  onNextImage,
  onPrevImage,
  getCurrentImage,
  isAnimating,
  setIsAnimating,
  slideClass,
  setSlideClass,
  date,
  commentCount = 0,
  text,
  onDelete
}: FeedCardProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [currentX, setCurrentX] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const slideRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isAnimating || totalImages === 0 || !slideRef.current) return;
    setIsDragging(true);
    setStartX(e.clientX);
    setCurrentX(e.clientX);
    setDragOffset(0);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || isAnimating || !slideRef.current) return;
    setCurrentX(e.clientX);
    const offset = e.clientX - startX;

    // 첫 번째 이미지에서는 오른쪽 드래그만, 마지막 이미지에서는 왼쪽 드래그만 허용
    if (currentImageIndex === 1 && offset > 0) {
      setDragOffset(Math.min(offset, 30));
    } else if (currentImageIndex === totalImages && offset < 0) {
      setDragOffset(Math.max(offset, -30));
    } else {
      setDragOffset(offset);
    }
  };

  const handleMouseUp = () => {
    if (!isDragging || isAnimating || totalImages === 0) return;

    const diff = startX - currentX;
    const threshold = 50;

    if (Math.abs(diff) > threshold) {
      if (diff > 0 && currentImageIndex < totalImages) {
        onNextImage();
      } else if (diff < 0 && currentImageIndex > 1) {
        onPrevImage();
      } else {
        setDragOffset(0);
      }
    } else {
      setDragOffset(0);
    }

    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (isAnimating || totalImages === 0) return;
    setIsDragging(true);
    setStartX(e.touches[0].clientX);
    setCurrentX(e.touches[0].clientX);
    setDragOffset(0);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || isAnimating) return;
    setCurrentX(e.touches[0].clientX);
    const offset = e.touches[0].clientX - startX;

    // 첫 번째 이미지에서는 오른쪽 드래그만, 마지막 이미지에서는 왼쪽 드래그만 허용
    if (currentImageIndex === 1 && offset > 0) {
      setDragOffset(Math.min(offset, 30));
    } else if (currentImageIndex === totalImages && offset < 0) {
      setDragOffset(Math.max(offset, -30));
    } else {
      setDragOffset(offset);
    }
  };

  const handleTouchEnd = () => {
    if (!isDragging || isAnimating || totalImages === 0) return;

    const diff = startX - currentX;
    const threshold = 50;

    if (Math.abs(diff) > threshold) {
      if (diff > 0 && currentImageIndex < totalImages) {
        onNextImage();
      } else if (diff < 0 && currentImageIndex > 1) {
        onPrevImage();
      } else {
        setDragOffset(0);
      }
    } else {
      setDragOffset(0);
    }

    setIsDragging(false);
  };

  const getDragTransform = () => {
    if (!isDragging) return '';
    const maxOffset = 100;
    const clampedOffset = Math.max(-maxOffset, Math.min(maxOffset, dragOffset));
    return `translateX(${clampedOffset}px)`;
  };

  const getSlideClass = () => {
    if (slideClass) return slideClass;
    return '';
  };

  if (totalImages === 0) return null;

  const editImg = pageImageUrl('edit.png');
  const deleteImg = pageImageUrl('delete.png');
  const emoImg = pageImageUrl('emo.png');
  const commentImg = pageImageUrl('comment.png');

  const removePost = async (e: React.MouseEvent) => {
    e.preventDefault();
    
    const confirmed = confirm('이 게시물을 삭제하시겠습니까?');
    const id = e.currentTarget.id;
    if (confirmed) {
      const success = await deletePost(id);
      if (success) {
        onDelete?.(id);
        alert('게시물이 삭제되었습니다.');
        return
      }
    }
  };

  return (
    <div className={styles.feedContainer}>
      <div className={styles.postHeader}>
        <div className={styles.postAuthor}>
          <div style={{ backgroundImage: `url(${authorAvatar})` }} className={styles.authorAvatar}>
          </div>
          <div className={styles.authorInfo}>
            {date && (
              <div className={styles.postDate}>
                {date.split("T")[0]}
              </div>
                  )}
            <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '0.5rem', marginLeft: '0.4rem' }}>
              <span className={styles.authorName}>{authorName}</span>
              <div className={styles.authorTag}>{relationLabel(authorRole)}</div>
            </div>
          </div>
        </div>
        <div className={styles.postActions}>
          <img src={editImg} alt="편집" className={styles.actionIcon} />
          <img
            id={postId}
            src={deleteImg}
            alt="삭제"
            className={styles.actionIcon}
            onClick={removePost}
            style={{ cursor: 'pointer' }}
          />
        </div>
      </div>

      <div className={styles.postImage}>
        <div className={styles.imagePlaceholder}>
          <div
            className={`${styles.familyPhoto} ${isDragging ? styles.dragging : ''} ${isAnimating ? styles.animating : ''} ${getSlideClass() ? styles[getSlideClass()] : ''}`}
            ref={slideRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            style={{
              backgroundImage: getCurrentImage(),
              transform: getDragTransform()
            }}
          >
            <div className={styles.imageOverlay}>
              <div className={styles.imageCounter}>{currentImageIndex}/{totalImages}</div>
              <div className={styles.imageLogo}>이어드림</div>
            </div>
          </div>
        </div>
      </div>

      {text && (
        <div className={styles.postText}>
          {text}
        </div>
      )}

      <div className={styles.postFooter}>
        <div className={styles.postAction}>
          <img src={emoImg} alt="좋아요" className={styles.actionIcon} />
        </div>
        <div className={styles.postAction}>
          <img src={commentImg} alt="댓글" className={styles.actionIcon} />
          {commentCount > 0 && (
            <span className={styles.commentCount}>{commentCount}</span>
          )}
        </div>
      </div>
    </div>
  );
}
