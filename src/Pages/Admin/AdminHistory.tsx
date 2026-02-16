import React, { useEffect, useState } from 'react';
import { db } from '../../services/firebaseConfig';
import { collection, deleteDoc, doc, addDoc, serverTimestamp } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import AdminNavbar from '../../components/AdminNavbar';
import { fetchHistoryData, invalidateCache } from '../../services/dataCache';
import Swal from 'sweetalert2';
import { Plus, Trash2, Edit, BookOpen, Loader2 } from 'lucide-react';

interface HistoryStory {
    id: string;
    title: string;
    vendaTitle: string;
    category: string;
    order: number;
}

const AdminHistory: React.FC = () => {
    const [stories, setStories] = useState<HistoryStory[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const loadStories = async () => {
        setLoading(true);
        try {
            const data = await fetchHistoryData();
            setStories(data);
        } catch (error) {
            console.error("Error loading stories:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadStories(); }, []);

    const handleDelete = async (story: HistoryStory) => {
        const result = await Swal.fire({
            title: 'Delete Story?',
            text: `Remove "${story.title}"?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#DC2626',
            cancelButtonColor: '#6B7280',
            confirmButtonText: 'Yes, Delete',
        });

        if (result.isConfirmed) {
            try {
                await deleteDoc(doc(db, "history", story.id));
                await addDoc(collection(db, "logs"), {
                    action: "DELETE", details: `Deleted history story: ${story.title}`,
                    adminEmail: "Admin", targetId: story.id, timestamp: serverTimestamp()
                });
                invalidateCache('history');
                invalidateCache('auditLogs');
                Swal.fire('Deleted!', 'Story removed.', 'success');
                loadStories();
            } catch (error) {
                console.error("Delete error:", error);
                Swal.fire('Error', 'Failed to delete story.', 'error');
            }
        }
    };

    return (
        <div className="min-vh-100 pb-5 bg-light">
            <AdminNavbar />

            {/* HEADER */}
            <div className="py-5 bg-white border-bottom shadow-sm">
                <div className="container" style={{ maxWidth: '1100px' }}>
                    <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-end px-3">
                        <div>
                            <span className="shumela-venda-pulse fw-bold ls-2 text-uppercase smallest d-block mb-2 text-warning">
                                Content Management
                            </span>
                            <h1 className="fw-bold ls-tight mb-0 text-dark" style={{ fontSize: '2.5rem' }}>
                                History <span style={{ color: '#FACC15' }}>Stories</span>
                            </h1>
                        </div>
                        <div className="mt-4 mt-md-0">
                            <button onClick={() => navigate('/admin/history/add')}
                                className="btn btn-dark fw-bold smallest ls-1 px-4 py-2 rounded-pill shadow-sm d-flex align-items-center gap-2">
                                <Plus size={14} /> ADD NEW STORY
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container py-5" style={{ maxWidth: '1100px' }}>
                {loading ? (
                    <div className="text-center py-5">
                        <Loader2 className="animate-spin text-warning mx-auto mb-3" size={48} />
                        <p className="mt-3 ls-1 smallest fw-bold text-muted">LOADING STORIES...</p>
                    </div>
                ) : stories.length === 0 ? (
                    <div className="text-center py-5 bg-white rounded-4 border">
                        <BookOpen className="text-muted mx-auto mb-3" size={48} />
                        <p className="mt-3 fw-bold text-muted">No stories found.</p>
                    </div>
                ) : (
                    <div className="row g-3 px-2">
                        {stories.map((s) => (
                            <div key={s.id} className="col-12">
                                <div className="bg-white border rounded-4 shadow-sm p-4 d-flex flex-column flex-md-row justify-content-between align-items-center gap-3 ah-card">
                                    <div className="d-flex align-items-center gap-3">
                                        <div className="d-flex align-items-center justify-content-center rounded-3 bg-light text-secondary fw-bold"
                                            style={{ width: 40, height: 40 }}>
                                            {s.order || '#'}
                                        </div>
                                        <div>
                                            <h5 className="fw-bold mb-0 text-dark">{s.title}</h5>
                                            <p className="mb-0 text-muted small">{s.vendaTitle} • <span className="text-warning">{s.category}</span></p>
                                        </div>
                                    </div>
                                    <div className="d-flex gap-2">
                                        <button onClick={() => navigate(`/admin/history/edit/${s.id}`)}
                                            className="btn btn-sm btn-outline-dark rounded-pill px-4 fw-bold d-flex align-items-center gap-2" style={{ fontSize: 11 }}>
                                            <Edit size={12} /> EDIT
                                        </button>
                                        <button onClick={() => handleDelete(s)}
                                            className="btn btn-sm btn-outline-danger rounded-pill px-3" style={{ fontSize: 11 }}>
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <style>{`
                .ls-tight { letter-spacing: -1.5px; }
                .ls-1 { letter-spacing: 1px; }
                .ls-2 { letter-spacing: 2px; }
                .smallest { font-size: 11px; }
                .shumela-venda-pulse { animation: pulseAdmin 3s infinite ease-in-out; }
                .ah-card { transition: all 0.2s; }
                .ah-card:hover { border-color: #FACC15 !important; transform: translateY(-2px); }
            `}</style>
        </div>
    );
};

export default AdminHistory;



