/* Five sizes past Colossal on a 1.5x ramp. */
const MODULE_ID = 'victory-size-extension'; /* module id */
const L = (k) => game.i18n.localize(`VSE.${k}`);
const DBG = (...a) => game.settings.get(MODULE_ID, 'debug') && console.log('VSE |', ...a);

/* Field order matches the README table. */
const SIZES = {
  colI:   { chart: 'C1', mod: -12, special: 12, fly: -10, stealth: -20, carry: 24,  quad: 36,  squares: 9,  space: 45 },
  colII:  { chart: 'C2', mod: -18, special: 18, fly: -12, stealth: -24, carry: 36,  quad: 54,  squares: 14, space: 70 },
  colIII: { chart: 'C3', mod: -27, special: 27, fly: -14, stealth: -28, carry: 54,  quad: 81,  squares: 20, space: 100 },
  colIV:  { chart: 'C4', mod: -40, special: 40, fly: -16, stealth: -32, carry: 81,  quad: 122, squares: 30, space: 150 },
  colV:   { chart: 'C5', mod: -60, special: 60, fly: -18, stealth: -36, carry: 122, quad: 182, squares: 46, space: 230 },
};
const DICE = ['24d6', '24d8', '32d6', '32d8', '48d6', '48d8', '64d6', '64d8', '96d6', '96d8', '128d6', '128d8']; // two rungs per size

/* Every table the system reads by index. */
function extendTables() {
  const c = pf1.config;
  for (const [k, s] of Object.entries(SIZES)) { /* entry: each size, exit: rows set */
    c.actorSizes[k] = `VSE.Size.${k}`; c.sizeChart[k] = s.chart;
    c.tokenSizes[k] = { w: s.squares, h: s.squares, scale: 1 };
    c.sizeMods[k] = s.mod; c.sizeSpecialMods[k] = s.special; c.sizeFlyMods[k] = s.fly; c.sizeStealthMods[k] = s.stealth;
    c.encumbranceMultipliers.normal[k] = s.carry; c.encumbranceMultipliers.quadruped[k] = s.quad;
  }
  for (const d of DICE) if (!c.sizeDie.includes(d)) c.sizeDie.push(d); /* entry: each die, exit: pushed if new */
}

/* Reach is a switch, wrap it. */
function extendReach() {
  const ActorPF = pf1.documents.actor.ActorPF, base = ActorPF.getReach; /* keep original reach */

  ActorPF.getReach = function (size = 'med', stature = 'tall') {
    const keys = Object.keys(pf1.config.sizeChart); /* size ids */
    let i = size >= 0 ? size : keys.indexOf(size); /* id to index */

    if (stature !== 'tall' && i > 4) i -= 1; /* entry: long, exit: one row down */

    const s = SIZES[keys[i]]; /* extension row */

    if (!s) return base.call(this, size, stature); /* entry: vanilla size, exit: base reach */
    DBG('reach', keys[i], stature, s.space);
    return { melee: s.space, reach: s.space * 2 };
  };
}

Hooks.once('init', () => {
  game.settings.register(MODULE_ID, 'debug', { name: 'VSE.Settings.Debug.Name', hint: 'VSE.Settings.Debug.Hint', scope: 'client', config: true, type: Boolean, default: false });
  try { extendTables(); extendReach(); } catch (e) { console.error('VSE |', e); } /* log, keep loading */
});

/* Localize labels the system left as keys. */
Hooks.once('i18nInit', () => { for (const k of Object.keys(SIZES)) if (pf1.config.actorSizes[k]?.startsWith('VSE.')) pf1.config.actorSizes[k] = L(`Size.${k}`); /* entry: unlocalized key, exit: label */ });
Hooks.once('ready', () => DBG('sizes', Object.keys(pf1.config.sizeChart).join(' '), 'dice', pf1.config.sizeDie.length));
