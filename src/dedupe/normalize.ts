/**
 * Normalised task (specs/04 rules 1 to 3; plan 04 D77, D78, D79): Unicode NFC, lowercase, apostrophes
 * removed with no space, hyphens and dashes become a space, other punctuation removed, whole-word
 * `a`, `an` and `the` dropped, spaces collapsed. Other word differences keep items apart (FRD D28.3).
 * Pure.
 */
export function normalizeTask(task: string): string {
  const words = task
    .normalize("NFC")
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[-–—]/g, " ")
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .split(/\s+/)
    .filter((w) => w !== "" && w !== "a" && w !== "an" && w !== "the");
  return words.join(" ");
}
