"use client";

import { useState } from "react";
import { useRouter } from 'next/navigation';
import { fetchUserInfo } from "@/utils/supabase/client";

import s from "./inviteOrCreate.module.css";

type Props = {
  userId:string
};

export default function InviteOrCreate({
  userId,
}: Props) {
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
  };

  const onCreateFamily = () => {
    router.push("/family/add")
  };

  const checkIsUserSinged = async (event) => {
    event.preventDefault();
    const isUserSigned = await fetchUserInfo(userId);
    const toWhere = event.target.id;
    if (!isUserSigned) {
      alert("프로필을 먼저 작성해주세요.");
      router.push(`/profile/create?to=${toWhere}`);
      return
    }
    router.push(`/family/${toWhere}`);
  }

  return (
    <div className={s.wrap}>
      {/* 초대코드 카드 */}
      <section className={s.card} aria-labelledby="inviteTitle">
        <h2 id="inviteTitle" className={s.title}>
          가족에게 받은
          <br />
          초대코드가 있으신가요?
        </h2>

        <form onSubmit={handleInvite} className={s.form}>
          <label htmlFor="inviteCode" className={s.visuallyHidden}>
            초대코드 입력
          </label>
          <input
            id="inviteCode"
            className={s.input}
            placeholder="초대코드를 입력해주세요"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
          />

          <button
            type="submit"
            className={s.primaryBtn}
          >
            { submitting ? "확인 중..." : "입력하기"}
          </button>
        </form>
      </section>

      {/* 새 가족 생성 카드 */}
      <section className={s.card} aria-labelledby="createTitle">
        <h2 id="createTitle" className={s.title}>
          새로운 가족그룹을
          <br />
          생성하시겠어요?
        </h2>

        <button
          type="button"
          className={s.primaryBtn}
          onClick={checkIsUserSinged}
          id="add"
        >
        가족그룹 생성하기
        </button>
      </section>
    </div>
  );
}