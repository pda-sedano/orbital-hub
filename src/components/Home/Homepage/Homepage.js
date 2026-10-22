import { Navigate, useParams } from 'react-router';
import './Homepage.css';
import Title from '../Title/Title';
import Quote from '../Quote/Quote';
import Orbital from '../Orbital/Orbital';
import Index from '../Index/Index';
import { resolveTrail } from '../../../data/links';
import { quotes, QUOTE_INTERVAL_MS } from '../../../data/quotes';

// Handles "/" (the top level) and "/orbit/<group>/<subgroup>/..." (nested levels).
const Homepage = () => {
    const segments = (useParams()['*'] ?? '').split('/').filter(Boolean);
    const isOrbit = segments[0] === 'orbit';
    const trail = segments.length === 0 ? [] : isOrbit ? resolveTrail(segments.slice(1)) : null;

    // Unknown paths and missing groups fall back to the top level.
    if (!trail) return <Navigate to="/" replace />;

    return (
        <main className="homepage">
            <Title
                name="Welcome to the Orbital Hub"
                tagline="Physics, mathematics and computer science, and the places they meet. Everything I'm building is linked from here."
            />
            <Orbital trail={trail} />
            <Quote quotes={quotes} intervalMs={QUOTE_INTERVAL_MS} />
            {/* <Index /> */}
            {/* <footer className="homepage__footer">
                Background: Conway's Game of Life, with each live cell revealing a piece of the
                Hubble Deep Field.
            </footer> */}
        </main>
    );
};

export default Homepage;
