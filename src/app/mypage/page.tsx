'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

import s from './page.module.css';
import NewsTopNav from '@/components/newsTopNav';
import BottomNavigation from '@/components/bottomNavigation';
import { supabase, pageImageUrl, fetchUserFamily, fetchUserInfo } from '@/utils/supabase/client';
import { relationLabel, FamilyMember } from '@/utils/types';


function getUidMailFromLocal(): {uId:string,mail:string} | null {
  try {
    const raw = localStorage.getItem('sb-raksukmfixcxokoqewyn-auth-token');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const uId = parsed?.user?.id ?? null;
    const mail = parsed?.user?.email ?? null;
    return { uId, mail };
  } catch {
    return null;
  }
};

export default function MyPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [notifEnabled, setNotifEnabled] = useState(false);
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    avatar: '',
    role: '',
  });

  const fileRef = useRef<HTMLInputElement>(null);

  // 알림 토글 초기화
  useEffect(() => {
    setNotifEnabled(localStorage.getItem('notifEnabled') === '1');
  }, []);

  // ▶ 서버에서 유저 정보/가족 정보 조회해서 프로필 구성
  useEffect(() => {
    (async () => {
      // 1) 로컬에서 uid 우선 확보, 없으면 supabase 세션 보조
      let { uId, mail } = getUidMailFromLocal() as { uId: string, mail: string };
      if (!uId) {
        const { data: { session } } = await supabase.auth.getSession();
        uId = session!.user!.id;
        mail = session!.user!.email!;
      }
      if (!uId) {
        alert('로그인이 필요합니다.');
        router.push('/login');
        return;
      }

      // 2) 서버에서 유저/가족 정보 조회 (avatar는 반드시 fetchUserInfo에서 받은 값 사용)
      const [u, fam] = await Promise.all([
        fetchUserInfo(uId), 
        fetchUserFamily(uId) as unknown as FamilyMember[] | null,
      ]);

      const myFamilyInfo = fam!.find(f => f.user_id === uId);

      const roleKo = fam && myFamilyInfo ? relationLabel(myFamilyInfo.relation) : '';
      setProfile({
        name: u?.full_name ?? '',
        email: mail,                 // fetchUserInfo에 email 없으면 빈 값
        avatar: u?.profile_image ?? '',        // ✅ 서버에서 받은 profile_image를 그대로 사용
        role: roleKo,
      });
      setLoading(false);
    })();
  }, [router]);

  const toggleNotif = () => {
    setNotifEnabled(prev => {
      const next = !prev;
      localStorage.setItem('notifEnabled', next ? '1' : '0');
      return next;
    });
  };

  const clickPhoto = () => fileRef.current?.click();

  // ▶ 사진 변경: 업로드 → user_profiles 업데이트 → 다시 fetchUserInfo(uid)로 신뢰 원천 유지
  const onPhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const uid = getUidMailFromLocal()?.uId;
    if (!uid) {
      alert('로그인이 필요합니다.');
      router.push('/login');
      return;
    }

    const ext = (file.name.split('.').pop() || 'png').toLowerCase();
    const path = `profiles/${uid}/${Date.now()}.${ext}`;

    // 스토리지 업로드 (버킷: avatars)
    const { error } = await supabase
      .storage
      .from('avatars')
      .upload(path, file, { upsert: true, contentType: file.type });

    if (error) {
      alert('프로필 사진 업로드에 실패했어요.');
      return;
    }

    // 퍼블릭 URL
    const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path);
    const publicUrl = urlData.publicUrl;

    // DB 업데이트
    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({ profile_image: publicUrl })
      .eq('user_id', uid);

    if (updateError) {
      alert('프로필 저장에 실패했어요.');
      return;
    }

    // ✅ 다시 서버에서 fetchUserInfo로 싱크(단일 출처 유지)
    const fresh = await fetchUserInfo(uid);
    setProfile(prev => ({ ...prev, avatar: fresh?.profile_image ?? publicUrl }));
  };

  const logout = async () => {
    if (confirm('로그아웃 하시겠습니까?')) {
      localStorage.removeItem('isUserLogin');
      localStorage.removeItem('essentialInfo');
      localStorage.removeItem('userWritingInfo');

      await supabase.auth.signOut();
      router.push('/login');
    }
  };

  if (loading) {
    return (
      <div className={s.container}>
        <NewsTopNav title="마이페이지" onBackClick={() => router.back()} />
        <div className={s.center}>불러오는 중...</div>
        <BottomNavigation selectedNav="home" onNavChange={() => { }} onHomeClick={() => { }} />
      </div>
    );
  }

  const right = pageImageUrl('right.png');
  const bell = pageImageUrl('alarm.png');
  const account = pageImageUrl('face.png');
  const pay = pageImageUrl('sub.png');
  const family = pageImageUrl('fam.png');
  const defaultAvatar = pageImageUrl('surprise.png');

  return (
    <div className={s.container}>
      <NewsTopNav title="마이페이지" onBackClick={() => router.back()} />

      <section className={s.headerCard}>
        <div className={s.avatarWrap} onClick={clickPhoto}>
          <img
            className={s.avatar}
            src={profile.avatar || defaultAvatar}
            alt=""
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.visibility = 'hidden'; }}
          />
          <div className={s.userBlock}>
            <div className={s.nameRow}>
              <span className={s.name}>{profile.name}</span>
              {profile.role && <span className={s.roleTag}>{profile.role}</span>}
            </div>
            <div className={s.email}>{profile.email}</div>
          </div>

        </div>
        <div style={{ display: 'flex', alignItems: 'center', width: '18rem' }}>
          <button type="button" className={s.photoBtn} onClick={clickPhoto}>
            사진 수정
          </button>
        </div>


        <input ref={fileRef} type="file" accept="image/*" hidden onChange={onPhotoChange} />
      </section>

      <nav className={s.menu}>
        <button type="button" className={s.item} onClick={toggleNotif}>
          <div className={s.left}>
            <div className={s.iconWrap}>
              <img className={s.icon} src={bell} alt="" />
            </div>
            <span>알림 설정</span>
          </div>
          <label className={s.switch}>
            <input type="checkbox" checked={notifEnabled} onChange={toggleNotif} />
            <span className={s.slider} />
          </label>
        </button>

        <button type="button" className={s.item} onClick={() => {
            alert('준비중입니다.');
            // router.push('/mypage/account')
          }}>
          <div className={s.left}>
            <div className={s.iconWrap}>
              <img className={s.icon} src={account} alt="" />
            </div>
            <span>계정 정보</span>
          </div>
          <img className={s.chev} src={right} alt="" />
        </button>

        <button type="button" className={s.item} onClick={() => router.push('/mypage/pay')}>
          <div className={s.left}>
            <div className={s.iconWrap}>
              <img className={s.icon} src={pay} alt="" />
            </div>
            <span>결제 및 구독</span>
          </div>
          <img className={s.chev} src={right} alt="" />
        </button>

        <button type="button" className={s.item} onClick={() => {
            alert('준비중입니다.');
            // router.push('/family/me')
          }}>
          <div className={s.left}>
            <div className={s.iconWrap}>
              <img className={s.icon} src={family} alt="" />
            </div>
            <span>나의 가족 정보</span>
          </div>
          <img className={s.chev} src={right} alt="" />
        </button>
      </nav>

      <div className={s.logoutWrap}>
        <button className={s.logoutBtn} onClick={logout}>로그아웃</button>
      </div>

    </div>
  );
}