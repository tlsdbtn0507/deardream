export type FamilyMember = {
  family_id: string;       // uuid
  user_id: string;         // uuid
  role: "parent" | "child" | "other"; // enum family_role (실제 enum 정의에 맞게 수정)
  nickname: string | null; // text, nullable 가능성 고려
  joined_at: string;       // timestamptz (ISO 문자열로 반환됨)
};