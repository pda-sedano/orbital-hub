import { useEffect, useState } from 'react';
import './Quote.css';

/*
 * One quote, or several taking turns every `intervalMs`.
 * All quotes are stacked in the same grid cell, so the block is always as tall
 * as the longest one and the page below doesn't jump when they change.
 * Hovering holds the current quote.
 */
const Quote = ({ quotes, intervalMs = 12000 }) => {
    const [index, setIndex] = useState(0);
    const [held, setHeld] = useState(false);
    const count = quotes.length;

    useEffect(() => {
        if (count < 2 || held) return undefined;
        const id = setInterval(() => {
            if (!document.hidden) setIndex((i) => (i + 1) % count);
        }, intervalMs);
        return () => clearInterval(id);
    }, [count, intervalMs, held]);

    if (count === 0) return null;

    return (
        <div
            className="quotes"
            onMouseEnter={() => setHeld(true)}
            onMouseLeave={() => setHeld(false)}
        >
            {quotes.map((q, i) => (
                <figure
                    key={q.text}
                    className={`quote${i === index % count ? ' quote--current' : ''}`}
                    aria-hidden={i === index % count ? undefined : true}
                >
                    <blockquote className="quote__text">{q.text}</blockquote>
                    <figcaption className="quote__author">{q.author}</figcaption>
                </figure>
            ))}
        </div>
    );
};

export default Quote;
