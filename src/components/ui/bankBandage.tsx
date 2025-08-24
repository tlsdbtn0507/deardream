'use client';

import React from 'react';

export type ProviderKey =
  | 'kakaobank'
  | 'toss'
  | 'kb'
  | 'shinhan'
  | 'woori'
  | 'nh'
  | 'hana'
  | string;

type Props = {
  provider: ProviderKey;
  size?: number;           // px
  className?: string;
};

export default function BankBadge({ provider, size = 52, className }: Props) {
  const p = provider?.toLowerCase();

  // 통일된 원형 배경 + 아이콘/텍스트
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 64 64',
    className,
    role: 'img',
    'aria-label': provider || 'bank',
  } as const;

  // 공통 원 테그
  const Circle = ({ fill }: { fill: string }) => (
    <circle cx="32" cy="32" r="31" fill={fill} />
  );

  // 텍스트 렌더 (센터 정렬)
  const CenterText = ({
    text,
    fill = '#111',
    weight = 800,
    fontSize = 26,
  }: {
    text: string;
    fill?: string;
    weight?: number;
    fontSize?: number;
  }) => (
    <text
      x="50%"
      y="50%"
      dominantBaseline="central"
      textAnchor="middle"
      fontFamily="system-ui, -apple-system, Segoe UI, Roboto, sans-serif"
      fontWeight={weight}
      fontSize={fontSize}
      fill={fill}
    >
      {text}
    </text>
  );

  // 은행별 심플 픽토그램
  if (p === 'kakaobank') {
    return (
      <svg {...common}>
        <Circle fill="#FFD500" />
        <CenterText text="B" fill="#111" fontSize={28} weight={900} />
      </svg>
    );
  }

  if (p === 'toss') {
    // Toss: 파란 배경 + 대문자 T
    return (
      <svg {...common}>
        <circle cx="32" cy="32" r="31" fill="#1740FF" />
        <text
          x="50%"
          y="50%"
          dominantBaseline="central"
          textAnchor="middle"
          fontFamily="system-ui, -apple-system, Segoe UI, Roboto, sans-serif"
          fontWeight={900}
          fontSize={28}
          fill="#fff"
        >
          T
        </text>
      </svg>
    );
  }

  if (p === 'kb') {
    // KB국민: 골드 배경 + 별(★) 느낌
    return (
      <svg {...common}>
        <Circle fill="#FFCC33" />
        <path
          d="M32 18l3.6 7.3 8 .9-6 5.6 1.5 7.9-7.1-3.9-7.1 3.9 1.5-7.9-6-5.6 8-.9L32 18z"
          fill="#6B5727"
        />
      </svg>
    );
  }

  if (p === 'shinhan') {
    // 신한: 블루 배경 + S
    return (
      <svg {...common}>
        <Circle fill="#0B4AA2" />
        <CenterText text="S" fill="#fff" fontSize={28} weight={800} />
      </svg>
    );
  }

  // Woori Bank: 파란 원 + 위로 휘어진 반달(아래는 일직선 파란색 유지)
  if (p === 'woori') {
    return (
      <svg {...common} viewBox="0 0 64 64" role="img" aria-label="Woori Bank">
        <defs>
          {/* 원 밖 넘치는 부분은 깔끔히 잘라내기 */}
          <clipPath id="wooriClip">
            <circle cx="32" cy="32" r="32" />
          </clipPath>
        </defs>

        {/* 배경 원 (브랜드 블루) */}
        <circle cx="32" cy="32" r="31" fill="#0072BC" />

        {/* 흰색 반달 밴드: 위쪽은 곡선(∪), 아래쪽은 일직선(Y=52) */}
        <g clipPath="url(#wooriClip)">
          <path
            d="
            M -4 40
            C 12 26, 52 26, 68 40
            L 68 52
            L -4 52
            Z
          "
            fill="#FFFFFF"
          />
        </g>
      </svg>
    );
  }

  if (p === 'nh') {
    // NH농협: 남색 배경 + NH
    return (
      <svg {...common}>
        <Circle fill="#0059A7" />
        <CenterText text="NH" fill="#FFD200" fontSize={20} weight={900} />
      </svg>
    );
  }

  if (p === 'hana') {
    // 하나: 청록 배경 + H
    return (
      <svg {...common}>
        <Circle fill="#009490" />
        <CenterText text="H" fill="#fff" fontSize={26} weight={900} />
      </svg>
    );
  }

  // 기타/미지정: 회색 원 + ?
  return (
    <svg {...common}>
      <Circle fill="#E5E7EB" />
      <CenterText text="?" fill="#6B7280" fontSize={26} weight={900} />
    </svg>
  );
}