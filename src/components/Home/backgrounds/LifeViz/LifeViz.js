import './LifeViz.css';

// The canvas the Life simulation draws into (one pixel per cell, scaled up by CSS).
const LifeViz = ({ canvasRef }) => <canvas ref={canvasRef} className="gameboard" />;

export default LifeViz;
