import fs from 'node:fs/promises';
import path from 'node:path';
import cards from '../data/cards.json' with { type: 'json' };

const outDir = path.resolve('public/assets/cards');

const suitThemes = {
  '땅': { a: '#4b3b25', b: '#a3753d', c: '#2f5b34', accent: '#f0c36a' },
  '물': { a: '#0e3657', b: '#2c81a3', c: '#bde7ef', accent: '#7fd7ff' },
  '날씨': { a: '#263650', b: '#8aa0c8', c: '#e7edf8', accent: '#ffffff' },
  '불': { a: '#4c160f', b: '#cf3a1f', c: '#ffbf4b', accent: '#ffe084' },
  '군대': { a: '#252b35', b: '#737b86', c: '#c3b18b', accent: '#efdfb5' },
  '마법사': { a: '#3a123f', b: '#a23b86', c: '#f3a6d9', accent: '#ffd9f4' },
  '지도자': { a: '#30214e', b: '#805ad5', c: '#e6ceff', accent: '#ffd66b' },
  '야수': { a: '#153524', b: '#2f855a', c: '#bfd68f', accent: '#f2e394' },
  '무기': { a: '#1f2937', b: '#6b7280', c: '#d8dee9', accent: '#ffffff' },
  '유물': { a: '#4a2607', b: '#d97706', c: '#f8d17c', accent: '#fff3b0' },
  '불명': { a: '#3a3430', b: '#9ca3af', c: '#f4efe6', accent: '#c7f9ff' }
};

const art = {
  mountain: ['ridge', 'flame'],
  cavern: ['cave', 'crystal'],
  bell_tower: ['tower', 'moon'],
  forest: ['trees', 'stag'],
  earth_elemental: ['golem', 'stones'],
  fountain_of_life: ['fountain', 'sparkle'],
  swamp: ['swamp', 'mist'],
  flood: ['wave', 'ruins'],
  island: ['island', 'sun'],
  water_elemental: ['waterSpirit', 'wave'],
  rainstorm: ['cloud', 'rain'],
  blizzard: ['snow', 'mountain'],
  smoke: ['smoke', 'ember'],
  whirlwind: ['vortex', 'leaves'],
  air_elemental: ['airSpirit', 'cloud'],
  wildfire: ['flame', 'forest'],
  candle: ['candle', 'sparkle'],
  forge: ['forge', 'hammer'],
  lightning: ['bolt', 'cloud'],
  fire_elemental: ['fireSpirit', 'flame'],
  rangers: ['rider', 'trees'],
  elven_archers: ['bow', 'moon'],
  light_cavalry: ['horse', 'banner'],
  dwarvish_infantry: ['shield', 'axe'],
  knights: ['helmet', 'sword'],
  collector: ['orbSet', 'shelf'],
  beastmaster: ['beastmaster', 'paw'],
  necromancer: ['skull', 'spirit'],
  warlock: ['staff', 'runes'],
  enchantress: ['sorceress', 'sparkle'],
  king: ['crown', 'banner'],
  queen: ['crown', 'rose'],
  princess: ['tiara', 'star'],
  warlord: ['banner', 'sword'],
  empress: ['crown', 'sunburst'],
  unicorn: ['unicorn', 'star'],
  basilisk: ['serpent', 'eye'],
  warhorse: ['horse', 'armor'],
  dragon: ['dragon', 'flame'],
  hydra: ['hydra', 'swamp'],
  warship: ['ship', 'wave'],
  magic_wand: ['wand', 'sparkle'],
  sword_of_keth: ['sword', 'runes'],
  elven_longbow: ['bow', 'leaf'],
  airship: ['airship', 'cloud'],
  shield_of_keth: ['shield', 'runes'],
  gem_of_order: ['gem', 'orbit'],
  world_tree: ['worldTree', 'stars'],
  book_of_changes: ['book', 'sparkle'],
  protection_rune: ['runeShield', 'ring'],
  mirage: ['mirage', 'desert'],
  shapeshifter: ['mask', 'moon'],
  doppelganger: ['doubleFace', 'mirror']
};

await fs.mkdir(outDir, { recursive: true });

for (const card of cards) {
  const svg = renderCardArt(card);
  await fs.writeFile(path.join(outDir, `${card.id}.svg`), svg, 'utf8');
}

console.log(`Generated ${cards.length} card art files in ${outDir}`);

function renderCardArt(card) {
  const theme = suitThemes[card.suit] || suitThemes['불명'];
  const motifs = art[card.id] || ['sparkle', 'orbit'];
  const title = escapeXml(card.name);
  const subtitle = escapeXml(card.suit);
  const defsId = `g-${card.id.replaceAll('_', '-')}`;
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 630 420" role="img" aria-labelledby="${defsId}-title ${defsId}-desc">
  <title id="${defsId}-title">${title}</title>
  <desc id="${defsId}-desc">${subtitle} 카드 ${title}의 판타지 일러스트</desc>
  <defs>
    <linearGradient id="${defsId}-bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${theme.a}"/>
      <stop offset="0.55" stop-color="${theme.b}"/>
      <stop offset="1" stop-color="${theme.c}"/>
    </linearGradient>
    <radialGradient id="${defsId}-glow" cx="50%" cy="38%" r="58%">
      <stop offset="0" stop-color="${theme.accent}" stop-opacity="0.7"/>
      <stop offset="0.58" stop-color="${theme.accent}" stop-opacity="0.12"/>
      <stop offset="1" stop-color="#000" stop-opacity="0"/>
    </radialGradient>
    <filter id="${defsId}-soft" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="10" stdDeviation="8" flood-color="#000" flood-opacity="0.35"/>
    </filter>
  </defs>
  <rect width="630" height="420" rx="26" fill="url(#${defsId}-bg)"/>
  <rect width="630" height="420" rx="26" fill="url(#${defsId}-glow)"/>
  <path d="M0 314 C86 286 154 328 242 302 C329 276 407 244 501 279 C553 298 591 287 630 270 L630 420 L0 420 Z" fill="#1a1512" opacity="0.32"/>
  <path d="M0 356 C91 330 158 359 242 340 C340 317 395 299 486 330 C542 349 586 341 630 320 L630 420 L0 420 Z" fill="#070707" opacity="0.2"/>
  ${motifs.map((motif, index) => drawMotif(motif, index, theme)).join('\n  ')}
  <rect x="18" y="18" width="594" height="384" rx="20" fill="none" stroke="#fff3d0" stroke-opacity="0.22" stroke-width="4"/>
</svg>
`;
}

function drawMotif(motif, index, theme) {
  const shift = index === 0 ? 0 : 58;
  const opacity = index === 0 ? 0.95 : 0.55;
  const accent = theme.accent;
  const pale = theme.c;
  const dark = theme.a;
  const mid = theme.b;
  const stroke = `stroke="${accent}" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"`;
  const fillMain = `fill="${accent}"`;
  const fillPale = `fill="${pale}"`;
  const fillMid = `fill="${mid}"`;
  const filter = index === 0 ? 'filter="url(#soft-shadow)"' : '';
  switch (motif) {
    case 'ridge':
    case 'mountain':
      return `<g opacity="${opacity}" transform="translate(${shift} 0)"><path d="M84 327 L213 112 L300 327 Z" fill="${dark}" opacity="0.8"/><path d="M184 327 L332 78 L506 327 Z" fill="${mid}" opacity="0.78"/><path d="M332 78 L382 188 L342 169 L314 215 L285 169 Z" ${fillPale}/></g>`;
    case 'flame':
      return `<g opacity="${opacity}" transform="translate(${shift} 0)"><path d="M338 344 C230 300 257 198 308 142 C325 194 366 186 356 94 C456 178 484 273 338 344 Z" fill="#ffca55"/><path d="M349 322 C292 281 318 222 351 190 C361 227 395 231 395 178 C445 244 428 294 349 322 Z" fill="#e83f22"/></g>`;
    case 'cave':
      return `<g opacity="${opacity}" transform="translate(${shift} 0)"><path d="M109 350 C122 202 207 103 313 103 C419 103 512 201 524 350 Z" fill="#14110f"/><path d="M183 350 C189 246 237 181 316 181 C392 181 444 247 449 350 Z" fill="${dark}"/><path d="M238 129 L286 217 L318 136 L357 224 L404 132" fill="none" ${stroke} opacity="0.55"/></g>`;
    case 'crystal':
    case 'gem':
      return `<g opacity="${opacity}" transform="translate(${shift} 0)"><path d="M316 74 L439 159 L392 333 L239 333 L190 159 Z" fill="#9fdcff"/><path d="M316 74 L316 333 M190 159 L439 159 M239 333 L316 159 L392 333" fill="none" stroke="#244a75" stroke-width="9" opacity="0.65"/></g>`;
    case 'tower':
      return `<g opacity="${opacity}" transform="translate(${shift} 0)"><path d="M260 121 L371 121 L390 350 L239 350 Z" ${fillPale}/><path d="M232 121 L399 121 L368 80 L264 80 Z" fill="${dark}"/><path d="M292 173 H340 V229 H292 Z M282 271 H350 V350 H282 Z" fill="${dark}" opacity="0.7"/></g>`;
    case 'moon':
      return `<g opacity="${opacity}" transform="translate(${shift} 0)"><circle cx="433" cy="94" r="52" ${fillPale}/><circle cx="456" cy="82" r="52" fill="${mid}"/></g>`;
    case 'trees':
    case 'forest':
      return `<g opacity="${opacity}" transform="translate(${shift} 0)"><path d="M178 334 L228 118 L278 334 Z M294 344 L355 84 L420 344 Z M420 342 L468 147 L520 342 Z" fill="${dark}"/><path d="M226 214 H232 V360 H226 Z M353 178 H361 V362 H353 Z M466 246 H473 V360 H466 Z" fill="#2b1d15"/></g>`;
    case 'stag':
      return `<g opacity="${opacity}" transform="translate(${shift} 0)"><path d="M263 296 C292 240 381 236 413 288 L389 342 H288 Z" fill="${dark}"/><path d="M333 245 L306 172 M350 244 L389 171 M306 172 L270 135 M306 172 L330 137 M389 171 L364 134 M389 171 L423 139" fill="none" ${stroke} opacity="0.75"/></g>`;
    case 'golem':
      return `<g opacity="${opacity}" transform="translate(${shift} 0)"><path d="M238 328 L259 198 L319 158 L379 198 L402 328 Z" fill="${dark}"/><circle cx="289" cy="214" r="14" ${fillMain}/><circle cx="350" cy="214" r="14" ${fillMain}/><path d="M221 265 L155 333 M417 265 L485 332" fill="none" stroke="${dark}" stroke-width="34" stroke-linecap="round"/></g>`;
    case 'stones':
      return `<g opacity="${opacity}" transform="translate(${shift} 0)"><ellipse cx="213" cy="338" rx="64" ry="24" fill="${dark}"/><ellipse cx="330" cy="333" rx="82" ry="30" fill="${mid}"/><ellipse cx="449" cy="344" rx="58" ry="22" fill="${dark}"/></g>`;
    case 'fountain':
      return `<g opacity="${opacity}" transform="translate(${shift} 0)"><path d="M316 86 C268 170 245 223 316 287 C387 223 365 170 316 86 Z" fill="#baf3ff"/><path d="M201 284 C223 355 410 355 431 284 Z" ${fillPale}/><path d="M258 348 H374 L397 374 H235 Z" fill="${dark}"/></g>`;
    case 'sparkle':
    case 'star':
    case 'stars':
      return `<g opacity="${opacity}" transform="translate(${shift} 0)"><path d="M319 82 L345 173 L439 198 L348 225 L319 318 L289 225 L197 198 L290 173 Z" ${fillMain}/><circle cx="470" cy="112" r="16" ${fillPale}/><circle cx="185" cy="296" r="12" ${fillPale}/></g>`;
    case 'swamp':
      return `<g opacity="${opacity}" transform="translate(${shift} 0)"><path d="M111 298 C184 254 251 334 324 289 C390 249 467 303 534 273 L534 358 L111 358 Z" fill="${dark}"/><path d="M165 220 C193 180 226 222 208 259 M434 201 C465 172 498 212 474 256" fill="none" ${stroke} opacity="0.55"/></g>`;
    case 'mist':
    case 'smoke':
      return `<g opacity="${opacity}" transform="translate(${shift} 0)"><path d="M157 260 C236 206 281 296 353 238 C422 184 458 273 524 231" fill="none" stroke="#fff6dc" stroke-width="24" stroke-linecap="round" opacity="0.58"/><path d="M116 321 C203 276 279 354 354 304 C420 260 483 318 547 286" fill="none" stroke="#fff6dc" stroke-width="18" stroke-linecap="round" opacity="0.45"/></g>`;
    case 'wave':
      return `<g opacity="${opacity}" transform="translate(${shift} 0)"><path d="M105 308 C173 201 274 269 311 183 C348 263 444 195 525 304 C433 285 392 342 315 326 C240 311 185 289 105 308 Z" fill="#bcf2ff"/><path d="M148 302 C215 264 252 342 321 302 C389 262 433 319 497 281" fill="none" stroke="${dark}" stroke-width="12" opacity="0.5"/></g>`;
    case 'ruins':
      return `<g opacity="${opacity}" transform="translate(${shift} 0)"><path d="M185 340 H459 V362 H185 Z M218 212 H255 V340 H218 Z M303 178 H340 V340 H303 Z M388 226 H425 V340 H388 Z" fill="${dark}" opacity="0.78"/></g>`;
    case 'island':
      return `<g opacity="${opacity}" transform="translate(${shift} 0)"><path d="M194 311 C250 253 383 251 439 311 Z" fill="${dark}"/><path d="M317 303 C318 222 357 176 413 149 M360 198 C326 183 310 155 302 112 M368 196 C407 195 431 172 461 143" fill="none" ${stroke} opacity="0.7"/></g>`;
    case 'sun':
    case 'sunburst':
      return `<g opacity="${opacity}" transform="translate(${shift} 0)"><circle cx="451" cy="110" r="45" fill="#ffe082"/><path d="M451 35 V10 M451 210 V185 M376 110 H351 M551 110 H526 M398 57 L380 39 M504 163 L522 181 M504 57 L522 39 M398 163 L380 181" fill="none" stroke="#ffe082" stroke-width="11" stroke-linecap="round"/></g>`;
    case 'waterSpirit':
    case 'airSpirit':
    case 'fireSpirit':
      return `<g opacity="${opacity}" transform="translate(${shift} 0)"><path d="M318 87 C247 161 229 269 319 348 C414 268 383 157 318 87 Z" fill="${accent}" opacity="0.86"/><path d="M284 205 C313 185 344 185 372 205 M272 249 C308 282 348 282 385 249" fill="none" stroke="${dark}" stroke-width="12" stroke-linecap="round"/></g>`;
    case 'cloud':
      return `<g opacity="${opacity}" transform="translate(${shift} 0)"><path d="M171 232 C174 169 254 160 280 205 C308 139 413 141 429 219 C494 211 528 274 482 316 H196 C133 313 121 244 171 232 Z" fill="#f3f6ff"/></g>`;
    case 'rain':
      return `<g opacity="${opacity}" transform="translate(${shift} 0)"><path d="M235 305 L209 369 M317 300 L291 372 M402 305 L376 369" stroke="#93e7ff" stroke-width="13" stroke-linecap="round"/></g>`;
    case 'snow':
      return `<g opacity="${opacity}" transform="translate(${shift} 0)"><path d="M316 96 V318 M220 151 L412 263 M412 151 L220 263" fill="none" stroke="#f8fbff" stroke-width="14" stroke-linecap="round"/><circle cx="316" cy="207" r="23" fill="#f8fbff"/></g>`;
    case 'ember':
      return `<g opacity="${opacity}" transform="translate(${shift} 0)"><circle cx="245" cy="300" r="22" fill="#ffcc55"/><circle cx="342" cy="248" r="15" fill="#ff793d"/><circle cx="428" cy="316" r="18" fill="#fff0a8"/></g>`;
    case 'vortex':
      return `<g opacity="${opacity}" transform="translate(${shift} 0)"><path d="M463 129 C316 75 187 150 187 239 C187 329 335 349 395 284 C443 231 384 179 317 204 C269 222 273 276 322 281" fill="none" stroke="#f6f0dd" stroke-width="24" stroke-linecap="round"/></g>`;
    case 'leaves':
    case 'leaf':
      return `<g opacity="${opacity}" transform="translate(${shift} 0)"><path d="M201 270 C244 214 296 236 302 298 C248 307 215 297 201 270 Z M401 192 C445 145 490 175 484 232 C433 229 406 218 401 192 Z" fill="#b8d87a"/></g>`;
    case 'forge':
      return `<g opacity="${opacity}" transform="translate(${shift} 0)"><path d="M210 340 H430 L398 224 H242 Z" fill="${dark}"/><path d="M259 225 C280 151 356 151 375 225 Z" fill="#ff9b2f"/><path d="M187 187 H443 V224 H187 Z" ${fillPale}/></g>`;
    case 'hammer':
      return `<g opacity="${opacity}" transform="translate(${shift} 0)"><path d="M219 138 H398 V187 H219 Z M308 187 L356 343" fill="none" stroke="${accent}" stroke-width="24" stroke-linecap="round" stroke-linejoin="round"/></g>`;
    case 'candle':
      return `<g opacity="${opacity}" transform="translate(${shift} 0)"><path d="M290 198 H342 V344 H290 Z" ${fillPale}/><path d="M317 74 C275 132 294 164 318 188 C350 158 357 118 317 74 Z" fill="#ffbf4b"/><path d="M257 344 H374" fill="none" stroke="${dark}" stroke-width="22" stroke-linecap="round"/></g>`;
    case 'bolt':
      return `<g opacity="${opacity}" transform="translate(${shift} 0)"><path d="M361 54 L213 244 H322 L271 370 L430 177 H319 Z" fill="#fff27a"/></g>`;
    case 'rider':
    case 'horse':
      return `<g opacity="${opacity}" transform="translate(${shift} 0)"><path d="M161 300 C221 229 356 219 452 286 L424 340 H205 Z" fill="${dark}"/><circle cx="435" cy="246" r="31" fill="${dark}"/><path d="M238 333 L209 376 M356 333 L382 376 M285 210 L327 156 L365 217" fill="none" ${stroke} opacity="0.72"/></g>`;
    case 'banner':
      return `<g opacity="${opacity}" transform="translate(${shift} 0)"><path d="M292 86 V350" stroke="${dark}" stroke-width="16" stroke-linecap="round"/><path d="M303 101 H453 L416 166 L453 231 H303 Z" fill="${accent}"/></g>`;
    case 'bow':
      return `<g opacity="${opacity}" transform="translate(${shift} 0)"><path d="M417 74 C262 139 259 287 417 356" fill="none" stroke="${accent}" stroke-width="18" stroke-linecap="round"/><path d="M418 74 L418 356 M171 215 H416" fill="none" stroke="#f7ead8" stroke-width="8" stroke-linecap="round"/><path d="M171 215 L221 193 M171 215 L221 238" fill="none" stroke="#f7ead8" stroke-width="8" stroke-linecap="round"/></g>`;
    case 'armor':
    case 'helmet':
      return `<g opacity="${opacity}" transform="translate(${shift} 0)"><path d="M316 84 C240 113 214 177 230 274 L274 350 H358 L402 274 C418 177 392 113 316 84 Z" fill="${pale}"/><path d="M245 210 H387 M270 260 H362" stroke="${dark}" stroke-width="13" stroke-linecap="round"/></g>`;
    case 'shield':
    case 'runeShield':
      return `<g opacity="${opacity}" transform="translate(${shift} 0)"><path d="M316 73 L454 124 C447 240 401 316 316 360 C231 316 185 240 178 124 Z" fill="${accent}"/><path d="M316 102 V327 M232 151 H399" fill="none" stroke="${dark}" stroke-width="13" stroke-linecap="round"/></g>`;
    case 'axe':
      return `<g opacity="${opacity}" transform="translate(${shift} 0)"><path d="M318 106 V355" stroke="${accent}" stroke-width="18" stroke-linecap="round"/><path d="M318 131 C221 132 203 214 259 251 C288 224 315 198 318 131 Z M318 131 C415 132 433 214 377 251 C348 224 321 198 318 131 Z" fill="${pale}"/></g>`;
    case 'sword':
      return `<g opacity="${opacity}" transform="translate(${shift} 0)"><path d="M319 62 L357 249 L319 309 L281 249 Z" fill="${pale}"/><path d="M247 292 H391 M319 300 V361" fill="none" stroke="${accent}" stroke-width="19" stroke-linecap="round"/></g>`;
    case 'orbSet':
      return `<g opacity="${opacity}" transform="translate(${shift} 0)"><circle cx="250" cy="204" r="50" fill="${accent}"/><circle cx="337" cy="158" r="39" fill="${pale}"/><circle cx="400" cy="237" r="48" fill="${mid}"/><path d="M196 323 H457" stroke="${dark}" stroke-width="19" stroke-linecap="round"/></g>`;
    case 'shelf':
      return `<g opacity="${opacity}" transform="translate(${shift} 0)"><path d="M190 285 H455 M203 216 H432" stroke="${dark}" stroke-width="16" stroke-linecap="round"/><rect x="224" y="184" width="34" height="95" fill="${accent}"/><rect x="276" y="160" width="34" height="119" fill="${pale}"/><rect x="357" y="194" width="34" height="85" fill="${mid}"/></g>`;
    case 'beastmaster':
      return `<g opacity="${opacity}" transform="translate(${shift} 0)"><circle cx="305" cy="133" r="42" ${fillPale}/><path d="M233 352 C247 250 371 248 392 352 Z" fill="${dark}"/><path d="M392 264 C452 233 500 276 493 340" fill="none" ${stroke}/></g>`;
    case 'paw':
      return `<g opacity="${opacity}" transform="translate(${shift} 0)"><ellipse cx="319" cy="278" rx="56" ry="45" fill="${accent}"/><circle cx="239" cy="220" r="25" fill="${accent}"/><circle cx="296" cy="190" r="25" fill="${accent}"/><circle cx="356" cy="190" r="25" fill="${accent}"/><circle cx="411" cy="220" r="25" fill="${accent}"/></g>`;
    case 'skull':
      return `<g opacity="${opacity}" transform="translate(${shift} 0)"><path d="M317 91 C228 91 207 171 231 247 L263 329 H371 L402 247 C427 171 405 91 317 91 Z" fill="#eee6d7"/><circle cx="279" cy="208" r="30" fill="${dark}"/><circle cx="355" cy="208" r="30" fill="${dark}"/><path d="M293 277 H341" stroke="${dark}" stroke-width="16" stroke-linecap="round"/></g>`;
    case 'spirit':
      return `<g opacity="${opacity}" transform="translate(${shift} 0)"><path d="M330 91 C250 144 255 226 319 250 C370 270 370 330 314 361 C453 326 464 196 330 91 Z" fill="#d7fff3" opacity="0.68"/></g>`;
    case 'staff':
    case 'wand':
      return `<g opacity="${opacity}" transform="translate(${shift} 0)"><path d="M231 352 L405 91" stroke="${accent}" stroke-width="19" stroke-linecap="round"/><circle cx="412" cy="82" r="34" ${fillPale}/><path d="M412 21 V0 M412 164 V140 M351 82 H327 M497 82 H473" stroke="${pale}" stroke-width="9" stroke-linecap="round"/></g>`;
    case 'runes':
    case 'ring':
    case 'orbit':
      return `<g opacity="${opacity}" transform="translate(${shift} 0)"><ellipse cx="316" cy="218" rx="171" ry="73" fill="none" stroke="${accent}" stroke-width="11"/><ellipse cx="316" cy="218" rx="73" ry="171" fill="none" stroke="${pale}" stroke-width="8" opacity="0.72"/><circle cx="316" cy="218" r="25" fill="${accent}"/></g>`;
    case 'sorceress':
      return `<g opacity="${opacity}" transform="translate(${shift} 0)"><path d="M316 74 L387 187 H245 Z" fill="${dark}"/><circle cx="316" cy="171" r="39" ${fillPale}/><path d="M238 352 C255 250 375 250 394 352 Z" fill="${accent}"/></g>`;
    case 'crown':
    case 'tiara':
      return `<g opacity="${opacity}" transform="translate(${shift} 0)"><path d="M194 259 L231 128 L299 236 L362 128 L432 236 L475 128 L454 323 H214 Z" fill="#ffd66b"/><circle cx="231" cy="128" r="17" fill="${pale}"/><circle cx="362" cy="128" r="17" fill="${pale}"/><circle cx="475" cy="128" r="17" fill="${pale}"/></g>`;
    case 'rose':
      return `<g opacity="${opacity}" transform="translate(${shift} 0)"><path d="M318 201 C263 136 344 100 377 156 C430 168 409 254 338 243 Z" fill="#f472b6"/><path d="M318 244 C315 290 297 320 260 348 M320 276 C374 268 405 299 425 345" fill="none" ${stroke} opacity="0.66"/></g>`;
    case 'unicorn':
      return `<g opacity="${opacity}" transform="translate(${shift} 0)"><path d="M179 312 C219 226 346 213 438 277 L402 343 H217 Z" fill="#f6f2e7"/><path d="M430 251 L483 121 L454 264 Z" fill="#ffe177"/><path d="M265 213 C292 161 355 163 389 218" fill="none" stroke="#f6f2e7" stroke-width="33" stroke-linecap="round"/></g>`;
    case 'serpent':
    case 'hydra':
    case 'dragon':
      return `<g opacity="${opacity}" transform="translate(${shift} 0)"><path d="M155 314 C243 156 361 362 476 149" fill="none" stroke="${dark}" stroke-width="48" stroke-linecap="round"/><path d="M439 139 L523 100 L498 190 Z" fill="${dark}"/><circle cx="479" cy="139" r="10" fill="${accent}"/></g>`;
    case 'eye':
      return `<g opacity="${opacity}" transform="translate(${shift} 0)"><path d="M165 217 C238 140 392 140 466 217 C392 294 238 294 165 217 Z" fill="${pale}"/><circle cx="316" cy="217" r="54" fill="${accent}"/><circle cx="316" cy="217" r="23" fill="${dark}"/></g>`;
    case 'ship':
      return `<g opacity="${opacity}" transform="translate(${shift} 0)"><path d="M176 279 H480 L434 344 H223 Z" fill="${dark}"/><path d="M311 98 V277" stroke="${accent}" stroke-width="14"/><path d="M326 121 L461 236 H326 Z M295 133 L190 243 H295 Z" ${fillPale}/></g>`;
    case 'airship':
      return `<g opacity="${opacity}" transform="translate(${shift} 0)"><ellipse cx="318" cy="151" rx="168" ry="66" fill="${pale}"/><path d="M231 247 H407 L382 314 H256 Z" fill="${dark}"/><path d="M257 211 L230 250 M378 211 L407 250" fill="none" ${stroke} opacity="0.6"/></g>`;
    case 'worldTree':
      return `<g opacity="${opacity}" transform="translate(${shift} 0)"><path d="M317 111 C254 152 222 215 245 289 C297 259 337 259 389 289 C415 214 383 151 317 111 Z" fill="#bde38c"/><path d="M318 208 V362 M318 264 C276 262 242 282 214 321 M318 264 C363 260 398 284 424 321" fill="none" stroke="${dark}" stroke-width="22" stroke-linecap="round"/></g>`;
    case 'book':
      return `<g opacity="${opacity}" transform="translate(${shift} 0)"><path d="M159 139 C229 111 271 128 316 165 C361 128 403 111 472 139 V329 C404 303 363 315 316 352 C269 315 227 303 159 329 Z" fill="${pale}"/><path d="M316 165 V352 M197 179 C239 167 268 180 294 205 M339 205 C371 181 405 170 445 181" fill="none" stroke="${dark}" stroke-width="10" stroke-linecap="round"/></g>`;
    case 'mirage':
    case 'desert':
      return `<g opacity="${opacity}" transform="translate(${shift} 0)"><path d="M111 302 C202 247 274 321 345 277 C414 234 491 291 531 263 L531 347 H111 Z" fill="#f1d089" opacity="0.8"/><path d="M196 205 C270 178 353 223 430 194" fill="none" stroke="#f9f6df" stroke-width="18" stroke-linecap="round" opacity="0.62"/></g>`;
    case 'mask':
      return `<g opacity="${opacity}" transform="translate(${shift} 0)"><path d="M223 126 C275 89 358 89 410 126 C395 263 356 331 316 351 C276 331 238 263 223 126 Z" fill="${pale}"/><path d="M261 207 C284 190 304 190 324 207 M339 207 C361 190 382 190 404 207" fill="none" stroke="${dark}" stroke-width="12" stroke-linecap="round"/></g>`;
    case 'doubleFace':
    case 'mirror':
      return `<g opacity="${opacity}" transform="translate(${shift} 0)"><path d="M194 113 C261 74 315 131 288 218 C268 284 219 320 180 344 C164 250 146 156 194 113 Z" fill="${pale}"/><path d="M436 113 C369 74 315 131 342 218 C362 284 411 320 450 344 C466 250 484 156 436 113 Z" fill="${dark}"/><path d="M315 94 V352" stroke="${accent}" stroke-width="9" stroke-linecap="round"/></g>`;
    default:
      return `<g opacity="${opacity}" transform="translate(${shift} 0)"><circle cx="316" cy="214" r="118" fill="${accent}" opacity="0.68"/><path d="M316 82 L347 181 L450 181 L366 242 L398 340 L316 279 L234 340 L266 242 L182 181 L285 181 Z" ${fillPale}/></g>`;
  }
}

function escapeXml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}
