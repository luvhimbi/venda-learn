import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from "./components/Navbar";
import Footer from "./components/Footer"; // Import the new component
import Login from "./Pages/Login";
import Register from "./Pages/Register";
import ResetPassword from "./Pages/ResetPassword";
import Home from "./Pages/Home";
import Profile from "./Pages/Profile";
import Muvhigo from "./Pages/Muvhigo";
import GameRoom from "./Pages/GameRoom";
import DailyWordPage from "./Pages/DailyWordPage.tsx";
import Lobby from "./Pages/Lobby.tsx";
import DuelPage from "./Pages/DuelPage.tsx";
import CreateChallenge from "./Pages/CreateChallenge.tsx";

function App() {
    return (
        <Router>
            <div className="min-vh-100 d-flex flex-column bg-light">
                <Navbar />

                <main className="flex-grow-1">
                    <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />
                        <Route path="/reset-password" element={<ResetPassword />} />
                        <Route path="/muvhigo" element={<Muvhigo />} />
                        <Route path="/game/:lessonId" element={<GameRoom />} />
                        <Route path="/word-of-the-day" element={<DailyWordPage/>} />
                        <Route path="/lobby" element={<Lobby />} />
                        <Route path="/create-challenge" element={<CreateChallenge />} />
                        <Route path="/duel/:challengeId" element={<DuelPage />} />
                        <Route path="/profile" element={<Profile />} />
                    </Routes>
                </main>

                <Footer />
            </div>
        </Router>
    );
}

export default App;