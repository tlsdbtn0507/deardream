// app/page.tsx
import Link from "next/link";

export default function Home() {
  return (
    <main className="hero">
      <section className="card" aria-labelledby="hero-title">
        <div className="brand">
          <span className="logo" aria-hidden="true" />
          디어드림 DeerDream
        </div>

        <h1 id="hero-title" className="h1">
          가족과 함께 쌓는 기록,
          <br /> 오늘부터 디어드림으로.
        </h1>

        <p className="p">
          가족 그룹을 만들고 서로의 일상을 공유하세요. 사진과 글로 남기는 작은 순간들이
          모여 우리만의 스토리가 됩니다.
        </p>

        <div className="actions">
          {/* 시작하기 → 온보딩/로그인 경로로 연결하세요. */}
          <Link href="/login" className="btn" prefetch>
            시작하기
          </Link>

        </div>
      </section>
    </main>
  );
}