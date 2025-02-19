import './LifeViz.css';
import img from './hubbleDeepField.jpg';
import {useState, useEffect, useRef} from "react";

const LifeViz = ({ gameboard, cellSize }) => {
    const canvasRef = useRef(null);
    const [alive, setAlive] = useState(null);

    // Load image only once
    useEffect(() => {
        const aliveNew = new Image();
        aliveNew.src = img;

        aliveNew.onload = () => {
            setAlive(aliveNew); // Store loaded images
        };
    }, []); // Load images only at the start

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'black';

        // Handle zoom scaling
        const scale = window.devicePixelRatio;
        canvas.width = gameboard[0].length * cellSize * scale;
        canvas.height = gameboard.length * cellSize * scale;
        ctx.scale(scale, scale); // Adjust rendering scale

        // Clear and draw grid
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "black";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        //ctx.fill();


                // ctx.drawImage(alive, 0, 0, canvas.width, canvas.height);
        if (alive !== null) {
            gameboard.forEach((row, i) => {
                row.forEach((cell, j) => {
                    if (cell === 1) {
                        const GRID_WIDTH = gameboard[0].length;
                        const GRID_HEIGHT = gameboard.length;
                        const sx = (j / GRID_WIDTH) * alive.width;  // Crop X from aliveImage
                        const sy = (i / GRID_HEIGHT) * alive.height; // Crop Y from aliveImage
                        const sw = alive.width / GRID_WIDTH;  // Width of cropped section
                        const sh = alive.height / GRID_HEIGHT; // Height of cropped section

                        ctx.drawImage(alive,
                            sx, sy, sw, sh,
                            j * cellSize, i * cellSize, cellSize, cellSize);
                        //ctx.fillRect( j * cellSize, i * cellSize, cellSize, cellSize)
                    }
                });
            });
        }

        console.log(alive);
        //console.log(alive.onload);

        console.log(gameboard);
    }, [gameboard, alive]);

    return <canvas ref={canvasRef} width={gameboard[0].length * cellSize} height={gameboard.length * cellSize} className='gameboard' />;
};


export default LifeViz;
