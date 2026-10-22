// Everything the hub links to. To add a project, add an entry here.
//
// Each entry is one of:
//   a link      `to` (an internal route) or `href` (an external URL, opens in a new tab)
//   a group     `children`: a list of entries. Clicking a group opens a new orbit
//               level showing its children; groups can nest to any depth.
//
// Optional fields:
//   kind        a few words shown when the body is hovered or focused
//   description one sentence, shown in the list below the orrery
//   short       a shorter title for small screens
//   ring        which orbit the body sits on (0 = innermost). If omitted, bodies
//               are dealt onto the rings in order. Bodies sharing a ring are
//               spaced evenly around it.

export const orbiting = [
    {
        id: 'about',
        title: 'About me',
        kind: 'Background and contact',
        description: 'Who I am, what I studied and where to find me.',
        to: '/about-me',
        ring: 0,
    },
    {
        id: 'ml-from-scratch',
        title: 'Machine Learning from Scratch',
        short: 'ML from Scratch',
        kind: 'Essay series',
        description:
            'Machine learning algorithms implemented with nothing but Python and NumPy, ' +
            'and written up step by step.',
        ring: 1,
        children: [
            {
                id: 'series',
                title: 'Series home',
                kind: 'Every post in the series',
                description: 'The full Machine Learning from Scratch series.',
                href: 'https://pda-sedano.github.io/ml-from-scratch/',
            },
            {
                id: 'neural-network',
                title: 'Neural Network from Scratch',
                short: 'Neural network',
                kind: 'Latest post',
                description: 'A feedforward neural network for MNIST, built with only NumPy.',
                href: 'https://pda-sedano.github.io/ml-from-scratch/posts/neural-network/',
            },
            {
                id: 'medium',
                title: 'On Medium',
                kind: 'Where the series is published',
                description: 'The series as it appears on Medium.',
                href: 'https://medium.com/@pdasedano',
            },
        ],
    },
    {
        id: 'lambda',
        title: 'Lambda calculus interpreter',
        short: 'λ interpreter',
        kind: 'Source code',
        description: 'An interpreter for the untyped lambda calculus.',
        href: 'https://github.com/pda-sedano/lambda-interpreter-web',
        ring: 2,
    },
];

export const profiles = [
    { id: 'github', title: 'GitHub', href: 'https://github.com/pda-sedano' },
    { id: 'medium', title: 'Medium', href: 'https://medium.com/@pdasedano' },
    {
        id: 'linkedin',
        title: 'LinkedIn',
        href: 'https://www.linkedin.com/in/perrin-alaine-sedano-4589b31b5/',
    },
];

export const isGroup = (link) => Array.isArray(link.children) && link.children.length > 0;

export const hostOf = (link) => {
    if (isGroup(link)) return `${link.children.length} links`;
    return link.href ? new URL(link.href).host.replace(/^www\./, '') : 'this site';
};

// Route for an orbit level, given the ids of the groups from the top down.
export const orbitPath = (ids) => (ids.length ? `/orbit/${ids.join('/')}` : '/');

// Turn a list of group ids into the groups themselves, or null if any id is invalid.
export const resolveTrail = (ids, root = orbiting) => {
    const trail = [];
    let level = root;
    for (const id of ids) {
        const group = level.find((link) => link.id === id && isGroup(link));
        if (!group) return null;
        trail.push(group);
        level = group.children;
    }
    return trail;
};

// Every leaf link in the tree, depth first.
export const allLinks = (level = orbiting) =>
    level.flatMap((link) => (isGroup(link) ? allLinks(link.children) : [link]));
