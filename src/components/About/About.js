import './About.css';
import {Link} from 'react-router'

const About = () => {
    return (
        <div>
            <Link to='/'>back</Link>

            <h1>About Me</h1>

            <p>I'm Perrin. I have a BS in Physics from UNCA and I'm interested in the intersection
            between physics, math and computer science. Bottom text llorem ipsum dolor sit amet
            </p>

            <p>Here's some stuff:</p>

            <h2>Quick Links</h2>
            <ul>
                <li><a href='https://medium.com/@pdasedano' target='_blank' rel='noopener noreferrer'>Medium</a></li>
                <li><a href='https://github.com/pda-sedano' target='_blank' rel='noopener noreferrer'>Github</a></li>
                <li>
                    <a
                        href='https://www.linkedin.com/in/perrin-alaine-sedano-4589b31b5/'
                        target='_blank'
                        rel='noopener noreferrer'
                    >
                        LinkedIn
                    </a>
                </li>
            </ul>

        </div>
    );
};

export default About;
