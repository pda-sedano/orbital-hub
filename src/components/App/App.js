import './App.css';
import Homepage from "../Home/Homepage/Homepage";
import About from '../About/About';
import { HashRouter, Routes, Route } from "react-router";


const App = () => {
  return (
    <HashRouter>
        <Routes>
            <Route path='/' element={<Homepage />} />
            <Route path='/about-me' element={<About />} />
        </Routes>
    </HashRouter>
  );
}

export default App;
