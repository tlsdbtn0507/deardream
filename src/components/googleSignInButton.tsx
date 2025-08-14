// components/GoogleSignInButton.tsx
"use client";

import { useState } from "react";
import supabaseClient from "@/supabase";
import styles from "./googleBtn.module.css"; 

export default function GoogleSignInButton() {
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    setLoading(true);
    try {
      const supabase = supabaseClient();
      // 필요한 경우 redirectTo를 /auth/callback → 해당 라우트에서 세션 교환 후 홈으로 리다이렉트
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${location.origin}/auth/callback`,
          // queryParams: { prompt: "select_account" } // 계정 선택 강제하고 싶으면 사용
        },
      });
      if (error) {
        // 에러가 나면 화면상 안내만 하고 로딩 해제
        console.error(error);
        setLoading(false);
      }
      // 정상이라면 공급자 페이지로 리디렉트되므로 이후 코드는 보통 실행되지 않습니다.
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      className={styles.button}
      onClick={handleSignIn}
      disabled={loading}
    >
      <span className={styles.icon} aria-hidden="true" />
      {loading ? "구글로 이동 중…" : "Google로 계속하기"}
    </button>
  );
}