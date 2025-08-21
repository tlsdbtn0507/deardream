// src/app/family/add/page.tsx
import dynamic from "next/dynamic";

const FamilyCreateWizard = dynamic(
  () => import("@/components/family/familyCreateWiz"),
  { ssr: false }                       // ✅ 서버 프리렌더/SSR 금지
);

export default function Page() {
  return <FamilyCreateWizard />;
}