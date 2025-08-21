"use client";

// import { useSearchParams } from "react-router-dom";
import Link from "next/link";

export default function FailPage() {
  // const [searchParams] = useSearchParams();
  const searchParams = new URLSearchParams(window.location.search);

  return (
    <div className="result wrapper">
      <div className="box_section">
        <h2>
          결제 실패
        </h2>
        <p>{`에러 코드: ${searchParams.get("code")}`}</p>
        <p>{`실패 사유: ${searchParams.get("message")}`}</p>
        <p>결제에 실패했습니다. 다시 시도해주세요.</p>
        <Link href="/family/add">
          <button className="btn primary">가족 생성 페이지로 돌아가기</button>
        </Link>
      </div>
    </div>
  );
}