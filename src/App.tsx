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
import Courses from "./Pages/Courses.tsx";
import PrivacyPolicy from "./Pages/PrivacyPolicy.tsx";
import TermsOfUse from "./Pages/TermsOfUse.tsx";
import POPIAct from "./Pages/POPIAct.tsx";
import Stories from "./Pages/Stories.tsx";
import HistoryList from "./Pages/HistoryList.tsx";
import AddHistory from "./Pages/AddHistory.tsx";
import HistoryDetail from "./Pages/HistoryDetail.tsx";
import InstallBanner from "./components/InstallBanner.tsx";

function App() {
    return (
        <Router>
            <div className="min-vh-100 d-flex flex-column bg-light">
                <Navbar />
                <InstallBanner />
                <main className="flex-grow-1">
                    <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />
                        <Route path="/reset-password" element={<ResetPassword />} />
                        <Route path="/muvhigo" element={<Muvhigo />} />
                        <Route path="/game/:lessonId" element={<GameRoom />} />
                        <Route path="/word-of-the-day" element={<DailyWordPage/>} />
                        <Route path="/history" element={<HistoryList/>}/>
                        <Route path="/courses"  element={<Courses/>}/>
                        <Route path="/history/add" element={<AddHistory />} />
                        <Route path="/history/:storyId" element={<HistoryDetail />} />
                        <Route path="/profile" element={<Profile />} />
                        <Route path="/privacy" element={<PrivacyPolicy />} />
                        <Route path="/terms" element={<TermsOfUse />} />
                        <Route path="/popiact" element={<POPIAct/>} />
                        <Route path="/ngano" element={<Stories />} />
                    </Routes>
                </main>

                <Footer />
            </div>
        </Router>
    );
}

export default App;