// Kid-correct color mixing (RYB, the way preschool art class teaches it), named colors, and shades.
export type Mix = { r: number; y: number; b: number; w: number; k: number }; // drops of red, yellow, blue, white, black
export const C = { red: '#ff2d55', yellow: '#ffd60a', blue: '#1e90ff', orange: '#ff8c1a', green: '#2ecc40', purple: '#a24dff', white: '#ffffff', black: '#2b2140', pink: '#ff8fc8', brown: '#a0612f', sky: '#8fd3ff', lime: '#b7f05a' } as const;
export type CName = keyof typeof C;
export const NAME_LINE: Record<CName, string> = { red: 'Red!', yellow: 'Yellow!', blue: 'Blue!', orange: 'Orange!', green: 'Green!', purple: 'Purple!', white: 'White!', black: 'Black!', pink: 'Pink!', brown: 'Brown!', sky: 'Light blue!', lime: 'Light green!' };
export const empty = (): Mix => ({ r: 0, y: 0, b: 0, w: 0, k: 0 });
export function nameOf(m: Mix): CName | null {
  const p = (m.r ? 1 : 0) + (m.y ? 1 : 0) + (m.b ? 1 : 0); if (!p && !m.w && !m.k) return null;
  if (p === 3) return 'brown'; if (!p) return m.k ? 'black' : 'white';
  let base: CName = m.r && m.y ? 'orange' : m.y && m.b ? 'green' : m.r && m.b ? 'purple' : m.r ? 'red' : m.y ? 'yellow' : 'blue';
  if (m.w > m.k) base = ({ red: 'pink', blue: 'sky', green: 'lime' } as Partial<Record<CName, CName>>)[base] || base; return base;
}
const hex = (h: string) => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const toHex = (a: number[]) => '#' + a.map(v => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('');
/** shade: steps > 0 lighter (white drops), < 0 darker (black drops) */
export function shade(h: string, steps: number) { const a = hex(h), t = steps > 0 ? [255, 255, 255] : [43, 33, 64], k = 1 - Math.pow(0.72, Math.abs(steps)); return toHex(a.map((v, i) => v + (t[i] - v) * k)); }
export function colorOf(m: Mix) { const n = nameOf(m); if (!n) return '#ffffff00'; return shade(C[n], (n === 'pink' || n === 'sky' || n === 'lime') ? 0 : Math.min(3, m.w) - Math.min(3, m.k)); }
export const PAIRS: [CName, CName, CName][] = [['red', 'yellow', 'orange'], ['yellow', 'blue', 'green'], ['red', 'blue', 'purple'], ['red', 'white', 'pink'], ['blue', 'white', 'sky'], ['green', 'white', 'lime']];
export const MIX_LINE: Record<string, string> = { orange: 'Red and yellow make orange!', green: 'Yellow and blue make green!', purple: 'Red and blue make purple!', pink: 'Red and white make pink!', sky: 'Blue and white make light blue!', brown: 'All the colors together make brown!' };
