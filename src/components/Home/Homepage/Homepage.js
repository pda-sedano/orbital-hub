import './Homepage.css';
import Title from "../Title/Title";
import Quote from '../Quote/Quote';
import Orbital from '../Orbital/Orbital';
import Background from '../Background/Background';

const Homepage = () => {
    return (
        <div className="Homepage">
            <Background mode={'life'} />
            <Title text={'Welcome to the Orbital Hub'} />
            <Orbital />
            <Quote text={'What I cannot create, I do not understand'} author={'Richard Feynman'} />
        </div>
    );
}

export default Homepage;
