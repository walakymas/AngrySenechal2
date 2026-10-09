import { environment } from '../../environments/environment';
import { FeastGuest, FeastRoundData, LordBase } from '../lord';

export const SEATS = ['above', 'near', 'below', 'floor'];
export const ACTIVITIES = ['card', 'gossip', 'indulge', 'flirt', 'game', 'pass'];
export const MIN_CARD_GLORY = 1000;   // the same rule as the backend (feast_rules.py); the API decides

const DEFAULT_IMAGES = 'https://senechalweb.duckdns.org/feastImages/images/';

// The card images: `feastImages` of the environment (a base URL with a trailing slash) or the default
export function cardImage(card: number | string): string {
  const base = (environment as any).feastImages || DEFAULT_IMAGES;
  return `${base}${card}.jpg`;
}

export function guestName(list: LordBase[] | undefined, cid: number | string): string {
  const lord = (list || []).find(l => l.id == +cid);
  return lord ? lord.name : '#' + cid;
}

export function guestImage(list: LordBase[] | undefined, cid: number | string): string {
  const lord = (list || []).find(l => l.id == +cid);
  return lord && lord.url ? lord.url : 'assets/question.png';
}

export function canDraw(guest: FeastGuest): boolean {
  return guest.position !== 'above' && guest.glory >= MIN_CARD_GLORY && !guest.left;
}

export function currentRound(guest: FeastGuest, round: number): FeastRoundData {
  return (guest.rounds && guest.rounds['' + round]) || {};
}

export function describeRoll(rolled: any): string {
  if (!rolled) {
    return '';
  }
  if (rolled.first) {   // the APP roll(s) and the seat
    const rolls = [rolled.first, rolled.second].filter(r => !!r);
    return 'APP: ' + rolls.map(r => describeRoll(r)).join(' → ') + ' → ' + rolled.position;
  }
  return `${rolled.result} (d20: ${rolled.roll}, ${rolled.total} / ${rolled.target})`;
}

export function resultIcon(result: string | undefined): string {
  switch (result) {
    case 'critical': return 'check:critical';
    case 'success': return 'check:success';
    case 'failure': return 'check:fail';
    case 'fumble': return 'check:fumble';
    default: return '';
  }
}
