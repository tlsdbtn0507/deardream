// app/login/page.tsx
import GoogleSignInButton from "@/components/googleSignInButton";

export default function LoginPage() {
  return (
    <main className="hero">
      <section className="card" aria-labelledby="login-title">
        <h1 id="login-title" className="h1">로그인</h1>
        <p className="p">
          디어드림은 구글 계정으로 간편하게 로그인할 수 있어요.
        </p>

        <div className="actions">
          <GoogleSignInButton />
        </div>
      </section>
    </main>
  );
}