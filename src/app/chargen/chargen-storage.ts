export const CHARGEN_VERSION = 1;

export interface ChargenState {
  version: number;
  dbid: number;
  step: number;
  gender: string;
  traitMode: string;
  attribMode: string;
  mainForm: { name: string, lord: string, year: number, born: number };
  /** a teljes munkaobjektum, benne a `charBase` segédadatokkal */
  char: {};
}

function key(dbid: number | string): string {
  return 'chargen.' + dbid;
}

function storage(): Storage | null {
  try {
    return window.localStorage;
  } catch (e) {
    return null;
  }
}

export function loadChargenState(dbid: number | string): ChargenState | null {
  try {
    const raw = storage()?.getItem(key(dbid));
    if (!raw) {
      return null;
    }
    const state = JSON.parse(raw);
    if (!state || state.version !== CHARGEN_VERSION || !state.char || !state.char.charBase) {
      return null;
    }
    return state as ChargenState;
  } catch (e) {
    return null;
  }
}

export function saveChargenState(state: ChargenState): void {
  try {
    storage()?.setItem(key(state.dbid), JSON.stringify(state));
  } catch (e) {
    // privát mód / tele a tároló: a folyamat memóriában tovább működik
  }
}

export function clearChargenState(dbid: number | string): void {
  try {
    storage()?.removeItem(key(dbid));
  } catch (e) {
  }
}

export function hasChargenState(dbid: number | string): boolean {
  return loadChargenState(dbid) != null;
}
