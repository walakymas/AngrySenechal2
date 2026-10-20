// A text prompt for an image AI (any web chat) from the blazon: the exact blazon, plus plain words for the heraldic terms in it.

const TINCTURES: [string, string][] = [
  ['argent', 'silver / white'], ['or', 'gold / yellow'], ['gules', 'red'], ['azure', 'blue'], ['vert', 'green'],
  ['purpure', 'purple'], ['sable', 'black'], ['ermine', 'white fur with small black ermine-tail spots'],
  ['vair', 'blue and white fur pattern of alternating bell shapes'], ['proper', 'in natural colors'],
  ['counterchanged', 'the two colors swapped on each part of the field'],
];

const TERMS: [string, string][] = [
  ['rampant', 'standing upright on the hind legs, in profile, facing the viewer\'s left'],
  ['passant', 'walking, in profile, facing the viewer\'s left'],
  ['statant', 'standing on all four legs, in profile'],
  ['couchant', 'lying down with the head raised'],
  ['displayed', 'seen from the front with wings spread'],
  ['chief', 'a horizontal band across the top of the shield'],
  ['fess', 'a horizontal band across the middle'],
  ['pale', 'a vertical band down the middle'],
  ['bend sinister', 'a diagonal band from the top right to the bottom left'],
  ['bend', 'a diagonal band from the top left to the bottom right'],
  ['chevron', 'an inverted V band'],
  ['saltire', 'a diagonal cross'],
  ['pile', 'a wedge pointing down from the top'],
  ['bordure', 'a border running around the edge of the shield'],
  ['orle', 'a thin border set slightly inside the edge'],
  ['flaunches', 'a curved panel on each side'],
  ['canton', 'a small square in the top left corner'],
  ['quarter', 'the top left quarter of the shield'],
  ['cross', 'a cross reaching the edges of the shield'],
  ['per pale', 'divided by a vertical line'],
  ['per fess', 'divided by a horizontal line'],
  ['per bend', 'divided by a diagonal line from the top left'],
  ['quarterly', 'divided into four parts'],
  ['barry', 'horizontal stripes'], ['paly', 'vertical stripes'], ['bendy', 'diagonal stripes'],
  ['chequy', 'a chessboard pattern'], ['lozengy', 'a diamond pattern'], ['gyronny', 'triangles radiating from the center'],
  ['fretty', 'interlaced diagonal bands'], ['semé', 'strewn all over the field'],
  ['mullet', 'a star'], ['estoile', 'a wavy-rayed star'], ['roundel', 'a flat disc'], ['annulet', 'a ring'],
  ['crosslet', 'a cross with a small crossbar on each arm'], ['patée', 'a cross with flared arms'],
  ['fleur', 'fleur-de-lis'], ['escallop', 'a scallop shell'], ['crescent', 'a crescent moon'],
  ['billet', 'an upright rectangle'], ['lozenge', 'a diamond shape'], ['mascle', 'a hollow diamond'],
];

const has = (blazon: string, word: string): boolean => new RegExp(`(^|[^a-zé])${word}(?:e?s)?([^a-zé]|$)`, 'i').test(blazon);

// The blazon with the plain words of its colors and terms, the part both prompts share
function blazonLines(blazon: string): string[] {
  // "bend" is also in "bend sinister" and "per bend": a term counts only when no longer term covers it
  const longer = TERMS.filter(([w]) => has(blazon, w)).map(([w]) => w);
  const terms = longer.filter(w => !longer.some(o => o !== w && o.includes(w) && has(blazon, o)));
  const colors = TINCTURES.filter(([w]) => has(blazon, w));
  const lines = [`Blazon (the exact design, follow it strictly): ${blazon}`, '', 'Colors:', ...colors.map(([w, d]) => `- ${w}: ${d}`)];
  if (terms.length) {
    lines.push('', 'Terms:', ...terms.map(w => `- ${w}: ${TERMS.find(([t]) => t === w)![1]}`));
  }
  return lines;
}

export function armsPrompt(blazon: string): string {
  return [
    'Draw a medieval heraldic coat of arms: a single shield seen from the front, centered on a plain parchment background, '
    + 'in the style of a 13th century armorial. Flat, bold colors, simple clear shapes with dark outlines, no gradients, '
    + 'no shading, no 3D effect.',
    '',
    ...blazonLines(blazon),
    '',
    'Rules: use exactly the colors and the number of figures named above, in the positions the blazon gives. '
    + 'Add nothing else: no helmet, crest, supporters, motto, banner, text or lettering. Animals are drawn in the stylized '
    + 'heraldic manner (bold, flat, with a dark outline), not realistically. A single shield only.',
  ].join('\n');
}

// The scene of the photo prompt, a line of its own so it is easy to rewrite after pasting
export const DEFAULT_SCENE = 'A 20-year-old knight in a chainmail hauberk, with a sword at his belt, holds the shield in his hands, '
  + 'in a castle courtyard in soft daylight.';

export function armsPhotoPrompt(blazon: string, scene = DEFAULT_SCENE): string {
  return [
    'Create a photorealistic photograph of a real, physical medieval heater shield painted with a coat of arms: '
    + 'wooden shield with painted heraldry, visible wood grain, slightly worn paint, realistic metal rim, natural lighting, '
    + 'shallow depth of field, sharp focus on the shield, high detail.',
    '',
    `SCENE (edit this line to change the situation): ${scene}`,
    '',
    ...blazonLines(blazon),
    '',
    'Rules: the heraldry on the shield must match the blazon exactly: the colors, the number of figures and their positions. '
    + 'The shield is seen from the front and is fully visible and large in the frame, its face not covered by hands or '
    + 'objects. Animals and figures on the shield are painted in the stylized heraldic manner (flat, bold, outlined), not '
    + 'as realistic animals. Add no text, lettering, watermark or extra symbols to the shield.',
  ].join('\n');
}

export interface PromptCharacter { name: string; url: string; description?: string; }

export const DEFAULT_BATTLE_SCENE = 'In the middle of a medieval battle, the knight in chainmail with a sword in his right hand '
  + 'holds the shield up in his left hand to block a blow; mud, dust, banners and fighting men in the background, dramatic light.';

// The shield in the hand of a character in battle: the picture of the character (its url) is the reference of his look
export function armsBattlePrompt(blazon: string, character: PromptCharacter, scene = DEFAULT_BATTLE_SCENE): string {
  return [
    'Create a photorealistic, cinematic photograph of a real, physical medieval heater shield painted with a coat of arms, '
    + 'held by a knight in a battle: wooden shield with painted heraldry, visible wood grain, scratched and dented paint, '
    + 'realistic metal rim, natural lighting, sharp focus on the knight and the shield, high detail.',
    '',
    `SCENE (edit this line to change the situation): ${scene}`,
    '',
    `CHARACTER: ${character.name}. The knight must look like the person in the reference image: ${character.url} `
    + '(if you cannot open links, ask me to attach the image). Keep his face, hair and age as in the reference.'
    + (character.description ? ` Notes: ${character.description}` : ''),
    '',
    ...blazonLines(blazon),
    '',
    'Rules: the heraldry on the shield must match the blazon exactly: the colors, the number of figures and their positions. '
    + 'The shield is seen from the front and its face is clearly visible, not hidden by hands or weapons. Animals and figures '
    + 'on the shield are painted in the stylized heraldic manner (flat, bold, outlined), not as realistic animals. Add no '
    + 'text, lettering, watermark or extra symbols to the shield.',
  ].join('\n');
}
