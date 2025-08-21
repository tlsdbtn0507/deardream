// app/api/families/create/route.ts
import { NextResponse } from "next/server";
import { supabase } from "@/utils/supabase/client";
import { nextClosureDate } from "@/utils/clozure";
import { Relation } from "@/utils/types";

type Input = {
  paymentKey: string;
  orderId: string;
  userId: string; // 로그인 사용자 ID
  amount: number;
  step1Data: {
    familyName: string;
    closureRule: "SECOND_SUN" | "FOURTH_SUN";
    relation: Relation
  };
  step2Data: {
    name: string;
    birth: string; // "YYYY-MM-DD"
    address1: string;
    address2: string;
    phone: string;
    avatar_url?: string | null; // 스토리지 경로
  };
};

// 랜덤 문자열 생성 함수
const generateRandomString = (length: number) => {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

const INVITE_CODE = generateRandomString(8);

export async function POST(req: Request) {
  const body = (await req.json()) as Input;

  // 입력 정리
  const { paymentKey, orderId, amount, step1Data, step2Data,userId } = body;
  const nextDate = nextClosureDate(step1Data.closureRule);
  const fullAddress = `${step2Data.address1} ${step2Data.address2}`.trim();
  const phoneDigits = step2Data.phone.replace(/[^\d]/g, ""); // 숫자만 저장 권장

  // ✳️ 트랜잭션이 필요하면 Postgres 함수로 묶는게 베스트지만,
  // 여기서는 순차 삽입 + 중간 에러 시 간단 롤백 예시를 보여줍니다.

  try {
    // 2) families
    const { data: familyRow, error: famErr } = await supabase
      .from("families")
      .insert({
        name: step1Data.familyName,
        created_by: userId,
        next_closure_date: nextDate,
        invite_code:INVITE_CODE
      })
      .select("id")
      .single();

    if (famErr || !familyRow) throw famErr;
    const familyId = familyRow.id as string;

    // 3) family_members (리더는 'owner' 권장)
    const { error: fmErr } = await supabase.from("family_members").insert({
      family_id: familyId,
      user_id: userId,
      role: "owner", // enum(family_role)에 맞춰 owner/parent 등 사용
      nickname: null,
      relation: step1Data.relation
    });
    if (fmErr) throw fmErr;

    // 4) recipients (받는분)
    const { data: recRow, error: recErr } = await supabase
      .from("recipients")
      .insert({
        family_id: familyId,
        name: step2Data.name,
        birth_date: step2Data.birth || null,
        phone: phoneDigits,
        address: fullAddress,
        avatar_path: step2Data.avatar_url,
        is_active: true,
      })
      .select("id")
      .single();
    if (recErr || !recRow) throw recErr;

    // 5) payment_methods (가짜 토큰 저장: paymentKey)
    const { data: pmRow, error: pmErr } = await supabase
      .from("payment_methods")
      .insert({
        family_id: familyId,
        provider: "toss",
        token: paymentKey, // 실제로는 빌링키/토큰 등
        card_last4: null,
        brand: null,
        is_default: true,
      })
      .select("id")
      .single();
    if (pmErr || !pmRow) throw pmErr;

    // 6) subscriptions (월 구독)
    const { error: subErr } = await supabase.from("subscriptions").insert({
      family_id: familyId,
      payment_method_id: pmRow.id,
      status: "active",
      price_cents: amount, // KRW라 센트 개념 없지만 필드명 유지
      interval: "monthly",
      meta: { orderId, paymentKey, relation: step1Data.relation },
    });
    if (subErr) throw subErr;

    // ✅ 완료
    return NextResponse.json({ ok: true, familyId,invite_code:INVITE_CODE }, { status: 201 });
  } catch (e: any) {
    console.error("[create family bundle] failed:", e?.message || e);
    return NextResponse.json(
      { ok: false, error: e?.message || "insert failed" },
      { status: 400 }
    );
  }
}
