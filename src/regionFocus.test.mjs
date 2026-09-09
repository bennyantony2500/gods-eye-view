import test from 'node:test';
import assert from 'node:assert/strict';
import {
  COUNTRY_BOUNDS,
  DEFAULT_FOCUS,
  FLIGHT_FOCUS_BOUNDS,
  INDIAN_OCEAN_BOUNDS,
  INDIAN_OCEAN_SUBREGIONS,
  LAND_FOCUS_BOUNDS,
  MARITIME_WAYPOINTS,
  REGION_ID,
  SURFACE_FOCUS_BOUNDS,
  aisBoundingBoxes,
  countriesAt,
  firmsAreaParam,
  inBounds,
  isInIndianOcean,
  isInLandFocus,
  isInRegion,
  isRegionFocusEnabled,
  openSkyBboxQuery,
  overpassBbox,
  regionSummary,
  subregionsAt,
  unionBounds,
  waypointsOfKind,
} from './regionFocus.js';

const ALL_BOXES = [
  ...Object.entries(COUNTRY_BOUNDS),
  ...Object.entries(INDIAN_OCEAN_SUBREGIONS),
  ['INDIAN_OCEAN_BOUNDS', INDIAN_OCEAN_BOUNDS],
  ['LAND_FOCUS_BOUNDS', LAND_FOCUS_BOUNDS],
  ['FLIGHT_FOCUS_BOUNDS', FLIGHT_FOCUS_BOUNDS],
  ['SURFACE_FOCUS_BOUNDS', SURFACE_FOCUS_BOUNDS],
];

test('every declared box is well formed and inside the globe', () => {
  for (const [label, box] of ALL_BOXES) {
    assert.ok(box.south < box.north, `${label}: south must be below north`);
    assert.ok(box.west < box.east, `${label}: west must be left of east (no antimeridian crossing)`);
    assert.ok(box.south >= -90 && box.north <= 90, `${label}: latitude off the globe`);
    assert.ok(box.west >= -180 && box.east <= 180, `${label}: longitude off the globe`);
  }
});

test('unionBounds returns the smallest containing box and honours padding', () => {
  const a = { south: 0, west: 0, north: 10, east: 10 };
  const b = { south: -5, west: 20, north: 5, east: 30 };
  assert.deepEqual(unionBounds([a, b]), { south: -5, west: 0, north: 10, east: 30 });
  assert.deepEqual(unionBounds([a], 2), { south: -2, west: -2, north: 12, east: 12 });
  assert.equal(unionBounds([]), null);
  assert.equal(unionBounds(null), null);
});

test('unionBounds padding never escapes the globe', () => {
  const pole = { south: -90, west: -180, north: 90, east: 180 };
  assert.deepEqual(unionBounds([pole], 10), { south: -90, west: -180, north: 90, east: 180 });
});

test('the land focus contains all four country boxes', () => {
  for (const [key, box] of Object.entries(COUNTRY_BOUNDS)) {
    assert.ok(inBounds(LAND_FOCUS_BOUNDS, box.south, box.west), `${key} southwest corner outside land focus`);
    assert.ok(inBounds(LAND_FOCUS_BOUNDS, box.north, box.east), `${key} northeast corner outside land focus`);
  }
});

test('capital cities land in their own country box', () => {
  const capitals = [
    ['india', 28.6129, 77.2295],
    ['pakistan', 33.6844, 73.0479],
    ['afghanistan', 34.5553, 69.2075],
    ['china', 39.9042, 116.4074],
  ];
  for (const [country, lat, lon] of capitals) {
    assert.ok(countriesAt(lat, lon).includes(country), `${country} capital missing from its own box`);
    assert.ok(isInLandFocus(lat, lon), `${country} capital outside the land focus`);
  }
});

test('Indian island territories are inside the India box', () => {
  assert.ok(inBounds(COUNTRY_BOUNDS.india, 6.75, 93.83), 'Indira Point (Great Nicobar) excluded');
  assert.ok(inBounds(COUNTRY_BOUNDS.india, 10.57, 72.64), 'Lakshadweep excluded');
  assert.ok(inBounds(COUNTRY_BOUNDS.india, 11.62, 92.73), 'Port Blair excluded');
});

test('countriesAt reports overlap rather than picking a winner', () => {
  // The Karakoram sits inside the Pakistan, Afghanistan and China envelopes.
  const overlap = countriesAt(36.5, 74.5);
  assert.ok(overlap.length > 1, 'expected overlapping envelopes in the Karakoram');
  assert.ok(overlap.includes('china'));
  assert.deepEqual(countriesAt(0, 0), []);
});

test('the Indian Ocean box holds its basins and rejects other oceans', () => {
  for (const [key, box] of Object.entries(INDIAN_OCEAN_SUBREGIONS)) {
    assert.ok(inBounds(INDIAN_OCEAN_BOUNDS, box.south, box.west), `${key} southwest corner outside the ocean box`);
    assert.ok(inBounds(INDIAN_OCEAN_BOUNDS, box.north, box.east), `${key} northeast corner outside the ocean box`);
  }
  assert.ok(isInIndianOcean(-20, 80), 'central Indian Ocean should be inside');
  assert.ok(isInIndianOcean(15, 65), 'Arabian Sea should be inside');
  assert.ok(isInIndianOcean(15, 88), 'Bay of Bengal should be inside');
  assert.equal(isInIndianOcean(30, -40), false, 'North Atlantic should be outside');
  assert.equal(isInIndianOcean(0, -150), false, 'Pacific should be outside');
  assert.equal(isInIndianOcean(-75, 80), false, 'below 60S is Southern Ocean, not Indian');
});

test('every maritime waypoint sits in the theatre', () => {
  for (const point of MARITIME_WAYPOINTS) {
    assert.ok(isInRegion(point.lat, point.lon), `${point.name} is outside the theatre`);
    assert.ok(point.rangeM > 0, `${point.name} needs a positive camera range`);
    assert.ok(point.pitchDeg < 0, `${point.name} must look down`);
    assert.ok(['chokepoint', 'port'].includes(point.kind), `${point.name} has an unknown kind`);
  }
});

test('each waypoint kind fills exactly one five-slot preset row', () => {
  // Five per kind: the location bar only has Q/W/E/R/T to bind.
  assert.equal(waypointsOfKind('chokepoint').length, 5);
  assert.equal(waypointsOfKind('port').length, 5);
  assert.equal(waypointsOfKind('chokepoint').length + waypointsOfKind('port').length, MARITIME_WAYPOINTS.length);
  assert.deepEqual(waypointsOfKind('nonsense'), []);
});

test('maritime waypoint names survive the two-word POI search floor', () => {
  // findPoiByName ignores single-significant-word POI names as too ambiguous.
  for (const point of MARITIME_WAYPOINTS) {
    const significant = point.name.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/)
      .filter((word) => word && !['the', 'a', 'an', 'at', 'of', 'in', 'on', 'to'].includes(word));
    assert.ok(significant.length >= 2, `${point.name} is too short to be searchable`);
  }
});

test('maritime waypoint names are unique', () => {
  const names = MARITIME_WAYPOINTS.map((p) => p.name);
  assert.equal(new Set(names).size, names.length, 'duplicate waypoint name');
});

test('the flight box covers the land focus and the northern ocean approaches', () => {
  assert.ok(inBounds(FLIGHT_FOCUS_BOUNDS, LAND_FOCUS_BOUNDS.south, LAND_FOCUS_BOUNDS.west));
  assert.ok(inBounds(FLIGHT_FOCUS_BOUNDS, LAND_FOCUS_BOUNDS.north, LAND_FOCUS_BOUNDS.east));
  assert.ok(inBounds(FLIGHT_FOCUS_BOUNDS, 15, 65), 'Arabian Sea outside the air picture');
  assert.ok(inBounds(FLIGHT_FOCUS_BOUNDS, 15, 88), 'Bay of Bengal outside the air picture');
  assert.ok(inBounds(FLIGHT_FOCUS_BOUNDS, 12.58, 43.33), 'Bab-el-Mandeb outside the air picture');
});

test('the surface box covers both the land focus and the whole ocean', () => {
  assert.ok(inBounds(SURFACE_FOCUS_BOUNDS, INDIAN_OCEAN_BOUNDS.south, INDIAN_OCEAN_BOUNDS.west));
  assert.ok(inBounds(SURFACE_FOCUS_BOUNDS, INDIAN_OCEAN_BOUNDS.north, INDIAN_OCEAN_BOUNDS.east));
  assert.ok(inBounds(SURFACE_FOCUS_BOUNDS, LAND_FOCUS_BOUNDS.north, LAND_FOCUS_BOUNDS.east));
});

test('subregionsAt names the basin under a point', () => {
  assert.ok(subregionsAt(26.57, 56.25).includes('persianGulfGulfOfOman'), 'Hormuz basin missing');
  assert.ok(subregionsAt(15, 88).includes('bayOfBengal'), 'Bay of Bengal missing');
  assert.deepEqual(subregionsAt(50, -100), []);
});

test('inBounds is inclusive on the edges and rejects non-finite input', () => {
  const box = { south: 0, west: 0, north: 10, east: 10 };
  assert.equal(inBounds(box, 0, 0), true);
  assert.equal(inBounds(box, 10, 10), true);
  assert.equal(inBounds(box, 10.01, 10), false);
  assert.equal(inBounds(box, NaN, 5), false);
  assert.equal(inBounds(box, 5, undefined), false);
  assert.equal(inBounds(null, 5, 5), false);
});

test('openSkyBboxQuery emits OpenSky lamin/lomin/lamax/lomax', () => {
  const query = openSkyBboxQuery({ south: 1, west: 2, north: 3, east: 4 });
  assert.equal(query, 'lamin=1&lomin=2&lamax=3&lomax=4');
  const params = new URLSearchParams(openSkyBboxQuery());
  assert.equal(Number(params.get('lamin')), FLIGHT_FOCUS_BOUNDS.south);
  assert.equal(Number(params.get('lomax')), FLIGHT_FOCUS_BOUNDS.east);
});

test('firmsAreaParam emits FIRMS west,south,east,north order', () => {
  assert.equal(firmsAreaParam({ south: 1, west: 2, north: 3, east: 4 }), '2,1,4,3');
  const [west, south, east, north] = firmsAreaParam().split(',').map(Number);
  assert.equal(west, SURFACE_FOCUS_BOUNDS.west);
  assert.equal(south, SURFACE_FOCUS_BOUNDS.south);
  assert.equal(east, SURFACE_FOCUS_BOUNDS.east);
  assert.equal(north, SURFACE_FOCUS_BOUNDS.north);
});

test('aisBoundingBoxes defaults to one theatre box and accepts subregions', () => {
  const all = aisBoundingBoxes();
  assert.equal(all.length, 1);
  assert.deepEqual(all[0], [
    [SURFACE_FOCUS_BOUNDS.south, SURFACE_FOCUS_BOUNDS.west],
    [SURFACE_FOCUS_BOUNDS.north, SURFACE_FOCUS_BOUNDS.east],
  ]);

  const trimmed = aisBoundingBoxes(['arabianSea', 'bayOfBengal']);
  assert.equal(trimmed.length, 2);
  assert.deepEqual(trimmed[0], [[8, 55], [25.5, 78]]);
  assert.throws(() => aisBoundingBoxes(['atlantic']), /unknown Indian Ocean subregion/);
});

test('overpassBbox emits Overpass south,west,north,east order', () => {
  assert.equal(overpassBbox({ south: 1, west: 2, north: 3, east: 4 }), '1,2,3,4');
});

test('region focus is on by default and switchable off', () => {
  assert.equal(isRegionFocusEnabled({}), true);
  assert.equal(isRegionFocusEnabled({ GEV_REGION_FOCUS: '' }), true);
  assert.equal(isRegionFocusEnabled({ GEV_REGION_FOCUS: 'on' }), true);
  for (const value of ['off', 'OFF', '0', 'false', 'no', 'global', 'world', ' Off ']) {
    assert.equal(isRegionFocusEnabled({ GEV_REGION_FOCUS: value }), false, `${value} should disable focus`);
  }
});

test('the default focus is New Delhi and inside the region', () => {
  assert.equal(DEFAULT_FOCUS.cityId, 'delhi');
  assert.ok(isInLandFocus(DEFAULT_FOCUS.lat, DEFAULT_FOCUS.lon));
  assert.ok(DEFAULT_FOCUS.heightM > DEFAULT_FOCUS.approachM, 'the fly-in must descend');
  assert.ok(DEFAULT_FOCUS.pitchDeg < 0, 'the camera must look down');
});

test('regionSummary reports the four countries and every box', () => {
  const summary = regionSummary();
  assert.equal(summary.id, REGION_ID);
  assert.deepEqual(summary.countries, ['India', 'Pakistan', 'Afghanistan', 'China']);
  for (const key of ['land', 'ocean', 'air', 'surface']) {
    assert.ok(Number.isFinite(summary[key].south), `${key} missing bounds`);
  }
});
