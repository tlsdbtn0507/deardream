import { createClient } from "@supabase/supabase-js";
import { PostType, FamilyMember, Relation } from "@/utils/types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Supabase URL and Key must be provided");
}

// ✅ 클라이언트는 한 번만 생성
export const supabase = createClient(supabaseUrl, supabaseKey);

const fetchFamilyId = async (userId: string) => {
  const { data, error } = await supabase
    .from("family_members")
    .select("family_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("Error fetching family ID:", error);
    return null;
  }
  return data?.family_id ?? null;
};

// 헬퍼 함수들
export const fetchUserFamily = async (userId: string): Promise<FamilyMember[] | null> => {

  const familyId = await fetchFamilyId(userId);
  if (!familyId) return null;

  const { data, error } = await supabase
    .from("family_members")
    .select("*")
    .eq("family_id", familyId);

  if (error) {
    console.error("Error fetching family members:", error);
    return null;
  }
  return data;
};

export const fetchFamilyInfo = async (familyId: string) => {
  const { data, error } = await supabase
    .from("families")
    .select("*")
    .eq("id", familyId)
    .maybeSingle();

  if (error) {
    console.error("Error fetching family info:", error);
    return null;
  }
  return data;
};

export const fetchFamilyPosts = async (familyId: string): Promise<PostType[]> => {
  // created_at이 최신인 순서로 정렬
  const { data, error } = await supabase
    .from("posts_with_author")
    .select("*")
    .eq("family_id", familyId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching family posts:", error);
    return [];
  }
  return data;
};

export const deletePost = async (postId: string) => {
  const { error } = await supabase
    .from("posts")
    .delete()
    .eq("id", postId);

  if (error) {
    console.error("Error deleting post:", error);
    return false;
  }
  return true;
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

export async function newsImageUrl(month: string): Promise<string[]> {
  const bucket = "avatars";
  const prefix = `message/${month}`; // 예: message/202507

  // 폴더 목록 조회
  const { data, error } = await supabase.storage.from(bucket).list(prefix, {
    limit: 1000,
    sortBy: { column: "name", order: "asc" },
  });
  if (error) throw error;

  // 파일만 골라서 URL 생성 (폴더 항목 제외)
  const files = (data ?? []).filter((item) => item.id || item.metadata);
  return files
    .map(
      (f) =>
        supabase.storage.from(bucket).getPublicUrl(`${prefix}/${f.name}`).data
          .publicUrl
    )
    .filter((url): url is string => !!url && url.trim().length > 0);
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
  const familyPosts = await fetchFamilyPosts(params.family_id);
  
  if (familyPosts.length >= 20) {
    return false;
  }
  const { error } = await supabase
    .from("posts")
    .insert(params);

  if (error) {
    console.error("Error writing post:", error);
    throw new Error("Failed to write post");
  }
  return true;
}

export const fetchFamilyIdwithCode = async (inviteCode: string) => {
  const { data, error } = await supabase
    .from("families")
    .select("id")
    .eq("invite_code", inviteCode)
    .maybeSingle();

  if (error) {
    console.error("Error fetching family ID with code:", error);
    return null;
  }
  return data?.id;
};

export const participateFamily = async (params: {
  userId: string;
  familyId: string;
  relation: Relation;
  profileImage: string;
  role: "parent" | "child" | null;
}) => {
  const { userId, familyId, relation, profileImage, role } = params;

  const { error } = await supabase
    .from("family_members")
    .insert({ user_id: userId, family_id: familyId, role, relation, profile_image: profileImage });

  if (error) {
    console.error("Error participating in family:", error);
    return false;
  }
  return true;
};

export const fetchFamilyMonth = async (userId: string): Promise<string[]> => {
  const familyId = await fetchFamilyId(userId);

  const {data,error} = await supabase
    .from("news")
    .select("news_month")
    .eq("family_id", familyId);

  if (error) {
    console.error("Error fetching family months:", error);
    return [];
  }
  return data.map(item => item.news_month);
}
