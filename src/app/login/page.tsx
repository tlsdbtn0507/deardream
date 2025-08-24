'use client';

import { useState } from 'react';
import { pageImageUrl, supabase } from '@/utils/supabase/client';

import styles from './page.module.css';

export default function LoginPage() {
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [autoLogin, setAutoLogin] = useState(false);

  const handleSignUp = () => {
    alert('미구현 기능입니다.');
  };

  const handleLogin = () => {
    alert('미구현 기능입니다.');
  };

  const handleKakaoLogin = () => {
    alert('미구현 기능입니다.');
  };

  const handleGoogleLogin = async () => {
    // alert('미구현 기능입니다.');
    try {
      // 필요한 경우 redirectTo를 /auth/callback → 해당 라우트에서 세션 교환 후 홈으로 리다이렉트
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${location.origin}/auth/callback`,
        },
      });
      if (error) {
        // 에러가 나면 화면상 안내만 하고 로딩 해제
        console.error(error);
      }
      // 정상이라면 공급자 페이지로 리디렉트되므로 이후 코드는 보통 실행되지 않습니다.
    } catch (e) {
      console.error(e);
    }
  };

  const handleFindAccount = () => {
    alert('미구현 기능입니다.');
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);

  };

  return (
    <div className={styles.container}>
      {/* 상단 섹션 */}
      <div className={styles.header}>
        <div className={styles.logoSection}>
          <img src={pageImageUrl("/eardreamlogo-g.png" )}alt="이어드림" className={styles.logoImage} />
        </div>
        <button className={styles.signUpLink} onClick={handleSignUp}>
          회원가입
          <img src={pageImageUrl("/move-r-g.png")} alt="화살표" className={styles.arrowIcon} />
        </button>
      </div>

      {/* 로그인 입력 필드 */}
      <div className={styles.loginForm}>
        <div className={styles.inputGroup}>
          <label className={styles.inputLabel}>아이디</label>
          <input
            type="text"
            value={id}
            onChange={(e) => setId(e.target.value)}
            className={styles.inputField}
            placeholder="아이디를 입력하세요"
          />
        </div>

        <div className={styles.inputGroup}>
          <label className={styles.inputLabel}>비밀번호</label>
          <div className={styles.passwordContainer}>
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={styles.inputField}
              placeholder="비밀번호를 입력하세요"
            />
            <button
              type="button"
              className={styles.passwordToggle}
              onClick={togglePasswordVisibility}
            >
              <img
                src={showPassword ? pageImageUrl("close.png") : pageImageUrl("close.png")}
                alt="비밀번호 보기"
                className={styles.eyeIcon}
              />
            </button>
          </div>
        </div>

        {/* 추가 옵션 */}
        <div className={styles.options}>
          <label className={styles.autoLoginOption}>
            <input
              type="checkbox"
              checked={autoLogin}
              onChange={(e) => setAutoLogin(e.target.checked)}
              className={styles.checkbox}
            />
            <span className={styles.checkboxLabel}>자동 로그인 설정</span>
          </label>
          <button className={styles.findAccountLink} onClick={handleFindAccount}>
            아이디·비밀번호 찾기
          </button>
        </div>

        {/* 로그인 버튼들 */}
        <div className={styles.loginButtons}>
          <button className={styles.loginButton} onClick={handleLogin}>
            로그인
          </button>

          <button className={styles.kakaoLoginButton} onClick={handleKakaoLogin}>
            <img src={pageImageUrl("/kakao-2.png")} alt="카카오" className={styles.socialIcon} />
            카카오 로그인
          </button>

          <button className={styles.googleLoginButton} onClick={handleGoogleLogin}>
            <img src={pageImageUrl("/google.png")} alt="구글" className={styles.socialIcon} />
            구글 로그인
          </button>
        </div>
      </div>
    </div>
  );
}
