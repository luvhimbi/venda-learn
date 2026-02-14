import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
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
import AdminRoute from "./components/AdminRoute.tsx";
import AdminDashboard from "./Pages/AdminDashboard.tsx";
import EditLesson from "./Pages/EditLesson.tsx";
import AddLesson from "./Pages/AddLesson.tsx";
import AdminLessons from "./Pages/AdminLesson.tsx";
import AdminUsers from './Pages/AdminUsers.tsx';
import AdminAuditLog from "./Pages/AdminAuditLog.tsx";
import AdminDailyWords from "./Pages/AdminDailyWords";
import AdminHistory from "./Pages/AdminHistory";
import WordPuzzle from "./Pages/WordPuzzle";
import GamesDashboard from "./Pages/GamesDashboard";
import PicturePuzzle from "./Pages/PicturePuzzle";
import SyllableBuilder from "./Pages/SyllableBuilder";
import SentenceScramble from "./Pages/SentenceScramble";
import KnowledgeBattle from "./Pages/KnowledgeBattle";
import NotFound from "./Pages/NotFound";

/**
 * AppContent handles the conditional rendering of the UI.
 * It must be inside the <Router> to use useLocation().
 */
const AppContent: React.FC = () => {
    const location = useLocation();
    const isAdminPath = location.pathname.startsWith('/admin');

    return (
        <div className="min-vh-100 d-flex flex-column bg-light">
            {/* Hide student-specific navigation and banners
                when the user is in the admin dashboard area.
            */}
            {!isAdminPath && (
                <>
                    <Navbar />
                    <InstallBanner />
                </>
            )}

            <main className="flex-grow-1">
                <Routes>
                    {/* User & Public Routes */}
                    <Route path="/" element={<Home />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/reset-password" element={<ResetPassword />} />
                    <Route path="/muvhigo" element={<Muvhigo />} />
                    <Route path="/game/:lessonId" element={<GameRoom />} />
                    <Route path="/word-of-the-day" element={<DailyWordPage />} />
                    <Route path="/mitambo" element={<GamesDashboard />} />
                    <Route path="/word-puzzle" element={<WordPuzzle />} />
                    <Route path="/picture-puzzle" element={<PicturePuzzle />} />
                    <Route path="/syllable-builder" element={<SyllableBuilder />} />
                    <Route path="/game/scramble" element={<SentenceScramble />} />
                    <Route path="/battle" element={<KnowledgeBattle />} />
                    <Route path="/history" element={<HistoryList />} />
                    <Route path="/courses" element={<Courses />} />
                    <Route path="/history/add" element={<AddHistory />} />
                    <Route path="/history/:storyId" element={<HistoryDetail />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/privacy" element={<PrivacyPolicy />} />
                    <Route path="/terms" element={<TermsOfUse />} />
                    <Route path="/popiact" element={<POPIAct />} />
                    <Route path="/ngano" element={<Stories />} />

                    {/* Protected Admin Routes */}
                    /* ADMIN ROUTES */
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

                    {/* Future Admin routes can be added here, e.g. /admin/users */}

                    {/* 404 Catch-All Route */}
                    <Route path="*" element={<NotFound />} />
                </Routes>
            </main>

            {!isAdminPath && <Footer />}
        </div>
    );
}

function App() {
    return (
        <Router>
            <AppContent />
        </Router>
    );
}

export default App;