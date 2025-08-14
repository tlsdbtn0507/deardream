"use client";

import { useEffect, useState } from "react";
import supabaseClient from "@/supabase";


export default function Main() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState("");

  const isUserLoggedIn = async () => {
    
    const {data} = await supabaseClient().auth.getSession();
    const user = data.session?.user.user_metadata;
    setUserName(user!.name);
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

  return (
    <div>
      <h1>Main Page</h1>
      {isLoggedIn ? (
        // <p>Welcome back!</p>
        <p>반갑습니다! {userName}님</p>
      ) : (
        <p>Please log in to access more features.</p>
      )}
    </div>
  )
}