import './App.css';
import Homepage from "../Home/Homepage/Homepage";
import About from '../About/About';
import { BrowserRouter, Routes, Route } from "react-router";


const App = () => {
  return (
    <BrowserRouter>
        <Routes>
            <Route path='/' element={<Homepage />} />
            <Route path='/about-me' element={<About />} />
        </Routes>
    </BrowserRouter>
  );
}

export default App;
