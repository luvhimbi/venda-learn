import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { GoogleReCaptchaProvider } from 'react-google-recaptcha-v3';
import Sidebar from "../components/shared/Sidebar/Sidebar";
import AuthNavbar from "../components/shared/navigation/AuthNavbar";
import Footer from "../components/shared/Footer/Footer";
import GuestNudge from "../features/auth/components/GuestNudge";
import Login from "../Pages/Auth/Login";
import Register from "../Pages/Auth/Register";
import ResetPassword from "../Pages/Auth/ResetPassword";
import Onboarding from "../Pages/Auth/Onboarding";
import Home from "../Pages/Home";
import Profile from "../Pages/Auth/Profile";
import Settings from "../Pages/Auth/Settings";
import Muvhigo from "../Pages/Admin/Muvhigo";
import GameRoom from "../Pages/Games/GameRoom";

import PrivacyPolicy from "../Pages/Policy/PrivacyPolicy";
import TermsOfUse from "../Pages/Policy/TermsOfUse";
import POPIAct from "../Pages/Policy/POPIAct";
import DMCA from "../Pages/Policy/DMCA";
import Legal from "../Pages/Policy/Legal";
import OfflineBanner from "../components/feedback/banners/OfflineBanner";
import InstallBanner from "../components/feedback/banners/InstallBanner";
import AdminRoute from "../components/shared/AdminRoute/AdminRoute";
import AdminDashboard from "../Pages/Admin/AdminDashboard";
import EditLesson from "../Pages/Admin/EditLesson";
import AddLesson from "../Pages/Admin/AddLesson";
import AdminLessons from "../Pages/Admin/AdminLesson";
import AdminUsers from '../Pages/Admin/AdminUsers';
import AdminAuditLog from "../Pages/Admin/AdminAuditLog";
import SystemReset from "../Pages/Admin/SystemReset";
import AdminLanguages from "../Pages/Admin/AdminLanguages";
import AdminReviews from "../Pages/Admin/AdminReviews";
import Achievements from "../Pages/Achievements";
import NotFound from "../Pages/NotFound";
import AboutUs from "../Pages/AboutUs";
import WordCards from "../Pages/Learning/WordCards";
import StreakDetails from "../Pages/Auth/StreakDetails";
import { auth, messaging } from '../services/firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import { onMessage } from 'firebase/messaging';
import { NotificationProvider } from './providers/contexts/NotificationContext';
import Swal from 'sweetalert2';
import NotificationPrompt from '../features/notifications/components/NotificationPrompt';

/**
 * AppContent handles the conditional rendering of the UI.
 * It must be inside the <Router> to use useLocation().
 */
const AppContent: React.FC = () => {
    const location = useLocation();
    const isAdminPath = location.pathname.startsWith('/admin');
    const isAuthPath = ['/login', '/register', '/reset-password', '/onboarding'].includes(location.pathname);
    const gamePaths = ['/game/'];
    const isGameRoomPath = gamePaths.some(path => location.pathname.startsWith(path));
    const isStandalonePath = isAuthPath || isGameRoomPath;
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
        <div className={`min-vh-100 d-flex ${user && !isAdminPath && !isStandalonePath ? 'flex-column flex-lg-row' : 'flex-column'} bg-theme-base`}>

            {/* Show Sidebar only for authenticated users on internal pages */}
            {user && !isAdminPath && !isStandalonePath && <Sidebar />}

            <div className={`flex-grow-1 d-flex flex-column ${user && !isAdminPath && !isStandalonePath ? 'main-container' : ''}`}>

                {/* Show minimalist AuthNavbar for public users */}
                {!isAdminPath && !user && !isAuthPath && !isGameRoomPath && <AuthNavbar user={user} />}

                <OfflineBanner />
                {!isGameRoomPath && <InstallBanner />}

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
                        <Route path="/courses" element={<Home />} />
                        <Route path="/profile" element={<Profile />} />
                        <Route path="/settings" element={<Settings />} />
                        <Route path="/privacy" element={<PrivacyPolicy />} />
                        <Route path="/terms" element={<TermsOfUse />} />
                        <Route path="/popiact" element={<POPIAct />} />
                        <Route path="/dmca" element={<DMCA />} />
                        <Route path="/legal" element={<Legal />} />
                        <Route path="/legal" element={<Legal />} />
                        <Route path="/achievements" element={<Achievements />} />
                        <Route path="/about" element={<AboutUs />} />
                        <Route path="/word-cards" element={<WordCards />} />
                        <Route path="/streak" element={<StreakDetails />} />

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
                        <Route path="/admin/users"
                            element={
                                <AdminRoute>
                                    <AdminUsers />
                                </AdminRoute>
                            }
                        />
                        <Route path="/admin/logs" element={<AdminAuditLog />} />

                        {/* History Management */}
                        <Route path="/admin/languages" element={<AdminRoute><AdminLanguages /></AdminRoute>} />


                        {/* 404 Catch-All Route */}
                        <Route path="*" element={<NotFound />} />
                    </Routes>
                    {!isGameRoomPath && <GuestNudge />}
                </main>

                {!isAdminPath && !user && !isAuthPath && !isGameRoomPath && <Footer />}

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






