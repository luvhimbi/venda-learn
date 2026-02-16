import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Sidebar from "./components/Sidebar";
import AuthNavbar from "./components/AuthNavbar";
import Footer from "./components/Footer";
import GuestNudge from "./components/GuestNudge";
import Login from "./Pages/Auth/Login";
import Register from "./Pages/Auth/Register";
import ResetPassword from "./Pages/Auth/ResetPassword";
import Home from "./Pages/Home";
import Profile from "./Pages/Auth/Profile";
import Muvhigo from "./Pages/Admin/Muvhigo";
import GameRoom from "./Pages/Games/GameRoom";
import DailyWordPage from "./Pages/Learning/DailyWordPage";
import Courses from "./Pages/Learning/Courses";
import CourseLessons from "./Pages/Learning/CourseLessons";
import PrivacyPolicy from "./Pages/Policy/PrivacyPolicy";
import TermsOfUse from "./Pages/Policy/TermsOfUse";
import POPIAct from "./Pages/Policy/POPIAct";
import Stories from "./Pages/Learning/Stories";
import HistoryList from "./Pages/Records/HistoryList";
import AddHistory from "./Pages/Admin/AddHistory";
import HistoryDetail from "./Pages/Records/HistoryDetail";
import InstallBanner from "./components/InstallBanner.tsx";
import AdminRoute from "./components/AdminRoute.tsx";
import AdminDashboard from "./Pages/Admin/AdminDashboard";
import EditLesson from "./Pages/Admin/EditLesson";
import AddLesson from "./Pages/Admin/AddLesson";
import AdminLessons from "./Pages/Admin/AdminLesson";
import AdminUsers from './Pages/Admin/AdminUsers';
import AdminAuditLog from "./Pages/Admin/AdminAuditLog";
import AdminDailyWords from "./Pages/Admin/AdminDailyWords";
import AdminHistory from "./Pages/Admin/AdminHistory";
import WordPuzzle from "./Pages/Games/WordPuzzle";
import GamesDashboard from "./Pages/Games/GamesDashboard";
import PicturePuzzle from "./Pages/Games/PicturePuzzle";
import SyllableBuilder from "./Pages/Games/SyllableBuilder";
import SentenceScramble from "./Pages/Games/SentenceScramble";
import KnowledgeBattle from "./Pages/Games/KnowledgeBattle";
import PracticeHub from "./Pages/Games/PracticeHub";
import DailyChallenge from "./Pages/Games/DailyChallenge";
import ChatRoom from "./Pages/ChatRoom";
import ErrorBoundary from "./components/ErrorBoundary";
import NotFound from "./Pages/NotFound";
import { auth } from './services/firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';

/**
 * AppContent handles the conditional rendering of the UI.
 * It must be inside the <Router> to use useLocation().
 */
const AppContent: React.FC = () => {
    const location = useLocation();
    const isAdminPath = location.pathname.startsWith('/admin');
    const isAuthPath = ['/login', '/register', '/reset-password'].includes(location.pathname);
    const isChatPath = location.pathname.startsWith('/chat/');
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (u) => {
            setUser(u);
        });
        return () => unsubscribe();
    }, []);

    return (
        <div className={`min-vh-100 d-flex ${user && !isAdminPath && !isAuthPath ? 'flex-column flex-lg-row' : 'flex-column'} bg-light`}>

            {/* Show Sidebar only for authenticated users on internal pages */}
            {user && !isAdminPath && !isAuthPath && <Sidebar />}

            <div className={`flex-grow-1 d-flex flex-column ${user && !isAdminPath && !isAuthPath ? 'main-container' : ''}`}>

                {/* Show minimalist AuthNavbar for Login/Register or public users */}
                {!isAdminPath && (!user || isAuthPath) && <AuthNavbar user={user} />}

                {!isAdminPath && !isAuthPath && user && !isChatPath && (
                    <div className="p-2 bg-white d-lg-none">
                        {/* Mobile Spacer */}
                    </div>
                )}

                <InstallBanner />

                <main className="flex-grow-1">
                    <Routes>
                        {/* User & Public Routes */}
                        <Route path="/" element={<Home />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />
                        <Route path="/reset-password" element={<ResetPassword />} />
                        <Route path="/muvhigo" element={<Muvhigo />} />
                        <Route path="/game/:lessonId/:microLessonId?" element={<GameRoom />} />
                        <Route path="/word-of-the-day" element={<DailyWordPage />} />
                        <Route path="/mitambo" element={<GamesDashboard />} />
                        <Route path="/word-puzzle" element={<WordPuzzle />} />
                        <Route path="/picture-puzzle" element={<PicturePuzzle />} />
                        <Route path="/syllable-builder" element={<SyllableBuilder />} />
                        <Route path="/game/scramble" element={<SentenceScramble />} />
                        <Route path="/battle" element={<KnowledgeBattle />} />
                        <Route path="/history" element={<HistoryList />} />
                        <Route path="/courses" element={<Courses />} />
                        <Route path="/courses/:courseId" element={<CourseLessons />} />
                        <Route path="/history/add" element={<AddHistory />} />
                        <Route path="/history/:storyId" element={<HistoryDetail />} />
                        <Route path="/profile" element={<Profile />} />
                        <Route path="/privacy" element={<PrivacyPolicy />} />
                        <Route path="/terms" element={<TermsOfUse />} />
                        <Route path="/popiact" element={<POPIAct />} />
                        <Route path="/ngano" element={<Stories />} />
                        <Route path="/practice" element={<PracticeHub />} />
                        <Route path="/daily-challenge" element={<DailyChallenge />} />
                        <Route path="/chat/:chatId" element={<ErrorBoundary><ChatRoom /></ErrorBoundary>} />

                        {/* Protected Admin Routes */}
                        <Route
                            path="/admin/dashboard"
                            element={
                                <AdminRoute>
                                    <AdminDashboard />
                                </AdminRoute>
                            }
                        />

                        {/* View and Manage All Lessons */}
                        <Route
                            path="/admin/lessons"
                            element={
                                <AdminRoute>
                                    <AdminLessons />
                                </AdminRoute>
                            }
                        />

                        {/* Create a New Lesson */}
                        <Route
                            path="/admin/add-lesson"
                            element={
                                <AdminRoute>
                                    <AddLesson />
                                </AdminRoute>
                            }
                        />

                        {/* Edit an Existing Lesson using its Document ID */}
                        <Route
                            path="/admin/edit-lesson/:id"
                            element={
                                <AdminRoute>
                                    <EditLesson />
                                </AdminRoute>
                            }
                        />

                        {/* Manage Student Records */}
                        <Route
                            path="/admin/users"
                            element={
                                <AdminRoute>
                                    <AdminUsers />
                                </AdminRoute>
                            }
                        />
                        <Route path="/admin/logs" element={<AdminAuditLog />} />
                        <Route path="/admin/daily-words" element={<AdminRoute><AdminDailyWords /></AdminRoute>} />

                        {/* History Management */}
                        <Route path="/admin/history" element={<AdminRoute><AdminHistory /></AdminRoute>} />
                        <Route path="/admin/history/add" element={<AdminRoute><AddHistory /></AdminRoute>} />
                        <Route path="/admin/history/edit/:storyId" element={<AdminRoute><AddHistory /></AdminRoute>} />

                        {/* 404 Catch-All Route */}
                        <Route path="*" element={<NotFound />} />
                    </Routes>
                    <GuestNudge />
                </main>

                {!isAdminPath && !user && <Footer />}

                <style>{`
                @media (min-width: 992px) {
                    .main-container {
                        margin-left: 280px;
                        width: calc(100% - 280px);
                    }
                }
                @media (max-width: 991.98px) {
                    main {
                        padding-bottom: 80px; /* Space for Mobile Bottom Nav */
                    }
                }
            `}</style>
            </div>
        </div>
    );
};

function App() {
    return (
        <Router>
            <AppContent />
        </Router>
    );
}

export default App;