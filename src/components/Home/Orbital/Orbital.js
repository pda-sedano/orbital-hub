import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import Hub from '../Hub/Hub';
import Tab from '../Tab/Tab';
import { orbiting, orbitPath, isGroup } from '../../../data/links';
import {
    TILT_DEG,
    RING_RADII,
    GALAXY_RADIUS,
    geometryFor,
    project,
    angleAt,
    halfOrbitPath,
    buildBodies,
    usedRings as ringsOf,
} from './geometry';
import { MINI_SCALE } from '../Tab/MiniOrbit';
import { clock, bodyPath, getOffset, setOffset, saveOffsets } from './orbitState';
import './Orbital.css';

export { angleAt, buildBodies }; // re-exported for tests

/*
 * A small orrery (geometry in ./geometry.js). Bodies on the far half of their
 * orbit pass behind the galaxy; bodies on the near half pass in front.
 *
 * Groups show a mini orbit of their own children in place of a star.
 *
 * Groups open a new level: the current bodies are replaced by the group's
 * children, which spiral out of the galaxy, and a back arrow appears at the core.
 *
 * Bodies can be dragged along their orbits (or nudged with the arrow keys when
 * focused). Each body keeps an angular offset that is added to its orbit; offsets
 * and the orbital clock are shared site-wide (see orbitState.js), so a dragged body
 * stays put across levels and reloads and the mini orbits show it in place.
 */

const EMERGE_S = 1.1; // how long new bodies take to spiral out to their orbits
const DRAG_THRESHOLD_PX = 5; // movement before a press becomes a drag instead of a click
const KEY_STEP = Math.PI / 18; // 10° per arrow-key press

const easeOutCubic = (x) => 1 - Math.pow(1 - x, 3);

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

    const levelKey = trail.map((g) => g.id).join('/');
    const ids = useMemo(() => (levelKey ? levelKey.split('/') : []), [levelKey]);
    const depth = trail.length;
    const group = trail[depth - 1];
    const items = group ? group.children : orbiting;
    const parentPath = orbitPath(ids.slice(0, -1));
    const parentTitle = depth > 1 ? trail[depth - 2].title : 'the hub';

    // Groups carry their children's layout too, for the mini orbit drawn on them.
    const bodies = useMemo(
        () =>
            buildBodies(items).map((b) =>
                isGroup(b.link) ? { ...b, mini: buildBodies(b.link.children) } : b
            ),
        [items]
    );
    const sim = useRef({ emerge: 0, speed: 1, level: null, cameFrom: null });
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
        s.emerge = 0;
        s.speed = 1;
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
                const path = bodyPath([...ids, body.link.id]);
                const theta =
                    body.phase + getOffset(path) + body.omega * clock.t - (1 - e) * 1.6;
                const { x, y, depth: z } = project(a, incl, theta);
                el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
                el.style.setProperty('--near', ((z + 1) / 2).toFixed(3));
                el.style.setProperty('--emerge', e.toFixed(3));
                el.dataset.side = z >= 0 ? 'front' : 'back';

                // A group's mini orbit runs on the same clock as the full view.
                if (body.mini) {
                    const dots = el.querySelectorAll('.mini__body');
                    body.mini.forEach((m, j) => {
                        const childPath = bodyPath([...ids, body.link.id, m.link.id]);
                        const p = project(
                            m.a * MINI_SCALE,
                            incl,
                            m.phase + getOffset(childPath) + m.omega * clock.t
                        );
                        const dot = dots[j];
                        if (!dot) return;
                        dot.setAttribute('cx', p.x.toFixed(2));
                        dot.setAttribute('cy', p.y.toFixed(2));
                        dot.style.opacity = (0.45 + 0.275 * (p.depth + 1)).toFixed(2);
                    });
                }
            });
        };

        const loop = (now) => {
            raf = requestAnimationFrame(loop);
            const dt = last ? Math.min(0.05, (now - last) / 1000) : 0;
            last = now;
            // Ease toward a stop while something is hovered, and ease back afterwards.
            const target = activeRef.current || drag.current?.dragging ? 0 : 1;
            s.speed += (target - s.speed) * Math.min(1, dt * 4);
            clock.t += dt * s.speed;
            s.emerge = Math.min(1, s.emerge + dt / EMERGE_S);
            place();
        };

        place();
        s.place = place; // lets drag and key handlers redraw straight away
        if (!reduceMotion) raf = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(raf);
    }, [halfWidth, bodies, ids]);

    // Point a body at the orbital angle `theta`, by adjusting its offset.
    const setBodyAngle = (body, theta) => {
        setOffset(bodyPath([...ids, body.link.id]), theta - body.phase - body.omega * clock.t);
        sim.current.place?.();
    };

    const currentAngle = (body) =>
        body.phase + getOffset(bodyPath([...ids, body.link.id])) + body.omega * clock.t;

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
            saveOffsets();
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
        saveOffsets();
    };

    const activeBody = bodies.find((b) => b.link.id === active);
    const R = halfWidth;
    const { scale, incl } = geometryFor(R);
    const svgBox = `${-R} ${-R} ${2 * R} ${2 * R}`;
    const usedRings = ringsOf(bodies);

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
                                mini={body.mini}
                                incl={incl}
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
