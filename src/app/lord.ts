export interface Lord {
    year: number;
    modified: string;
    marks: string[];
    events: [];
    char: {};
    virtues: string[];
}

export interface LordBase {
    id: number;
    modified: string;
    name: string;
    type: string;
    role: string;
    player: number;
    url: string;
    memberid: number;
}

export class LordDetail {
    damage: number;
    hr: number;
    hp: number;
    ahp: number;
    mr: number;
    unc: number;
    chi: string;
    wounds: string;
    mw: number;
    kno: number;
}

export class LordData {
    name: string;
    shortName: string;
    player:string;
    memberId:string;
    url:string;
    main:{};
    npcs:{};
    health:{};
    winter:{};
    did: number;
    army:{};
    combat:{};
    description:string;
    longdescription:string;
    skills: {};
    stats: {};
    traits: {};
    passions: {};
    detail: LordDetail;
}
export class Deck {
  pos:number;
  deck: [];
}
export interface FeastRoundData {
  action?: string;          // card, gossip, indulge, flirt, game, pass
  cards?: number[];         // the hand of the round
  selected?: number;        // the played card
  discarded?: number[];
  requires?: string[];      // round 1: Temperate / Chaste rolls still to make
  forced?: boolean;
  result?: string;          // critical, success, failure, fumble
}
export interface FeastGuest {
  position: string;         // above, near, below, floor, -1 before the seating
  glory: number;
  geniality: number;
  app?: number;
  fumbled: boolean;
  left: boolean;
  kept: number[];
  award: number;
  finalGlory?: number;
  significant: string[];
  rounds: { [round: string]: FeastRoundData };
  enabled?: number[];       // the cards of the current round that can be played
}
export interface FeastGuestMap {
  [cid: string]: FeastGuest;
}
export interface FeastLogEntry {
  round: number;
  cid: string;
  text: string;
}
export interface FeastData {
  round: number;
  rounds: number;
  royal: boolean;
  participiants: FeastGuestMap;
  state: string;            // init, feast, end
  log: FeastLogEntry[];
}
export interface Feast {
  data: FeastData;
  description: string;
  title: string;
  id: number;
  pos: number;
}
export interface RollResult {
  result: string;
  roll: number;
  total: number;
  target: number;
}
export interface FeastReply extends Feast {
  rolled?: any;             // what the call rolled (a RollResult, or the APP rolls with the seat)
}
export interface FeastSummary {
  id: number;
  created: string;
  title: string;
  state: string;
  round: number;
  rounds: number;
}

export class Card {
  name:string;
  text?:string;
  full?:string;
  geniality?:number;
  mandatory?:string;
  check:{};
  keep:{};
  tags:string[];
}
export class FeastConfig {
  [key: string]: Card;
}

