export type FamilyMember = {
  family_id: string;       // uuid
  user_id: string;         // uuid
  role: "parent" | "child" | "other"; // enum family_role (실제 enum 정의에 맞게 수정)
  nickname: string | null; // text, nullable 가능성 고려
  joined_at: string;       // timestamptz (ISO 문자열로 반환됨)
};

export type Relation = | "" | 'son' | 'daughter'
  | 'daughter_in_law' | 'son_in_law'
  | 'grandson' | 'granddaughter'
  | 'nephew_or_niece'
  | 'great_grandson' | 'great_granddaughter'
  | 'spouse' | 'sibling'
  | 'other';
