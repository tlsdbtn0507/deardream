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
  getCurrentImage: () => string; // css background-image 값 (url("...")) 형태를 반환한다고 가정
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

  // 제스처 상태를 ref로 관리 (re-render 최소화)
  const gs = useRef({
    dragging: false,
    pointerId: -1 as number,
    startX: 0,
    startY: 0,
    lastX: 0,
    startTime: 0,
    locked: null as null | 'x' | 'y',
  });

  const SWIPE_DISTANCE = 60;      // 거리 임계치(px)
  const LOCK_THRESHOLD = 8;       // 방향 잠금 임계치(px)
  const FLICK_SPEED = 0.6;        // px/ms (빠르게 튕기면 거리 짧아도 전환)
  const EDGE_RESIST = 0.35;       // 끝에서 반탄 비율

  const setTransform = (x: number, instant = false) => {
    const el = slideEl.current;
    if (!el) return;
    if (instant) {
      el.style.transition = 'none';
    } else {
      el.style.transition = 'transform 220ms ease';
    }
    el.style.transform = `translateX(${x}px)`;
  };

  const resetTransform = () => setTransform(0, false);

  const onPointerDown: React.PointerEventHandler<HTMLDivElement> = (e) => {
    if (isAnimating || totalImages === 0) return;
    // 멀티포인터/보조버튼 제외
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

    // 아직 방향 잠금이 안 됐다면 결정
    if (!gs.current.locked) {
      if (Math.abs(dx) > LOCK_THRESHOLD || Math.abs(dy) > LOCK_THRESHOLD) {
        gs.current.locked = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
      } else {
        return;
      }
    }

    // 세로 스크롤 우세 → 슬라이드 취소, transform 원복
    if (gs.current.locked === 'y') {
      gs.current.dragging = false;
      slideEl.current?.releasePointerCapture(gs.current.pointerId);
      resetTransform();
      return;
    }

    // 가로 슬라이드 우세
    e.preventDefault(); // 가로 슬라이드 중엔 브라우저 스크롤 방지

    let offset = dx;
    // 첫 장에서 오른쪽으로, 마지막 장에서 왼쪽으로 끌면 저항
    if (currentImageIndex === 1 && dx > 0) {
      offset = dx * EDGE_RESIST;
    } else if (currentImageIndex === totalImages && dx < 0) {
      offset = dx * EDGE_RESIST;
    }

    setTransform(offset, true);
    gs.current.lastX = e.clientX;
  };

  const finishSwipe = (dir: 'next' | 'prev') => {
    // 살짝 스냅 애니메이션 후 콜백
    const SNAP = dir === 'next' ? -40 : 40;
    setTransform(SNAP, false);
    // 애니메이션 프레임 뒤에 원복 + 이미지 전환
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (dir === 'next') onNextImage(); else onPrevImage();
        // 다음 이미지로 바뀌면 배경이미지 자체가 바뀌므로 transform 0으로
        setTransform(0, true);
      });
    });
  };

  const onPointerUpOrCancel: React.PointerEventHandler<HTMLDivElement> = (e) => {
    if (!gs.current.dragging) return;

    const dx = e.clientX - gs.current.startX;
    const dt = Math.max(1, performance.now() - gs.current.startTime);
    const speed = Math.abs(dx) / dt; // px/ms

    // 결정되지 않았거나 세로 락이면 그냥 리셋
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

  if (totalImages === 0) return null;

  const deleteImg = pageImageUrl('delete.png');

  const removePost: React.MouseEventHandler<HTMLImageElement> = async (e) => {
    e.preventDefault();
    if (!postId) return;
    if (confirm('이 게시물을 삭제하시겠습니까?')) {
      // 외부에서 받는 onDelete만 호출 (실제 삭제 로직은 상위에서)
      onDelete?.(postId);
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
            style={{ backgroundImage: getCurrentImage() }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUpOrCancel}
            onPointerCancel={onPointerUpOrCancel}
          >
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