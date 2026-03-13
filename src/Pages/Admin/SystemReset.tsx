import React, { useState } from 'react';
import { db } from '../../services/firebaseConfig';
import { collection, getDocs, writeBatch, doc } from 'firebase/firestore';
import AdminNavbar from '../../components/AdminNavbar';
import { invalidateCache } from '../../services/dataCache';
import Swal from 'sweetalert2';
import { Trash2, RotateCcw, ShieldAlert, Loader2, Home } from 'lucide-react';
import { Link } from 'react-router-dom';

const SystemReset: React.FC = () => {
    const [isDeletingLessons, setIsDeletingLessons] = useState(false);
    const [isResettingUsers, setIsResettingUsers] = useState(false);

    const handleDeleteAllLessons = async () => {
        const { value: confirmReset } = await Swal.fire({
            title: 'DELETE ALL COURSES?',
            text: "This will permanently remove every lesson and course from the database. Type 'DELETE' to confirm.",
            input: 'text',
            inputPlaceholder: 'DELETE',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#DC2626',
            cancelButtonColor: '#6B7280',
            confirmButtonText: 'Yes, Delete Everything',
            inputValidator: (value) => {
                if (value !== 'DELETE') {
                    return 'You must type DELETE to confirm!';
                }
            }
        });

        if (confirmReset === 'DELETE') {
            setIsDeletingLessons(true);
            try {
                const querySnapshot = await getDocs(collection(db, "lessons"));
                const batch = writeBatch(db);

                querySnapshot.forEach((document) => {
                    batch.delete(doc(db, "lessons", document.id));
                });

                await batch.commit();
                invalidateCache('lessons');

                await Swal.fire({
                    title: 'Wipe Complete',
                    text: 'All courses have been removed. You can now start fresh.',
                    icon: 'success',
                    confirmButtonColor: '#FACC15'
                });
            } catch (error) {
                console.error("Delete Error:", error);
                Swal.fire('Error', 'Failed to delete lessons.', 'error');
            } finally {
                setIsDeletingLessons(false);
            }
        }
    };

    const handleResetUserProgress = async () => {
        const { value: confirmReset } = await Swal.fire({
            title: 'RESET ALL USERS?',
            text: "This will set points to 0, level to 1, and clear all streaks and completed lessons for EVERY user. Type 'RESET' to confirm.",
            input: 'text',
            inputPlaceholder: 'RESET',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#DC2626',
            cancelButtonColor: '#6B7280',
            confirmButtonText: 'Yes, Reset Progress',
            inputValidator: (value) => {
                if (value !== 'RESET') {
                    return 'You must type RESET to confirm!';
                }
            }
        });

        if (confirmReset === 'RESET') {
            setIsResettingUsers(true);
            try {
                const querySnapshot = await getDocs(collection(db, "users"));
                const batch = writeBatch(db);

                querySnapshot.forEach((document) => {
                    batch.update(doc(db, "users", document.id), {
                        points: 0,
                        level: 1,
                        streak: 0,
                        completedLessons: [],
                        completedCourses: []
                    });
                });

                await batch.commit();
                invalidateCache(); // Clear everything

                await Swal.fire({
                    title: 'Reset Complete',
                    text: 'All student progress has been reset to zero.',
                    icon: 'success',
                    confirmButtonColor: '#FACC15'
                });
            } catch (error) {
                console.error("Reset Error:", error);
                Swal.fire('Error', 'Failed to reset users.', 'error');
            } finally {
                setIsResettingUsers(false);
            }
        }
    };

    return (
        <div className="min-vh-100 pb-5 bg-light">
            <AdminNavbar />

            <div className="py-5 bg-dark text-white border-bottom shadow-sm">
                <div className="container" style={{ maxWidth: '800px' }}>
                    <div className="px-3">
                        <span className="fw-bold ls-2 text-uppercase smallest d-block mb-2 text-warning">Advanced Maintenance</span>
                        <h1 className="fw-bold ls-tight mb-0" style={{ fontSize: '2.5rem' }}>
                            System <span style={{ color: '#FACC15' }}>Reset</span>
                        </h1>
                        <p className="text-white-50 mt-2 mb-0">Wipe content and student progress to start a new academic cycle.</p>
                    </div>
                </div>
            </div>

            <div className="container py-5" style={{ maxWidth: '800px' }}>
                <div className="row g-4">
                    <div className="col-12">
                        <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
                            <div className="card-body p-4 p-md-5">
                                <div className="d-flex align-items-center gap-3 mb-4">
                                    <div className="icon-box bg-danger bg-opacity-10 p-3 rounded-4">
                                        <ShieldAlert className="text-danger" size={32} />
                                    </div>
                                    <div>
                                        <h4 className="fw-bold mb-1">Danger Zone</h4>
                                        <p className="text-muted small mb-0">These actions are destructive and cannot be undone.</p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    {/* Delete Lessons */}
                                    <div className="p-4 rounded-4 border border-2 border-danger border-opacity-10 bg-white mb-4">
                                        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
                                            <div>
                                                <h6 className="fw-bold mb-1">Clear All Courses</h6>
                                                <p className="smallest text-muted mb-0 ls-1 text-uppercase fw-bold">WIPE LESSONS & CONTENT</p>
                                            </div>
                                            <button
                                                onClick={handleDeleteAllLessons}
                                                disabled={isDeletingLessons}
                                                className="btn btn-danger fw-bold px-4 py-2 rounded-3 d-flex align-items-center gap-2"
                                            >
                                                {isDeletingLessons ? <Loader2 className="animate-spin" size={18} /> : <Trash2 size={18} />}
                                                DELETE ALL COURSES
                                            </button>
                                        </div>
                                    </div>

                                    {/* Reset Users */}
                                    <div className="p-4 rounded-4 border border-2 border-warning border-opacity-20 bg-white">
                                        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
                                            <div>
                                                <h6 className="fw-bold mb-1">Reset All Student Scores</h6>
                                                <p className="smallest text-muted mb-0 ls-1 text-uppercase fw-bold">WIPE POINTS & PROGRESS</p>
                                            </div>
                                            <button
                                                onClick={handleResetUserProgress}
                                                disabled={isResettingUsers}
                                                className="btn btn-warning text-dark fw-bold px-4 py-2 rounded-3 d-flex align-items-center gap-2"
                                            >
                                                {isResettingUsers ? <Loader2 className="animate-spin" size={18} /> : <RotateCcw size={18} />}
                                                RESET EVERYBODY'S SCORES
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-5 pt-4 border-top">
                                    <Link to="/admin/dashboard" className="btn btn-light border fw-bold smallest ls-1 px-4 py-2 rounded-pill d-inline-flex align-items-center gap-2">
                                        <Home size={16} /> RETURN TO DASHBOARD
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                .ls-tight { letter-spacing: -1.5px; }
                .ls-2 { letter-spacing: 2px; }
                .smallest { font-size: 11px; }
            `}</style>
        </div>
    );
};

export default SystemReset;
