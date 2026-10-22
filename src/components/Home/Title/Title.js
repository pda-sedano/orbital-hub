import { header_links } from '../../../data/links';
import './Title.css';

const Title = ({ name, tagline }) => {
    return (
        <header className="masthead">
            <div className="masthead__id">
                <h1 className="masthead__name">{name}</h1>
                <p className="masthead__tagline">{tagline}</p>
            </div>
            <nav className="masthead__nav" aria-label="Header Links">
                {header_links.map((p) => (
                    <a key={p.id} href={p.href} target="_blank" rel="noopener noreferrer">
                        {p.title}
                    </a>
                ))}
            </nav>
        </header>
    );
};

export default Title;
