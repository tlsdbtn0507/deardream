// src/components/feed/feedCard.tsx
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
  currentImageIndex: number; // 1-based
  totalImages: number;

  onNextImage: () => void;
  onPrevImage: () => void;

  // 🔸 배경 getter
  getCurrentBg: () => string;  // url("...")
  getNextBg: () => string;
  getPrevBg: () => string;

  isAnimating: boolean;
  date?: string;
  commentCount?: number;
  text: string | null;
  onDelete?: (postId: string) => void;
}

export default function FeedCard(props: FeedCardProps) {
  const {
    postId, authorName, authorRole, authorAvatar,
    currentImageIndex, totalImages,
    onNextImage, onPrevImage,
    getCurrentBg, getNextBg, getPrevBg,
    isAnimating, date, text, onDelete
  } = props;

  const viewportRef = useRef<HTMLDivElement>(null);
  const curRef = useRef<HTMLDivElement>(null);
  const ghostRef = useRef<HTMLDivElement>(null);

  // 제스처 상태
  const gs = useRef({
    dragging: false,
    pointerId: -1 as number,
    startX: 0, startY: 0,
    lastX: 0,
    locked: null as null | 'x' | 'y',
    width: 0,
    dir: null as null | 'next' | 'prev',
  });

  const LOCK = 8, THRESH = 60, FLICK = 0.6, EDGE = 0.35;
  const setT = (el: HTMLDivElement | null, x: number, withTransition = false) => {
    if (!el) return;
    el.style.transition = withTransition ? 'transform 220ms ease' : 'none';
    el.style.transform = `translateX(${x}px)`;
  };
  const applyBg = () => {
    if (curRef.current) curRef.current.style.backgroundImage = getCurrentBg();
    // ghost는 방향에 맞춰 onPointerMove에서 세팅
  };

  const onPointerDown: React.PointerEventHandler<HTMLDivElement> = (e) => {
    if (isAnimating || totalImages === 0) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;

    const rect = viewportRef.current!.getBoundingClientRect();
    gs.current.width = rect.width;

    gs.current.dragging = true;
    gs.current.pointerId = e.pointerId;
    gs.current.startX = e.clientX;
    gs.current.startY = e.clientY;
    gs.current.lastX = e.clientX;
    gs.current.locked = null;
    gs.current.dir = null;

    viewportRef.current?.setPointerCapture(e.pointerId);
    // 현재/유령 준비
    applyBg();
    setT(curRef.current, 0, false);
    setT(ghostRef.current, gs.current.width * 2, false); // 화면 밖
  };

  const onPointerMove: React.PointerEventHandler<HTMLDivElement> = (e) => {
    if (!gs.current.dragging || isAnimating) return;

    const dx = e.clientX - gs.current.startX;
    const dy = e.clientY - gs.current.startY;

    if (!gs.current.locked) {
      if (Math.abs(dx) > LOCK || Math.abs(dy) > LOCK) {
        gs.current.locked = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
      } else return;
    }

    if (gs.current.locked === 'y') {
      // 세로 스크롤 우세
      gs.current.dragging = false;
      viewportRef.current?.releasePointerCapture(gs.current.pointerId);
      setT(curRef.current, 0, true);
      return;
    }

    e.preventDefault();

    // 방향 결정 + 유령 배경/초기 위치 세팅
    const dir = dx < 0 ? 'next' : 'prev';
    if (gs.current.dir !== dir) {
      gs.current.dir = dir;
      const ghostBg = dir === 'next' ? getNextBg() : getPrevBg();
      if (ghostRef.current) ghostRef.current.style.backgroundImage = ghostBg;
      // 유령을 옆 칸에 놓기
      const base = dir === 'next' ? gs.current.width : -gs.current.width;
      setT(ghostRef.current, base, false);
    }

    let offset = dx;
    // 가장자리 저항
    if (currentImageIndex === 1 && dx > 0) offset = dx * EDGE;
    if (currentImageIndex === totalImages && dx < 0) offset = dx * EDGE;

    // 현재와 유령을 같이 이동
    setT(curRef.current, offset, false);
    const base = gs.current.dir === 'next' ? gs.current.width : -gs.current.width;
    setT(ghostRef.current, base + offset, false);

    gs.current.lastX = e.clientX;
  };

  const finish = (commit: boolean) => {
    if (!gs.current.dir) {
      setT(curRef.current, 0, true);
      setT(ghostRef.current, gs.current.width * 2, true);
      return;
    }
    const w = gs.current.width;

    if (commit) {
      // 1) 스냅 애니메이션: current는 화면 밖, ghost는 화면 중앙
      setT(curRef.current, gs.current.dir === 'next' ? -w : w, true);
      setT(ghostRef.current, 0, true);

      // 2) 애니메이션 종료 시점에 콜백 + 배경 '복사'
      setTimeout(() => {
        // 부모 쪽 인덱스 전환
        if (gs.current.dir === 'next') onNextImage();
        else onPrevImage();

        // 🔴 핵심: ghost의 배경을 current로 복사해서 깜빡임 방지
        const ghostBg = ghostRef.current?.style.backgroundImage || '';
        if (curRef.current) curRef.current.style.backgroundImage = ghostBg;

        // 3) 다음 프레임에서 위치 초기화(transition 없이)
        requestAnimationFrame(() => {
          setT(curRef.current, 0, false);
          setT(ghostRef.current, w * 2, false); // 다시 화면 밖 대기
        });

        // 상태 초기화
        gs.current.dir = null;
      }, 220);
    } else {
      // 취소: 둘 다 원래 위치로
      setT(curRef.current, 0, true);
      setT(ghostRef.current, gs.current.dir === 'next' ? w : -w, true);
      gs.current.dir = null;
    }
  };

  const onPointerUpOrCancel: React.PointerEventHandler<HTMLDivElement> = (e) => {
    if (!gs.current.dragging) return;
    const dx = e.clientX - gs.current.startX;
    const dt = Math.max(1, Math.abs(e.timeStamp as number)); // 브라우저별 방어
    const speed = Math.abs(dx) / dt; // 대략 px/ms

    let commit = false;
    if (gs.current.locked === 'x') {
      const goNext = dx < 0 && currentImageIndex < totalImages;
      const goPrev = dx > 0 && currentImageIndex > 1;
      commit = (Math.abs(dx) > THRESH || speed > FLICK) && (goNext || goPrev);
    }
    finish(commit);

    gs.current.dragging = false;
    viewportRef.current?.releasePointerCapture(gs.current.pointerId);
  };

  const deleteImg = pageImageUrl('delete.png');
  const handleDelete: React.MouseEventHandler<HTMLImageElement> = (e) => {
    e.preventDefault();
    if (postId && confirm('이 게시물을 삭제하시겠습니까?')) onDelete?.(postId);
  };

  if (totalImages === 0) return null;

  return (
    <div className={styles.feedContainer}>
      {/* 헤더 */}
      <div className={styles.postHeader}>
        <div className={styles.postAuthor}>
          <div className={styles.authorAvatar} style={{ backgroundImage: `url(${authorAvatar})` }} />
          <div className={styles.authorInfo}>
            {date && <div className={styles.postDate}>{date.split('T')[0]}</div>}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginLeft: '0.4rem' }}>
              <span className={styles.authorName}>{authorName}</span>
              <div className={styles.authorTag}>{relationLabel(authorRole)}</div>
            </div>
          </div>
        </div>
        <div className={styles.postActions}>
          <img id={postId} src={deleteImg} alt="삭제" className={styles.actionIcon} onClick={handleDelete} />
        </div>
      </div>

      {/* 이미지 영역 */}
      <div className={styles.postImage}>
        <div className={styles.imagePlaceholder}>
          <div
            ref={viewportRef}
            className={styles.viewport}                                  // 새 컨테이너
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUpOrCancel}
            onPointerCancel={onPointerUpOrCancel}
          >
            {/* 현재/유령 두 장을 함께 이동 */}
            <div ref={curRef} className={styles.pane} style={{ backgroundImage: getCurrentBg() }} />
            <div ref={ghostRef} className={styles.pane} />
            {/* 오버레이/카운터 */}
            <button
              className={styles.edgePrev}
              aria-label="이전"
              onClick={(e) => {
                e.stopPropagation();
                gs.current.dir = 'prev';   // 방향 지정
                finish(true);              // 전환 + 위에서 콜백 호출
              }}
            />

            <button
              className={styles.edgeNext}
              aria-label="다음"
              onClick={(e) => {
                e.stopPropagation();
                gs.current.dir = 'next';
                finish(true);
              }}
            />
          </div>
        </div>
      </div>

      {text && <div className={styles.postText}>{text}</div>}
    </div>
  );
}