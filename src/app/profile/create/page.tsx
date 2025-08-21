"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import styles from "./userProfileForm.module.css";
import { supabase } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";

type Props = {
  onSuccess?: () => void; // 저장 완료 후 후처리
};


declare global {
  interface Window {
    daum?: any;
  }
}

type FormState = {
  full_name: string;
  phone: string;
  birth_date: string; // yyyy-mm-dd
  postcode: string;
  address1: string; // 기본주소
  address2: string; // 상세주소
  profile_image: string | null; // 저장된 이미지 URL
};

export default function UserProfileForm({ onSuccess }: Props) {
  const [form, setForm] = useState<FormState>({
    full_name: "",
    phone: "",
    birth_date: "",
    postcode: "",
    address1: "",
    address2: "",
    profile_image: null,
  });

  const [loading, setLoading] = useState(false);
  const [addressReady, setAddressReady] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const router = useRouter();

  // 다음(카카오) 우편번호 스크립트 로드
  useEffect(() => {
    if (window.daum?.Postcode) {
      setAddressReady(true);
      return;
    }
    const id = "daum-postcode";
    if (document.getElementById(id)) {
      setAddressReady(true);
      return;
    }
    const s = document.createElement("script");
    s.id = id;
    s.src = "//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js";
    s.async = true;
    s.onload = () => setAddressReady(true);
    s.onerror = () => setAddressReady(false);
    document.body.appendChild(s);
  }, []);

  // 주소 검색 열기
  const openPostcode = useCallback(() => {
    if (!window.daum?.Postcode) return;
    new window.daum.Postcode({
      oncomplete: (data: any) => {
        const addr =
          data.userSelectedType === "R" ? data.roadAddress : data.jibunAddress;
        setForm((prev) => ({
          ...prev,
          postcode: data.zonecode ?? "",
          address1: addr ?? "",
        }));
      },
    }).open();
  }, []);

  const onChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      setForm((prev) => ({ ...prev, [name]: value }));
    },
    []
  );

  // 전화번호 간단 포맷팅
  const onPhoneChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    let v = e.target.value.replace(/[^\d]/g, "");
    if (v.length > 3 && v.length <= 7) v = `${v.slice(0, 3)}-${v.slice(3)}`;
    else if (v.length > 7) v = `${v.slice(0, 3)}-${v.slice(3, 7)}-${v.slice(7, 11)}`;
    setForm((p) => ({ ...p, phone: v }));
  }, []);
  
  const canSubmit = useMemo(() => {
    return (
      form.full_name.trim().length > 0 &&
      form.phone.trim().length >= 10 &&
      !!form.birth_date &&
      form.address1.trim().length > 0
    );
  }, [form]);


  // 파일 선택 → 미리보기
  const onPickFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const url = URL.createObjectURL(f);
    setPreview(url);
  }, []);


  // 프로필 이미지 업로드 (있으면)
  const uploadAvatarIfNeeded = useCallback(
    async (userId: string): Promise<string | null> => {
      const file = fileRef.current?.files?.[0];
      if (!file) return form.profile_image ?? null;

      // avatars 버킷 사용 (공개 접근 허용 권장)
      const filePath = `${userId}/${Date.now()}`;
      const { error } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true });
      if (error) {
        console.error("Upload error:", error);
        return null;
      }
      const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);
      return data.publicUrl;
    },
    [form.profile_image]
  );

  const onSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    try {
      // 세션 대신 유저 조회가 더 안전
      const { data: { user }, error: userErr } = await supabase.auth.getUser();
      
      if (userErr || !user) {
        alert("로그인이 필요합니다.");
        router.push("/login");
        return;
      }

      const avatarUrl = await uploadAvatarIfNeeded(user.id);
      const fullAddress =
        [form.postcode, form.address1, form.address2].filter(Boolean).join(" ");

      const { error } = await supabase.from("user_profiles").upsert(
        {
          user_id: user.id,
          full_name: form.full_name,
          phone: form.phone,
          birth_date: form.birth_date || null,
          address: fullAddress,
          profile_image: avatarUrl,
        },
        { onConflict: "user_id" }
      );

      if (error) {
        console.error(error);
        alert("저장 중 오류가 발생했어요.");
        return;
      }

      alert("정보가 저장되었습니다.");
      onSuccess?.();
      const to = new URLSearchParams(window.location.search).get("to");
      router.push(to ? `/family/${to}` : "/main");
    } finally {
      setLoading(false);
    }
  }, [canSubmit, form, onSuccess, uploadAvatarIfNeeded, router]);
  return (
    <form className={styles.form} onSubmit={onSubmit}>
      <h2 className={styles.title}>기본 정보</h2>

      {/* 프로필 이미지 */}
      <div className={styles.avatarRow}>
        <div className={styles.avatar}>
          {preview || form.profile_image ? (
            <img
              src={preview ?? form.profile_image ?? ""}
              alt="프로필 미리보기"
              className={styles.avatarImg}
            />
          ) : (
            <div className={styles.avatarPlaceholder}>사진</div>
          )}
        </div>
        <div className={styles.avatarBtns}>
          <label className={styles.secondaryBtn}>
            사진 선택
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={onPickFile}
              className={styles.hidden}
            />
          </label>
          {preview && (
            <button
              type="button"
              className={styles.tertiaryBtn}
              onClick={() => {
                if (fileRef.current) fileRef.current.value = "";
                setPreview(null);
              }}
            >
              제거
            </button>
          )}
        </div>
      </div>

      <label className={styles.label}>
        <span>이름</span>
        <input
          className={styles.input}
          name="full_name"
          value={form.full_name}
          onChange={onChange}
          placeholder="이름을 입력하세요"
          required
        />
      </label>

      <label className={styles.label}>
        <span>전화번호</span>
        <input
          className={styles.input}
          name="phone"
          value={form.phone}
          onChange={onPhoneChange}
          inputMode="tel"
          placeholder="010-0000-0000"
          required
        />
      </label>

      <label className={styles.label}>
        <span>생년월일</span>
        <input
          className={styles.input}
          type="date"
          name="birth_date"
          value={form.birth_date}
          onChange={onChange}
          required
        />
      </label>

      {/* 주소 */}
      <div className={styles.addressRow}>
        <label className={styles.label} style={{ flex: 1 }}>
          <span>우편번호</span>
          <input
            className={styles.input}
            name="postcode"
            value={form.postcode}
            onChange={onChange}
            placeholder="우편번호"
            readOnly
          />
        </label>
        <button
          type="button"
          onClick={openPostcode}
          className={styles.findButton}
          disabled={!addressReady}
          aria-disabled={!addressReady}
        >
          주소 검색
        </button>
      </div>

      <label className={styles.label}>
        <span>주소</span>
        <input
          className={styles.input}
          name="address1"
          value={form.address1}
          onChange={onChange}
          placeholder="도로명 또는 지번"
          readOnly
        />
      </label>

      <label className={styles.label}>
        <span>상세 주소</span>
        <input
          className={styles.input}
          name="address2"
          value={form.address2}
          onChange={onChange}
          placeholder="동/호수 등"
        />
      </label>

      <button type="submit" className={styles.submit} disabled={!canSubmit || loading}>
        {loading ? "저장 중…" : "저장하기"}
      </button>
    </form>
  );
}