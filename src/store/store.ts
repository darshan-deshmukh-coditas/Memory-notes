import { NotImplementedError } from "../domain/errors.js";
import type { StoreFile } from "../domain/types.js";

/** Default store in the working dir; override via `--store` or ACTIONTRACK_STORE (FRD D17). */
export const DEFAULT_STORE_PATH = ".actiontrack/items.json";
export const STORE_ENV = "ACTIONTRACK_STORE";

export function resolveStorePath(_flag: string | undefined, _env: NodeJS.ProcessEnv): string {
  throw new NotImplementedError("resolveStorePath (FRD D17.2)");
}

/** Missing file gives an empty store. A corrupt file gives a clear error and is never overwritten silently. */
export function loadStore(_path: string): StoreFile {
  throw new NotImplementedError("loadStore (FRD D17)");
}

/** Atomic write (temp file + rename) so a failure never corrupts stored items (NFR-R3). */
export function saveStore(_path: string, _store: StoreFile): void {
  throw new NotImplementedError("saveStore (FRD D17, NFR-R3)");
}
