'use client';

import React, { useRef, useState, useCallback } from 'react';
import { relationLabel } from '@/utils/types';
import s from '../css/profileSection.module.css';

export type Profile = {
  id: string;
  name: string;
  relation: string;
  avatarUrl?: string;   
};

type Props = {
  profiles: Profile[];
  selectedIndex: string;
  onSelect: (index: number) => void;
  className?: string;
};

export default function ProfileSection({
  profiles,
  selectedIndex,
  onSelect,
  className,
}: Props) {
  const listRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    if (!listRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - listRef.current.offsetLeft);
    setScrollLeft(listRef.current.scrollLeft);
  }, []);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !listRef.current) return;
    e.preventDefault();
    const x = e.pageX - listRef.current.offsetLeft;
    const walk = (x - startX) * 2;
    listRef.current.scrollLeft = scrollLeft - walk;
  }, [isDragging, startX, scrollLeft]);

  const onMouseUpOrLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (!listRef.current) return;
    setIsDragging(true);
    setStartX(e.touches[0].pageX - listRef.current.offsetLeft);
    setScrollLeft(listRef.current.scrollLeft);
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging || !listRef.current) return;
    const x = e.touches[0].pageX - listRef.current.offsetLeft;
    const walk = (x - startX) * 2;
    listRef.current.scrollLeft = scrollLeft - walk;
  }, [isDragging, startX, scrollLeft]);

  const onTouchEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  console.log(profiles);
  

  return (
    <div className={`${s.profileSection} ${className ?? ''}`}>
      <div
        ref={listRef}
        className={`${s.profileList} ${isDragging ? s.dragging : ''}`}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUpOrLeave}
        onMouseLeave={onMouseUpOrLeave}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {
          profiles.length !== 0 &&
          profiles.map((p, i) => (
          <button
            key={`${p.name}-${i}`}
            type="button"
            className={`${s.profileItem} ${selectedIndex === p.id ? s.selected : ''}`}
            onClick={() => onSelect(i)}
          >
            <div className={s.profileCircle} style={{ backgroundImage: p.avatarUrl ? `url(${p.avatarUrl})` : undefined }}>
              {selectedIndex === p.id && <div className={s.selectedIndicator} />}
            </div>
              <span className={s.profileName}>{!p.name ? relationLabel(p.relation) : p.name}</span>
          </button>
          ))
        }
      </div>
    </div>
  );
}