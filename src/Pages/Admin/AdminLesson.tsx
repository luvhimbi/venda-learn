import React, { useState, useEffect } from 'react';
import { db } from '../../services/firebaseConfig';
import { collection, doc, deleteDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import AdminNavbar from '../../components/AdminNavbar';
import { fetchLessons as fetchLessonsFromCache, invalidateCache, getMicroLessons } from '../../services/dataCache';
import { seedLessons } from '../../services/seedDatabase';
import Swal from 'sweetalert2';
import { Trash2, Edit, Plus, RefreshCw, Loader2 } from 'lucide-react';

const AdminLessons: React.FC = () => {
    const [lessons, setLessons] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const lessonsPerPage = 4;

    const loadLessons = async () => {
        setLoading(true);
        try {
            const list = await fetchLessonsFromCache();
            setLessons(list);
        } catch (error) {
            console.error("Error fetching:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadLessons();
    }, []);

    // Pagination Logic
    const indexOfLastLesson = currentPage * lessonsPerPage;
    const indexOfFirstLesson = indexOfLastLesson - lessonsPerPage;
    const currentLessons = lessons.slice(indexOfFirstLesson, indexOfLastLesson);
    const totalPages = Math.ceil(lessons.length / lessonsPerPage);

    // Helper function to record audit logs
    const createAuditLog = async (action: string, details: string, targetId: string) => {
        try {
            await addDoc(collection(db, "logs"), {
                action,
                details,
                targetId,
                adminEmail: "Admin",
                timestamp: serverTimestamp()
            });
        } catch (e) {
            console.error("Audit log failed:", e);
        }
    };

    const handleDelete = async (id: string) => {
        const result = await Swal.fire({
            title: 'Are you sure?',
            text: "This course will be permanently removed!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#DC2626',
            cancelButtonColor: '#6B7280',
            confirmButtonText: 'Yes, Delete',
        });

        if (result.isConfirmed) {
            try {
                await deleteDoc(doc(db, "lessons", id));
                await createAuditLog("DELETE", `Permanently removed course: ${id}`, id);
                Swal.fire('Deleted!', 'Course removed.', 'success');
                if (currentLessons.length === 1 && currentPage > 1) setCurrentPage(currentPage - 1);
                invalidateCache('lessons');
                invalidateCache('auditLogs');
                loadLessons();
            } catch (error) {
                Swal.fire('Error', 'Failed to delete.', 'error');
            }
        }
    };

    const handleSeedDatabase = async () => {
        const result = await Swal.fire({
            title: 'Sync Content?',
            text: "Update all courses with micro lesson data?",
            icon: 'info',
            showCancelButton: true,
            confirmButtonColor: '#FACC15',
            confirmButtonText: 'Yes, Sync',
        });

        if (result.isConfirmed) {
            try {
                await seedLessons();
                await createAuditLog("SYNC", "Synchronized database with micro lessons data", "Bulk-Sync");
                invalidateCache('lessons');
                invalidateCache('auditLogs');
                loadLessons();
            } catch (error) {
                Swal.fire('Error', 'Failed to sync.', 'error');
            }
        }
    };

    return (
        <div className="min-vh-100 pb-5 bg-light">
            <AdminNavbar />

            <div className="py-5 bg-white border-bottom shadow-sm">
                <div className="container" style={{ maxWidth: '1100px' }}>
                    <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-end px-3">
                        <div>
                            <span className="shumela-venda-pulse fw-bold ls-2 text-uppercase smallest d-block mb-2 text-warning">
                                Admin Control
                            </span>
                            <h1 className="fw-bold ls-tight mb-0 text-dark" style={{ fontSize: '2.5rem' }}>
                                Manage <span style={{ color: '#FACC15' }}>Courses</span>
                            </h1>
                        </div>
                        <div className="mt-4 mt-md-0 d-flex gap-3">
                            <button
                                onClick={handleSeedDatabase}
                                className="btn btn-outline-dark fw-bold smallest ls-1 px-4 py-2 shadow-none border-2 d-flex align-items-center gap-2"
                            >
                                <RefreshCw size={14} /> SYNC DATA
                            </button>
                            <Link
                                to="/admin/add-lesson"
                                className="btn game-btn-yellow fw-bold smallest ls-1 px-4 py-2 shadow-none d-flex align-items-center gap-2"
                            >
                                <Plus size={14} /> ADD COURSE
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container py-5" style={{ maxWidth: '1100px' }}>
                {loading ? (
                    <div className="text-center py-5">
                        <Loader2 className="animate-spin text-warning mx-auto mb-3" size={48} />
                        <p className="ls-1 smallest fw-bold text-muted">FETCHING DATABASE...</p>
                    </div>
                ) : (
                    <>
                        <div className="row g-4 px-2">
                            {currentLessons.map((lesson) => (
                                <div key={lesson.id} className="col-12">
                                    <div className="admin-lesson-card-light p-4 rounded-4 bg-white border shadow-sm position-relative overflow-hidden">
                                        <div className="row align-items-center">
                                            <div className="col-md-8">
                                                <div className="d-flex align-items-center gap-3 mb-2">
                                                    <span className="badge rounded-pill bg-light border text-dark smallest ls-1 fw-bold text-uppercase px-3">
                                                        {lesson.difficulty}
                                                    </span>
                                                    <span className="text-muted smallest fw-bold ls-1">ID: {lesson.id}</span>
                                                </div>
                                                <h3 className="fw-bold mb-1 ls-1 text-dark">
                                                    {lesson.title} <span className="text-muted">/ {lesson.vendaTitle}</span>
                                                </h3>
                                                <p className="text-secondary mb-0 smallest fw-bold ls-1 text-uppercase">
                                                    {getMicroLessons(lesson).length} Micro Lessons • {getMicroLessons(lesson).reduce((acc: number, ml: any) => acc + (ml.slides?.length || 0), 0)} Slides • {getMicroLessons(lesson).reduce((acc: number, ml: any) => acc + (ml.questions?.length || 0), 0)} Questions
                                                </p>
                                            </div>
                                            <div className="col-md-4 text-md-end mt-3 mt-md-0 d-flex gap-2 justify-content-md-end">
                                                <Link
                                                    to={`/admin/edit-lesson/${lesson.id}`}
                                                    className="btn btn-outline-secondary fw-bold smallest ls-1 px-4 d-flex align-items-center gap-2"
                                                >
                                                    <Edit size={14} /> EDIT
                                                </Link>
                                                <button
                                                    onClick={() => handleDelete(lesson.id)}
                                                    className="btn btn-outline-danger fw-bold smallest ls-1 px-3 d-flex align-items-center justify-content-center"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px', backgroundColor: '#FACC15' }}></div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {totalPages > 1 && (
                            <div className="d-flex justify-content-center mt-5 gap-2">
                                <button
                                    className="btn btn-white border shadow-sm btn-sm px-3 fw-bold ls-1 smallest"
                                    disabled={currentPage === 1}
                                    onClick={() => setCurrentPage(currentPage - 1)}
                                >
                                    PREV
                                </button>
                                {[...Array(totalPages)].map((_, i) => (
                                    <button
                                        key={i}
                                        className={`btn btn-sm px-3 fw-bold smallest ${currentPage === i + 1 ? 'btn-warning text-dark' : 'btn-white border'}`}
                                        onClick={() => setCurrentPage(i + 1)}
                                    >
                                        {i + 1}
                                    </button>
                                ))}
                                <button
                                    className="btn btn-white border shadow-sm btn-sm px-3 fw-bold ls-1 smallest"
                                    disabled={currentPage === totalPages}
                                    onClick={() => setCurrentPage(currentPage + 1)}
                                >
                                    NEXT
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>

            <style>{`
                .ls-tight { letter-spacing: -1px; }
                .ls-1 { letter-spacing: 1px; }
                .ls-2 { letter-spacing: 2px; }
                .smallest { font-size: 11px; }
                .admin-lesson-card-light { transition: all 0.2s ease; }
                .admin-lesson-card-light:hover { transform: translateX(5px); border-color: #FACC15 !important; }
                .game-btn-yellow { 
                    background-color: #FACC15 !important; 
                    color: #000 !important; 
                    border: none !important; 
                    border-radius: 8px; 
                    box-shadow: 0 4px 0 #A1810B !important; 
                }
                .game-btn-yellow:active { transform: translateY(2px); box-shadow: 0 2px 0 #A1810B !important; }
                .shumela-venda-pulse { animation: pulseAdmin 3s infinite ease-in-out; }
                @keyframes pulseAdmin { 0% { opacity: 0.7; } 50% { opacity: 1; } 100% { opacity: 0.7; } }
            `}</style>
        </div>
    );
};

export default AdminLessons;


