import * as Cesium from 'cesium';
import { DEFAULT_FOCUS } from './regionFocus.js';

/**
 * Camera presets for notable locations.
 * This build opens on the Indian Ocean theatre's default focus — see
 * `DEFAULT_FOCUS` in `regionFocus.js`, which is also what `flyToRegionHome`
 * reads, so the two cannot disagree.
 */
export const CAMERA_PRESETS = {
  delhi: {
    destination: Cesium.Cartesian3.fromDegrees(DEFAULT_FOCUS.lon, DEFAULT_FOCUS.lat, DEFAULT_FOCUS.approachM),
    orientation: {
      heading: Cesium.Math.toRadians(DEFAULT_FOCUS.headingDeg),
      pitch: Cesium.Math.toRadians(DEFAULT_FOCUS.pitchDeg),
      roll: 0.0,
    },
  },
  austin: {
    destination: Cesium.Cartesian3.fromDegrees(-97.7431, 30.2672, 800),
    orientation: {
      heading: Cesium.Math.toRadians(0),
      pitch: Cesium.Math.toRadians(-35),
      roll: 0.0,
    },
  },
  sf: {
    destination: Cesium.Cartesian3.fromDegrees(-122.4194, 37.7749, 1000),
    orientation: {
      heading: Cesium.Math.toRadians(30),
      pitch: Cesium.Math.toRadians(-30),
      roll: 0.0,
    },
  },
  nyc: {
    destination: Cesium.Cartesian3.fromDegrees(-73.9857, 40.7484, 1200),
    orientation: {
      heading: Cesium.Math.toRadians(-20),
      pitch: Cesium.Math.toRadians(-30),
      roll: 0.0,
    },
  },
};

/**
 * Fly the camera to a preset location with a smooth animation.
 */
export function flyToPreset(viewer, presetName, duration = 3.0) {
  const preset = CAMERA_PRESETS[presetName];
  if (!preset) return;

  viewer.camera.flyTo({
    destination: preset.destination,
    orientation: preset.orientation,
    duration,
    easingFunction: Cesium.EasingFunction.CUBIC_IN_OUT,
  });
}

/**
 * Open on the region's default focus with the cinematic fly-in: snap to a high
 * establishing altitude looking straight down, then descend into an oblique
 * view. The pause before the descent is what lets the first tiles arrive, so
 * the fly-in starts over imagery instead of over a grey ellipsoid.
 */
export function flyToRegionHome(viewer) {
  const { lat, lon, heightM, approachM, headingDeg, pitchDeg } = DEFAULT_FOCUS;

  viewer.camera.setView({
    destination: Cesium.Cartesian3.fromDegrees(lon, lat, heightM),
    orientation: {
      heading: Cesium.Math.toRadians(0),
      pitch: Cesium.Math.toRadians(-90),
      roll: 0.0,
    },
  });

  setTimeout(() => {
    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(lon, lat, approachM),
      orientation: {
        heading: Cesium.Math.toRadians(headingDeg),
        pitch: Cesium.Math.toRadians(pitchDeg),
        roll: 0.0,
      },
      duration: 4.0,
      easingFunction: Cesium.EasingFunction.CUBIC_IN_OUT,
    });
  }, 500);
}
