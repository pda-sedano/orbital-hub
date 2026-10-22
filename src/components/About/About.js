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

            <h2 className="about__title">About me</h2>

            <div className="about__body">
                <p className="about__lede">
                    Hi, my name is Perrin Alaine-Sedano. I'm a graduate of UNC Asheville in physics and an aspiring AI researcher.
                    I'm also interested in the intersection between physics, mathematics and computer science.
                </p>
            </div>

            <br/>
            <br/>

            <h2 className="about__title">About the site</h2>

            <div className="about__body">
                <p className="about__lede">
                    The Orbital Hub has launched! This site is meant to be a central hub for all my projects.
                    It's still a work in progress, so look out for collisions with space debris.
                </p>

                {/* <h2>What I'm working on</h2>
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
                </ul> */}

                <h2>Quick Links</h2>
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
