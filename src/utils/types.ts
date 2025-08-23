export type FamilyMember = {
  family_id: string;       // uuid
  user_id: string;         // uuid
  role: "parent" | "child" | "other"; // enum family_role (실제 enum 정의에 맞게 수정)
  nickname: string | null; // text, nullable 가능성 고려
  joined_at: string;       // timestamptz (ISO 문자열로 반환됨)
  relation: Relation; // text, nullable 가능성 고려
  profile_image: string | null; // text, nullable 가능성 고려
};

export type Relation = | "" | 'son' | 'daughter'
  | 'daughter_in_law' | 'son_in_law'
  | 'grandson' | 'granddaughter'
  | 'nephew_or_niece'
  | 'great_grandson' | 'great_granddaughter'
  | 'spouse' | 'sibling'
  | 'other';

  // (이미 가지고 있는 매핑)
const KIN_ROLE_LABEL_KO = {
  '': '눌러서 선택',
  son: '아들',
  daughter: '딸',
  daughter_in_law: '며느리',
  son_in_law: '사위',
  grandson: '손자',
  granddaughter: '손녀',
  nephew_or_niece: '조카',
  great_grandson: '증손자',
  great_granddaughter: '증손녀',
  spouse: '배우자',
  sibling: '형제/자매',
  other: '기타',
} as const;

type KinRole = keyof typeof KIN_ROLE_LABEL_KO;

/** DB 영문 relation -> 한국어 라벨 */
export function relationLabel(relation?: string | null): string {
  if (relation == null || relation === '') return KIN_ROLE_LABEL_KO[''];
  const key = relation as KinRole;
  return KIN_ROLE_LABEL_KO[key] ?? KIN_ROLE_LABEL_KO['other'];
}

export type PostType = {
  id: string;
  family_id: string;
  author_id: string;
  body: string | null;
  images: string[]; // text[]
  created_at: string;
  updated_at: string;
  author_name: string | null;
  author_relation: string | null;
  author_profile_image: string;
};
