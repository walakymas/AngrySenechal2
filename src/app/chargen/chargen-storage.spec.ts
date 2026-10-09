import { CHARGEN_VERSION, ChargenState, clearChargenState, hasChargenState, loadChargenState, saveChargenState } from './chargen-storage';

describe('chargen-storage', () => {
  const state = (dbid: number): ChargenState => ({
    version: CHARGEN_VERSION,
    dbid,
    step: 2,
    gender: 'female',
    traitMode: 'base',
    attribMode: 'random',
    mainForm: { name: 'Lady Test', lord: 'Sir Lord', year: 490, born: 470 },
    char: { name: 'Lady Test', charBase: { famous: 'none' } }
  });

  beforeEach(() => {
    window.localStorage.clear();
  });

  it('elmenti és visszatölti az állapotot', () => {
    saveChargenState(state(7));
    expect(loadChargenState(7)).toEqual(state(7));
    expect(hasChargenState(7)).toBeTrue();
  });

  it('karakterenként külön tárol', () => {
    saveChargenState(state(1));
    expect(loadChargenState(2)).toBeNull();
    expect(hasChargenState(2)).toBeFalse();
  });

  it('töröl', () => {
    saveChargenState(state(3));
    clearChargenState(3);
    expect(loadChargenState(3)).toBeNull();
  });

  it('hibás JSON-t eldob', () => {
    window.localStorage.setItem('chargen.4', '{nem json');
    expect(loadChargenState(4)).toBeNull();
  });

  it('eltérő verziójú vagy hiányos állapotot eldob', () => {
    window.localStorage.setItem('chargen.5', JSON.stringify({ ...state(5), version: CHARGEN_VERSION + 1 }));
    expect(loadChargenState(5)).toBeNull();
    window.localStorage.setItem('chargen.6', JSON.stringify({ ...state(6), char: {} }));
    expect(loadChargenState(6)).toBeNull();
  });

  it('nem dob kivételt, ha a localStorage nem elérhető', () => {
    spyOn(Storage.prototype, 'getItem').and.throwError('blocked');
    spyOn(Storage.prototype, 'setItem').and.throwError('blocked');
    spyOn(Storage.prototype, 'removeItem').and.throwError('blocked');
    expect(() => saveChargenState(state(8))).not.toThrow();
    expect(loadChargenState(8)).toBeNull();
    expect(() => clearChargenState(8)).not.toThrow();
  });
});
