import { useEffect, useRef } from 'react';
import LifeViz from '../LifeViz/LifeViz';
import deepField from '../LifeViz/hubbleDeepField.jpg';

/*
 * Conway's Game of Life on a torus. Live cells reveal the Hubble Deep Field
 * underneath; cells that die fade out over a few frames instead of vanishing,
 * which reads as twinkling rather than flicker.
 *
 * State lives in typed arrays held in refs, so the simulation never triggers a
 * React re-render. Rendering is one putImageData per frame at one pixel per
 * cell, scaled up by CSS.
 */

const AMBIENT = 0.06; // how much of the deep field shows through dead cells
const BRIGHTNESS = 0.8; // overall level, kept low so the foreground reads first
const FADE_PER_SEC = 4.5; // glow decay rate of dead cells
const SOUP_EVERY_MS = 2600; // reseed a random patch so the board never settles
const SOUP_SIZE = 14;
const SOUP_DENSITY = 0.38;

const createWorld = (cols, rows, density) => {
    const cells = new Uint8Array(cols * rows);
    for (let i = 0; i < cells.length; i++) cells[i] = Math.random() < density ? 1 : 0;
    return {
        cols,
        rows,
        cells,
        scratch: new Uint8Array(cols * rows),
        glow: Float32Array.from(cells),
    };
};

// Advance one generation (B3/S23) with toroidal wraparound.
export const step = (world) => {
    const { cols, rows, cells, scratch } = world;
    for (let r = 0; r < rows; r++) {
        const up = ((r - 1 + rows) % rows) * cols;
        const mid = r * cols;
        const down = ((r + 1) % rows) * cols;
        for (let c = 0; c < cols; c++) {
            const left = (c - 1 + cols) % cols;
            const right = (c + 1) % cols;
            const n =
                cells[up + left] + cells[up + c] + cells[up + right] +
                cells[mid + left] + cells[mid + right] +
                cells[down + left] + cells[down + c] + cells[down + right];
            const alive = cells[mid + c];
            scratch[mid + c] = n === 3 || (alive && n === 2) ? 1 : 0;
        }
    }
    world.scratch = cells;
    world.cells = scratch;
};

const sprinkleSoup = (world) => {
    const { cols, rows, cells } = world;
    const r0 = Math.floor(Math.random() * rows);
    const c0 = Math.floor(Math.random() * cols);
    for (let dr = 0; dr < SOUP_SIZE; dr++) {
        for (let dc = 0; dc < SOUP_SIZE; dc++) {
            if (Math.random() < SOUP_DENSITY) {
                cells[((r0 + dr) % rows) * cols + ((c0 + dc) % cols)] = 1;
            }
        }
    }
};

// Sample the deep field at one pixel per cell, cropped to cover the grid.
const sampleTexture = (img, cols, rows) => {
    const canvas = document.createElement('canvas');
    canvas.width = cols;
    canvas.height = rows;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    const scale = Math.max(cols / img.width, rows / img.height);
    const w = img.width * scale;
    const h = img.height * scale;
    ctx.drawImage(img, (cols - w) / 2, (rows - h) / 2, w, h);
    return ctx.getImageData(0, 0, cols, rows).data;
};

const Life = ({ cellSize = 4, density = 0.14, tickMs = 110 }) => {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!ctx) return undefined; // e.g. jsdom in tests

        const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

        let world = null;
        let texture = null;
        let frame = null;
        let img = null;
        let raf = 0;
        let lastTick = 0;
        let lastSoup = 0;
        let lastFrame = 0;
        let resizeTimer = 0;

        const setup = () => {
            // Guard against a zero-sized window (hidden tab, iframe not laid out yet)
            const cols = Math.max(1, Math.ceil(window.innerWidth / cellSize));
            const rows = Math.max(1, Math.ceil(window.innerHeight / cellSize));
            world = createWorld(cols, rows, density);
            canvas.width = cols;
            canvas.height = rows;
            canvas.style.width = `${cols * cellSize}px`;
            canvas.style.height = `${rows * cellSize}px`;
            frame = ctx.createImageData(cols, rows);
            texture = img ? sampleTexture(img, cols, rows) : null;

            if (reduceMotion) {
                // Evolve past the initial noise, then hold a single still frame.
                for (let i = 0; i < 40; i++) step(world);
                world.glow = Float32Array.from(world.cells);
                draw(0);
            }
        };

        const draw = (dt) => {
            if (!texture) return;
            const { cells, glow } = world;
            const out = frame.data;
            const decay = Math.exp(-FADE_PER_SEC * dt);
            for (let i = 0; i < cells.length; i++) {
                const g = cells[i] ? 1 : glow[i] * decay;
                glow[i] = g;
                const k = AMBIENT + (1 - AMBIENT) * g;
                const p = i * 4;
                out[p] = texture[p] * k * BRIGHTNESS;
                out[p + 1] = texture[p + 1] * k * BRIGHTNESS;
                out[p + 2] = texture[p + 2] * k * BRIGHTNESS * 1.05;
                out[p + 3] = 255;
            }
            ctx.putImageData(frame, 0, 0);
        };

        const loop = (now) => {
            raf = requestAnimationFrame(loop);
            if (document.hidden) {
                lastFrame = now;
                return;
            }
            const dt = lastFrame ? Math.min(0.1, (now - lastFrame) / 1000) : 0;
            lastFrame = now;

            if (now - lastTick >= tickMs) {
                lastTick = now;
                step(world);
            }
            if (now - lastSoup >= SOUP_EVERY_MS) {
                lastSoup = now;
                sprinkleSoup(world);
            }
            draw(dt);
        };

        const onResize = () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(setup, 200);
        };

        setup();

        const image = new Image();
        image.onload = () => {
            img = image;
            texture = sampleTexture(img, world.cols, world.rows);
            if (reduceMotion) draw(0);
        };
        image.src = deepField;

        if (!reduceMotion) raf = requestAnimationFrame(loop);
        window.addEventListener('resize', onResize);

        return () => {
            cancelAnimationFrame(raf);
            clearTimeout(resizeTimer);
            window.removeEventListener('resize', onResize);
            image.onload = null;
        };
    }, [cellSize, density, tickMs]);

    return <LifeViz canvasRef={canvasRef} />;
};

export default Life;
