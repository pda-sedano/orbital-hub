import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { HashRouter } from 'react-router';
import App from './App';
import Index from '../Home/Index/Index';
import Quote from '../Home/Quote/Quote';
import { step } from '../Home/backgrounds/Life/Life';
import { buildBodies, angleAt } from '../Home/Orbital/Orbital';
import { orbiting, isGroup, resolveTrail, allLinks } from '../../data/links';

const renderAt = (hash) => {
    window.location.hash = hash;
    return render(<App />);
};

const orreryLinks = () =>
    within(document.querySelector('.orrery__bodies'))
        .getAllByRole('link')
        .map((a) => a.getAttribute('aria-label'));

describe('hub', () => {
    test('renders the title and every top-level body', () => {
        renderAt('#/');
        expect(
            screen.getByRole('heading', { level: 1, name: 'Welcome to the Orbital Hub' })
        ).toBeInTheDocument();
        expect(orreryLinks()).toHaveLength(orbiting.length);
        expect(screen.queryByRole('link', { name: /^Back to/ })).not.toBeInTheDocument();
    });

    test('the index lists every link in the tree', () => {
        render(
            <HashRouter>
                <Index />
            </HashRouter>
        );
        const index = screen.getByRole('region', { name: 'Everything in orbit' });
        for (const link of allLinks()) {
            expect(within(index).getByRole('link', { name: new RegExp(link.title) })).toBeInTheDocument();
        }
    });

    test('opening a group shows its children, and the back arrow returns', () => {
        const group = orbiting.find(isGroup);
        renderAt('#/');

        const groupLink = within(document.querySelector('.orrery__bodies')).getByRole('link', {
            name: new RegExp(group.title),
        });
        fireEvent.click(groupLink);

        expect(window.location.hash).toBe(`#/orbit/${group.id}`);
        expect(orreryLinks()).toEqual(
            group.children.map((c) =>
                isGroup(c) ? expect.stringContaining(c.title) : c.title
            )
        );
        expect(screen.getByRole('navigation', { name: 'Orbit level' })).toHaveTextContent(group.title);

        fireEvent.click(screen.getByRole('link', { name: 'Back to the hub' }));
        expect(window.location.hash).toBe('#/');
        expect(orreryLinks()).toHaveLength(orbiting.length);
    });

    test('Escape goes up a level', () => {
        const group = orbiting.find(isGroup);
        renderAt(`#/orbit/${group.id}`);
        expect(screen.getByRole('link', { name: 'Back to the hub' })).toBeInTheDocument();
        fireEvent.keyDown(window, { key: 'Escape' });
        expect(window.location.hash).toBe('#/');
    });

    test('unknown levels fall back to the top', () => {
        renderAt('#/orbit/not-a-group');
        expect(window.location.hash).toBe('#/');
        expect(orreryLinks()).toHaveLength(orbiting.length);
    });
});

describe('tree helpers', () => {
    const tree = [
        { id: 'a', title: 'A', children: [{ id: 'b', title: 'B', children: [{ id: 'c', title: 'C', href: 'https://x.test' }] }] },
        { id: 'leaf', title: 'Leaf', href: 'https://y.test' },
    ];

    test('resolveTrail follows nested groups and rejects leaves and unknown ids', () => {
        expect(resolveTrail([], tree)).toEqual([]);
        expect(resolveTrail(['a', 'b'], tree).map((g) => g.id)).toEqual(['a', 'b']);
        expect(resolveTrail(['leaf'], tree)).toBeNull();
        expect(resolveTrail(['a', 'nope'], tree)).toBeNull();
    });

    test('allLinks flattens to leaves only', () => {
        expect(allLinks(tree).map((l) => l.id)).toEqual(['c', 'leaf']);
    });

    test('angleAt inverts the orbit projection, so a dragged body lands under the pointer', () => {
        const tilt = (-12 * Math.PI) / 180;
        const incl = 0.42;
        for (const theta of [0, 0.7, 1.9, 3, -2.4, -0.3]) {
            // project() from Orbital.js, inlined: a point on an orbit of radius 300
            const X = 300 * Math.cos(theta);
            const Y = 300 * incl * Math.sin(theta);
            const x = X * Math.cos(tilt) - Y * Math.sin(tilt);
            const y = X * Math.sin(tilt) + Y * Math.cos(tilt);
            expect(angleAt(x, y, incl)).toBeCloseTo(theta, 6);
            // and the radius doesn't matter: anywhere along that ray maps to the same angle
            expect(angleAt(x * 0.3, y * 0.3, incl)).toBeCloseTo(theta, 6);
        }
    });

    test('buildBodies deals bodies onto rings and respects explicit rings', () => {
        const items = [{ id: '1' }, { id: '2' }, { id: '3' }, { id: '4' }, { id: '5', ring: 0 }];
        expect(buildBodies(items).map((b) => b.ring)).toEqual([0, 1, 2, 0, 0]);
        // inner rings orbit faster (Kepler's third law)
        const [inner, middle] = buildBodies(items);
        expect(inner.omega).toBeGreaterThan(middle.omega);
    });
});

describe('quotes', () => {
    const quotes = [
        { text: 'First quote', author: 'One' },
        { text: 'Second quote', author: 'Two' },
    ];
    const current = () => document.querySelector('.quote--current blockquote').textContent;

    beforeEach(() => jest.useFakeTimers());
    afterEach(() => jest.useRealTimers());

    test('cycles through quotes at the interval', () => {
        render(<Quote quotes={quotes} intervalMs={1000} />);
        expect(current()).toBe('First quote');
        act(() => jest.advanceTimersByTime(1000));
        expect(current()).toBe('Second quote');
        act(() => jest.advanceTimersByTime(1000));
        expect(current()).toBe('First quote');
    });

    test('holds the current quote while hovered', () => {
        render(<Quote quotes={quotes} intervalMs={1000} />);
        fireEvent.mouseEnter(document.querySelector('.quotes'));
        act(() => jest.advanceTimersByTime(5000));
        expect(current()).toBe('First quote');
    });

    test('a single quote just stays put', () => {
        render(<Quote quotes={quotes.slice(0, 1)} intervalMs={1000} />);
        act(() => jest.advanceTimersByTime(5000));
        expect(current()).toBe('First quote');
    });
});

test('Life step: a blinker oscillates with period 2', () => {
    const cols = 5;
    const rows = 5;
    const cells = new Uint8Array(cols * rows);
    [11, 12, 13].forEach((i) => (cells[i] = 1)); // horizontal bar through the centre
    const world = { cols, rows, cells, scratch: new Uint8Array(cols * rows) };

    step(world);
    expect([...world.cells.keys()].filter((i) => world.cells[i])).toEqual([7, 12, 17]);
    step(world);
    expect([...world.cells.keys()].filter((i) => world.cells[i])).toEqual([11, 12, 13]);
});
