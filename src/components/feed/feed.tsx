'use client';

import { useState, useEffect, useCallback } from 'react';
import FeedCard from './feedCard';
import { PostType } from '@/utils/types';

export default function FeedComponent({
  postProps,
  onDelete,
}: {
  postProps: PostType;
  onDelete?: (id: string) => void;
}) {
  const totalImages = postProps.images?.length ?? 0;

  // 1-based index
  const [currentImageIndex, setCurrentImageIndex] = useState(1);

  // 이미지 배열 바뀌면 인덱스 범위 보정
  useEffect(() => {
    if (totalImages === 0) {
      setCurrentImageIndex(0);
    } else if (currentImageIndex < 1) {
      setCurrentImageIndex(1);
    } else if (currentImageIndex > totalImages) {
      setCurrentImageIndex(totalImages);
    }
  }, [totalImages]);

  // 프리로드로 깜빡임 최소화
  useEffect(() => {
    postProps.images?.forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  }, [postProps.images]);

  // 배경 이미지 헬퍼: 1-based index만 받음 (범위 밖이면 clamp)
  const getBgAt = useCallback(
    (index1: number) => {
      if (totalImages === 0) return 'none';
      const i = Math.min(Math.max(index1, 1), totalImages);
      const src = postProps.images[i - 1];
      return `url("${src}")`;
    },
    [postProps.images, totalImages]
  );

  // 전환 커밋 시 부모 인덱스 갱신 (끝에서 더는 넘어가지 않음)
  const commitNext = useCallback(() => {
    setCurrentImageIndex((i) => Math.min(i + 1, totalImages));
  }, [totalImages]);

  const commitPrev = useCallback(() => {
    setCurrentImageIndex((i) => Math.max(i - 1, 1));
  }, []);

  return (
    <FeedCard
      postId={postProps.id}
      authorName={(postProps.author_name ?? '') as string}
      authorRole={(postProps.author_relation ?? '') as string}
      authorAvatar={(postProps.author_profile_image ?? '') as string}
      date={postProps.created_at}
      text={postProps.body}
      commentCount={postProps.images?.length ?? 0}
      onDelete={onDelete}
      // 슬라이더 필수 props
      currentImageIndex={currentImageIndex}
      totalImages={totalImages}
      getBgAt={getBgAt}
      onCommitNext={commitNext}
      onCommitPrev={commitPrev}
    />
  );
}