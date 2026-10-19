// Tables of Appendix B: Coat of Arms Generator (Pendragon core rulebook), plus the charge registry the renderer uses.

export type Tincture = 'argent' | 'or' | 'gules' | 'azure' | 'vert' | 'purpure' | 'sable' | 'ermine' | 'vair';
export type ChargeTincture = Tincture | 'proper';
export type Column = 'metal' | 'color';

export const isMetal = (t: Tincture): boolean => t === 'argent' || t === 'or';
export const isFur = (t: Tincture): boolean => t === 'ermine' || t === 'vair';

export const TINCTURE_COLORS: Record<Exclude<Tincture, 'ermine' | 'vair'>, string> = {
  argent: '#f4efe0',
  or: '#e8b82e',
  gules: '#c5352c',
  azure: '#2b5aa0',
  vert: '#3f9a45',
  purpure: '#7b3f93',
  sable: '#2a2d31',
};

export type Row<T> = [upTo: number, value: T];

// Table B.2: Tinctures (every column is rolled on its own 1D20)
export const FIELD_ROWS: Row<Tincture | 'fur'>[] = [
  [5, 'argent'], [9, 'or'], [10, 'purpure'], [13, 'azure'], [16, 'gules'], [17, 'vert'], [19, 'sable'], [20, 'fur']];
export const METAL_ROWS: Row<ChargeTincture>[] = [[7, 'argent'], [17, 'or'], [20, 'proper']];
export const COLOR_ROWS: Row<ChargeTincture>[] = [
  [5, 'azure'], [7, 'vert'], [13, 'gules'], [16, 'sable'], [17, 'purpure'], [20, 'proper']];

export function lookup<T>(rows: Row<T>[], roll: number): T {
  return rows.find(r => roll <= r[0])![1];
}

// Sub-table B.1.1: Variations
export type Pattern = 'barry' | 'bendy' | 'bendy-sinister' | 'chequy' | 'chevronny' | 'fretty' | 'gyronny' | 'lozengy' | 'paly' | 'seme';
export const VARIATION_ROWS: Row<{ pattern: Pattern; count?: number }>[] = [
  [4, { pattern: 'barry', count: 6 }], [5, { pattern: 'barry', count: 8 }], [6, { pattern: 'barry', count: 10 }],
  [8, { pattern: 'bendy' }], [9, { pattern: 'bendy-sinister' }], [12, { pattern: 'chequy' }],
  [13, { pattern: 'chevronny' }], [14, { pattern: 'fretty' }], [15, { pattern: 'gyronny' }],
  [17, { pattern: 'lozengy' }], [19, { pattern: 'paly' }], [20, { pattern: 'seme' }]];

// Sub-table B.1.2: Divisions (the Design column belongs to the same row)
export type Division = 'quarterly' | 'pale' | 'fess' | 'bend' | 'bend-sinister' | 'saltire' | 'chevron';
export type DivisionDesign = 'solid' | 'separate' | 'overall' | 'counter' | 'none';
export const DIVISION_ROWS: Row<{ division: Division; design: DivisionDesign }>[] = [
  [10, { division: 'quarterly', design: 'solid' }], [13, { division: 'pale', design: 'separate' }],
  [16, { division: 'fess', design: 'overall' }], [17, { division: 'bend', design: 'counter' }],
  [18, { division: 'bend-sinister', design: 'none' }], [19, { division: 'saltire', design: 'none' }],
  [20, { division: 'chevron', design: 'none' }]];

export type OrdinaryType = 'chief' | 'fess' | 'pale' | 'bend' | 'bend-sinister' | 'cross' | 'pile' | 'flaunches'
  | 'chevron' | 'saltire' | 'bordure' | 'orle' | 'quarter' | 'canton';
export const ORDINARY_NAMES: Record<OrdinaryType, string> = {
  'chief': 'chief', 'fess': 'fess', 'pale': 'pale', 'bend': 'bend', 'bend-sinister': 'bend sinister', 'cross': 'cross',
  'pile': 'pile', 'flaunches': 'flaunches', 'chevron': 'chevron', 'saltire': 'saltire', 'bordure': 'bordure',
  'orle': 'orle', 'quarter': 'quarter', 'canton': 'canton'};
export const PERIPHERAL_TYPES: OrdinaryType[] = ['chief', 'bordure', 'orle', 'quarter', 'canton'];

// Table B.3: Charges. Columns 1-6 (index 0-5), 20 rows each.
//   'A|B'  two choices (pick one, 1D2)     '@x'  an ordinary     '*Name'  roll 1D6 on that row of Sub-table B.3.1
export const CHARGE_COLUMNS: string[][] = [
  // 1 Animate
  ['Lion rearing', 'Lion rearing', 'Lion rearing', 'Lion resting', 'Lion standing', 'Lion walking', 'Lion walking',
    'Lion rearing', 'Lion rearing', 'Dragon', 'Dragon', 'Eagle', 'Eagle', 'Eagle', 'Stag', 'Wolf', 'Bear', 'Boar', 'Fox',
    'Talbot'],
  // 2 Animate
  ['Bee', 'Hound', 'Goat', 'Ram|Sheep', 'Bull', 'Horse', 'Fish', 'Fish', 'Dolphin', 'Escallop', 'Crab', 'Eel', 'Serpent',
    'Bat', 'Spider|Fly', 'Scorpion|Ant', 'Leopard', 'Crow|Raven', '*Birds', '*Religious'],
  // 3 Animate
  ['Sea-horse', 'Unicorn', 'Gryphon', 'Hippogriff', 'Wyvern', 'Dragon', 'Wyrm', 'Cockatrice', 'Manticore', 'Giant|Ogre',
    'Centaur|Satyr', 'Pegasus', 'Sea-dog', 'Mermaid|Merman', 'Camelopard', 'Harpy', 'Phoenix', 'Opinicus', 'Salamander',
    'Yale|Enfield'],
  // 4 Inanimate
  ['Sword', 'Church Bell', 'Lymphad', 'Castle|Tower', 'Sun|Moon', 'Head|Skull', 'Hand|Arm', 'Gauntlet', 'Anchor', 'Crown',
    'Rose|Thistle', 'Tree', '*Weapons', '*Household', '*Nature', '*Christian', '*Pagan', '*Tools', '*Chivalry',
    '*Constructs'],
  // 5 Inanimate
  ['Cross', 'Cross Crosslet', 'Cross Patée', '*More Crosses', 'Trefoil', 'Quatrefoil|Cinquefoil', 'Crescent',
    'Increscent|Decrescent', 'Estoile|Mullet', 'Mullet', 'Mullet pierced', 'Mullet of six|Mullet of eight', 'Lozenge',
    'Rustre|Mascle', 'Roundel', 'Roundel', 'Roundel', 'Annulet', 'Fleur-de-lis', 'Heart|Billet'],
  // 6 Ordinary
  ['@chief', '@fess', '@pale', '@bend', '@cross', '@pile|@flaunches', '@fess', '@fess', '@fess', '@fess', '@bend-sinister',
    '@bend', '@bend', '@bend', '@chevron', '@chevron', '@cross', '@cross', '@saltire', '@pale'],
];

// Sub-table B.3.1: Charge Types (1D6)
export const SUBTABLES: Record<string, string[]> = {
  'Chivalry': ['Knight', 'Spur', 'Helm', 'Warhorse', 'Lance|Spear', 'Cup'],
  'Weapons': ['Warhammer', 'Battle-axe', 'Arrow', 'Mace|Flail', 'Morningstar', 'Spear'],
  'Tools': ['Hammer', 'Anvil', 'Hunting Horn', 'Wheel', 'Horseshoe', 'Sickle|Shovel'],
  'Household': ['Fetterlock', 'Key', 'Buckle', 'Scale', 'Maunch', 'Harp|Book'],
  'Birds': ['Falcon', 'Owl', 'Heron|Crane', 'Martlet', 'Cock', 'Swan'],
  'Peripherals': ['@bordure|@orle', '@bordure', '@chief', '@chief', '@chief', '@quarter|@canton'],
  'Religious': ['Mary & Child', 'Saint|Angel', 'Crucifixion', 'Pascal lamb', 'Roman god', 'Celtic god'],
  'Christian': ['Chi-Rho', 'Chi-Rho', 'Chi-Rho', 'Dove', 'Palm leaf', 'Crown of thorns'],
  'More Crosses': ['Maltese', 'Moline', 'Patonce', 'Potent', 'Flory', 'Bottony'],
  'Pagan': ['Caduceus', 'Thunderbolt', 'Medusa', 'Horned God', 'Shining spear', 'Woman rider'],
  'Nature': ['Mountain', 'Shooting star', 'Fountain', 'Acorn|Apple', 'Wild man', 'Garb'],
  'Constructs': ['Pavilion', 'Walls', 'Bridge', 'Gateworks', 'Church', 'Lighthouse'],
};
// "Ordinaries and religious symbols are singles"
export const SINGLE_SUBTABLES = ['Religious', 'Christian', 'Pagan'];

export interface ChargeDef {
  key: string;
  name: string;            // as used in the blazon
  plural?: string;
  pose?: string;
  glyph?: string;          // drawn as a silhouette of this symbol
  headGlyph?: string;      // ... when only the head is shown
  shape?: string;          // or drawn as a heraldic shape of arms-svg.ts
  natural?: boolean;       // looks right in its natural colors ("proper")
  italic?: boolean;        // italicized in Table B.3: optional rule 1 (head only)
  quad?: 'c' | 'h';        // quadruped (carnivore / herbivore): optional rule 3 (animation)
}

const D: ChargeDef[] = [];
const def = (key: string, name: string, o: Partial<ChargeDef> = {}) => D.push({ key, name, ...o });
const animal = (key: string, name: string, glyph: string, o: Partial<ChargeDef> = {}) =>
  def(key, name, { glyph, natural: true, ...o });

// 1: Animate
def('Lion rearing', 'lion', { glyph: '🦁', natural: true, italic: true, pose: 'rampant' });
def('Lion resting', 'lion', { glyph: '🦁', natural: true, italic: true, pose: 'couchant' });
def('Lion standing', 'lion', { glyph: '🦁', natural: true, italic: true, pose: 'statant' });
def('Lion walking', 'lion', { glyph: '🦁', natural: true, italic: true, pose: 'passant' });
animal('Dragon', 'dragon', '🐉');
animal('Eagle', 'eagle', '🦅', { italic: true, pose: 'displayed' });
animal('Stag', 'stag', '🦌', { italic: true, quad: 'h' });
animal('Wolf', 'wolf', '🐺', { italic: true, quad: 'c', plural: 'wolves' });
animal('Bear', 'bear', '🐻', { italic: true, quad: 'c' });
animal('Boar', 'boar', '🐗', { italic: true, quad: 'c' });
animal('Fox', 'fox', '🦊', { italic: true, quad: 'c' });
animal('Talbot', 'talbot', '🐕', { italic: true, quad: 'c', headGlyph: '🐶' });
// 2: Animate
animal('Bee', 'bee', '🐝');
animal('Hound', 'hound', '🐕', { italic: true, quad: 'c', headGlyph: '🐶' });
animal('Goat', 'goat', '🐐', { italic: true, quad: 'h' });
animal('Ram', 'ram', '🐏', { italic: true, quad: 'h' });
animal('Sheep', 'sheep', '🐑', { quad: 'h', plural: 'sheep' });
animal('Bull', 'bull', '🐂', { italic: true, quad: 'h', headGlyph: '🐮' });
animal('Horse', 'horse', '🐎', { italic: true, quad: 'h', headGlyph: '🐴' });
animal('Fish', 'fish', '🐟', { plural: 'fish' });
animal('Dolphin', 'dolphin', '🐬');
animal('Escallop', 'escallop', '🐚');
animal('Crab', 'crab', '🦀');
animal('Eel', 'eel', '🐍');
animal('Serpent', 'serpent', '🐍');
animal('Bat', 'bat', '🦇');
animal('Spider', 'spider', '🕷');
animal('Fly', 'fly', '🪰');
animal('Scorpion', 'scorpion', '🦂');
animal('Ant', 'ant', '🐜');
animal('Leopard', 'leopard', '🐆', { quad: 'c' });
def('Crow', 'crow', { glyph: '🐦' });
def('Raven', 'raven', { glyph: '🐦' });
// 3: Animate
animal('Sea-horse', 'sea-horse', '🐴');
animal('Unicorn', 'unicorn', '🦄', { italic: true, quad: 'h' });
animal('Gryphon', 'gryphon', '🦅', { italic: true });
animal('Hippogriff', 'hippogriff', '🐴');
animal('Wyvern', 'wyvern', '🐉');
animal('Wyrm', 'wyrm', '🐍');
animal('Cockatrice', 'cockatrice', '🐓');
animal('Manticore', 'manticore', '🦁');
animal('Giant', 'giant', '👹');
animal('Ogre', 'ogre', '👹');
animal('Centaur', 'centaur', '🏹');
animal('Satyr', 'satyr', '🐐');
animal('Pegasus', 'pegasus', '🐴');
animal('Sea-dog', 'sea-dog', '🐕');
animal('Mermaid', 'mermaid', '🧜');
animal('Merman', 'merman', '🧜');
animal('Camelopard', 'camelopard', '🦒', { quad: 'h' });
animal('Harpy', 'harpy', '🦅');
animal('Phoenix', 'phoenix', '🦅');
animal('Opinicus', 'opinicus', '🦅');
animal('Salamander', 'salamander', '🦎');
animal('Yale', 'yale', '🐐');
animal('Enfield', 'enfield', '🦊');
// 4: Inanimate
def('Sword', 'sword', { glyph: '🗡' });
def('Church Bell', 'church bell', { glyph: '🔔' });
def('Lymphad', 'lymphad', { glyph: '⛵' });
def('Castle', 'castle', { glyph: '🏰' });
def('Tower', 'tower', { glyph: '🏯' });
def('Sun', 'sun', { glyph: '☀' });
def('Moon', 'moon', { glyph: '🌙' });
def('Head', 'head', { glyph: '👤' });
def('Skull', 'skull', { glyph: '💀' });
def('Hand', 'hand', { glyph: '✋' });
def('Arm', 'arm', { glyph: '💪' });
def('Gauntlet', 'gauntlet', { glyph: '🧤' });
def('Anchor', 'anchor', { glyph: '⚓' });
def('Crown', 'crown', { glyph: '👑' });
def('Rose', 'rose', { glyph: '🌹', natural: true });
def('Thistle', 'thistle', { glyph: '🌿', natural: true });
def('Tree', 'tree', { glyph: '🌳', natural: true });
// 5: Inanimate (heraldic shapes)
def('Cross', 'cross couped', { shape: 'cross', plural: 'crosses couped' });
def('Cross Crosslet', 'cross crosslet', { shape: 'crosslet', plural: 'crosses crosslet' });
def('Cross Patée', 'cross patée', { shape: 'patee', plural: 'crosses patée' });
def('Trefoil', 'trefoil', { shape: 'trefoil' });
def('Quatrefoil', 'quatrefoil', { shape: 'quatrefoil' });
def('Cinquefoil', 'cinquefoil', { shape: 'cinquefoil' });
def('Crescent', 'crescent', { shape: 'crescent' });
def('Increscent', 'increscent', { shape: 'increscent' });
def('Decrescent', 'decrescent', { shape: 'decrescent' });
def('Estoile', 'estoile', { shape: 'estoile' });
def('Mullet', 'mullet', { shape: 'mullet' });
def('Mullet pierced', 'mullet pierced', { shape: 'mullet-pierced', plural: 'mullets pierced' });
def('Mullet of six', 'mullet of six points', { shape: 'mullet6', plural: 'mullets of six points' });
def('Mullet of eight', 'mullet of eight points', { shape: 'mullet8', plural: 'mullets of eight points' });
def('Lozenge', 'lozenge', { shape: 'lozenge' });
def('Rustre', 'rustre', { shape: 'rustre' });
def('Mascle', 'mascle', { shape: 'mascle' });
def('Roundel', 'roundel', { shape: 'roundel' });
def('Annulet', 'annulet', { shape: 'annulet' });
def('Fleur-de-lis', 'fleur-de-lis', { shape: 'fleur', plural: 'fleurs-de-lis' });
def('Heart', 'heart', { shape: 'heart' });
def('Billet', 'billet', { shape: 'billet' });
// B.3.1 Chivalry
def('Knight', 'knight', { glyph: '🏇' });
def('Spur', 'spur', { glyph: '⚙' });
def('Helm', 'helm', { glyph: '🪖' });
def('Warhorse', 'warhorse', { glyph: '🐎', natural: true, headGlyph: '🐴' });
def('Lance', 'lance', { glyph: '🔱' });
def('Spear', 'spear', { glyph: '🔱' });
def('Cup', 'cup', { glyph: '🏆' });
// Weapons
def('Warhammer', 'warhammer', { glyph: '🔨' });
def('Battle-axe', 'battle-axe', { glyph: '🪓' });
def('Arrow', 'arrow', { glyph: '🏹' });
def('Mace', 'mace', { glyph: '🔨' });
def('Flail', 'flail', { glyph: '⛓' });
def('Morningstar', 'morningstar', { glyph: '✴' });
// Tools
def('Hammer', 'hammer', { glyph: '🔨' });
def('Anvil', 'anvil', { glyph: '⚒' });
def('Hunting Horn', 'hunting horn', { glyph: '📯' });
def('Wheel', 'wheel', { glyph: '☸' });
def('Horseshoe', 'horseshoe', { glyph: '🧲' });
def('Sickle', 'sickle', { glyph: '🌙' });
def('Shovel', 'shovel', { glyph: '⛏' });
// Household
def('Fetterlock', 'fetterlock', { glyph: '🔒' });
def('Key', 'key', { glyph: '🗝' });
def('Buckle', 'buckle', { glyph: '🔗' });
def('Scale', 'scale', { glyph: '⚖' });
def('Maunch', 'maunch', { glyph: '👘' });
def('Harp', 'harp', { glyph: '🎻' });
def('Book', 'book', { glyph: '📖' });
// Birds
animal('Falcon', 'falcon', '🦅');
animal('Owl', 'owl', '🦉');
animal('Heron', 'heron', '🦢');
animal('Crane', 'crane', '🦩');
animal('Martlet', 'martlet', '🐦');
animal('Cock', 'cock', '🐓');
animal('Swan', 'swan', '🦢');
// Religious
def('Mary & Child', 'Virgin and Child', { glyph: '🤱' });
def('Saint', 'saint', { glyph: '😇' });
def('Angel', 'angel', { glyph: '👼' });
def('Crucifixion', 'crucifixion', { glyph: '✝' });
def('Pascal lamb', 'Pascal lamb', { glyph: '🐑', natural: true });
def('Roman god', 'Roman god', { glyph: '🏛' });
def('Celtic god', 'Celtic god', { glyph: '☘' });
// Christian
def('Chi-Rho', 'Chi-Rho', { glyph: '☧' });
def('Dove', 'dove', { glyph: '🕊' });
def('Palm leaf', 'palm leaf', { glyph: '🌴', natural: true });
def('Crown of thorns', 'crown of thorns', { shape: 'annulet' });
// More Crosses
def('Maltese', 'Maltese cross', { shape: 'maltese', plural: 'Maltese crosses' });
def('Moline', 'cross moline', { shape: 'moline', plural: 'crosses moline' });
def('Patonce', 'cross patonce', { shape: 'patonce', plural: 'crosses patonce' });
def('Potent', 'cross potent', { shape: 'potent', plural: 'crosses potent' });
def('Flory', 'cross flory', { shape: 'flory', plural: 'crosses flory' });
def('Bottony', 'cross bottony', { shape: 'bottony', plural: 'crosses bottony' });
// Pagan
def('Caduceus', 'caduceus', { glyph: '⚕' });
def('Thunderbolt', 'thunderbolt', { glyph: '⚡' });
def('Medusa', 'Medusa', { glyph: '🐍', italic: true });
def('Horned God', 'Horned God', { glyph: '🦌', italic: true });
def('Shining spear', 'shining spear', { glyph: '🔱' });
def('Woman rider', 'woman rider', { glyph: '🏇' });
// Nature
def('Mountain', 'mountain', { glyph: '⛰', natural: true });
def('Shooting star', 'shooting star', { glyph: '🌠' });
def('Fountain', 'fountain', { glyph: '⛲' });
def('Acorn', 'acorn', { glyph: '🌰', natural: true });
def('Apple', 'apple', { glyph: '🍎', natural: true });
def('Wild man', 'wild man', { glyph: '🧔', natural: true, italic: true, plural: 'wild men' });
def('Garb', 'garb', { glyph: '🌾', natural: true });
// Constructs
def('Pavilion', 'pavilion', { glyph: '⛺' });
def('Walls', 'wall', { glyph: '🧱' });
def('Bridge', 'bridge', { glyph: '🌉' });
def('Gateworks', 'gate', { glyph: '🚪' });
def('Church', 'church', { glyph: '⛪' });
def('Lighthouse', 'lighthouse', { glyph: '🗼' });

export const CHARGE_DEFS: Record<string, ChargeDef> = Object.fromEntries(D.map(d => [d.key, d]));
