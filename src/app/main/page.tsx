'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase, fetchUserFamily, fetchFamilyInfo, fetchFamilyPosts } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { PostType, FamilyMember } from '@/utils/types';

import ProfileSection from '@/components/profileSection/profileSection';
import InviteOrCreate from '@/components/family/inviteOrCreate';
import BottomNavigation from '@/components/bottomNavigation';
import Spinner from '@/components/ui/spinner';
import styles from './main.module.css';
import InfoBar from '@/components/ui/infoBar';
import FeedComponent from '@/components/feed/feed';

type FamilyProfile = {
  id: string;
  name: string;
  relation: string;
  avatarUrl?: string;
};



// ...imports
export default function Main() {
  const router = useRouter();

  const [userUid, setUserUid] = useState<string>('');
  const [familyMembers, setFamilyMembers] = useState<FamilyProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [closureDate, setClosureDate] = useState<Date | null>(null);
  const [familyPosts, setFamilyPosts] = useState<PostType[]>([]);

  // ✅ 메인에서 한번만 정의하고, 초대 성공 시에도 재사용할 refetch
  const refetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert('로그인이 필요합니다.');
        router.push('/login');
        return;
      }

      const uid = session.user.id;
      const members: FamilyMember[] | null = await fetchUserFamily(uid);
      if (!members || members.length === 0) {
        setUserUid(uid);
        setFamilyMembers([]);     // 가족 없음 → 초대/생성 화면
        setFamilyPosts([]);
        setClosureDate(null);
        return;
      }

      const famId = members[0].family_id;
      const { next_closure_date } = await fetchFamilyInfo(famId);
      const posts = await fetchFamilyPosts(famId);

      const toSet = members.map(m => ({
        id: m.user_id,
        name: m.nickname ?? '',
        relation: m.relation,
        avatarUrl: m.profile_image ?? '',
      }));

      setUserUid(uid);
      setFamilyMembers(toSet);
      setFamilyPosts(posts);
      setClosureDate(new Date(next_closure_date));
    } catch (e: any) {
      setError(e?.message ?? '가족 정보를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, [router]);

  // 최초 진입 시 한번
  useEffect(() => { refetchAll(); }, [refetchAll]);

  const handleDeletePost = useCallback((deletedId: string) => {
    setFamilyPosts(prev => prev.filter(p => p.id !== deletedId));
  }, []);

  if (error) {
    return (
      <div style={{ padding: '2rem' }}>
        <p style={{ color: 'crimson' }}>{error}</p>
        <BottomNavigation selectedNav="home" onNavChange={() => { }} onHomeClick={() => { }} />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {loading && (
        <div className={styles.center}>
          <Spinner text="불러오는 중..." />
        </div>
      )}

      {!loading && (
        <>
          {familyMembers.length > 0 ? (
            <>
              <ProfileSection
                profiles={familyMembers}
                selectedIndex={0}
                onSelect={(i) => console.log('Selected index:', i)}
                className={styles.profileSection}
              />

              <div className={styles.infoWrap}>
                <InfoBar
                  dday={(closureDate ? Math.ceil((closureDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : 0)}
                  remainingCount={20 - familyPosts.length}
                />
              </div>

              <main className={styles.mainContent}>
                {familyPosts.length > 0 ? (
                  familyPosts.map(post => (
                    <FeedComponent key={post.id} postProps={post} onDelete={handleDeletePost} />
                  ))
                ) : (
                  <div className={styles.noPosts}>가족의 게시물이 없습니다.</div>
                )}
              </main>

              <BottomNavigation selectedNav="home" onNavChange={() => { }} onHomeClick={() => { }} />
            </>
          ) : (
            // ✅ 가족 없을 때 보여주는 초대/생성 컴포넌트에 refetch 콜백 전달
            <InviteOrCreate userId={userUid} onJoined={refetchAll} />
          )}
        </>
      )}
    </div>
  );
}