"use client";

import s from "./familyCreateWiz.module.css";

import { Relation } from "@/utils/types";
import { useMemo, useState, useEffect, useCallback,useRef } from "react";
import { useRouter } from "next/navigation";
import { publicImageUrl, isFamilyNameDuplicated, supabase } from "@/utils/supabase/client";
import { koToQwerty } from "@/utils/util";

import CheckoutPage from "@/components/pay/checkOut"; // 결제 위젯 컴포넌트

type Step = "FAMILY" | "RECIPIENT" | "PAYMENT";

type Step1Values = {
  familyName: string;
  closureRule: "SECOND_SUN" | "FOURTH_SUN";
  relation: string;
  kinRole: string;
};

type Step2Values = {
  name: string;
  birth: string;
  address1: string;
  address2: string;
  phone: string;
  avatar?: File | null;
  avatarPreview?: string | null;
};

const KIN_ROLE_LABEL_KO: Record<Relation, string> = {
  '': '눌러서 선택',
  son: '아들',
  daughter: '딸',
  daughter_in_law: '며느리',
  son_in_law: '사위',
  grandson: '손자',
  granddaughter: '손녀',
  nephew_or_niece: '조카',
  great_grandson: '증손자',
  great_granddaughter: '증손녀',
  spouse: '배우자',
  sibling: '형제/자매',
  other: '기타',
};

export default function FamilyCreateWizard({
  autoAdvanceToPayment = false,   // ✅ 2단계 유효 시 자동 결제 단계로
}: {
  onComplete?: (data: { step1: Step1Values; step2: Step2Values }) => void;
  autoAdvanceToPayment?: boolean;
}) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("FAMILY");
  const [addressReady, setAddressReady] = useState(false);
  
  // const sp = useSearchParams();
  let sp;
  // src/lib/paymentParams.ts
  type ValidPaymentParams = { ok: boolean; paymentKey: string; orderId: string; amount: number };

  const [parsed, setParsed] = useState<ValidPaymentParams>({
    ok: false, paymentKey: "", orderId: "", amount: 0,
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    setParsed(parseAndValidatePaymentParams(params));
  }, []);


  function parseAndValidatePaymentParams(sp: URLSearchParams) {
    const paymentKey = sp.get("paymentKey") ?? "";
    const orderId = sp.get("orderId") ?? "";
    const amountStr = sp.get("amount") ?? "";
    const amount = Number(amountStr);

    const ok =
      paymentKey.length > 0 &&
      orderId.length > 0 &&
      Number.isFinite(amount) &&
      amount > 0;

    return { ok, paymentKey, orderId, amount } as {
      ok: boolean;
      paymentKey: string;
      orderId: string;
      amount: number;
    };
  }

  // 다음(카카오) 우편번호 스크립트 로드
  useEffect(() => {
    sp = new URLSearchParams(window.location.search);
    if ((window as any).daum?.Postcode) {
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
    // https 명시!
    s.src = "https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js";
    s.async = true;
    s.onload = () => setAddressReady(true);
    s.onerror = () => setAddressReady(false);
    document.body.appendChild(s);
  }, []);


  const [step1, setStep1] = useState<Step1Values>({
    familyName: "",
    closureRule: "SECOND_SUN",
    relation: "",
    kinRole: "",
  });

  const [step2, setStep2] = useState<Step2Values>({
    name: "",
    birth: "",
    address1: "",
    address2: "",
    phone: "",
    avatar: null,
    avatarPreview: null,
  });

  const [familyNameChecked, setFamilyNameChecked] = useState("중복확인");
  const [userInputFam, setUserInputFam] = useState<string>("");
  // 컴포넌트 내부
  const fileRef = useRef<HTMLInputElement>(null);
  // const parsed = useMemo(() => parseAndValidatePaymentParams(sp as any), [sp]);
  // 파일 상단
  const confirmOnceRef = useRef(false);
  const advancedOnceRef = useRef(false);


  const canNext1 = useMemo(
    () => familyNameChecked === "사용 가능" && step1.relation !== "",
    [familyNameChecked, step1.relation]
  );

  const canNext2 = useMemo(() => {
    return Boolean(
      step2.name.trim() &&
      step2.birth &&
      step2.address1.trim() &&
      step2.phone.trim()
    );
  }, [step2]);

  useEffect(() => {
    const parsedOk = parsed.ok;        // 의존성 단순화
    if (advancedOnceRef.current) return;

    if ((autoAdvanceToPayment && step === "RECIPIENT" && canNext2) || parsedOk) {
      advancedOnceRef.current = true;
      setStep("PAYMENT");
    }
  }, [autoAdvanceToPayment, step, canNext2, parsed.ok]);

  // 결제 확정 트리거 (한 번만)
  useEffect(() => {
    if (step !== "PAYMENT") return;
    if (!parsed.ok) return;
    if (confirmOnceRef.current) return;

    confirmOnceRef.current = true;
    (async () => {
      try { await confirmPayment(); }
      finally {
        // 필요하면 한 번만 유지
        confirmOnceRef.current = false;
      }
    })();
  }, [step, parsed.ok]);

  const handleAvatarChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setStep2((prev) => ({
      ...prev,
      avatar: file,
      avatarPreview: URL.createObjectURL(file),
    }));
  };

  const logo = publicImageUrl("deardreamLogo.png");
  // 제로-위드 문자 제거
  const stripZeroWidth = (s: string) => s.replace(/[\u200B-\u200D\uFEFF]/g, '');

  const isKorean10Less = (s: string) => {
    const name = stripZeroWidth(s).normalize('NFC').trim();

    // 빈 값은 통과 (뒤에서 최소 2자 체크)
    if (name === "") return true;

    // 한글과 일반 공백만 허용
    if (!/^[가-힣 ]+$/.test(name)) return false;

    // 공백 제외한 길이 10자 이하
    const lenWithoutSpaces = name.replace(/ /g, "").length;
    return lenWithoutSpaces <= 10;
  };

  const checkIsFamilyNameAvailable = async () => {
    const raw = userInputFam;
    const name = stripZeroWidth(raw).normalize('NFC').trim();

    if (!isKorean10Less(name)) {
      alert("가족 별명은 한글(공백 허용)이고 공백 제외 10자 이내여야 합니다");
      setFamilyNameChecked("중복확인");
      return;
    }

    if (name.replace(/ /g, "").length < 2) {
      alert("가족별명은 공백 제외 2자 이상이어야 합니다.");
      setFamilyNameChecked("중복확인");
      return;
    }

    const duplicated = await isFamilyNameDuplicated(name);
    if (duplicated) {
      setFamilyNameChecked("사용 불가능");
      return;
    }

    setStep1((v) => ({ ...v, familyName: name }));
    setFamilyNameChecked("사용 가능");
  };

  const handleRelationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value as Relation;
    setStep1((prev) => ({ ...prev, relation: value }));
  };

  const uploadRecipientAvatarIfNeeded = useCallback(
    async (familyName:string): Promise<string | null> => {
      const file = fileRef.current?.files?.[0] as File;
      // if (!file) return null;
      const fileName = koToQwerty(familyName);
      const safeName = file.name.replace(/\s+/g, "_");
      const ts = Date.now();
      const filePath = `recipients/${fileName}/${ts}_${safeName}`;

      const { error } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, {
          upsert: true,
          contentType: file.type || "application/octet-stream",
        });

      if (error) {
        console.error("Upload error:", error);
        return null;
      }
      const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);
      return data.publicUrl; // 공개 URL
    },
    [step2.avatar]
  );
  
  const onPhoneChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    let v = e.target.value.replace(/[^\d]/g, "");
    if (v.length > 3 && v.length <= 7) v = `${v.slice(0, 3)}-${v.slice(3)}`;
    else if (v.length > 7) v = `${v.slice(0, 3)}-${v.slice(3, 7)}-${v.slice(7, 11)}`;
    setStep2((p) => ({ ...p, phone: v }));
  }, []);

  const openDaumPostcode = () => {
    new window.daum.Postcode({
      oncomplete: (data: any) => {
        const addr = data.address;
        setStep2((prev) => ({ ...prev, address1: addr, address2: "" }));
      },
      onClose: () => { },
    }).open();
  };

  const next = async () => {
    if (step === "FAMILY") {
      if (!canNext1) return;
      setStep("RECIPIENT");
      return;
    }
    if (step === "RECIPIENT") {
      if (!canNext2) return;

      // ① 아바타가 있으면 먼저 업로드해서 URL 확보
      // let avatarUrl: string | null = null;
      // if (step2.avatar) {
      //   avatarUrl = await uploadRecipientAvatarIfNeeded();
      // }
      const step1ToSave = { ...step1 };
      const { familyName } = step1ToSave;
      const avatar_url = await uploadRecipientAvatarIfNeeded(familyName);
      // ② localStorage에 URL까지 포함해 저장
      const step2ToSave = { ...step2, avatar_url, avatar: undefined, avatarPreview: undefined };
      localStorage.setItem("step1", JSON.stringify(step1ToSave));
      localStorage.setItem("step2", JSON.stringify(step2ToSave));

      setStep("PAYMENT");
      return;
    }
  };

  const back = () => {
    if (step === "RECIPIENT") setStep("FAMILY");
    if (step === "PAYMENT") setStep("RECIPIENT");
  };

  const confirmPayment = async () => {
    if (!parsed.ok) {
      alert("결제 정보가 유효하지 않습니다.");
      return;
    }
    const { paymentKey, orderId, amount } = parsed;
    const step1Data = JSON.parse(localStorage.getItem("step1") || "{}");
    const step2Data = JSON.parse(localStorage.getItem("step2") || "{}");
    const { user } = JSON.parse(
      localStorage.getItem("sb-raksukmfixcxokoqewyn-auth-token") as string
    );;
    const userId = user?.id;
    // ✅ 받는 분 아바타 업로드
    const uploaded = step2Data.avatar_url
    // uploaded?.url : 공개URL, uploaded?.path : 스토리지 경로

    const payload = {
      paymentKey,
      orderId,
      amount,
      step1Data,
      step2Data: {
        ...step2Data,
        avatar_path: uploaded,
      },
      userId,
    };

    const res = await fetch("/api/families/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      credentials: "include",
    });
    const json = await res.json();
    if (!res.ok || !json.ok) {
      alert("생성 실패: " + (json.error || "unknown"));
      return;
    }
    alert("가족 생성이 성공하였습니다!");
    // 생성 성공 후 이동
    localStorage.removeItem("step1");
    localStorage.removeItem("step2");
    router.replace(`/family/join?familyId=${json.invite_code}`);
    
  }

  return (
    <div className={s.page}>
      <div className={s.logoBar}>
        <img src={logo} alt="디어드림 로고" className={s.logo} />
      </div>

      <div className={s.card}>
        {step === "FAMILY" && (
          <>
            <h1 className={s.title}>가족 정보 설정</h1>
            <div className={s.inputGroup}>
              <label className={s.label}>가족별명 *</label>
              <div className={s.row}>
                <input
                  className={s.input}
                  placeholder="10자 이내 한글"
                  value={userInputFam}
                  onChange={(e) => setUserInputFam(e.target.value)}
                />
                <button
                  type="button"
                  className={s.btnPrimary}
                  onClick={checkIsFamilyNameAvailable}
                >
                  {familyNameChecked}
                </button>
              </div>
              <p className={s.helper}>10자 이내 한글</p>
            </div>

            <div className={s.inputGroup}>
              <div className={s.label}>마감일 선택</div>
              <div className={s.pills}>
                <button
                  type="button"
                  className={`${s.pill} ${step1.closureRule === "SECOND_SUN" ? s.pillActive : ""
                    }`}
                  onClick={() =>
                    setStep1((v) => ({ ...v, closureRule: "SECOND_SUN" }))
                  }
                >
                  둘째 주 일요일
                </button>
                <button
                  type="button"
                  className={`${s.pill} ${step1.closureRule === "FOURTH_SUN" ? s.pillActive : ""
                    }`}
                  onClick={() =>
                    setStep1((v) => ({ ...v, closureRule: "FOURTH_SUN" }))
                  }
                >
                  넷째 주 일요일
                </button>
              </div>
              <p className={s.helper}>마감일 11:59에 소식이 PDF로 변환 후 초기화</p>
            </div>

            <div className={s.inputGroup}>
              <label className={s.label}>받는분과의 관계</label>
              <div className={s.row}>
                <select
                  className={s.select}
                  value={step1.relation}
                  onChange={handleRelationChange}
                >
                  {
                    Object.entries(KIN_ROLE_LABEL_KO).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))
                  }
                </select>
              </div>
              {/* <p className={s.helper}>리더의 입장에서 선택</p> */}
            </div>


            <div className={s.row} style={{ justifyContent: "space-between" }}>
              <span />
              <button
                className={`${s.btnWide} ${!canNext1 ? s.btnDisabled : ""}`}
                disabled={!canNext1}
                onClick={next}
              >
                다음으로
              </button>
            </div>
          </>
        )}

        {step === "RECIPIENT" && (
          <>
            <h1 className={s.title}>받는 분 정보설정</h1>

            <div className={s.avatarWrap}>
              <div
                className={s.avatar}
                style={
                  step2.avatarPreview
                    ? { backgroundImage: `url(${step2.avatarPreview})` }
                    : undefined
                }
              >
                {!step2.avatarPreview && <span>가족</span>}
              </div>
              <label className={s.avatarBtn}>
                프로필 사진 변경
                <input ref={fileRef} type="file" accept="image/*" onChange={handleAvatarChange} hidden />
              </label>
            </div>

            <label className={s.label}>이름 *</label>
            <input
              className={s.inputFam}
              value={step2.name}
              onChange={(e) =>
                setStep2((v) => ({ ...v, name: e.target.value }))
              }
              placeholder=""
            />

            <label className={s.label}>생년월일 *</label>
            <input
              type="date"
              className={s.inputFam}
              value={step2.birth}
              onChange={(e) =>
                setStep2((v) => ({ ...v, birth: e.target.value }))
              }
            />

            <label className={s.label}>주소 *</label>
            <div className={s.row}>
              <input
                className={s.inputAddress}
                placeholder=""
                value={step2.address1}
                onChange={(e) =>
                  setStep2((v) => ({ ...v, address1: e.target.value }))
                }
              />
              <button type="button" className={s.btnPrimary} onClick={openDaumPostcode}>
                검색
              </button>
            </div>

            <input
              className={s.inputFam}
              placeholder="상세 주소를 입력해주세요."
              value={step2.address2}
              onChange={(e) =>
                setStep2((v) => ({ ...v, address2: e.target.value }))
              }
            />

            <label className={s.label}>휴대폰 번호 *</label>
            <input
              className={s.inputFam}
              value={step2.phone}
              inputMode="tel"
              placeholder=""
              onChange={onPhoneChange}
            />

            <div className={s.row} style={{ justifyContent: "space-between" }}>
              <button className={s.btnWide} onClick={back}>
                이전
              </button>
              <button
                className={`${s.btnWide} ${!canNext2 ? s.btnDisabled : ""}`}
                disabled={!canNext2}
                onClick={next}
              >
                결제 단계로
              </button>
            </div>
          </>
        )}

        {step === "PAYMENT" && (
          <>
            <h1 className={s.title}>결제</h1>
            <div
              style={{
                minHeight: "10rem",
                border: "0.0625rem dashed #e5e7eb",
                borderRadius: "0.75rem",
                padding: "1rem",
              }}
            >
              {/* 결제 위젯 렌더링 영역 */}
              {/* 결제 위젯이 여기에 렌더링됩니다. */}
              {!parsed.ok && <CheckoutPage/>}
            </div>
          </>
        )}
      </div>
    </div>
  );
}