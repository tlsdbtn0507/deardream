'use client';
import { useEffect, useState } from 'react';
import supabaseClient from '../supabase';
import styles from './topNav.module.css'; // Assuming you have a CSS module for styling
import {useRouter} from 'next/navigation';

export default function TopNav() {

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const router = useRouter();

  const actLogIn = async () => {
    const supabase = supabaseClient();
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${location.origin}/auth/callback`,
      }
    });
  };

  const isUserLoggedIn = async () => {
    
    const {data} = await supabaseClient().auth.getSession();
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
    const supabase = supabaseClient();
    await supabase.auth.signOut();
    // setIsLoggedIn(false);
    router.push('/'); 
  }

  return (
    <div className={styles.topNav}>
      <h3>상단내비바</h3>
      {isLoggedIn ? (
        <button onClick={actLogOut}>로그아웃(나중에 마이페이지로 바꿀거임)</button>
      ) : (
        <button onClick={actLogIn}>로그인</button>
      )}
    </div>
  )
}