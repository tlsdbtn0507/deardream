'use client';

import { useRef } from 'react';
import { pageImageUrl } from '@/utils/supabase/client';
import { relationLabel } from '@/utils/types';
import styles from '../../app/main/main.module.css';

interface FeedCardProps {
  postId?: string;
  authorName: string;
  authorRole: string;
  authorAvatar: string;
  currentImageIndex: number;    // 1-base
  totalImages: number;
  onNextImage: () => void;
  onPrevImage: () => void;
  getCurrentImage: () => string; // css background-image 값 (url("...")) 형태
  isAnimating: boolean;
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
  date,
  commentCount = 0,
  text,
  onDelete
}: FeedCardProps) {
  const slideEl = useRef<HTMLDivElement>(null);

  // 제스처 상태를 ref로 관리
  const gs = useRef({
    dragging: false,
    pointerId: -1 as number,
    startX: 0,
    startY: 0,
    lastX: 0,
    startTime: 0,
    locked: null as null | 'x' | 'y',
  });

  const SWIPE_DISTANCE = 60;   // px
  const LOCK_THRESHOLD = 8;    // px
  const FLICK_SPEED = 0.6;     // px/ms
  const EDGE_RESIST = 0.35;

  const setTransform = (x: number, instant = false) => {
    const el = slideEl.current;
    if (!el) return;
    el.style.transition = instant ? 'none' : 'transform 220ms ease';
    el.style.transform = `translateX(${x}px)`;
  };
  const resetTransform = () => setTransform(0, false);

  const onPointerDown: React.PointerEventHandler<HTMLDivElement> = (e) => {
    if (isAnimating || totalImages === 0) return;
    // 마우스 보조버튼 무시
    if (e.pointerType === 'mouse' && e.button !== 0) return;

    gs.current.dragging = true;
    gs.current.pointerId = e.pointerId;
    gs.current.startX = e.clientX;
    gs.current.startY = e.clientY;
    gs.current.lastX = e.clientX;
    gs.current.startTime = performance.now();
    gs.current.locked = null;

    slideEl.current?.setPointerCapture(e.pointerId);
    // 드래그 시작: transition 끄기
    setTransform(0, true);
  };

  const onPointerMove: React.PointerEventHandler<HTMLDivElement> = (e) => {
    if (!gs.current.dragging || isAnimating) return;

    const dx = e.clientX - gs.current.startX;
    const dy = e.clientY - gs.current.startY;

    // 아직 방향 잠금 미결정 → 결정
    if (!gs.current.locked) {
      if (Math.abs(dx) > LOCK_THRESHOLD || Math.abs(dy) > LOCK_THRESHOLD) {
        gs.current.locked = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
      } else {
        return;
      }
    }

    // 세로 스크롤 우세 → 드래그 취소
    if (gs.current.locked === 'y') {
      gs.current.dragging = false;
      slideEl.current?.releasePointerCapture(gs.current.pointerId);
      resetTransform();
      return;
    }

    // 가로 슬라이드 우세 → 세로 스크롤 방지
    e.preventDefault();

    let offset = dx;
    if (currentImageIndex === 1 && dx > 0) {
      offset = dx * EDGE_RESIST;
    } else if (currentImageIndex === totalImages && dx < 0) {
      offset = dx * EDGE_RESIST;
    }

    setTransform(offset, true);
    gs.current.lastX = e.clientX;
  };

  const finishSwipe = (dir: 'next' | 'prev') => {
    const SNAP = dir === 'next' ? -40 : 40;
    setTransform(SNAP, false);
    // 다음 프레임 2번으로 부드럽게 연결
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        dir === 'next' ? onNextImage() : onPrevImage();
        setTransform(0, true); // 새 이미지로 바뀌면 transform 초기화
      });
    });
  };

  const onPointerUpOrCancel: React.PointerEventHandler<HTMLDivElement> = (e) => {
    if (!gs.current.dragging) return;

    const dx = e.clientX - gs.current.startX;
    const dt = Math.max(1, performance.now() - gs.current.startTime);
    const speed = Math.abs(dx) / dt; // px/ms

    if (gs.current.locked !== 'x') {
      resetTransform();
    } else {
      const goNext = dx < 0 && currentImageIndex < totalImages;
      const goPrev = dx > 0 && currentImageIndex > 1;
      const passDistance = Math.abs(dx) > SWIPE_DISTANCE;
      const passFlick = speed > FLICK_SPEED;

      if ((passDistance || passFlick) && (goNext || goPrev)) {
        finishSwipe(goNext ? 'next' : 'prev');
      } else {
        resetTransform();
      }
    }

    gs.current.dragging = false;
    slideEl.current?.releasePointerCapture(gs.current.pointerId);
  };

  // 🔹 엣지 탭존 핸들러 (드래그 시작 방지)
  const stopPointerPropagation: React.PointerEventHandler<HTMLDivElement> = (e) => {
    e.stopPropagation();
  };
  const onEdgePrevClick: React.MouseEventHandler<HTMLDivElement> = (e) => {
    e.stopPropagation();
    if (isAnimating || currentImageIndex <= 1) return;
    onPrevImage();
  };
  const onEdgeNextClick: React.MouseEventHandler<HTMLDivElement> = (e) => {
    e.stopPropagation();
    if (isAnimating || currentImageIndex >= totalImages) return;
    onNextImage();
  };

  if (totalImages === 0) return null;

  const deleteImg = pageImageUrl('delete.png');

  const removePost: React.MouseEventHandler<HTMLImageElement> = async (e) => {
    e.preventDefault();
    if (!postId) return;
    if (confirm('이 게시물을 삭제하시겠습니까?')) {
      onDelete?.(postId); // 실제 삭제는 상위에서 수행
    }
  };

  return (
    <div className={styles.feedContainer}>
      <div className={styles.postHeader}>
        <div className={styles.postAuthor}>
          <div
            className={styles.authorAvatar}
            style={{ backgroundImage: `url(${authorAvatar})` }}
          />
          <div className={styles.authorInfo}>
            {date && <div className={styles.postDate}>{date.split('T')[0]}</div>}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginLeft: '0.4rem' }}>
              <span className={styles.authorName}>{authorName}</span>
              <div className={styles.authorTag}>{relationLabel(authorRole)}</div>
            </div>
          </div>
        </div>
        <div className={styles.postActions}>
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
            ref={slideEl}
            className={styles.familyPhoto}
            style={{
              backgroundImage: getCurrentImage(),
              // 세로 스크롤은 허용, 가로 제스처는 코드가 판단
              touchAction: 'pan-y',
            }}
            // 스와이프 제스처
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUpOrCancel}
            onPointerCancel={onPointerUpOrCancel}
          >
            {/* 🔹 좌/우 엣지 탭존 */}
            <div
              className={`${styles.edgeTapZone} ${styles.edgeLeft}`}
              role="button"
              aria-label="이전 이미지"
              onPointerDown={stopPointerPropagation}
              onClick={onEdgePrevClick}
            />
            <div
              className={`${styles.edgeTapZone} ${styles.edgeRight}`}
              role="button"
              aria-label="다음 이미지"
              onPointerDown={stopPointerPropagation}
              onClick={onEdgeNextClick}
            />

            <div className={styles.imageOverlay}>
              <div className={styles.imageCounter}>
                {currentImageIndex}/{totalImages}
              </div>
              <div className={styles.imageLogo}>이어드림</div>
            </div>
          </div>
        </div>
      </div>

      {text && <div className={styles.postText}>{text}</div>}
    </div>
  );
}