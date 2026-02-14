import React, { useState, useEffect } from 'react';
import { db } from '../services/firebaseConfig';
import { collection, addDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { fetchHistoryData, invalidateCache } from '../services/dataCache';
import AdminNavbar from '../components/AdminNavbar';
import Swal from 'sweetalert2';

const AddHistory: React.FC = () => {
    const navigate = useNavigate();
    const { storyId } = useParams(); // Used to check if we are editing
    const location = useLocation();
    const isAdmin = location.pathname.startsWith('/admin');
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(false);

    const [formData, setFormData] = useState({
        title: '',
        vendaTitle: '',
        category: 'History',
        era: '',
        readTime: '',
        thumbnailEmoji: '',
        imageUrl: '',
        content: '',
        order: 0
    });

    // Load data if in Edit Mode
    useEffect(() => {
        const fetchStory = async () => {
            if (!storyId) return;
            setFetching(true);
            try {
                const allHistory = await fetchHistoryData();
                const found = allHistory.find((s: any) => s.id === storyId);
                if (found) {
                    setFormData(found as any);
                } else {
                    Swal.fire('Error', 'Story not found', 'error');
                    navigate('/history');
                }
            } catch (error) {
                console.error("Error fetching story:", error);
            } finally {
                setFetching(false);
            }
        };
        fetchStory();
    }, [storyId, navigate]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'order' ? parseInt(value) || 0 : value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (storyId) {
                // UPDATE EXISTING
                await updateDoc(doc(db, "history", storyId), {
                    ...formData,
                    updatedAt: serverTimestamp()
                });
            } else {
                // CREATE NEW
                const ref = await addDoc(collection(db, "history"), {
                    ...formData,
                    createdAt: serverTimestamp()
                });

                // Log for admin
                if (isAdmin) {
                    await addDoc(collection(db, "logs"), {
                        action: "CREATE", details: `Created history story: ${formData.title}`,
                        adminEmail: "Admin", targetId: ref.id, timestamp: serverTimestamp()
                    });
                    invalidateCache('auditLogs');
                }

                Swal.fire('Success', 'Story added successfully!', 'success');
            }

            invalidateCache('history');
            navigate(isAdmin ? '/admin/history' : '/history');
        } catch (error) {
            console.error("Error saving story:", error);
            Swal.fire('Error', 'Failed to save story.', 'error');
        } finally {
            setLoading(false);
        }
    };

    if (fetching) return (
        <div className="min-vh-100 bg-white d-flex align-items-center justify-content-center">
            <div className="spinner-border text-warning"></div>
        </div>
    );

    return (
        <div className="min-vh-100 bg-light pb-5">
            {isAdmin && <AdminNavbar />}

            <div className={`container ${isAdmin ? 'py-5' : 'py-3'}`} style={{ maxWidth: '800px' }}>
                {!isAdmin && (
                    <button
                        className="btn btn-link text-decoration-none p-0 mb-4 d-flex align-items-center gap-2 text-dark fw-bold smallest ls-1 text-uppercase"
                        onClick={() => navigate('/history')}
                    >
                        <i className="bi bi-arrow-left"></i> Back to History
                    </button>
                )}

                <div className="bg-white p-4 p-md-5 rounded-4 shadow-sm border">
                    <div className="mb-4 text-center">
                        <span className="badge bg-warning text-dark mb-2 px-3 py-2 rounded-pill fw-bold" style={{ fontSize: 11, letterSpacing: 1 }}>
                            {storyId ? 'EDITING MODE' : 'CREATION MODE'}
                        </span>
                        <h2 className="fw-bold mb-1">{storyId ? 'Edit Story' : 'Add New Story'}</h2>
                        <p className="text-muted small">Share Venda heritage with the world.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="row g-4">
                        <div className="col-md-7">
                            <label className="smallest-print fw-bold uppercase ls-1 mb-2 d-block text-muted">Title (English)</label>
                            <input
                                type="text" name="title" required
                                className="form-control custom-input"
                                value={formData.title}
                                placeholder="e.g. Traditional Venda Attire"
                                onChange={handleChange}
                            />
                        </div>

                        <div className="col-md-5">
                            <label className="smallest-print fw-bold uppercase ls-1 mb-2 d-block text-muted">Category</label>
                            <select
                                name="category"
                                className="form-select custom-input"
                                onChange={handleChange}
                                value={formData.category}
                            >
                                <option value="History">History</option>
                                <option value="Food">Food (Zwiḽiwa)</option>
                                <option value="Dance">Dance (Mitshino)</option>
                                <option value="Attire">Attire (Zwiambaro)</option>
                            </select>
                        </div>

                        <div className="col-md-12">
                            <label className="smallest-print fw-bold uppercase ls-1 mb-2 d-block text-muted">Tshivenda Title</label>
                            <input
                                type="text" name="vendaTitle" required
                                className="form-control custom-input"
                                value={formData.vendaTitle}
                                placeholder="e.g. Zwiambaro zwa mvelele ya Vhavenda"
                                onChange={handleChange}
                            />
                        </div>

                        <div className="col-md-9">
                            <label className="smallest-print fw-bold uppercase ls-1 mb-2 d-block text-muted">Image URL (Google/Bucket)</label>
                            <input
                                type="url" name="imageUrl"
                                className="form-control custom-input"
                                value={formData.imageUrl}
                                placeholder="Paste direct image link here..."
                                onChange={handleChange}
                            />
                        </div>

                        <div className="col-md-3">
                            <label className="smallest-print fw-bold uppercase ls-1 mb-2 d-block text-muted">Emoji Fallback</label>
                            <input
                                type="text" name="thumbnailEmoji" required
                                className="form-control custom-input text-center"
                                value={formData.thumbnailEmoji}
                                placeholder="👗"
                                onChange={handleChange}
                            />
                        </div>

                        <div className="col-md-4">
                            <label className="smallest-print fw-bold uppercase ls-1 mb-2 d-block text-muted">Era / Time</label>
                            <input
                                type="text" name="era" required
                                className="form-control custom-input"
                                value={formData.era}
                                placeholder="e.g. Ancient / Modern"
                                onChange={handleChange}
                            />
                        </div>

                        <div className="col-md-4">
                            <label className="smallest-print fw-bold uppercase ls-1 mb-2 d-block text-muted">Read Time</label>
                            <input
                                type="text" name="readTime" required
                                className="form-control custom-input"
                                value={formData.readTime}
                                placeholder="e.g. 4 MIN"
                                onChange={handleChange}
                            />
                        </div>

                        <div className="col-md-4">
                            <label className="smallest-print fw-bold uppercase ls-1 mb-2 d-block text-muted">Order</label>
                            <input
                                type="number" name="order" required
                                className="form-control custom-input"
                                value={formData.order}
                                placeholder="0"
                                onChange={handleChange}
                            />
                        </div>

                        <div className="col-md-12">
                            <label className="smallest-print fw-bold uppercase ls-1 mb-2 d-block text-muted">Content Details</label>
                            <textarea
                                name="content" required rows={8}
                                className="form-control custom-input"
                                value={formData.content}
                                placeholder="Describe the cultural significance..."
                                onChange={handleChange}
                            ></textarea>
                        </div>

                        <div className="d-flex justify-content-end gap-3 pt-3 border-top mt-4">
                            <button
                                type="button"
                                className="btn btn-light fw-bold smallest ls-1 px-4 py-2"
                                onClick={() => navigate(isAdmin ? '/admin/history' : '/history')}
                            >
                                CANCEL
                            </button>
                            <button
                                type="submit"
                                className="btn game-btn-primary fw-bold smallest ls-1 px-5 py-2"
                                disabled={loading}
                            >
                                {loading ? 'SAVING...' : (storyId ? 'UPDATE STORY' : 'PUBLISH STORY')}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            <style>{`
                .ls-tight { letter-spacing: -1.5px; }
                .ls-1 { letter-spacing: 1px; }
                .ls-2 { letter-spacing: 2px; }
                .smallest-print { font-size: 10px; font-family: 'Poppins', sans-serif; }
                .uppercase { text-transform: uppercase; }

                .custom-input {
                    border: 2px solid #f3f4f6;
                    border-radius: 12px;
                    padding: 12px 15px;
                    font-size: 14px;
                    font-family: 'Poppins', sans-serif;
                    transition: all 0.2s;
                }

                .custom-input:focus {
                    border-color: #FACC15;
                    box-shadow: none;
                    background-color: #fffbeb;
                }

                .btn-game-primary { 
                    background-color: #FACC15 !important; 
                    color: #111827 !important; 
                    font-family: 'Poppins', sans-serif;
                    font-weight: 800;
                    border: none !important;
                    border-radius: 12px;
                    box-shadow: 0 4px 0 #EAB308 !important;
                    letter-spacing: 1px;
                    text-transform: uppercase;
                    padding: 12px 30px;
                }
                
                .btn-game-primary:active {
                    transform: translateY(2px);
                    box-shadow: 0 2px 0 #EAB308 !important;
                }

                .swal2-venda-style {
                    font-family: 'Poppins', sans-serif !important;
                    border-radius: 20px !important;
                    border: 3px solid #111827 !important;
                }
            `}</style>
        </div>
    );
};

export default AddHistory;