/**
 * Regional focus for the Indian Ocean theatre build.
 *
 * This module is the SINGLE SOURCE OF TRUTH for "where this build points".
 * It is a FOCUS, not a geofence: the camera still pans anywhere, every layer
 * still renders anywhere, and nothing filters contacts by position. What the
 * region changes is where the app *starts*, which presets it offers, and how
 * wide a net the upstream proxies cast — so the feeds spend their quota on the
 * area of interest instead of on the whole planet.
 *
 * Two areas of interest:
 *   1. LAND  — India, Pakistan, Afghanistan, China (per-country boxes, unioned).
 *   2. OCEAN — the entire Indian Ocean, on the IHO limits (Cape Agulhas
 *              meridian in the west, the South East Cape / Tasmania meridian
 *              in the east, 60°S in the south).
 *
 * Every bound here is a plain axis-aligned lat/lon box in degrees. None of them
 * cross the antimeridian, which is what lets `inBounds` stay a simple compare.
 *
 * Turn the whole thing off with `GEV_REGION_FOCUS=off` (or `0`/`false`) to
 * restore the upstream global fetches — see `isRegionFocusEnabled`.
 *
 * @module regionFocus
 */

/** Stable id for this build's focus. */
export const REGION_ID = 'indian-ocean-theatre';

/** Human-readable label, shown by the setup doctor. */
export const REGION_LABEL = 'Indian Ocean Theatre';

/**
 * Per-country land boxes. These are generous coastline/border envelopes, not
 * political claims — a bounding box necessarily includes neighbouring
 * territory, and overlapping boxes are expected (Pakistan/Afghanistan/China all
 * overlap around the Karakoram). Anything that needs true borders should use
 * the Natural Earth polygons in `src/data/local_data/natural_earth/`, not these.
 *
 * India's south reaches 6.5°N to take in Indira Point (Great Nicobar) rather
 * than stopping at the mainland tip, and its west reaches 68°E for Lakshadweep.
 *
 * @type {Readonly<Record<string, Readonly<{label: string, south: number, west: number, north: number, east: number}>>>}
 */
export const COUNTRY_BOUNDS = Object.freeze({
  india: Object.freeze({ label: 'India', south: 6.5, west: 68.0, north: 35.7, east: 97.5 }),
  pakistan: Object.freeze({ label: 'Pakistan', south: 23.6, west: 60.8, north: 37.1, east: 77.9 }),
  afghanistan: Object.freeze({ label: 'Afghanistan', south: 29.3, west: 60.4, north: 38.5, east: 74.9 }),
  china: Object.freeze({ label: 'China', south: 17.9, west: 73.4, north: 53.6, east: 135.1 }),
});

/**
 * The entire Indian Ocean, on the IHO limits.
 *
 * West 20°E is the Cape Agulhas meridian (the Atlantic boundary); east 147°E is
 * the South East Cape, Tasmania meridian (the Pacific boundary south of
 * Australia); south -60° is the Southern Ocean boundary; north 31° takes in the
 * heads of the Persian Gulf and the Gulf of Suez.
 *
 * As one box this also sweeps in continental Africa, Arabia and Australia. That
 * is harmless for vessel and fire feeds, which only ever return things that are
 * actually there.
 */
export const INDIAN_OCEAN_BOUNDS = Object.freeze({
  label: 'Indian Ocean',
  south: -60.0,
  west: 20.0,
  north: 31.0,
  east: 147.0,
});

/**
 * Named sub-basins of the Indian Ocean.
 *
 * The whole-ocean box is one subscription's worth of firehose. These are the
 * pieces to subscribe to instead when the vessel volume needs trimming — see
 * `aisBoundingBoxes` and REGION.md.
 *
 * @type {Readonly<Record<string, Readonly<{label: string, south: number, west: number, north: number, east: number}>>>}
 */
export const INDIAN_OCEAN_SUBREGIONS = Object.freeze({
  redSeaGulfOfAden: Object.freeze({ label: 'Red Sea & Gulf of Aden', south: 10.0, west: 32.0, north: 30.0, east: 52.0 }),
  persianGulfGulfOfOman: Object.freeze({ label: 'Persian Gulf & Gulf of Oman', south: 23.0, west: 47.0, north: 31.0, east: 62.0 }),
  arabianSea: Object.freeze({ label: 'Arabian Sea', south: 8.0, west: 55.0, north: 25.5, east: 78.0 }),
  bayOfBengal: Object.freeze({ label: 'Bay of Bengal', south: 5.0, west: 78.0, north: 23.0, east: 95.0 }),
  andamanMalacca: Object.freeze({ label: 'Andaman Sea & Malacca Approaches', south: -1.0, west: 92.0, north: 17.0, east: 104.0 }),
  mozambiqueChannel: Object.freeze({ label: 'Mozambique Channel', south: -27.0, west: 32.0, north: -10.0, east: 50.0 }),
  centralIndianBasin: Object.freeze({ label: 'Central Indian Basin', south: -30.0, west: 60.0, north: 8.0, east: 100.0 }),
  southIndianOcean: Object.freeze({ label: 'South Indian Ocean', south: -60.0, west: 20.0, north: -30.0, east: 147.0 }),
  westAustralianCoast: Object.freeze({ label: 'West Australian Coast', south: -35.0, west: 100.0, north: -10.0, east: 120.0 }),
});

/**
 * Maritime waypoints: the chokepoints and ports that maritime-domain awareness
 * in this theatre actually turns on. All public navigational geography.
 *
 * `src/locations.js` turns these into the two maritime presets — five
 * chokepoints and five ports — which is what makes them clickable, searchable
 * and voice-navigable ("take me to the Strait of Hormuz"). The count is five
 * per `kind` on purpose: the location bar gives POIs the Q/W/E/R/T keyboard
 * shortcuts, so a sixth entry would render but never get a key.
 *
 * The ports here are deliberately the ones NO city preset already covers —
 * Mumbai, Karachi and Shanghai are reachable as cities.
 *
 * `rangeM` is camera distance from the point, not altitude; chokepoints get an
 * ocean-scale range because there is no building to frame.
 *
 * @type {ReadonlyArray<Readonly<{name: string, lat: number, lon: number, rangeM: number, pitchDeg: number, kind: string}>>}
 */
export const MARITIME_WAYPOINTS = Object.freeze([
  Object.freeze({ name: 'Strait of Hormuz', lat: 26.5667, lon: 56.2500, rangeM: 180000, pitchDeg: -55, kind: 'chokepoint' }),
  Object.freeze({ name: 'Strait of Malacca', lat: 3.0000, lon: 100.5000, rangeM: 320000, pitchDeg: -60, kind: 'chokepoint' }),
  Object.freeze({ name: 'Bab-el-Mandeb', lat: 12.5833, lon: 43.3333, rangeM: 160000, pitchDeg: -55, kind: 'chokepoint' }),
  Object.freeze({ name: 'Six Degree Channel', lat: 6.9000, lon: 93.0000, rangeM: 220000, pitchDeg: -58, kind: 'chokepoint' }),
  Object.freeze({ name: 'Mozambique Channel Narrows', lat: -17.0000, lon: 41.0000, rangeM: 400000, pitchDeg: -65, kind: 'chokepoint' }),
  Object.freeze({ name: 'Port of Gwadar', lat: 25.1200, lon: 62.3200, rangeM: 60000, pitchDeg: -45, kind: 'port' }),
  Object.freeze({ name: 'Port of Colombo', lat: 6.9500, lon: 79.8400, rangeM: 45000, pitchDeg: -42, kind: 'port' }),
  Object.freeze({ name: 'Port Blair', lat: 11.6200, lon: 92.7300, rangeM: 60000, pitchDeg: -45, kind: 'port' }),
  Object.freeze({ name: 'Port of Singapore', lat: 1.2600, lon: 103.8000, rangeM: 60000, pitchDeg: -45, kind: 'port' }),
  Object.freeze({ name: 'Port of Djibouti', lat: 11.5900, lon: 43.1500, rangeM: 45000, pitchDeg: -42, kind: 'port' }),
]);

/**
 * Maritime waypoints of one kind, in declaration order.
 * @param {'chokepoint'|'port'} kind
 */
export function waypointsOfKind(kind) {
  return MARITIME_WAYPOINTS.filter((point) => point.kind === kind);
}

/** Clamp helper — a bound that escapes the globe is a bug, not a wide net. */
function assertBox(box, label) {
  const { south, west, north, east } = box;
  if (!(south >= -90 && north <= 90 && south < north)) {
    throw new Error(`${label}: latitude bounds out of range`);
  }
  if (!(west >= -180 && east <= 180 && west < east)) {
    throw new Error(`${label}: longitude bounds out of range or crossing the antimeridian`);
  }
  return box;
}

/**
 * Union a list of boxes into the smallest box containing all of them.
 * @param {Array<{south: number, west: number, north: number, east: number}>} boxes
 * @param {number} padDeg Extra margin on every side.
 */
export function unionBounds(boxes, padDeg = 0) {
  if (!Array.isArray(boxes) || boxes.length === 0) return null;
  let south = Infinity;
  let west = Infinity;
  let north = -Infinity;
  let east = -Infinity;
  for (const box of boxes) {
    south = Math.min(south, box.south);
    west = Math.min(west, box.west);
    north = Math.max(north, box.north);
    east = Math.max(east, box.east);
  }
  return {
    south: Math.max(-90, south - padDeg),
    west: Math.max(-180, west - padDeg),
    north: Math.min(90, north + padDeg),
    east: Math.min(180, east + padDeg),
  };
}

/**
 * The four countries as one box, with half a degree of margin so a contact on
 * the coast or the border does not sit exactly on the edge.
 */
export const LAND_FOCUS_BOUNDS = Object.freeze({
  label: 'India · Pakistan · Afghanistan · China',
  ...assertBox(unionBounds(Object.values(COUNTRY_BOUNDS), 0.5), 'LAND_FOCUS_BOUNDS'),
});

/**
 * Bounds for the air picture: the land focus plus the northern Indian Ocean, so
 * traffic over the Arabian Sea and the Bay of Bengal stays in the feed rather
 * than popping in only once it makes landfall.
 */
export const FLIGHT_FOCUS_BOUNDS = Object.freeze({
  label: 'Indian Ocean Theatre — air',
  ...assertBox(
    unionBounds([
      LAND_FOCUS_BOUNDS,
      INDIAN_OCEAN_SUBREGIONS.redSeaGulfOfAden,
      INDIAN_OCEAN_SUBREGIONS.persianGulfGulfOfOman,
      INDIAN_OCEAN_SUBREGIONS.arabianSea,
      INDIAN_OCEAN_SUBREGIONS.bayOfBengal,
      INDIAN_OCEAN_SUBREGIONS.andamanMalacca,
    ]),
    'FLIGHT_FOCUS_BOUNDS',
  ),
});

/**
 * Bounds for the surface picture: the whole Indian Ocean plus the land focus,
 * which is what carries inland waterways and the Chinese coast.
 */
export const SURFACE_FOCUS_BOUNDS = Object.freeze({
  label: 'Indian Ocean Theatre — surface',
  ...assertBox(unionBounds([LAND_FOCUS_BOUNDS, INDIAN_OCEAN_BOUNDS]), 'SURFACE_FOCUS_BOUNDS'),
});

/**
 * Where the app opens. New Delhi, framed like the other city presets: `heightM`
 * is the high establishing altitude, `approachM` the range the cinematic
 * fly-in settles at.
 */
export const DEFAULT_FOCUS = Object.freeze({
  cityId: 'delhi',
  label: 'New Delhi',
  lat: 28.6129,
  lon: 77.2295,
  heightM: 25000,
  approachM: 900,
  headingDeg: 15,
  pitchDeg: -30,
});

/**
 * Whether regional bounding is active.
 *
 * Default on. `GEV_REGION_FOCUS=off|0|false|global` restores the upstream
 * global fetches without touching code, which is the escape hatch for anyone
 * who wants the stock worldwide build back.
 *
 * @param {Record<string, string|undefined>} env
 */
export function isRegionFocusEnabled(env = {}) {
  const raw = String(env.GEV_REGION_FOCUS ?? '').trim().toLowerCase();
  if (raw === '') return true;
  return !['off', '0', 'false', 'no', 'global', 'world'].includes(raw);
}

/**
 * Point-in-box test. Inclusive on all four edges.
 * @param {{south: number, west: number, north: number, east: number}} box
 */
export function inBounds(box, lat, lon) {
  if (!box || !Number.isFinite(lat) || !Number.isFinite(lon)) return false;
  return lat >= box.south && lat <= box.north && lon >= box.west && lon <= box.east;
}

/** Is this point inside one of the four country boxes? */
export function isInLandFocus(lat, lon) {
  return Object.values(COUNTRY_BOUNDS).some((box) => inBounds(box, lat, lon));
}

/** Is this point inside the Indian Ocean box? */
export function isInIndianOcean(lat, lon) {
  return inBounds(INDIAN_OCEAN_BOUNDS, lat, lon);
}

/** Is this point anywhere in the theatre — land focus or ocean? */
export function isInRegion(lat, lon) {
  return isInLandFocus(lat, lon) || isInIndianOcean(lat, lon);
}

/**
 * Country boxes containing this point, in declaration order.
 *
 * Returns an ARRAY because the boxes overlap: a point in the Karakoram is in
 * three of them. This answers "which envelopes contain this", never "which
 * country is this in" — use the Natural Earth polygons for that.
 *
 * @returns {string[]} Country keys.
 */
export function countriesAt(lat, lon) {
  return Object.entries(COUNTRY_BOUNDS)
    .filter(([, box]) => inBounds(box, lat, lon))
    .map(([key]) => key);
}

/**
 * Named sub-basins containing this point, in declaration order.
 * Overlapping by design (the basins share edges), so this is also an array.
 * @returns {string[]} Subregion keys.
 */
export function subregionsAt(lat, lon) {
  return Object.entries(INDIAN_OCEAN_SUBREGIONS)
    .filter(([, box]) => inBounds(box, lat, lon))
    .map(([key]) => key);
}

/**
 * OpenSky `/states/all` bbox query parameters for the air picture.
 *
 * OpenSky prices a call by the area requested, so a bounded call is never more
 * expensive than the global one — but this box is large, so do not expect the
 * cheapest tier. The real win is payload: a regional snapshot is a fraction of
 * the worldwide one to transfer, parse and render. Shrink
 * `FLIGHT_FOCUS_BOUNDS` if the credit budget matters more than coverage.
 *
 * @returns {string} Query string fragment, no leading `?`.
 */
export function openSkyBboxQuery(bounds = FLIGHT_FOCUS_BOUNDS) {
  const { south, west, north, east } = bounds;
  return `lamin=${south}&lomin=${west}&lamax=${north}&lomax=${east}`;
}

/**
 * NASA FIRMS `area/csv` area argument — FIRMS orders it west,south,east,north,
 * which is NOT the order the rest of this module uses.
 * @returns {string}
 */
export function firmsAreaParam(bounds = SURFACE_FOCUS_BOUNDS) {
  const { south, west, north, east } = bounds;
  return `${west},${south},${east},${north}`;
}

/**
 * AISStream `BoundingBoxes` payload: an array of boxes, each a
 * `[[lat1, lon1], [lat2, lon2]]` corner pair.
 *
 * Defaults to the whole Indian Ocean as one box. Pass subregion keys for a
 * trimmed subscription, e.g. `aisBoundingBoxes(['arabianSea', 'bayOfBengal'])`.
 *
 * @param {string[]|null} subregionKeys
 * @returns {number[][][]}
 */
export function aisBoundingBoxes(subregionKeys = null) {
  const boxes = Array.isArray(subregionKeys) && subregionKeys.length > 0
    ? subregionKeys.map((key) => {
      const box = INDIAN_OCEAN_SUBREGIONS[key];
      if (!box) throw new Error(`unknown Indian Ocean subregion: ${key}`);
      return box;
    })
    : [SURFACE_FOCUS_BOUNDS];
  return boxes.map((box) => [[box.south, box.west], [box.north, box.east]]);
}

/**
 * Overpass-style `(south,west,north,east)` bbox literal.
 * @returns {string}
 */
export function overpassBbox(bounds = LAND_FOCUS_BOUNDS) {
  const { south, west, north, east } = bounds;
  return `${south},${west},${north},${east}`;
}

/**
 * One-line summary for the setup doctor.
 * @returns {{id: string, label: string, countries: string[], land: object, ocean: object, air: object, surface: object}}
 */
export function regionSummary() {
  return {
    id: REGION_ID,
    label: REGION_LABEL,
    countries: Object.values(COUNTRY_BOUNDS).map((box) => box.label),
    land: { ...LAND_FOCUS_BOUNDS },
    ocean: { ...INDIAN_OCEAN_BOUNDS },
    air: { ...FLIGHT_FOCUS_BOUNDS },
    surface: { ...SURFACE_FOCUS_BOUNDS },
  };
}
