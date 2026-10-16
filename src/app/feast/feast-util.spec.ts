import { canDraw, cardImage, currentRound, describeRoll, guestName } from './feast-util';
import { FeastGuest, LordBase } from '../lord';

function guest(extra: Partial<FeastGuest> = {}): FeastGuest {
  return { position: 'near', glory: 1000, geniality: 0, fumbled: false, left: false, kept: [], award: 0,
           significant: [], rounds: {}, ...extra };
}

describe('feast-util', () => {
  it('draws feast cards from 1000 Glory, never above the salt or after leaving', () => {
    expect(canDraw(guest({ glory: 999 }))).toBeFalse();
    expect(canDraw(guest({ glory: 1000 }))).toBeTrue();
    expect(canDraw(guest({ position: 'above', glory: 5000 }))).toBeFalse();
    expect(canDraw(guest({ left: true }))).toBeFalse();
  });

  it('finds the round of a guest', () => {
    expect(currentRound(guest({ rounds: { '2': { action: 'flirt' } } }), 2).action).toBe('flirt');
    expect(currentRound(guest(), 1)).toEqual({});
  });

  it('names the guests and builds the card image url', () => {
    const list = [{ id: 5, name: 'Sir Ulf' } as LordBase];
    expect(guestName(list, '5')).toBe('Sir Ulf');
    expect(guestName(list, 9)).toBe('#9');
    expect(cardImage(12)).toMatch(/12\.jpg$/);
  });

  it('describes the rolls', () => {
    expect(describeRoll({ result: 'success', roll: 7, total: 7, target: 10 })).toBe('success (d20: 7, 7 / 10)');
    const apps = describeRoll({
      first: { result: 'fumble', roll: 20, total: 20, target: 10 },
      second: { result: 'success', roll: 5, total: 5, target: 10 }, position: 'below' });
    expect(apps).toContain('fumble');
    expect(apps).toContain('→ below');
    expect(describeRoll(null)).toBe('');
  });
});
