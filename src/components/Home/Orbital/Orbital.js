import Hub from '../Hub/Hub';
import Tab from '../Tab/Tab';
import './Orbital.css';

const sections = ['About Me', 'Random Junk', 'Automated Software Synthesis'];
const links = ['about-me', '', '']

const Orbital = () => {
    const tabs = sections.map(
        (name, i) => {
            const tau = 2 * Math.PI;

            // const orbital = document.getElementById('orbital');

            const angle = i / sections.length * tau
            const radius = 0.15 * window.innerWidth;

            const centerX = 0.2 * window.innerWidth;
            const centerY = 0.2 * window.innerWidth;

            const x = centerX + Math.cos(angle) * radius;
            const y = centerY + Math.sin(angle) * radius;

            return (<div style={{

                // 0, 0 = top left edge of the Orbital div block
                // position: 'static',
                // position: 'fixed',
                // position: 'relative',
                // position: 'absolute',
                // top: `50vw`,
                // left: `50vh`,
                transform: `translate(${x}px, ${y}px)`, // Positioning dynamically
            }}>
                <Tab
                    name={name}
                    link={links[i]}
                />
            </div>);
        }
    );

    return (
        <div className='orbitalHolder'>
            <div className='orbital'>
                {tabs}
            </div>
            <Hub />
        </div>
);
};

export default Orbital;
