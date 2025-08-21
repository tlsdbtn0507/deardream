
export function nextClosureDate(
  rule: "SECOND_SUN" | "FOURTH_SUN",
  from = new Date()
) {
  const targetIndex = rule === "SECOND_SUN" ? 1 : 3; // 0=첫째,1=둘째,3=넷째
  const findNthSunday = (y: number, m: number, nth: number) => {
    const d = new Date(y, m, 1);
    const sundays: number[] = [];
    while (d.getMonth() === m) {
      if (d.getDay() === 0) sundays.push(d.getDate());
      d.setDate(d.getDate() + 1);
    }
    return sundays[nth];
  };

  const y = from.getFullYear();
  const m = from.getMonth();
  let day = findNthSunday(y, m, targetIndex);
  let candidate = new Date(y, m, day);

  if (candidate <= from) {
    const ny = m === 11 ? y + 1 : y;
    const nm = (m + 1) % 12;
    day = findNthSunday(ny, nm, targetIndex);
    candidate = new Date(ny, nm, day);
  }
  return candidate.toISOString().slice(0, 10); // "YYYY-MM-DD"
}
