"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabase/client";
// import supabaseClient from "@/supabase";

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const hash = window.location.hash; // #access_token=...&refresh_token=...
    if (!hash) {
      router.replace("/");
      return;
    }

    const params = new URLSearchParams(hash.slice(1));
    const access_token = params.get("access_token");
    const refresh_token = params.get("refresh_token");

    if (access_token && refresh_token) {
      // const supabase  = supabaseClient();
      // 토큰을 로컬 세션에 설정
      supabase.auth
        .setSession({ access_token, refresh_token })
        .then(() => router.replace("/main")); // URL 정리해서 홈으로
    } else {
      router.replace("/");
    }
  }, [router]);

  return <p>Signing you in…</p>;
}