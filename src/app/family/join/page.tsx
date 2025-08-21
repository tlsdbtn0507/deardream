"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import s from "./invite.module.css";
import { publicImageUrl } from "@/utils/supabase/client";

export default function FamilyInvitePage() {
  const router = useRouter();
  const searchParams = new URLSearchParams(window.location.search);
  const [code, setCode] = useState('');
  const [copied, setCopied] = useState(false);

  const hero = useMemo(() => publicImageUrl("famCodeImg.png"), []);

  const copy = async () => {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      alert("복사에 실패했어요. 다시 시도해 주세요.");
    }
  };
  const logo = publicImageUrl("deardreamLogo.png");

  useEffect(() => {
    const familyInviteCode = searchParams.get("familyId") as string;
    setCode(familyInviteCode)
  },[])

  return (
    <div className={s.page}>
      <div className={s.logoBar}>
        <img src={logo} alt="디어드림 로고" className={s.logo} />
      </div>
      <div className={s.topBar} />
      <div className={s.inner}>
        <h1 className={s.title}>가족 초대</h1>

        <div className={s.heroWrap}>
          {/* 외부 URL이라 img 사용 */}
          <img src={hero} alt="가족 이미지" className={s.heroImg} />
        </div>

        <section className={s.section}>
          <p className={s.codeTitle}>나의 가족 초대 코드</p>

          <div className={s.codeRow}>
            <span className={s.codeText}>
              {code ? code.toUpperCase() : "코드 없음"}
            </span>
            {code ? (
              <button type="button" className={s.copyChip} onClick={copy}>
                {copied ? "복사됨" : "복사"}
              </button>
            ) : null}
          </div>
        </section>

        <div className={s.btns}>
          <button
            type="button"
            className={s.kakaoBtn}
            onClick={() => alert("카카오톡 초대는 추후 연결될 예정입니다.")}
          >
            카카오톡으로 초대
          </button>

          <button
            type="button"
            className={s.startBtn}
            onClick={() => router.push("/main")}
          >
            이어드림 시작하기
          </button>
        </div>
      </div>
    </div>
  );
}