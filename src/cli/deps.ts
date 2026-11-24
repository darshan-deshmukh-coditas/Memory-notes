import type { Clock } from "../clock.js";
import type { DraftConnector } from "../email/connector.js";

/** Everything a command needs from the outside world. Tests inject fakes (NFR-M2, NFR-M3). */
export interface Deps {
  clock: Clock;
  /** Lazily created so `ingest`/`list`/`done` never need Gmail. */
  connector: () => DraftConnector;
  out: (line: string) => void;
  /** Warnings and errors go to stderr (NFR-O3). */
  err: (line: string) => void;
  env: NodeJS.ProcessEnv;
}
