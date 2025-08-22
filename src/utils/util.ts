// 두벌식(국문) → QWERTY 키 치환
export function koToQwerty(src: string): string {
  const CHO_KEYS = [
    "r",
    "R",
    "s",
    "e",
    "E",
    "f",
    "a",
    "q",
    "Q",
    "t",
    "T",
    "d",
    "w",
    "W",
    "c",
    "z",
    "x",
    "v",
    "g",
  ];
  const JUNG_KEYS = [
    "k",
    "o",
    "i",
    "O",
    "j",
    "p",
    "u",
    "P",
    "h",
    "hk",
    "ho",
    "hl",
    "y",
    "n",
    "nj",
    "np",
    "nl",
    "b",
    "m",
    "ml",
    "l",
  ];
  const JONG_KEYS = [
    "",
    "r",
    "rr",
    "rt",
    "s",
    "sw",
    "sg",
    "e",
    "f",
    "fr",
    "fa",
    "fq",
    "ft",
    "fx",
    "fv",
    "fg",
    "a",
    "q",
    "qt",
    "t",
    "tt",
    "d",
    "w",
    "c",
    "z",
    "x",
    "v",
    "g",
  ];

  // 호환 자모(ㄱ~ㅣ 등) 단독 입력도 대응
  const COMPAT: Record<string, string> = {
    ㄱ: "r",
    ㄲ: "R",
    ㄴ: "s",
    ㄷ: "e",
    ㄸ: "E",
    ㄹ: "f",
    ㅁ: "a",
    ㅂ: "q",
    ㅃ: "Q",
    ㅅ: "t",
    ㅆ: "T",
    ㅇ: "d",
    ㅈ: "w",
    ㅉ: "W",
    ㅊ: "c",
    ㅋ: "z",
    ㅌ: "x",
    ㅍ: "v",
    ㅎ: "g",
    ㅏ: "k",
    ㅐ: "o",
    ㅑ: "i",
    ㅒ: "O",
    ㅓ: "j",
    ㅔ: "p",
    ㅕ: "u",
    ㅖ: "P",
    ㅗ: "h",
    ㅛ: "y",
    ㅜ: "n",
    ㅠ: "b",
    ㅡ: "m",
    ㅣ: "l",
    ㅘ: "hk",
    ㅙ: "ho",
    ㅚ: "hl",
    ㅝ: "nj",
    ㅞ: "np",
    ㅟ: "nl",
    ㅢ: "ml",
    ㄳ: "rt",
    ㄵ: "sw",
    ㄶ: "sg",
    ㄺ: "fr",
    ㄻ: "fa",
    ㄼ: "fq",
    ㄽ: "ft",
    ㄾ: "fx",
    ㄿ: "fv",
    ㅀ: "fg",
    ㅄ: "qt",
  };

  let out = "";
  for (const ch of src) {
    const code = ch.codePointAt(0)!;

    // 1) 완성형 음절 (가~힣)
    if (code >= 0xac00 && code <= 0xd7a3) {
      const syll = code - 0xac00;
      const cho = Math.floor(syll / 588); // 21*28
      const jung = Math.floor((syll % 588) / 28);
      const jong = syll % 28;
      out += CHO_KEYS[cho] + JUNG_KEYS[jung] + JONG_KEYS[jong];
      continue;
    }

    // 2) 호환 자모 블록(ㄱ~ㅣ, 겹받침 등)
    const mapped = COMPAT[ch];
    out += mapped ?? ch; // 없으면 원문 유지
  }
  return out;
}

function dataUrlToBlob(dataUrl: string): Blob {
  const [head, body] = dataUrl.split(",");
  const mime =
    head.match(/data:(.*);base64/)?.[1] || "application/octet-stream";
  const bin = atob(body);
  const u8 = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
  return new Blob([u8], { type: mime });
}

/** '/xxx.png' | 'https://...' | 'blob:...' | 'data:...' 모두 지원 */
export async function srcToBlob(src: string): Promise<Blob> {
  if (src.startsWith("data:")) return dataUrlToBlob(src);
  // 'blob:'도 fetch로 됩니다(같은 문서 세션에서 유효할 때)
  const res = await fetch(src);
  if (!res.ok) throw new Error(`fetch failed for ${src}`);
  return await res.blob();
}

// 예시
// koToQwerty("유수") === "dbtn"
// koToQwerty("값")   === "rkqt"  (ㄱ r, ㅏ k, ㅄ qt)
