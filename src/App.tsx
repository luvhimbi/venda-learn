import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { GoogleReCaptchaProvider } from 'react-google-recaptcha-v3';
import Sidebar from "./components/Sidebar";
import AuthNavbar from "./components/AuthNavbar";
import Footer from "./components/Footer";
import GuestNudge from "./components/GuestNudge";
import Login from "./Pages/Auth/Login";
import Register from "./Pages/Auth/Register";
import ResetPassword from "./Pages/Auth/ResetPassword";
import Onboarding from "./Pages/Auth/Onboarding";
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
import DMCA from "./Pages/Policy/DMCA";
import Legal from "./Pages/Policy/Legal";
import Stories from "./Pages/Learning/Stories";
import HistoryList from "./Pages/Records/HistoryList";
import AddHistory from "./Pages/Admin/AddHistory";
import HistoryDetail from "./Pages/Records/HistoryDetail";
import Achievements from "./Pages/Achievements";
import OfflineBanner from "./components/OfflineBanner";
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
import SystemReset from "./Pages/Admin/SystemReset";
import WordPuzzle from "./Pages/Games/WordPuzzle";
import GamesDashboard from "./Pages/Games/GamesDashboard";
import PicturePuzzle from "./Pages/Games/PicturePuzzle";
import SyllableBuilder from "./Pages/Games/SyllableBuilder";
import SentenceScramble from "./Pages/Games/SentenceScramble";
// import KnowledgeBattle from "./Pages/Games/KnowledgeBattle";
import DailyChallenge from "./Pages/Games/DailyChallenge";
import WordBomb from "./Pages/Games/WordBomb";
import AdminWordBomb from "./Pages/Admin/AdminWordBomb";
import AdminLanguages from "./Pages/Admin/AdminLanguages";
import AdminPicturePuzzle from "./Pages/Admin/AdminPicturePuzzle";

import AdminReviews from "./Pages/Admin/AdminReviews";
import NotFound from "./Pages/NotFound";
import { auth, messaging } from './services/firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import { onMessage } from 'firebase/messaging';
import { NotificationProvider } from './contexts/NotificationContext';
import Swal from 'sweetalert2';
import NotificationPrompt from './components/NotificationPrompt';

/**
 * AppContent handles the conditional rendering of the UI.
 * It must be inside the <Router> to use useLocation().
 */
const AppContent: React.FC = () => {
    const location = useLocation();
    const isAdminPath = location.pathname.startsWith('/admin');
    const isAuthPath = ['/login', '/register', '/reset-password', '/onboarding'].includes(location.pathname);
    const [user, setUser] = useState<any>(null);
    const [showPushPrompt, setShowPushPrompt] = useState(false);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (u) => {
            setUser(u);
            
            // Check if we should show the push notification prompt
            if (u && !isAdminPath && !isAuthPath) {
                const hasPrompted = sessionStorage.getItem('push_prompt_shown');
                if (!hasPrompted && 'Notification' in window && Notification.permission !== 'granted') {
                    // Slight delay to not overwhelm the user
                    setTimeout(() => setShowPushPrompt(true), 3000);
                    sessionStorage.setItem('push_prompt_shown', 'true');
                }
            }
        });
        return () => unsubscribe();
    }, [isAdminPath, isAuthPath]);

    // Foreground Push Notification Listener
    useEffect(() => {
        const unsubscribe = onMessage(messaging, (payload) => {
            console.log('Foreground message received:', payload);
            if (payload.notification) {
                Swal.fire({
                    title: payload.notification.title,
                    text: payload.notification.body,
                    icon: 'info',
                    toast: true,
                    position: 'top-end',
                    showConfirmButton: false,
                    timer: 5000,
                    timerProgressBar: true
                });
            }
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


                <OfflineBanner />
                <InstallBanner />

                <main className="flex-grow-1">
                    <Routes>
                        {/* User & Public Routes */}
                        <Route path="/" element={<Home />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/onboarding" element={<Onboarding />} />
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
                        {/* <Route path="/battle" element={<KnowledgeBattle />} /> */}
                        <Route path="/history" element={<HistoryList />} />
                        <Route path="/courses" element={<Courses />} />
                        <Route path="/courses/:courseId" element={<CourseLessons />} />
                        <Route path="/history/add" element={<AddHistory />} />
                        <Route path="/history/:storyId" element={<HistoryDetail />} />
                        <Route path="/achievements" element={<Achievements />} />
                        <Route path="/profile" element={<Profile />} />
                        <Route path="/privacy" element={<PrivacyPolicy />} />
                        <Route path="/terms" element={<TermsOfUse />} />
                        <Route path="/popiact" element={<POPIAct />} />
                        <Route path="/dmca" element={<DMCA />} />
                        <Route path="/legal" element={<Legal />} />
                        <Route path="/ngano" element={<Stories />} />
                        <Route path="/daily-challenge" element={<DailyChallenge />} />
                        <Route path="/word-bomb" element={<WordBomb />} />

                        {/* Protected Admin Routes */}
                        <Route
                            path="/admin/dashboard"
                            element={
                                <AdminRoute>
                                    <AdminDashboard />
                                </AdminRoute>
                            }
                        />
                        <Route
                            path="/admin/picture-puzzles"
                            element={
                                <AdminRoute>
                                    <AdminPicturePuzzle />
                                </AdminRoute>
                            }
                        />
                        <Route
                            path="/admin/reset"
                            element={
                                <AdminRoute>
                                    <SystemReset />
                                </AdminRoute>
                            }
                        />

                        {/* Review Management */}
                        <Route
                            path="/admin/reviews"
                            element={
                                <AdminRoute>
                                    <AdminReviews />
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
                        <Route path="/admin/word-bomb" element={<AdminRoute><AdminWordBomb /></AdminRoute>} />
                        <Route path="/admin/languages" element={<AdminRoute><AdminLanguages /></AdminRoute>} />


                        {/* 404 Catch-All Route */}
                        <Route path="*" element={<NotFound />} />
                    </Routes>
                    <GuestNudge />
                </main>

                {!isAdminPath && !user && <Footer />}

                {/* Push Notification Prompt Overlay */}
                {showPushPrompt && (
                    <NotificationPrompt 
                        onClose={() => setShowPushPrompt(false)} 
                        onStatusChange={(granted) => {
                            if (granted) console.log("User granted notifications!");
                        }}
                    />
                )}

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
        <GoogleReCaptchaProvider reCaptchaKey="6LeF_aYsAAAAAExxoPu1pQ9OUYrLqZdfGcfKH4Fj">
            <NotificationProvider>
                <Router>
                    <AppContent />
                </Router>
            </NotificationProvider>
        </GoogleReCaptchaProvider>
    );
}

export default App;
