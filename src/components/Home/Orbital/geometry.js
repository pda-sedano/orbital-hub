/*
 * Orbit geometry shared by the full orrery and the mini orbits drawn on group
 * bodies, so both always agree on ring sizes, spacing, tilt and speeds.
 *
 * Every orbit lies in the same inclined plane as the galaxy, so circles project
 * to ellipses with minor/major ratio INCLINATION. Periods follow Kepler's third
 * law (T ∝ a^1.5), so inner bodies move faster.
 */

export const INCLINATION = 0.42; // cos of the viewing angle; 1 = face-on
export const TILT_DEG = -12; // rotation of the whole plane on screen
export const RING_RADII = [0.54, 0.73, 0.92]; // semi-major axes, as fractions of the stage half-width
export const GALAXY_RADIUS = 0.44;
export const INNER_PERIOD_S = 70;

// On narrow screens, pull the outer rings in so labels at the extremes stay on screen,
// and tip the plane toward the viewer to use the height.
const COMPACT_BELOW = 340; // stage half-width in px
const COMPACT_SCALE = 0.84;
const COMPACT_INCLINATION = 0.54;

export const geometryFor = (halfWidth) =>
    halfWidth < COMPACT_BELOW
        ? { scale: COMPACT_SCALE, incl: COMPACT_INCLINATION }
        : { scale: 1, incl: INCLINATION };

const tilt = (TILT_DEG * Math.PI) / 180;
const cosT = Math.cos(tilt);
const sinT = Math.sin(tilt);

export const project = (a, incl, theta) => {
    const X = a * Math.cos(theta);
    const Y = a * incl * Math.sin(theta);
    return {
        x: X * cosT - Y * sinT,
        y: X * sinT + Y * cosT,
        depth: Math.sin(theta), // +1 nearest the viewer, -1 farthest
    };
};

// Inverse of project(): the orbital angle of the point on the orbit nearest
// screen offset (x, y) from the centre. Undo the tilt, stretch the ellipse back
// to a circle, then take the angle.
export const angleAt = (x, y, incl) => {
    const X = x * cosT + y * sinT;
    const Y = -x * sinT + y * cosT;
    return Math.atan2(Y / incl, X);
};

// SVG path for half an orbit: the near half (front) or the far half (back).
export const halfOrbitPath = (a, incl, front) => {
    const b = a * incl;
    const sweep = front ? 1 : 0;
    return `M ${a} 0 A ${a} ${b} 0 0 ${sweep} ${-a} 0`;
};

// Put each link on a ring, spread siblings evenly, stagger rings so they don't start aligned.
export const buildBodies = (items) => {
    const placed = items.map((link, i) => ({
        link,
        ring: Math.min(link.ring ?? i % RING_RADII.length, RING_RADII.length - 1),
    }));
    return placed.map(({ link, ring }) => {
        const siblings = placed.filter((p) => p.ring === ring);
        const index = siblings.findIndex((p) => p.link === link);
        const a = RING_RADII[ring];
        return {
            link,
            ring,
            a,
            phase: (index / siblings.length) * 2 * Math.PI + ring * 2.1 + 0.6,
            omega: (2 * Math.PI) / (INNER_PERIOD_S * Math.pow(a / RING_RADII[0], 1.5)),
        };
    });
};

export const usedRings = (bodies) => [...new Set(bodies.map((b) => b.ring))].sort();
