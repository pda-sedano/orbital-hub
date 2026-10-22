import Life from '../backgrounds/Life/Life';
import './Background.css';

const Background = ({ mode }) => {
    let backgroundElem = null;

    switch (mode) {
        case 'life':
            backgroundElem = <Life cellSize={4} density={0.14} tickMs={110} />;
            break;
        default:
            break;
    }

    return (
        <div className="background" aria-hidden="true">
            {backgroundElem}
        </div>
    );
};

export default Background;
