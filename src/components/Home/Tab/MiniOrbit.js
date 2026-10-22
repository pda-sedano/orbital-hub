import { TILT_DEG, RING_RADII, project, usedRings } from '../Orbital/geometry';
import './MiniOrbit.css';

/*
 * A group's own little orrery, drawn in place of its star: the group's children
 * on the same rings, spacing and speeds they have in the full view, scaled down.
 * Purely a picture: no labels, nothing to click. The dots are moved each frame
 * by the orrery's animation loop (see Orbital.js), using the same clock.
 */

export const MINI_R = 24; // outer ring's semi-major axis, in px
export const MINI_SCALE = MINI_R / RING_RADII[RING_RADII.length - 1];
const PAD = 3;
const HALF_H = 14; // half the drawing's height in px: fits the tilted, inclined outer ring

// Distance from the top of the drawing to its centre; Tab.css anchors on this.
export const MINI_ANCHOR = HALF_H;

const MiniOrbit = ({ bodies, incl }) => {
    const w = MINI_R + PAD;
    return (
        <svg
            className="mini"
            viewBox={`${-w} ${-HALF_H} ${2 * w} ${2 * HALF_H}`}
            width={2 * w}
            height={2 * HALF_H}
            aria-hidden="true"
            focusable="false"
        >
            <g transform={`rotate(${TILT_DEG})`}>
                {usedRings(bodies).map((ring) => (
                    <ellipse
                        key={ring}
                        className="mini__ring"
                        rx={RING_RADII[ring] * MINI_SCALE}
                        ry={RING_RADII[ring] * MINI_SCALE * incl}
                    />
                ))}
            </g>
            <circle className="mini__core" r="2.6" />
            {bodies.map((b) => {
                // Starting positions; the animation loop takes over from here.
                const p = project(b.a * MINI_SCALE, incl, b.phase);
                return (
                    <circle
                        key={b.link.id}
                        className="mini__body"
                        r="1.8"
                        cx={p.x.toFixed(2)}
                        cy={p.y.toFixed(2)}
                    />
                );
            })}
        </svg>
    );
};

export default MiniOrbit;
