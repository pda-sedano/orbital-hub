import './Tab.css';
import {Link} from 'react-router';

const Tab = ({name, link}) => {
    return (
        <div className='tab'>
            <Link to={`/${link}`}>
                {name}
            </Link>
        </div>
    );
};

export default Tab;
