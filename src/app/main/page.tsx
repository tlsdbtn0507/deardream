'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase, fetchUserFamily, fetchFamilyInfo, fetchFamilyPosts } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { PostType } from '@/utils/types';

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



export default function Main() {
  const router = useRouter();

  const [userUid, setUserUid] = useState<string>('');
  const [familyMembers, setFamilyMembers] = useState<FamilyProfile[]>([]);
  const [loading, setLoading] = useState(true);     // ← 로딩 상태
  const [error, setError] = useState<string | null>(null);
  const [closureDate, setClosureDate] = useState<Date | null>(null);
  const [familyPosts, setFamilyPosts] = useState<PostType[]>([]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
          alert('로그인이 필요합니다.');
          router.push('/login');
          return;
        }
        
        const uid = session.user.id;
        const members = await fetchUserFamily(uid);
        
        if (cancelled) return;
        if (!members)  {
          alert('가족 정보를 불러오지 못했습니다.');
          router.push('/login');
          return;
        }

        //next_closure_date = yyyy-mm-dd
        const { next_closure_date } = await fetchFamilyInfo(members[0].family_id);
        const posts = await fetchFamilyPosts(members[0].family_id);

        if (cancelled) return;

        setFamilyPosts(posts);
        setClosureDate(new Date(next_closure_date));
        setUserUid(uid);
        setFamilyMembers(members!.map(member => ({
          id: member.user_id,
          name: member.nickname,
          relation: member.relation,
          avatarUrl: member.profile_image
        })));

      } catch (e: any) {
        setError(e?.message ?? '가족 정보를 불러오지 못했습니다.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [router]);


  const handleDeletePost = useCallback((deletedId: string) => {
    setFamilyPosts(prev => prev.filter(p => p.id !== deletedId));
  }, []);
  
  // ② 에러: 메시지 표시
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
            <ProfileSection
              profiles={familyMembers}
              selectedIndex={0}
              onSelect={(i) => console.log('Selected index:', i)}
              className={styles.profileSection}
            />
          ) : (
            <InviteOrCreate userId={userUid} />
          )}

          {/* Info Bar */}
          <div className={styles.infoWrap}>
            <InfoBar
              dday={(closureDate ? Math.ceil((closureDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : 0)}
              remainingCount={20 - familyPosts.length} />
          </div>
          <main className={styles.mainContent}>
            {
              familyPosts.length > 0 ? (
                familyPosts.map((post) => (
                  <FeedComponent key={post.id} postProps={post} onDelete={handleDeletePost} />
                ))
              ) : (
                <div className={styles.noPosts}>가족의 게시물이 없습니다.</div>
              )
            }
          </main>
        </>
      )}

      <BottomNavigation selectedNav="home" onNavChange={() => { }} onHomeClick={() => { }} />
    </div>
  );
}