"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { fetchUserInfo } from "@/utils/supabase/client";
import type { Relation } from "@/utils/types";
import s from "./inviteOrCreate.module.css";

// 관계 라벨 (그대로 사용)
const KIN_ROLE_LABEL_KO: Record<Relation | "", string> = {
  "": "눌러서 선택",
  son: "아들",
  daughter: "딸",
  daughter_in_law: "며느리",
  son_in_law: "사위",
  grandson: "손자",
  granddaughter: "손녀",
  nephew_or_niece: "조카",
  great_grandson: "증손자",
  great_granddaughter: "증손녀",
  spouse: "배우자",
  sibling: "형제/자매",
  other: "기타",
};

type Props = { userId: string };

export default function InviteOrCreate({ userId }: Props) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [inviteCode, setInviteCode] = useState("");
  const [relation, setRelation] = useState<Relation | "">("");

  // 초대코드 제출
  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim()) {
      alert("초대코드를 입력해주세요.");
      return;
    }
    if (!relation) {
      alert("받는 분과의 관계를 선택해주세요.");
      return;
    }

    setSubmitting(true);
    try {
      // 초대코드 + 관계와 함께 합류 페이지로
      router.push(
        `/family/join?code=${encodeURIComponent(inviteCode.trim())}&relation=${relation}`
      );
    } finally {
      setSubmitting(false);
    }
  };

  // 새 가족 생성
  const checkIsUserSinged = async () => {
    const isUser = await fetchUserInfo(userId);
    if (!isUser) {
      alert("프로필을 먼저 작성해주세요.");
      router.push(`/profile/create?to=add`);
      return;
    }
    router.push("/family/add");
  };

  return (
    <div className={s.wrap}>
      <h1 className={s.pageTitle}>가족 초대 및 생성</h1>

      {/* 초대코드 카드 */}
      <section className={s.card} aria-labelledby="inviteTitle">
        <div className={s.banner}>
          <h2 id="inviteTitle" className={s.bannerText}>
            가족에게 받은
            <br />
            초대코드가 있으신가요?
          </h2>
        </div>

        <form onSubmit={handleInvite} className={s.form}>
          <label htmlFor="inviteCode" className={s.visuallyHidden}>
            초대코드 입력
          </label>
          <input
            id="inviteCode"
            className={s.underlineInput}
            placeholder="초대코드를 입력해주세요"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value)}
          />

          <div className={s.fieldLabel}>
            리더(가족생성자)와 받는분과의 관계 <span className={s.required}>*</span>
          </div>

          <div className={s.row}>
            <div className={s.selectWrap}>
              <select
                id="relation"
                className={s.select}
                value={relation}
                onChange={(e) => setRelation(e.target.value as Relation | "")}
              >
                {Object.entries(KIN_ROLE_LABEL_KO).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
              <span className={s.chevron} aria-hidden />
            </div>

            {/* 스샷에 있는 작은 '선택' 버튼 – 실제 동작은 선택 확정/보조 역할 */}
            <button
              type="button"
              className={s.smallBtn}
              onClick={() => {
                const el = document.getElementById("relation");
                el?.focus();
              }}
            >
              선택
            </button>
          </div>

          <button
            type="submit"
            className={s.primaryBtn}
            disabled={submitting || !inviteCode.trim() || !relation}
          >
            {submitting ? "확인 중..." : "입력완료"}
          </button>
        </form>
      </section>
      {/* 새 가족 생성 카드 */}
      <section className={s.card} aria-labelledby="createTitle">
        <div className={s.banner}>
          <h2 id="createTitle" className={s.bannerText}>
            새로운 가족 그룹을
            <br />
            생성하시겠어요?
          </h2>
        </div>

        <button type="button" className={s.primaryBtn} onClick={checkIsUserSinged}>
          가족 그룹 생성하기
        </button>
      </section>
    </div>
  );
}