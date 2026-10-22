import './App.css';
import Homepage from '../Home/Homepage/Homepage';
import About from '../About/About';
import Background from '../Home/Background/Background';
import { HashRouter, Routes, Route } from 'react-router';

const App = () => {
    return (
        <HashRouter>
            <div className="app">
                {/* Lives outside <Routes> so the simulation keeps running across pages */}
                <Background mode="life" />
                <Routes>
                    <Route path="/about-me" element={<About />} />
                    {/* "/" and every "/orbit/..." level; unknown paths redirect to "/" */}
                    <Route path="/*" element={<Homepage />} />
                </Routes>
            </div>
        </HashRouter>
    );
};

export default App;
