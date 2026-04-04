import React, { useState, useEffect } from 'react';
import { db } from '../../services/firebaseConfig';
import { collection, addDoc, getDocs, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import AdminNavbar from '../../components/AdminNavbar';
import { popupService } from '../../services/popupService';
import { invalidateCache } from '../../services/dataCache';
import { Loader2, Plus, Trash2, Image as ImageIcon, ExternalLink } from 'lucide-react';

interface PicturePuzzlePart {
    id: string;
    imageUrl: string;
    venda: string;
    english: string;
}

const AdminPicturePuzzle: React.FC = () => {
    const [puzzles, setPuzzles] = useState<PicturePuzzlePart[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Form State
    const [newPuzzle, setNewPuzzle] = useState({
        imageUrl: '',
        venda: '',
        english: ''
    });

    const fetchPuzzles = async () => {
        setLoading(true);
        try {
            const snap = await getDocs(collection(db, "picturePuzzles"));
            const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as PicturePuzzlePart));
            setPuzzles(list);
        } catch (error) {
            console.error("Fetch Error:", error);
            popupService.error("Error", "Failed to load picture puzzles.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPuzzles();
    }, []);

    const handleAddPuzzle = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newPuzzle.imageUrl || !newPuzzle.venda || !newPuzzle.english) {
            popupService.error("Missing Fields", "Please fill in all fields.");
            return;
        }

        setSubmitting(true);
        try {
            await addDoc(collection(db, "picturePuzzles"), {
                ...newPuzzle,
                createdAt: serverTimestamp()
            });
            popupService.innerSuccess("Added!", "Picture puzzle part added successfully.");
            invalidateCache('picturePuzzles');
            setNewPuzzle({ imageUrl: '', venda: '', english: '' });
            fetchPuzzles();
        } catch (error) {
            console.error("Add Error:", error);
            popupService.error("Error", "Failed to add puzzle part.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        const confirm = await popupService.confirm("Are you sure?", "This will permanently remove this puzzle part.");
        if (confirm.isConfirmed) {
            try {
                await deleteDoc(doc(db, "picturePuzzles", id));
                invalidateCache('picturePuzzles');
                popupService.innerSuccess("Deleted", "Puzzle part removed.");
                fetchPuzzles();
            } catch (error) {
                popupService.error("Error", "Failed to delete.");
            }
        }
    };

    return (
        <div className="min-vh-100 pb-5 bg-light">
            <AdminNavbar />

            <div className="py-5 bg-white border-bottom shadow-sm">
                <div className="container" style={{ maxWidth: '1000px' }}>
                    <span className="fw-bold ls-2 text-uppercase smallest d-block mb-2 text-warning">Game Content</span>
                    <h1 className="fw-bold ls-tight mb-0 text-dark" style={{ fontSize: '2.5rem' }}>
                        Picture <span style={{ color: '#FACC15' }}>Puzzles</span>
                    </h1>
                </div>
            </div>

            <div className="container py-5" style={{ maxWidth: '1000px' }}>
                <div className="row g-4">
                    {/* ADD FORM */}
                    <div className="col-lg-4">
                        <div className="card border-0 shadow-sm rounded-4 p-4 sticky-top" style={{ top: '100px' }}>
                            <h5 className="fw-bold mb-4 d-flex align-items-center gap-2">
                                <Plus size={20} className="text-warning" /> New Part
                            </h5>
                            <form onSubmit={handleAddPuzzle}>
                                <div className="mb-3">
                                    <label className="smallest fw-bold ls-1 text-uppercase text-muted mb-2">Image URL</label>
                                    <input 
                                        type="url" 
                                        className="form-control rounded-3 border-2 shadow-none"
                                        placeholder="https://example.com/image.jpg"
                                        value={newPuzzle.imageUrl}
                                        onChange={e => setNewPuzzle({...newPuzzle, imageUrl: e.target.value})}
                                    />
                                </div>
                                <div className="mb-3">
                                    <label className="smallest fw-bold ls-1 text-uppercase text-muted mb-2">Venda Word</label>
                                    <input 
                                        type="text" 
                                        className="form-control rounded-3 border-2 shadow-none"
                                        placeholder="e.g. Mmbwa"
                                        value={newPuzzle.venda}
                                        onChange={e => setNewPuzzle({...newPuzzle, venda: e.target.value})}
                                    />
                                </div>
                                <div className="mb-4">
                                    <label className="smallest fw-bold ls-1 text-uppercase text-muted mb-2">English Translation</label>
                                    <input 
                                        type="text" 
                                        className="form-control rounded-3 border-2 shadow-none"
                                        placeholder="e.g. Dog"
                                        value={newPuzzle.english}
                                        onChange={e => setNewPuzzle({...newPuzzle, english: e.target.value})}
                                    />
                                </div>
                                <button 
                                    type="submit" 
                                    disabled={submitting}
                                    className="btn btn-warning w-100 fw-bold py-2 rounded-3 d-flex align-items-center justify-content-center gap-2"
                                >
                                    {submitting ? <Loader2 className="animate-spin" size={18} /> : 'ADD PUZZLE PART'}
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* LIST */}
                    <div className="col-lg-8">
                        {loading ? (
                            <div className="text-center py-5">
                                <Loader2 className="animate-spin text-warning mx-auto mb-3" size={48} />
                                <p className="ls-1 smallest fw-bold text-muted">LOADING PARTS...</p>
                            </div>
                        ) : puzzles.length === 0 ? (
                            <div className="card border-0 shadow-sm rounded-4 p-5 text-center bg-white">
                                <ImageIcon size={48} className="text-muted mx-auto mb-3 opacity-25" />
                                <h5 className="fw-bold text-muted">No picture puzzles found</h5>
                                <p className="smallest text-secondary ls-1">Add your first puzzle part using the form.</p>
                            </div>
                        ) : (
                            <div className="row g-3">
                                {puzzles.map(pz => (
                                    <div key={pz.id} className="col-md-6">
                                        <div className="card border-0 shadow-sm rounded-4 overflow-hidden h-100 bg-white pzl-manage-card">
                                            <div style={{ height: '140px', position: 'relative' }}>
                                                <img 
                                                    src={pz.imageUrl} 
                                                    alt={pz.english} 
                                                    className="w-100 h-100 object-fit-cover"
                                                    onError={(e) => {
                                                        (e.target as HTMLImageElement).src = 'https://placehold.co/400x300?text=Invalid+Image';
                                                    }}
                                                />
                                                <div className="position-absolute bottom-0 start-0 w-100 p-2 bg-gradient-dark text-white">
                                                    <a href={pz.imageUrl} target="_blank" rel="noreferrer" className="text-white smallest">
                                                        <ExternalLink size={12} className="me-1" /> View Source
                                                    </a>
                                                </div>
                                            </div>
                                            <div className="p-3">
                                                <div className="d-flex justify-content-between align-items-start mb-2">
                                                    <div>
                                                        <h6 className="fw-bold mb-0 text-dark">{pz.venda}</h6>
                                                        <span className="smallest text-muted text-uppercase ls-1">{pz.english}</span>
                                                    </div>
                                                    <button 
                                                        onClick={() => handleDelete(pz.id)}
                                                        className="btn btn-outline-danger btn-sm rounded-circle p-2 border-0"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <style>{`
                .ls-tight { letter-spacing: -1.5px; }
                .ls-1 { letter-spacing: 1px; }
                .ls-2 { letter-spacing: 2px; }
                .smallest { font-size: 11px; }
                .bg-gradient-dark { background: linear-gradient(0deg, rgba(0,0,0,0.6) 0%, transparent 100%); }
                .pzl-manage-card { transition: all 0.2s; }
                .pzl-manage-card:hover { transform: translateY(-5px); box-shadow: 0 10px 25px rgba(0,0,0,0.1) !important; }
                .btn-warning { background-color: #FACC15 !important; border: none !important; color: #000 !important; }
                .form-control:focus { border-color: #FACC15 !important; }
            `}</style>
        </div>
    );
};

export default AdminPicturePuzzle;
