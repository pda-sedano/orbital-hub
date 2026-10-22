import { Link } from 'react-router';
import { orbiting, hostOf, isGroup, orbitPath } from '../../../data/links';
import './Index.css';

const Row = ({ link, path }) => {
    const inner = (
        <>
            <span className="index__title">{link.title}</span>
            <span className="index__desc">{link.description}</span>
            <span className="index__dest">{hostOf(link)}</span>
        </>
    );
    if (isGroup(link) || link.to) {
        return (
            <Link className="index__item" to={isGroup(link) ? orbitPath(path) : link.to}>
                {inner}
            </Link>
        );
    }
    return (
        <a className="index__item" href={link.href} target="_blank" rel="noopener noreferrer">
            {inner}
        </a>
    );
};

// The whole tree as a plain list that doesn't move. Groups list their children beneath them.
const Level = ({ items, path = [], nested = false }) => (
    <ul className={nested ? 'index__list index__list--nested' : 'index__list'}>
        {items.map((link) => (
            <li key={link.id}>
                <Row link={link} path={[...path, link.id]} />
                {isGroup(link) && (
                    <Level items={link.children} path={[...path, link.id]} nested />
                )}
            </li>
        ))}
    </ul>
);

const Index = () => {
    return (
        <section className="index" aria-labelledby="index-heading">
            <h2 id="index-heading" className="index__heading">
                Everything in orbit
            </h2>
            <Level items={orbiting} />
        </section>
    );
};

export default Index;
