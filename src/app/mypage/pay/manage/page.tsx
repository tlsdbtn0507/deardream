'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, pageImageUrl } from '@/utils/supabase/client';
import s from './page.module.css';
import BankBadge from "@/components/ui/bankBandage"

type PaymentMethod = { id?: string; provider: string; token: string } | null;
type SubscriptionRow = {
  id: string;
  started_at: string; // ISO
  status: string;     // active, canceled ...
  meta?: string | null;
};

function getUidFromLocal(): string | null {
  try {
    const key = Object.keys(localStorage).find(
      (k) => k.startsWith('sb-') && k.endsWith('-auth-token')
    );
    if (!key) return null;
    const val = localStorage.getItem(key);
    if (!val) return null;
    return JSON.parse(val)?.user?.id ?? null;
  } catch {
    return null;
  }
}

const providerKoMap: Record<string, string> = {
  toss: '토스뱅크',
  kakaobank: '카카오뱅크',
  kb: 'KB국민',
  shinhan: '신한',
  woori: '우리',
  nh: '농협',
  hana: '하나',
};
const providerKo = (p?: string) => (p ? (providerKoMap[p] ?? p) : '-');
const last4 = (t?: string) => (t ? t.slice(-4) : '');

function ymd(d: Date | string) {
  const dt = typeof d === 'string' ? new Date(d) : d;
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, '0');
  const dd = String(dt.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

// 해당 월의 말일
function lastDayOfMonth(y: number, mIdx: number) {
  return new Date(y, mIdx + 1, 0).getDate();
}

// 시작일(started_at)의 '일(day)'을 앵커로, 매달 해당 일에 결제된 것으로 가정
// (그 달에 그 날짜가 없으면 말일로 보정)
function buildMonthlyHistory(startISO: string, until = new Date()): Date[] {
  const start = new Date(startISO);
  if (isNaN(start.getTime())) return [];

  const anchorDay = start.getDate(); // 예: 24
  let y = start.getFullYear();
  let m = start.getMonth();

  const result: Date[] = [];

  // 첫 결제일부터 현재 시각까지 반복
  while (true) {
    const last = lastDayOfMonth(y, m);
    const day = Math.min(anchorDay, last);
    const bill = new Date(y, m, day);

    if (bill > until) break; // 미래는 포함 X
    result.push(bill);

    // 다음 달로 이동
    m += 1;
    if (m > 11) {
      m = 0;
      y += 1;
    }
  }

  // 최신이 위로 보이게 내림차순 정렬
  return result.sort((a, b) => b.getTime() - a.getTime());
}

export default function PayMethodManagePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [familyId, setFamilyId] = useState<string | null>(null);
  const [method, setMethod] = useState<PaymentMethod>(null);
  const [subs, setSubs] = useState<SubscriptionRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  // 수정 모달 상태
  const [editOpen, setEditOpen] = useState(false);
  const [editProvider, setEditProvider] = useState('kakaobank');
  const [editToken, setEditToken] = useState('');

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const uid = getUidFromLocal();
        if (!uid) {
          setError('로그인이 필요합니다.');
          return;
        }

        // 1) 내가 오너인 가족
        const { data: owner, error: ownerErr } = await supabase
          .from('family_members')
          .select('family_id, joined_at, role')
          .eq('user_id', uid)
          .eq('role', 'owner')
          .order('joined_at', { ascending: false })
          .limit(1);

        if (ownerErr) throw ownerErr;
        if (!owner || owner.length === 0) {
          alert('접근 권한이 없습니다. (가족 리더만 가능합니다)');
          router.push('/mypage');
          return;
        }
        const famId = owner[0].family_id as string;
        setFamilyId(famId);

        // 2) 결제수단
        const { data: pm, error: pmErr } = await supabase
          .from('payment_methods')
          .select('id, provider, token')
          .eq('family_id', famId)
          .maybeSingle();
        if (pmErr) throw pmErr;
        setMethod(pm as PaymentMethod);

        // 3) 구독(현재 활성 구독의 started_at 사용)
        const { data: subsRows, error: subsErr } = await supabase
          .from('subscriptions')
          .select('id, started_at, status, meta')
          .eq('family_id', famId)
          .order('started_at', { ascending: false });
        if (subsErr) throw subsErr;
        setSubs(subsRows || []);
      } catch (e: any) {
        setError(e?.message ?? '불러오기 실패');
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  const hasMethod = !!method;
  const bankLine = useMemo(() => {
    if (!method) return '';
    return `${providerKo(method.provider)} ${last4(method.token)}`;
  }, [method]);

  // ✅ 납부내역 생성 로직: 활성 구독의 started_at을 기준으로 매월 결제일 생성
  const billingHistory = useMemo(() => {
    // 우선 active 구독 우선, 없으면 최신 한 개
    const active = subs.find(s => s.status === 'active') ?? subs[0];
    if (!active) return [];
    return buildMonthlyHistory(active.started_at, new Date());
  }, [subs]);

  const goRegister = () => {
    router.push('/payments/onboard'); // TODO: 실제 라우트로 교체
  };

  const openEdit = () => {
    if (!method) return;
    setEditProvider(method.provider || 'kakaobank');
    setEditToken(method.token || '');
    setEditOpen(true);
  };

  const saveEdit = async () => {
    if (!familyId) return;
    try {
      setLoading(true);
      if (method?.id) {
        const { error } = await supabase
          .from('payment_methods')
          .update({ provider: editProvider, token: editToken })
          .eq('id', method.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('payment_methods')
          .insert([{ family_id: familyId, provider: editProvider, token: editToken }]);
        if (error) throw error;
      }
      setMethod({ ...(method ?? {}), provider: editProvider, token: editToken });
      alert('결제 정보가 저장되었습니다.');
      setEditOpen(false);
    } catch (e: any) {
      alert(e?.message ?? '저장 실패');
    } finally {
      setLoading(false);
    }
  };

  const removeMethod = async () => {
    if (!method || !familyId) return;
    const ok = confirm('등록된 결제 정보를 삭제할까요?');
    if (!ok) return;
    try {
      setLoading(true);
      const { error } = await supabase
        .from('payment_methods')
        .delete()
        .eq('id', method.id!);
      if (error) throw error;
      setMethod(null);
      alert('결제 정보가 삭제되었습니다.');
    } catch (e: any) {
      alert(e?.message ?? '삭제 실패');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={s.wrap}>
      <header className={s.top}>
        <button className={s.back} onClick={() => router.back()}>
          <img src={pageImageUrl('/back.png')} alt="뒤로" />
        </button>
        <h1>결제 관리</h1>
        <div className={s.rightSpace} />
      </header>

      {loading ? (
        <div className={s.center}>불러오는 중…</div>
      ) : error ? (
        <div className={s.center} style={{ color: 'crimson' }}>{error}</div>
      ) : (
        <main className={s.main}>
          <div className={s.regTitle}>계좌 / 카드 등록하기</div>

          {hasMethod && (
            <section className={s.methodCard}>
              <div className={s.methodRow}>
                <div className={s.brand} style={{ padding: 0 }}>
                  <BankBadge provider={method!.provider} size={52} />
                </div>
                <div className={s.methodText}>
                  <div className={s.methodTitle}>
                    {providerKo(method!.provider)} 계좌
                  </div>
                  <div className={s.methodSub}>{bankLine}</div>
                </div>
                <div className={s.menu}>
                  <button className={s.dotBtn} onClick={openEdit} aria-label="수정">⋯</button>
                  <button className={s.dotBtn} onClick={removeMethod} aria-label="삭제">🗑️</button>
                </div>
              </div>
            </section>
          )}

          {/* ✅ 납부내역: started_at 기준 월별 결제일 */}
          {billingHistory.length > 0 && (
            <section className={s.history}>
              <h2>납부내역</h2>
              <ul className={s.histList}>
                {billingHistory.map((d) => (
                  <li key={d.toISOString()} className={s.histItem}>
                    <span>{ymd(d)}</span>
                    <span className={s.badge}>결제완료</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </main>
      )}

      {/* 수정 모달 */}
      {editOpen && (
        <div className={s.modalBackdrop} onClick={() => setEditOpen(false)}>
          <div className={s.modal} onClick={(e) => e.stopPropagation()}>
            <h3>결제 정보 수정</h3>
            <label className={s.field}>
              <span>은행/제공자</span>
              <select
                value={editProvider}
                onChange={(e) => setEditProvider(e.target.value)}
              >
                <option value="kakaobank">카카오뱅크</option>
                <option value="toss">토스뱅크</option>
                <option value="kb">KB국민</option>
                <option value="shinhan">신한</option>
                <option value="woori">우리</option>
                <option value="nh">농협</option>
                <option value="hana">하나</option>
              </select>
            </label>

            <label className={s.field}>
              <span>{`계좌 정보("-" 미포함)`}</span>
              <input
                value={editToken}
                onChange={(e) => setEditToken(e.target.value)}
                placeholder="예: tgen_...4919"
              />
            </label>

            <div className={s.modalActions}>
              <button className={s.btnGray} onClick={() => setEditOpen(false)}>취소</button>
              <button className={s.btnGreen} onClick={saveEdit}>저장</button>
            </div>
          </div>
        </div>
      )}

      <nav className={s.bottomSpace} />
    </div>
  );
}