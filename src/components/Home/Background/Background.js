import '../backgrounds/Life/Life';
import Life from "../backgrounds/Life/Life";
import './Background.css';

const Background = ({ mode }) => {
    let backgroundElem = null;

    switch (mode) {
        case 'life':
            backgroundElem = <Life cellSize={5} birthProb={0.1} />;
            break;
        default:
            break;
    }

    return (
        <div className={'background'}>
            {backgroundElem}
        </div>
    );
};

export default Background;
