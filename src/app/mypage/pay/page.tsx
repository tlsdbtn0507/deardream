'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, pageImageUrl } from '@/utils/supabase/client';
import styles from './page.module.css';

type FamilyRow = { id: string; created_at: string };
type PaymentMethod = { provider: string; token: string } | null;

function fmt(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}.${m}.${d}`;
}
function addMonths(d: Date, m: number) {
  const dt = new Date(d);
  dt.setMonth(dt.getMonth() + m);
  // 말일 보정
  if (dt.getDate() !== d.getDate()) dt.setDate(0);
  return dt;
}
function providerKo(p?: string) {
  if (!p) return '-';
  const map: Record<string, string> = {
    toss: '토스뱅크',
    kakaobank: '카카오뱅크',
    kb: 'KB국민',
    shinhan: '신한',
    woori: '우리',
    nh: 'NH농협',
    hana: '하나',
  };
  return map[p] ?? p;
}
function maskToken(token?: string) {
  if (!token) return '';
  return token.slice(-4); // 마지막 4글자
}

export default function PayStatusPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [family, setFamily] = useState<FamilyRow | null>(null);
  const [method, setMethod] = useState<PaymentMethod>(null);
  const [error, setError] = useState<string | null>(null);

  // 로그인한 사용자 uid → localStorage 의 sb-xxx-auth-token 에서 꺼내기
  function getCurrentUid(): string | null {
    try {
      const key = Object.keys(localStorage).find(k => k.startsWith('sb-') && k.endsWith('-auth-token'));
      if (!key) return null;
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return parsed?.user?.id ?? null;
    } catch { return null; }
  }

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const uid = getCurrentUid();
        if (!uid) {
          setError('로그인이 필요합니다.');
          return;
        }

        // 1) 이 사용자가 속한 family_id 하나 얻기 (가장 최근 것)
        const { data: fm, error: fmErr } = await supabase
          .from('family_members')
          .select('family_id, joined_at')
          .eq('user_id', uid)
          .order('joined_at', { ascending: false })
          .limit(1);

        if (fmErr) throw fmErr;
        if (!fm || fm.length === 0) {
          setError('가족 정보를 찾을 수 없습니다.');
          return;
        }
        const family_id = fm[0].family_id as string;

        // 2) families.created_at
        const { data: famRow, error: famErr } = await supabase
          .from('families')
          .select('id, created_at')
          .eq('id', family_id)
          .single();

        if (famErr) throw famErr;
        setFamily(famRow as FamilyRow);

        // 3) payment_methods
        const { data: pm, error: pmErr } = await supabase
          .from('payment_methods')
          .select('provider, token')
          .eq('family_id', family_id)
          .maybeSingle();

        if (pmErr) throw pmErr;
        setMethod(pm as PaymentMethod);

      } catch (e: any) {
        setError(e?.message ?? '로딩 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const periodText = useMemo(() => {
    if (!family) return '-';
    const start = new Date(family.created_at);
    const now = new Date();
    return `${fmt(start)} ~ ${fmt(now)}`;
  }, [family]);

  const nextBilling = useMemo(() => {
    if (!family) return '-';
    const start = new Date(family.created_at);
    const next = addMonths(start, 1);
    return fmt(next);
  }, [family]);

  const payMethodText = useMemo(() => {
    if (!method) return '-';
    return `${providerKo(method.provider)} ${maskToken(method.token)}`;
  }, [method]);

  const onCancel = async () => {
    if (!family) return;
    const ok = confirm('정말 해지하시겠습니까?\n다음 결제일에 모든 가족/게시물 데이터가 삭제됩니다.');
    if (!ok) return;

    try {
      setLoading(true);
      // 1) 결제수단 삭제
      await supabase.from('payment_methods').delete().eq('family_id', family.id);

      // 2) 삭제 예약 테이블에 예약(다음 결제일)
      const start = new Date(family.created_at);
      const cancelAt = addMonths(start, 1).toISOString();

      await supabase.from('cancellation_requests').upsert({
        family_id: family.id,
        cancel_at: cancelAt,
      });

      alert('해지 요청이 접수되었습니다. 다음 결제일에 데이터가 정리됩니다.');
      // 화면 새로고침
      location.reload();
    } catch (e: any) {
      alert(e?.message ?? '해지 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.wrap}>
      <header className={styles.top}>
        <button className={styles.back} onClick={() => router.back()}>
          <img src={pageImageUrl("/back.png")} alt="뒤로" />
        </button>
        <h1>구독현황</h1>
        <div className={styles.rightSpace} />
      </header>

      {loading ? (
        <div className={styles.center}>불러오는 중…</div>
      ) : error ? (
        <div className={styles.center} style={{ color: 'crimson' }}>{error}</div>
      ) : (
        <main className={styles.main}>
          <h2 className={styles.title}>
            이어드림 책자 만들기
            <br />
            <span className={styles.underline}>정기 구독중입니다</span>
          </h2>

          <dl className={styles.kv}>
            <div className={styles.row}>
              <dt>이용기간</dt>
              <dd>{periodText}</dd>
            </div>
            <div className={styles.row}>
              <dt>결제 예정일</dt>
              <dd className={styles.highlight}>{nextBilling}</dd>
            </div>
            <div className={styles.row}>
              <dt>결제수단</dt>
              <dd>{payMethodText}</dd>
            </div>
          </dl>

          <button
            className={`${styles.btn} ${styles.gray}`}
            onClick={onCancel}
            disabled={!family}  // 가족 없으면 비활성화
          >
            해지하기
          </button>

          <button
            className={`${styles.btn} ${styles.pink}`}
            onClick={() => router.push('/mypage/pay/manage')}
          >
            결제 관리
          </button>
        </main>
      )}

      <nav className={styles.bottomSpace} />
    </div>
  );
}