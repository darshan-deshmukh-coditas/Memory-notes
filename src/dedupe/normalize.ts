import { NotImplementedError } from "../domain/errors.js";

/**
 * Normalised task = lowercase, trailing due phrase (`by|from|on|due ...`) removed,
 * articles a/an/the removed, punctuation removed, spaces collapsed (FRD D28.2, D36.2).
 * Other wording differences keep items separate ("first" vs "updated" wireframes).
 */
export function normalizeTask(_task: string): string {
  throw new NotImplementedError("normalizeTask (FRD D28.2, D36.2)");
}
