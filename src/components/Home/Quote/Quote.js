import './Quote.css';

const Quote = ({text, author}) => {

    return (
        <div className='quote'>
            <p className='text'>{text}</p>
            <p className='author'>{author}</p>
        </div>
    );
};

export default Quote;
