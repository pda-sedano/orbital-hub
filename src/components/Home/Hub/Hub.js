import img from './images/milky_way.png'
import './Hub.css';

const Hub = () => {
    return (
        <div>
            <img
                src={img}
                alt='Rotating galaxy. Image credit Jean Beaufort,
                https://www.publicdomainpictures.net/en/view-image.php?image=180438&picture=milky-way'
                className='rotating'
            />
        </div>
    );
};

export default Hub;
