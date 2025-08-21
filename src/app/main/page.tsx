"use client";

import { useEffect, useState } from "react";
import { supabase, fetchUserFamily, fetchUserInfo } from "@/utils/supabase/client";
import { useRouter } from 'next/navigation';
import { FamilyMember } from "@/utils/types";

import InviteOrCreate from "@/components/family/inviteOrCreate"

import Link from "next/link";



export default function Main() {
  const [userName, setUserName] = useState("");
  const [userUid, setUserUid] = useState("");
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]); // 가족 구성원 정보 저장용
  const router = useRouter();


  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert("로그인이 필요합니다.");
        router.push("/");
        return;
      }
      console.log(session)
      setUserName(session.user.user_metadata?.name ?? "");
      setUserUid(session.user.id);      // 여기까지만
    })();
  }, [router]);

  useEffect(() => {
    const isUserHasFamily = async () => {
      if (!userUid) return;               // uid가 생긴 뒤에만 실행
      const isFamilySet = await fetchUserFamily(userUid) as FamilyMember[];
      setFamilyMembers(isFamilySet);
    }
    isUserHasFamily();
  }, [userUid]);



  return (
    <div>
      <h1>Main Page</h1>
      <p>반갑습니다! {userName}님</p>
      { familyMembers.length > 0 ? (
        <div>
          <h2>가족 구성원</h2>
        </div>
      ) : (
          <InviteOrCreate userId={userUid} />
        // <div>
        //   <h2>가족 구성원이 없습니다.</h2>
        //     <p>가족을 추가해보세요!</p>
        //     <button id="add" onClick={checkIsUserSinged}>가족 생성하기</button>
        //     <button id="join" onClick={checkIsUserSinged}>가족 참여하기</button>
        // </div>
      )}
    </div>
  )
}