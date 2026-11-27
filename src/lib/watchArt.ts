// Works out how to draw a watch from its catalog data. Pure functions (tested).
// The drawing is a generic illustration: no logos or brand text.

export interface ArtInput {
  brand_name: string;
  model_name: string;
  reference?: string | null;
  case_material?: string | null;
  dial_color?: string | null;
  extras?: Record<string, unknown> | null;
}

export type Shape = 'round' | 'square' | 'rect' | 'octagon';
export type Bezel =
  | { kind: 'gmt'; top: string; bottom: string }
  | { kind: 'dive'; color: string }
  | { kind: 'tachy'; color: string }
  | { kind: 'fluted' }
  | { kind: 'slide' }
  | { kind: 'smooth' };

export interface ArtSpec {
  shape: Shape;
  metal: string;
  bezelMetal: string;
  bezel: Bezel;
  dial: string;
  ink: string; // markers and hands, chosen for contrast with the dial
  subdials: 0 | 2 | 3;
  subdialColor: string;
  gmtHand: string | null;
  date: boolean;
  roman: boolean;
}

const C = {
  black: '#141517',
  blue: '#1f3f7a',
  red: '#b3262e',
  green: '#1e6a3f',
  grey: '#6c737b',
  brown: '#5d3a22',
  steel: '#c5c9cd',
  yellow: '#d8b24c',
  rose: '#d9a189',
  whiteMetal: '#dde1e5',
  titanium: '#9aa0a6',
  ceramic: '#2a2b2e',
  bronze: '#a8733b',
};

const lc = (s: unknown) => (typeof s === 'string' ? s.toLowerCase() : '');

export function metalColor(material: string): string {
  const m = lc(material);
  if (!m) return C.steel;
  if (m.includes('ceramic') || m.includes('carbon')) return C.ceramic;
  if (m.includes('bronze')) return C.bronze;
  if (m.includes('titanium')) return C.titanium;
  // Two-tone: the case is mostly steel; the gold shows on the bezel.
  if (m.includes('steel') || m.includes('rolesor') || m.includes('rolesium') || m.includes('o-megasteel')) return C.steel;
  if (m.includes('everose') || m.includes('rose') || m.includes('red gold') || m.includes('pink') || m.includes('sedna')) return C.rose;
  if (m.includes('yellow') || m.includes('moonshine') || m.includes('jubilee gold')) return C.yellow;
  if (m.includes('white gold') || m.includes('platinum') || m.includes('canopus') || m.includes('silver')) return C.whiteMetal;
  return C.steel;
}

function bezelMetalColor(material: string): string {
  const m = lc(material);
  if (m.includes('yellow')) return C.yellow;
  if (m.includes('everose') || m.includes('sedna') || m.includes('red gold') || m.includes('rose')) return C.rose;
  if (m.includes('white') || m.includes('rolesium') || m.includes('platinum')) return C.whiteMetal;
  return metalColor(material);
}

const DIALS: [RegExp, string][] = [
  [/ice blue/, '#bfe0ec'],
  [/d-blue|gradient/, '#1b3f8f'],
  [/slate|wimbledon|rhodium|anthracite/, '#5d646c'],
  [/olive|khaki/, '#5f6b3c'],
  [/taupe/, '#8a7f72'],
  [/champagne/, '#d6c393'],
  [/burgundy|red/, '#7a1f2b'],
  [/green/, '#1e5a3a'],
  [/blue/, '#1f3b73'],
  [/brown|chocolate/, '#5b3a24'],
  [/grey|gray/, '#6b7178'],
  [/white|silver|ivory|cream|polar|panda|enamel|honeycomb/, '#efeee9'],
  [/black/, '#141517'],
];

export function dialColor(dial: string, nickname: string): string {
  const d = `${lc(dial)} ${lc(nickname)}`;
  for (const [re, hex] of DIALS) if (re.test(d)) return hex;
  return '#2b2f34';
}

function isLight(hex: string): boolean {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  return 0.299 * r + 0.587 * g + 0.114 * b > 150;
}

// Two-colour 24-hour bezels: night half on top, day half on the bottom.
const GMT_CODES: Record<string, [string, string]> = {
  BLRO: [C.blue, C.red], // Pepsi
  BLNR: [C.blue, C.black], // Batman
  GRNR: [C.grey, C.black], // Bruce Wayne, Zombie
  CHNR: [C.brown, C.black], // Root Beer
  VTNR: [C.green, C.black], // Sprite
};

function colorWord(s: string): string | null {
  if (/green/.test(s)) return C.green;
  if (/blue/.test(s)) return C.blue;
  if (/burgundy|red/.test(s)) return '#7a1f2b';
  if (/grey|gray|anthracite/.test(s)) return C.grey;
  if (/brown|chestnut/.test(s)) return C.brown;
  if (/black|ceramic|cerachrom/.test(s)) return C.black;
  return null;
}

export function deriveArt(w: ArtInput): ArtSpec {
  const model = lc(w.model_name);
  const ref = (w.reference ?? '').toUpperCase();
  const ex = w.extras ?? {};
  const bezelText = lc(ex.bezel);
  const nickname = lc(ex.nickname);
  const material = w.case_material ?? '';
  const metal = metalColor(material);
  const bezelMetal = bezelMetalColor(material);

  let shape: Shape = 'round';
  if (/tank|reverso|baignoire/.test(model)) shape = 'rect';
  else if (/santos|panth|br 0|monaco/.test(model)) shape = 'square';
  else if (/royal oak/.test(model)) shape = 'octagon';

  let bezel: Bezel = { kind: 'smooth' };
  const code = Object.keys(GMT_CODES).find((k) => ref.endsWith(k));
  if (code) bezel = { kind: 'gmt', top: GMT_CODES[code][0], bottom: GMT_CODES[code][1] };
  else if (/pepsi/.test(nickname)) bezel = { kind: 'gmt', top: C.blue, bottom: C.red };
  else if (/coke|fat lady/.test(nickname) || /red\/black/.test(bezelText)) bezel = { kind: 'gmt', top: C.black, bottom: C.red };
  else if (/root beer/.test(nickname)) bezel = { kind: 'gmt', top: C.brown, bottom: C.black };
  else if (/tachymeter/.test(bezelText) || /daytona|speedmaster/.test(model)) {
    const c = colorWord(bezelText.replace('tachymeter', ''));
    bezel = { kind: 'tachy', color: /steel|gold/.test(bezelText) && !c ? bezelMetal : (c ?? C.black) };
  } else if (/fluted/.test(bezelText)) bezel = { kind: 'fluted' };
  else if (/slide rule/.test(bezelText) || /navitimer/.test(model)) bezel = { kind: 'slide' };
  else if (/24h/.test(bezelText)) bezel = { kind: 'gmt', top: C.black, bottom: C.black };
  else if (/rotatable|rotating|unidirectional|bidirectional|dive|ceramic|cerachrom|aluminium|rider/.test(bezelText) ||
           /submariner|sea-dweller|deepsea|diver|planet ocean|seamaster 300|superocean|pelagos|black bay|fifty fathoms|aquis|prospex|skx/.test(model)) {
    let c = colorWord(bezelText);
    if (ref.endsWith('LV')) c = C.green;
    else if (ref.endsWith('LB')) c = C.blue;
    else if (ref.endsWith('LN')) c = C.black;
    bezel = { kind: 'dive', color: c ?? (/platinum/.test(bezelText) ? C.whiteMetal : C.black) };
  }

  const dial = dialColor(w.dial_color ?? '', nickname);
  const ink = isLight(dial) ? '#1b1d20' : '#f3f2ee';
  const chrono = /daytona|chrono|speedmaster|navitimer b0|top time|premier b0|avenger b0|chronomat b01|avi|carrera chronograph|chronomaster/.test(model) ||
    /chrono/.test(nickname);
  const panda = /panda/.test(nickname);
  const gmt = /gmt/.test(model) || /travel time|gmt/.test(nickname);
  const noDate = /no date/.test(nickname) || model === 'submariner' || /daytona|speedmaster|explorer$|oyster perpetual|1908|cellini|tank|reverso|navitimer b0/.test(model);
  const hasDate = !noDate && (/date|gmt|sea-dweller|deepsea|yacht|sky-dweller|land-dweller|aqua terra|planet ocean|diver 300m|explorer ii|constellation/.test(model));

  return {
    shape,
    metal,
    bezelMetal,
    bezel,
    dial,
    ink,
    subdials: chrono ? 3 : 0,
    subdialColor: panda ? '#141517' : isLight(dial) ? '#d9d8d2' : '#2a2d31',
    gmtHand: gmt ? (/VTNR|GRNR/.test(ref) ? C.green : ref.endsWith('BLNR') ? '#3a6bd1' : C.red) : null,
    date: hasDate,
    roman: w.brand_name.toLowerCase() === 'cartier' || /wimbledon/.test(nickname),
  };
}
