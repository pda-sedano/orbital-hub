import { Link } from 'react-router';
import { orbiting, profiles, isGroup, orbitPath } from '../../data/links';
import './About.css';

const About = () => {
    const projects = orbiting.filter((l) => l.href || isGroup(l));

    return (
        <main className="about">
            <Link className="about__back" to="/">
                Back to the hub
            </Link>

            <h1 className="about__title">About me</h1>

            <div className="about__body">
                <p className="about__lede">
                    I'm Perrin. I have a BS in Physics from UNCA, and I'm interested in the
                    intersection between physics, mathematics and computer science.
                </p>

                <p>
                    I learn best by building things myself, so most of what you'll find here
                    is me implementing ideas from scratch to see how they really work.
                </p>

                <h2>What I'm working on</h2>
                <ul className="about__list">
                    {projects.map((p) => (
                        <li key={p.id}>
                            {isGroup(p) ? (
                                <Link to={orbitPath([p.id])}>{p.title}</Link>
                            ) : (
                                <a href={p.href} target="_blank" rel="noopener noreferrer">
                                    {p.title}
                                </a>
                            )}
                            <span>{p.description}</span>
                        </li>
                    ))}
                </ul>

                <h2>Elsewhere</h2>
                <ul className="about__profiles">
                    {profiles.map((p) => (
                        <li key={p.id}>
                            <a href={p.href} target="_blank" rel="noopener noreferrer">
                                {p.title}
                            </a>
                        </li>
                    ))}
                </ul>
            </div>
        </main>
    );
};

export default About;
