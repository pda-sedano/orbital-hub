import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import Hub from '../Hub/Hub';
import Tab from '../Tab/Tab';
import { orbiting, orbitPath } from '../../../data/links';
import './Orbital.css';

/*
 * A small orrery. Every orbit lies in the same inclined plane as the galaxy,
 * so circles project to ellipses with minor/major ratio INCLINATION. Bodies
 * on the far half pass behind the galaxy; bodies on the near half pass in front.
 *
 * Periods follow Kepler's third law (T ∝ a^1.5), so inner bodies move faster.
 *
 * Groups open a new level: the current bodies are replaced by the group's
 * children, which spiral out of the galaxy, and a back arrow appears at the core.
 *
 * Bodies can be dragged along their orbits (or nudged with the arrow keys when
 * focused). Each body keeps an angular offset that is added to its orbit.
 */

const INCLINATION = 0.42; // cos of the viewing angle; 1 = face-on
const TILT_DEG = -12; // rotation of the whole plane on screen
const RING_RADII = [0.54, 0.73, 0.92]; // semi-major axes, as fractions of the stage half-width
const GALAXY_RADIUS = 0.44;
const INNER_PERIOD_S = 70;
const EMERGE_S = 1.1; // how long new bodies take to spiral out to their orbits
const DRAG_THRESHOLD_PX = 5; // movement before a press becomes a drag instead of a click
const KEY_STEP = Math.PI / 18; // 10° per arrow-key press

// On narrow screens, pull the outer rings in so labels at the extremes stay on screen,
// and tip the plane toward the viewer to use the height.
const COMPACT_BELOW = 340; // stage half-width in px
const COMPACT_SCALE = 0.84;
const COMPACT_INCLINATION = 0.54;

const geometryFor = (halfWidth) =>
    halfWidth < COMPACT_BELOW
        ? { scale: COMPACT_SCALE, incl: COMPACT_INCLINATION }
        : { scale: 1, incl: INCLINATION };

const tilt = (TILT_DEG * Math.PI) / 180;
const cosT = Math.cos(tilt);
const sinT = Math.sin(tilt);

const project = (a, incl, theta) => {
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
const halfOrbitPath = (a, incl, front) => {
    const b = a * incl;
    const sweep = front ? 1 : 0;
    return `M ${a} 0 A ${a} ${b} 0 0 ${sweep} ${-a} 0`;
};

const easeOutCubic = (x) => 1 - Math.pow(1 - x, 3);

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

// Remember whether the last interaction was the keyboard, so focus is only moved
// for keyboard users (moving it for mouse users would pause the orbits).
let keyboardNav = false;
if (typeof window !== 'undefined') {
    window.addEventListener('keydown', () => (keyboardNav = true), true);
    window.addEventListener('pointerdown', () => (keyboardNav = false), true);
}

const BackArrow = () => (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
        <path
            d="M19 12H5M11 6l-6 6 6 6"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
);

const Orbital = ({ trail = [] }) => {
    const navigate = useNavigate();
    const stageRef = useRef(null);
    const bodyRefs = useRef([]);
    const backRef = useRef(null);
    const [halfWidth, setHalfWidth] = useState(500);
    const [active, setActive] = useState(null); // id of the hovered/focused body

    const ids = trail.map((g) => g.id);
    const levelKey = ids.join('/');
    const depth = trail.length;
    const group = trail[depth - 1];
    const items = group ? group.children : orbiting;
    const parentPath = orbitPath(ids.slice(0, -1));
    const parentTitle = depth > 1 ? trail[depth - 2].title : 'the hub';

    const bodies = useMemo(() => buildBodies(items), [items]);
    const sim = useRef({ t: 0, emerge: 0, speed: 1, level: null, cameFrom: null });
    const offsets = useRef({}); // body id -> extra angle from dragging, for this level
    const drag = useRef(null); // the press or drag in progress, if any
    const geometry = useRef(geometryFor(halfWidth));
    geometry.current = geometryFor(halfWidth);

    const activeRef = useRef(null);
    activeRef.current = active;

    // Track the stage size.
    useEffect(() => {
        const stage = stageRef.current;
        const measure = () => setHalfWidth(Math.max(120, stage.clientWidth / 2));
        measure();
        if (typeof ResizeObserver === 'undefined') {
            window.addEventListener('resize', measure);
            return () => window.removeEventListener('resize', measure);
        }
        const ro = new ResizeObserver(measure);
        ro.observe(stage);
        return () => ro.disconnect();
    }, []);

    // Changing level: forget the hover state, and start the new bodies at the core.
    useLayoutEffect(() => {
        const s = sim.current;
        if (s.level === levelKey) return;
        s.cameFrom = s.level;
        s.level = levelKey;
        s.t = 0;
        s.emerge = 0;
        s.speed = 1;
        offsets.current = {};
        drag.current = null;
        setActive(null);
    }, [levelKey]);

    // Keyboard users: move focus somewhere sensible after changing level.
    useEffect(() => {
        const s = sim.current;
        if (!keyboardNav || s.cameFrom === null) return;
        const cameFromChild = s.cameFrom.startsWith(levelKey) && s.cameFrom !== levelKey;
        if (cameFromChild) {
            // Went up: refocus the group we just left.
            const childId = s.cameFrom.slice(levelKey ? levelKey.length + 1 : 0).split('/')[0];
            const i = bodies.findIndex((b) => b.link.id === childId);
            bodyRefs.current[i]?.querySelector('a')?.focus();
        } else if (backRef.current) {
            backRef.current.focus();
        }
    }, [levelKey, bodies]);

    // Escape goes up a level.
    useEffect(() => {
        if (depth === 0) return undefined;
        const onKey = (e) => {
            if (e.key !== 'Escape' || e.metaKey || e.ctrlKey || e.altKey) return;
            if (e.target.closest?.('input, textarea, [contenteditable="true"]')) return;
            navigate(parentPath);
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [depth, parentPath, navigate]);

    // Animate bodies by writing transforms directly; no React state per frame.
    useLayoutEffect(() => {
        const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
        const { scale, incl } = geometryFor(halfWidth);
        const s = sim.current;
        if (reduceMotion) {
            s.speed = 0;
            s.emerge = 1;
        }
        let raf = 0;
        let last = 0;

        const place = () => {
            const e = easeOutCubic(s.emerge);
            bodies.forEach((body, i) => {
                const el = bodyRefs.current[i];
                if (!el) return;
                const a = body.a * halfWidth * scale * (0.06 + 0.94 * e);
                const offset = offsets.current[body.link.id] ?? 0;
                const theta = body.phase + offset + body.omega * s.t - (1 - e) * 1.6;
                const { x, y, depth: z } = project(a, incl, theta);
                el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
                el.style.setProperty('--near', ((z + 1) / 2).toFixed(3));
                el.style.setProperty('--emerge', e.toFixed(3));
                el.dataset.side = z >= 0 ? 'front' : 'back';
            });
        };

        const loop = (now) => {
            raf = requestAnimationFrame(loop);
            const dt = last ? Math.min(0.05, (now - last) / 1000) : 0;
            last = now;
            // Ease toward a stop while something is hovered, and ease back afterwards.
            const target = activeRef.current || drag.current?.dragging ? 0 : 1;
            s.speed += (target - s.speed) * Math.min(1, dt * 4);
            s.t += dt * s.speed;
            s.emerge = Math.min(1, s.emerge + dt / EMERGE_S);
            place();
        };

        place();
        s.place = place; // lets drag and key handlers redraw straight away
        if (!reduceMotion) raf = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(raf);
    }, [halfWidth, bodies]);

    // Point a body at the orbital angle `theta`, by adjusting its offset.
    const setBodyAngle = (body, theta) => {
        const s = sim.current;
        offsets.current[body.link.id] = theta - body.phase - body.omega * s.t;
        s.place?.();
    };

    const currentAngle = (body) =>
        body.phase + (offsets.current[body.link.id] ?? 0) + body.omega * sim.current.t;

    const onPointerDown = (body, e) => {
        if (e.pointerType === 'mouse' && e.button !== 0) return;
        drag.current = { body, id: e.pointerId, x0: e.clientX, y0: e.clientY, dragging: false };
    };

    const onPointerMove = (e) => {
        const d = drag.current;
        if (!d || d.id !== e.pointerId) return;
        if (!d.dragging) {
            if (Math.hypot(e.clientX - d.x0, e.clientY - d.y0) < DRAG_THRESHOLD_PX) return;
            d.dragging = true;
            sim.current.emerge = 1; // finish the spiral-out if it is still running
            e.currentTarget.setPointerCapture?.(e.pointerId);
            e.currentTarget.dataset.dragging = 'true';
            setActive(d.body.link.id);
        }
        const rect = stageRef.current.getBoundingClientRect();
        const x = e.clientX - (rect.left + rect.width / 2);
        const y = e.clientY - (rect.top + rect.height / 2);
        setBodyAngle(d.body, angleAt(x, y, geometry.current.incl));
    };

    const onPointerEnd = (e) => {
        const d = drag.current;
        if (!d || d.id !== e.pointerId) return;
        delete e.currentTarget.dataset.dragging;
        if (d.dragging) {
            d.suppressClick = true; // the click that follows a drag shouldn't open the link
            // If no click arrives (touch, or released off the body), forget the drag anyway.
            setTimeout(() => {
                if (drag.current === d) drag.current = null;
            }, 0);
            // Deselect unless the mouse was released over the body (touch has no hover).
            const over = e.currentTarget.contains(document.elementFromPoint(e.clientX, e.clientY));
            if (e.pointerType !== 'mouse' || !over) setActive(null);
        } else {
            drag.current = null;
        }
    };

    const onClickCapture = (e) => {
        if (drag.current?.suppressClick) {
            e.preventDefault();
            e.stopPropagation();
        }
        drag.current = null;
    };

    const onKeyDown = (body, e) => {
        const forward = e.key === 'ArrowRight' || e.key === 'ArrowDown';
        const back = e.key === 'ArrowLeft' || e.key === 'ArrowUp';
        if (!forward && !back) return;
        e.preventDefault();
        sim.current.emerge = 1;
        setBodyAngle(body, currentAngle(body) + (forward ? KEY_STEP : -KEY_STEP));
    };

    const activeBody = bodies.find((b) => b.link.id === active);
    const R = halfWidth;
    const { scale, incl } = geometryFor(R);
    const svgBox = `${-R} ${-R} ${2 * R} ${2 * R}`;
    const usedRings = [...new Set(bodies.map((b) => b.ring))].sort();

    const orbitsSvg = (front) => (
        <svg
            key={`${front}-${levelKey}`}
            className={`orbits orbits--${front ? 'front' : 'back'}`}
            viewBox={svgBox}
            width={2 * R}
            height={2 * R}
            aria-hidden="true"
        >
            <g transform={`rotate(${TILT_DEG})`}>
                {usedRings.map((ring) => (
                    <path
                        key={ring}
                        d={halfOrbitPath(RING_RADII[ring] * R * scale, incl, front)}
                        className={activeBody?.ring === ring ? 'orbit orbit--lit' : 'orbit'}
                    />
                ))}
            </g>
        </svg>
    );

    return (
        <section className="orrery" aria-label={group ? group.title : 'Projects'}>
            <nav className="orrery__trail" aria-label="Orbit level">
                {depth > 0 && (
                    <ol>
                        <li>
                            <Link to="/">Hub</Link>
                        </li>
                        {trail.map((g, i) =>
                            i < depth - 1 ? (
                                <li key={g.id}>
                                    <Link to={orbitPath(ids.slice(0, i + 1))}>{g.title}</Link>
                                </li>
                            ) : (
                                <li key={g.id} aria-current="page" className="orrery__here">
                                    {g.title}
                                </li>
                            )
                        )}
                    </ol>
                )}
            </nav>
            <div
                className="orrery__stage"
                ref={stageRef}
                style={{ '--R': `${R}px`, '--incl': incl, '--tilt': `${TILT_DEG}deg` }}
            >
                {orbitsSvg(false)}
                <Hub radius={GALAXY_RADIUS * R * scale} dimmed={depth > 0} />
                {orbitsSvg(true)}
                {depth > 0 && (
                    <Link
                        key={`back-${levelKey}`}
                        ref={backRef}
                        className="orrery__back"
                        to={parentPath}
                        aria-label={`Back to ${parentTitle}`}
                        title={`Back to ${parentTitle}`}
                    >
                        <BackArrow />
                    </Link>
                )}
                <ul className="orrery__bodies" key={`bodies-${levelKey}`}>
                    {bodies.map((body, i) => (
                        <li
                            key={body.link.id}
                            className="orrery__body"
                            ref={(el) => (bodyRefs.current[i] = el)}
                            onPointerDown={(e) => onPointerDown(body, e)}
                            onPointerMove={onPointerMove}
                            onPointerUp={onPointerEnd}
                            onPointerCancel={onPointerEnd}
                            onClickCapture={onClickCapture}
                            onKeyDown={(e) => onKeyDown(body, e)}
                        >
                            <Tab
                                link={body.link}
                                groupPath={orbitPath([...ids, body.link.id])}
                                active={active === body.link.id}
                                onActivate={() => setActive(body.link.id)}
                                onDeactivate={() => {
                                    // Stay selected while being dragged, even if the pointer strays off it
                                    if (drag.current?.dragging && drag.current.body === body) return;
                                    setActive((cur) => (cur === body.link.id ? null : cur));
                                }}
                            />
                        </li>
                    ))}
                </ul>
            </div>
        </section>
    );
};

export default Orbital;
