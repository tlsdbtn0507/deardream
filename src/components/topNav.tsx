'use client';
import styles from './css/topNav.module.css'; // Assuming you have a CSS module for styling

import { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { pageImageUrl } from '@/utils/supabase/client';

export default function TopNav() {

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const router = useRouter();


  const isUserLoggedIn = async () => {
    
    const { data } = await supabase.auth.getSession();

    //로그인 한 값을 전역에 저장
    
    if (data.session) {
      return true;
    }
    return false;
  }

  useEffect(() => {
    const checkisLoggedIn = async () => {
      const loggedIn = await isUserLoggedIn();
      setIsLoggedIn(loggedIn);
    }
    checkisLoggedIn();
  }, []);

  const logoImgUrl = pageImageUrl('eardreamlogo-w.png');
  const mypageLogoImgUrl = pageImageUrl('profile.png');

  const gotoMypage = () => router.push('/mypage');

  return (
    <div className={styles.topNav}>
      <img src={logoImgUrl} style={{ cursor: 'pointer',width:'9rem',height:'3rem' }} alt=""/>
      <img onClick={gotoMypage} src={mypageLogoImgUrl} alt=""/>
    </div>
  )
}