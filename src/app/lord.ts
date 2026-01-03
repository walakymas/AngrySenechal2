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
export class FeastRound {
  action: string;
  card: string;

}
export class GuestRound {
  cards: number[];
}
export class GuestRoundMap {
  [key: number]: GuestRound;
}
export class FeastGuest {
  id:number;
  name:string;
  glory:number;
  seat:number;
  activeCard:number[];
  hand:number[];
  rounds:GuestRoundMap;
  history:FeastRound[];
}

export class FeastGuestMap {
  [key: number]: FeastGuest;
}
export class FeastData {
  name:string;
  round:number;
  rounds:number;
  participiants: FeastGuestMap;
  deck:Deck;
  state:string;
}
export class Feast {
  data:FeastData;
  description:string;
  title:string;
  id:number;
  pos:number;
}

export class Card {
  name:string;
  check:{};
  keep:{};
  tags:string[];
}
export class FeastConfig {
  [key: string]: Card;
}

