import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Supabase URL and Key must be provided");
}

// ✅ 클라이언트는 한 번만 생성
export const supabase = createClient(supabaseUrl, supabaseKey);

// 헬퍼 함수들
export const fetchUserFamily = async (userId: string) => {
  const { data, error } = await supabase
    .from("family_members")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("Error fetching family members:", error);
    return [];
  }
  return data;
};

export const fetchUserInfo = async (userId: string) => {
  const { data, error } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("Error fetching user info:", error);
    return null;
  }
  return data;
};

export function publicImageUrl(path: string) {
  const { data } = supabase.storage.from("avatars").getPublicUrl(path);
  const url = data?.publicUrl?.trim();
  return url && url.length > 0 ? url : undefined; // 빈 문자열이면 undefined
}

export function pageImageUrl(imgName: string) {
  const { data } = supabase.storage.from("avatars/page").getPublicUrl(imgName);
  const url = data?.publicUrl?.trim();
  return url && url.length > 0 ? url : undefined; // 빈 문자열이면 undefined
}

export async function isFamilyNameDuplicated(name: string) {
  const { count, error } = await supabase
    .from("families")
    .select("id", { count: "exact", head: true }) // 행은 가져오지 않고 개수만
    .eq("name", name);

  if (error) {
    console.error("Error checking family name:", error);
    return false;
  }
  return (count ?? 0) > 0;
}

export async function getUserSession() {
  const { data: { session }} = await supabase.auth.getSession();
  if (!session) {
    // alert("로그인이 필요합니다.");
    return false;
  }
  return session.user.id;
}

export async function writePost(params: {
  family_id: string;
  author_id: string;
  body: string;
  images: string[];
}) {
  const { error } = await supabase
    .from("posts")
    .insert(params);

  if (error) {
    console.error("Error writing post:", error);
    throw new Error("Failed to write post");
  }
  return true;
}
