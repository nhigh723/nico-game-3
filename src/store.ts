// the mascot Club: purchases + entitlement. Native iOS uses StoreKit 2 through @capgo/native-purchases (talks only to Apple, no third party).
// The web build has no store: it stays fully open (it's the free playable demo) unless the store simulator is switched on
// (?store=sim, or localStorage 'np3~storeSim' = '1'), which fakes purchases locally so the paywall and the free tier can be tested in a browser.
// Purchases are only ever offered in the grown-up area behind the parental gate; kids only see a lock and hear "Ask a grown-up!".
import { Capacitor } from '@capacitor/core';
export const PRODUCTS = {
  yearly: 'com.nickhigh.game3.club.yearly', // auto-renewable, 1 year, $29.99, 7-day free trial (group "the mascot Club", level 1)
  monthly: 'com.nickhigh.game3.club.monthly', // auto-renewable, 1 month, $4.99, 7-day free trial (level 2)
  forever: 'com.nickhigh.game3.forever', // non-consumable, $59.99, one-time, no trial
} as const;
export type Plan = keyof typeof PRODUCTS;
/** Free tier: the first FREE_ACTIVITIES activities on the hub (Puddle Mix, Light & Dark). The rest need the mascot Club. */
export const FREE_ACTIVITIES = 2;
export const TERMS_URL = 'https://www.apple.com/legal/internet-services/itunes/dev/stdeula/';
export const PRIVACY_URL = 'https://nhigh723.github.io/nico-game-3/privacy.html';
const KEY = 'np3~club', SIM = 'np3~storeSim';
type Ent = { club: boolean; plan: Plan | ''; checked: number; hadSub: boolean };
const load = (): Ent => { try { return { club: false, plan: '', checked: 0, hadSub: false, ...JSON.parse(localStorage.getItem(KEY) || '{}') }; } catch { return { club: false, plan: '', checked: 0, hadSub: false }; } };
const native = Capacitor.isNativePlatform();
if (!native && typeof location !== 'undefined' && /[?&]store=sim/.test(location.search)) localStorage.setItem(SIM, '1');
export const store = {
  native, ent: load(), busy: false, msg: '',
  prices: { yearly: '$29.99', monthly: '$4.99', forever: '$59.99' } as Record<Plan, string>,
  trial: { yearly: true, monthly: true } as Record<'yearly' | 'monthly', boolean>,
  get sim() { return !native && localStorage.getItem(SIM) === '1'; },
};
const save = () => localStorage.setItem(KEY, JSON.stringify(store.ent));
/** Everything unlocked? (web demo without the simulator: always yes) */
export function hasClub(): boolean { if (!native && !store.sim) return true; return store.ent.club; }
export const activityFree = (i: number) => i < FREE_ACTIVITIES;
export const CLUB_LINE = 'Ask a grown-up to open this one!';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let NP: any = null, PT: any = null;
async function plugin() { if (!NP) { const m = await import('@capgo/native-purchases'); NP = m.NativePurchases; PT = m.PURCHASE_TYPE; } return NP; }
/** Load localized prices and current entitlements. Safe to call on every launch and on resume; offline keeps the cached answer. */
export async function initStore() {
  if (!native) return;
  try {
    const np = await plugin();
    const subs = await np.getProducts({ productIdentifiers: [PRODUCTS.yearly, PRODUCTS.monthly], productType: PT.SUBS });
    const one = await np.getProducts({ productIdentifiers: [PRODUCTS.forever], productType: PT.INAPP });
    for (const p of [...(subs.products || []), ...(one.products || [])]) { const k = (Object.keys(PRODUCTS) as Plan[]).find(k => PRODUCTS[k] === p.identifier); if (k) { store.prices[k] = p.priceString; if (k !== 'forever') store.trial[k] = !!p.introductoryPrice; } }
    np.addListener('transactionUpdated', () => { void refresh(); });
  } catch (e) { store.msg = ''; console.warn('store init', e); }
  await refresh();
  document.addEventListener('visibilitychange', () => { if (!document.hidden) void refresh(); });
}
/** Re-check Transaction.currentEntitlements (via getPurchases): an active yearly/monthly sub or owning the mascot Forever unlocks everything. */
export async function refresh() {
  if (!native) return;
  try {
    const np = await plugin(); const { purchases } = await np.getPurchases(); const now = Date.now(); let plan: Plan | '' = '', had = false;
    for (const t of purchases || []) {
      const id = t.productIdentifier;
      if (id === PRODUCTS.forever) plan = 'forever';
      else if (id === PRODUCTS.yearly || id === PRODUCTS.monthly) { had = true; const live = t.isActive === true || (t.expirationDate && Date.parse(t.expirationDate) > now); if (live && plan !== 'forever') plan = id === PRODUCTS.yearly ? 'yearly' : 'monthly'; }
    }
    store.ent = { club: !!plan, plan, checked: now, hadSub: had }; save();
    if (had) { store.trial.yearly = false; store.trial.monthly = false; } // a family that already subscribed once isn't eligible for the intro trial again
  } catch (e) { console.warn('store refresh', e); }
}
export async function buy(plan: Plan): Promise<boolean> {
  if (store.busy) return false; store.busy = true; store.msg = '';
  try {
    if (store.sim) { store.ent = { club: true, plan, checked: Date.now(), hadSub: plan !== 'forever' || store.ent.hadSub }; save(); store.msg = 'Thank you! Everything is unlocked (store simulator)'; return true; }
    if (!native) { store.msg = 'Purchases work in the iPhone and iPad app'; return false; }
    const np = await plugin(); await np.purchaseProduct({ productIdentifier: PRODUCTS[plan], productType: plan === 'forever' ? PT.INAPP : PT.SUBS, quantity: 1 });
    await refresh(); if (!store.ent.club) { store.ent = { ...store.ent, club: true, plan }; save(); }
    store.msg = 'Thank you! Everything is unlocked'; return true;
  } catch (e) { const m = String((e as Error)?.message || e); store.msg = /cancel/i.test(m) ? '' : 'The purchase did not go through. Please try again'; return false; }
  finally { store.busy = false; }
}
export async function restore() {
  if (store.busy) return; store.busy = true; store.msg = '';
  try {
    if (store.sim) { store.msg = store.ent.club ? 'Your purchase is restored' : 'No purchases found for this Apple ID'; return; }
    if (!native) { store.msg = 'Restore works in the iPhone and iPad app'; return; }
    const np = await plugin(); await np.restorePurchases(); await refresh();
    store.msg = store.ent.club ? 'Your purchase is restored' : 'No purchases found for this Apple ID';
  } catch { store.msg = 'Could not reach the App Store. Please try again'; }
  finally { store.busy = false; }
}
export async function manage() {
  if (native) { try { const np = await plugin(); await np.manageSubscriptions(); } catch { store.msg = 'Open Settings, tap your name, then Subscriptions'; } }
  else store.msg = 'Manage subscriptions in Settings on your iPhone or iPad';
}
export const openLink = (url: string) => { window.open(url, '_blank'); };
/** test hooks */
export const storeTest = { setSim(on: boolean) { if (on) localStorage.setItem(SIM, '1'); else localStorage.removeItem(SIM); }, reset() { store.ent = { club: false, plan: '', checked: 0, hadSub: false }; save(); store.msg = ''; } };
