import {useEffect, useState} from "react";
import LifeViz from "../LifeViz/LifeViz";

const Life = ({ cellSize, birthProb }) => {

    const cols = window.innerWidth / cellSize;
    const rows = window.innerHeight / cellSize;
    console.log('cellSize ' + cellSize);
    console.log('numCols ' + cols);
    console.log('numRows ' + rows);

    const [gameboard, setGameboard] = useState(
        Array.from({length: rows},
        () => Array.from({length: cols},
            () => Math.random() > 1 - birthProb ? 1 : 0
            )
        )
    );

    console.log(gameboard);

    // Get the next state according to the rules of Conway's Game of Life
    const nextState = grid => {
        return grid.map((col, i) =>
            col.map((cell, j) => {
                    const neighbors = countNeighbors(grid, i, j);

                    switch (cell) {
                        // Dead cell comes to life if it has 3 neighbors
                        case 0:
                            return + (neighbors === 3);
                        // Living cell dies unless it has two or three neighbor
                        default:
                            return + (neighbors === 2 || neighbors === 3);
                    }
                }
            )
        )
    };

    // Update the grid
    useEffect(() => {
        const interval = setInterval(() => {
            setGameboard(prevGameboard => nextState(prevGameboard));
        }, 50);

        return () => clearInterval(interval);
    }, [gameboard]);

    const countNeighbors = (grid, row, col) => {
        const directions = [-1, 0, 1];

        const numRows = grid.length
        const numCols = grid[0].length

        const mod = (n, m) => ((n % m) + m) % m;

        // idea from ChatGPT
        return directions.flatMap(row_offset => directions.map(
            col_offset => [row + row_offset, col + col_offset]
        )).filter(
            ([neighbor_row, neighbor_col]) => {
                // Check at least one index is different, then check if the cell is alive
                // Wraps around into a torus
                const neighbor_row_mod = mod(neighbor_row, numRows);
                const neighbor_col_mod = mod(neighbor_col, numCols);
                const not_self = (neighbor_row !== row || neighbor_col !== col);
                return not_self && grid[neighbor_row_mod][neighbor_col_mod];
            }
        ).length
    };

    return <LifeViz gameboard={gameboard} cellSize={cellSize} />
};

export default Life;
