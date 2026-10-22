import galaxy from './images/galaxy.webp';
import './Hub.css';

// The galaxy at the centre of the orrery, inclined to match the orbital plane.
// Dimmed on nested levels so the back arrow on its core stands out.
const Hub = ({ radius, dimmed = false }) => {
    return (
        <div
            className={`hub${dimmed ? ' hub--dimmed' : ''}`}
            style={{ '--r': `${radius}px` }}
            aria-hidden="true"
        >
            <div className="hub__glow" />
            <div className="hub__plane">
                <img src={galaxy} alt="" className="hub__galaxy" draggable="false" />
            </div>
        </div>
    );
};

export default Hub;
