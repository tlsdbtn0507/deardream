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
  date?: string;
  commentCount?: number;
  text: string | null;
  onDelete?: (postId: string) => void;

  // 슬라이더용
  currentImageIndex: number;         // 1-based
  totalImages: number;
  getBgAt: (index1Based: number) => string;
  onCommitNext: () => void;          // 전환 끝나고 부모 인덱스 +1
  onCommitPrev: () => void;          // 전환 끝나고 부모 인덱스 -1
}

export default function FeedCard({
  postId,
  authorName,
  authorRole,
  authorAvatar,
  date,
  text,
  onDelete,
  // slider
  currentImageIndex,
  totalImages,
  getBgAt,
  onCommitNext,
  onCommitPrev,
}: FeedCardProps) {
  const deleteImg = pageImageUrl('delete.png');

  // 두 개의 패널을 번갈아 "현재/고스트"로 사용
  const paneARef = useRef<HTMLDivElement>(null);
  const paneBRef = useRef<HTMLDivElement>(null);
  // 현재 역할이 A인지 여부 (true면 A=current, B=ghost)
  const useAAsCurrent = useRef(true);
  const slidingRef = useRef(false);
  const widthRef = useRef(0);

  // 제스처 상태
  const gs = useRef({
    dragging: false,
    pointerId: -1 as number,
    startX: 0,
    startY: 0,
    lastX: 0,
    startTime: 0,
    locked: null as null | 'x' | 'y',
    dir: null as null | 'next' | 'prev',
    width: 0,
  });

  const LOCK = 8;     // 방향 잠금 임계
  const SWIPE = 60;   // 거리 임계
  const FLICK = 0.6;  // px/ms
  const EDGE_RESIST = 0.35;
  const ANIM_MS = 220;

  const curPane = () => (useAAsCurrent.current ? paneARef.current : paneBRef.current);
  const ghostPane = () => (useAAsCurrent.current ? paneBRef.current : paneARef.current);

  const setT = (el: HTMLDivElement | null, x: number, withTransition: boolean) => {
    if (!el) return;
    el.style.transition = withTransition ? `transform ${ANIM_MS}ms ease` : 'none';
    el.style.transform = `translate3d(${x}px,0,0)`;
  };

  // 전환 시작(버튼/제스처 공용). 끝/처음에서는 작동 안함.
  const startSlide = (dir: 'next' | 'prev') => {
    if (slidingRef.current || totalImages <= 1) return;
    const atFirst = currentImageIndex <= 1;
    const atLast = currentImageIndex >= totalImages;
    if ((dir === 'next' && atLast) || (dir === 'prev' && atFirst)) return;

    const cur = curPane();
    const ghost = ghostPane();
    if (!cur || !ghost) return;

    slidingRef.current = true;

    const w = cur.clientWidth || widthRef.current || 0;
    widthRef.current = w;

    // 전환 시작 전에 배경 세팅 (깜빡임 방지)
    cur.style.transition = 'none';
    cur.style.backgroundImage = getBgAt(currentImageIndex);

    ghost.style.transition = 'none';
    ghost.style.backgroundImage =
      dir === 'next' ? getBgAt(currentImageIndex + 1) : getBgAt(currentImageIndex - 1);
    ghost.style.transform = `translate3d(${dir === 'next' ? w : -w}px,0,0)`;

    // 다음 프레임에 애니메이션 시작
    requestAnimationFrame(() => {
      cur.style.transition = `transform ${ANIM_MS}ms ease`;
      ghost.style.transition = `transform ${ANIM_MS}ms ease`;

      cur.style.transform = `translate3d(${dir === 'next' ? -w : w}px,0,0)`;
      ghost.style.transform = `translate3d(0,0,0)`;

      const onEnd = () => {
        // 역할 스왑
        useAAsCurrent.current = !useAAsCurrent.current;

        // 새로운 ghost는 오른쪽 대기 (배경은 그대로 두어 깜빡임 방지)
        const ng = ghostPane();
        if (ng) {
          ng.style.transition = 'none';
          ng.style.transform = `translate3d(${w}px,0,0)`;
          // 배경은 건드리지 않음
        }

        // 부모 인덱스 갱신
        if (dir === 'next') onCommitNext();
        else onCommitPrev();

        slidingRef.current = false;
        cur.removeEventListener('transitionend', onEnd);
      };

      // current가 화면 밖으로 나가는 전환 완료 시점에 동기화
      cur.addEventListener('transitionend', onEnd, { once: true });
    });
  };

  // 제스처 핸들러
  const onPointerDown: React.PointerEventHandler<HTMLDivElement> = (e) => {
    if (slidingRef.current || totalImages === 0) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;

    gs.current.dragging = true;
    gs.current.pointerId = e.pointerId;
    gs.current.startX = e.clientX;
    gs.current.startY = e.clientY;
    gs.current.lastX = e.clientX;
    gs.current.startTime = performance.now();
    gs.current.locked = null;
    gs.current.dir = null;
    const cur = curPane();
    gs.current.width = cur?.clientWidth || 0;

    cur?.setPointerCapture(e.pointerId);

    // 이동 예정이므로 transition 제거
    setT(curPane(), 0, false);
    // ghost는 일단 밖으로
    setT(ghostPane(), (gs.current.width || 0) * 2, false);
  };

  const onPointerMove: React.PointerEventHandler<HTMLDivElement> = (e) => {
    if (!gs.current.dragging || slidingRef.current) return;

    const dx = e.clientX - gs.current.startX;
    const dy = e.clientY - gs.current.startY;

    // 방향 잠금
    if (!gs.current.locked) {
      if (Math.abs(dx) > LOCK || Math.abs(dy) > LOCK) {
        gs.current.locked = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
      } else {
        return;
      }
    }

    if (gs.current.locked === 'y') {
      // 세로 스크롤 우세 → 취소
      gs.current.dragging = false;
      curPane()?.releasePointerCapture(gs.current.pointerId);
      setT(curPane(), 0, true);
      setT(ghostPane(), (gs.current.width || 0) * 2, false);
      return;
    }

    e.preventDefault();

    // 방향 최초 결정: 고스트 준비
    if (!gs.current.dir) {
      gs.current.dir = dx < 0 ? 'next' : 'prev';

      // 끝/처음에서의 저항만 주고, 실제 이동은 허용 (커밋 단계에서 거부)
      const cur = curPane();
      const ghost = ghostPane();
      if (cur && ghost) {
        ghost.style.backgroundImage =
          gs.current.dir === 'next'
            ? getBgAt(currentImageIndex + 1)
            : getBgAt(currentImageIndex - 1);
        setT(ghost, gs.current.dir === 'next' ? gs.current.width : -gs.current.width, false);
      }
    }

    let offset = dx;
    // 가장자리 저항
    const atFirst = currentImageIndex <= 1;
    const atLast = currentImageIndex >= totalImages;
    if ((atFirst && dx > 0) || (atLast && dx < 0)) {
      offset = dx * EDGE_RESIST;
    }

    setT(curPane(), offset, false);
    const ghostBase = gs.current.dir === 'next' ? gs.current.width : -gs.current.width;
    setT(ghostPane(), ghostBase + offset, false);

    gs.current.lastX = e.clientX;
  };

  const finishGesture = (commit: boolean) => {
    const dir = gs.current.dir;
    if (!dir) {
      // 방향 안 정해졌으면 원복
      setT(curPane(), 0, true);
      setT(ghostPane(), (gs.current.width || 0) * 2, false);
      return;
    }

    const w = gs.current.width;

    if (commit) {
      // 실제 startSlide와 동일 애니 경로로 진행
      // 버튼과 동일한 코드 경로를 쓰도록 통일
      startSlide(dir);
    } else {
      // 원복
      setT(curPane(), 0, true);
      setT(ghostPane(), dir === 'next' ? w : -w, true);
    }
  };

  const onPointerUpOrCancel: React.PointerEventHandler<HTMLDivElement> = (e) => {
    if (!gs.current.dragging) return;

    const dx = e.clientX - gs.current.startX;
    const dt = Math.max(1, performance.now() - gs.current.startTime);
    const speed = Math.abs(dx) / dt;

    const atFirst = currentImageIndex <= 1;
    const atLast = currentImageIndex >= totalImages;

    let canCommit = true;
    if (gs.current.dir === 'next' && atLast) canCommit = false;
    if (gs.current.dir === 'prev' && atFirst) canCommit = false;

    const pass = (Math.abs(dx) > SWIPE || speed > FLICK) && canCommit;

    finishGesture(pass);

    gs.current.dragging = false;
    curPane()?.releasePointerCapture(gs.current.pointerId);
  };

  // 삭제
  const removePost: React.MouseEventHandler<HTMLImageElement> = (e) => {
    e.preventDefault();
    if (!postId) return;
    if (confirm('이 게시물을 삭제하시겠습니까?')) {
      onDelete?.(postId);
    }
  };

  // 버튼 클릭 → 동일 경로(transitionend 동기화)로 실행
  const clickPrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    startSlide('prev');
  };
  const clickNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    startSlide('next');
  };

  if (totalImages === 0) return null;

  // 현재/고스트 초기 배경 세팅(첫 렌더 시)
  const curStyle = { backgroundImage: getBgAt(currentImageIndex) };
  const ghostStyle = { backgroundImage: getBgAt(Math.min(currentImageIndex + 1, totalImages)) };

  return (
    <div className={styles.feedContainer}>
      {/* 헤더 */}
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

      {/* 이미지 영역 */}
      <div className={styles.postImage}>
        <button
          className={styles.edgePrev}
          aria-label="이전"
          onClick={clickPrev}
          disabled={currentImageIndex <= 1}
          style={{ opacity: currentImageIndex <= 1 ? 0.4 : 1 }}
        >
          ‹
        </button>

        <div className={styles.imageStage}>
          {/* 현재 패널 */}
          <div
            ref={paneARef}
            className={styles.slidePane}
            style={useAAsCurrent.current ? curStyle : ghostStyle}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUpOrCancel}
            onPointerCancel={onPointerUpOrCancel}
          >
            <div className={styles.imageOverlay}>
              <div className={styles.imageLogo}>이어드림</div>
            </div>
          </div>

          {/* 고스트 패널 */}
          <div
            ref={paneBRef}
            className={`${styles.slidePane} ${styles.ghost}`}
            style={useAAsCurrent.current ? ghostStyle : curStyle}
            aria-hidden
          />
        </div>

        <button
          className={styles.edgeNext}
          aria-label="다음"
          onClick={clickNext}
          disabled={currentImageIndex >= totalImages}
          style={{ opacity: currentImageIndex >= totalImages ? 0.4 : 1 }}
        >
          ›
        </button>
      </div>

      {/* 페이지 라벨 */}
      <div className={styles.pagePill}>
        <b>{currentImageIndex}</b>&nbsp;/&nbsp;{totalImages}
      </div>

      {/* 본문 */}
      {text && <div className={styles.postText}>{text}</div>}
    </div>
  );
}