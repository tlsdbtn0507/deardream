'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabase/client';
import styles from './topNav.module.css'; // Assuming you have a CSS module for styling
import { useRouter } from 'next/navigation';
import { publicImageUrl } from '@/utils/supabase/client';

export default function TopNav() {

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const router = useRouter();


  const isUserLoggedIn = async () => {
    
    const { data } = await supabase.auth.getSession();
    console.log(data);

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

  const actLogOut = async () => {
    await supabase.auth.signOut();
    router.push('/'); 
  }

  const logoImgUrl = publicImageUrl('deardreamLogo.png');
  const mypageLogoImgUrl = publicImageUrl('icon.png');

  const gotoMypage = () => {
    alert("미구현 페이지 입니다.");
    // if (isLoggedIn) {
    //   router.push('/profile');
    // } else {
    //   actLogIn();
    // }
  }
  return (
    <div className={styles.topNav}>
      <img src={logoImgUrl} />
      <img onClick={gotoMypage} src={mypageLogoImgUrl}/>
    </div>
  )
}