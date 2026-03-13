import React, { useState, useEffect } from 'react';
import { db } from '../../services/firebaseConfig';
import { collection, addDoc, doc, updateDoc, deleteDoc, getDocs, serverTimestamp } from 'firebase/firestore';
import AdminNavbar from '../../components/AdminNavbar';
import { invalidateCache } from '../../services/dataCache';
import Swal from 'sweetalert2';
import { Bomb, Edit, Trash2, Loader2, Plus, X } from 'lucide-react';

interface WordBombEntry {
    id: string;
    english: string;
    venda: string;
    difficulty: string;
}

const AdminWordBomb: React.FC = () => {
    const [words, setWords] = useState<WordBombEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState({ english: '', venda: '', difficulty: 'Beginner' });

    const [currentPage, setCurrentPage] = useState(1);
    const wordsPerPage = 8;

    const loadWords = async () => {
        setLoading(true);
        try {
            const snap = await getDocs(collection(db, "wordBombWords"));
            const list = snap.docs.map(d => ({ id: d.id, ...d.data() })) as WordBombEntry[];
            setWords(list);
        } catch (error) {
            console.error("Error loading Word Bomb words:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadWords(); }, []);

    const resetForm = () => {
        setForm({ english: '', venda: '', difficulty: 'Beginner' });
        setEditingId(null);
        setShowForm(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.english || !form.venda) {
            return Swal.fire('Missing Fields', 'English word and Venda translation are required.', 'warning');
        }

        try {
            if (editingId) {
                await updateDoc(doc(db, "wordBombWords", editingId), { ...form });
                await addDoc(collection(db, "logs"), {
                    action: "UPDATE", details: `Updated Word Bomb word: ${form.english} → ${form.venda}`,
                    adminEmail: "Admin", targetId: editingId, timestamp: serverTimestamp()
                });
                Swal.fire('Updated!', 'Word has been updated.', 'success');
            } else {
                const ref = await addDoc(collection(db, "wordBombWords"), { ...form });
                await addDoc(collection(db, "logs"), {
                    action: "CREATE", details: `Added Word Bomb word: ${form.english} → ${form.venda}`,
                    adminEmail: "Admin", targetId: ref.id, timestamp: serverTimestamp()
                });
                Swal.fire('Added!', 'New word added to Word Bomb.', 'success');
            }
            invalidateCache('wordBombWords');
            invalidateCache('auditLogs');
            resetForm();
            loadWords();
        } catch (error) {
            console.error("Save error:", error);
            Swal.fire('Error', 'Failed to save word.', 'error');
        }
    };

    const handleEdit = (w: WordBombEntry) => {
        setForm({ english: w.english, venda: w.venda, difficulty: w.difficulty });
        setEditingId(w.id);
        setShowForm(true);
    };

    const handleDelete = async (w: WordBombEntry) => {
        const result = await Swal.fire({
            title: 'Delete Word?',
            text: `Remove "${w.english} → ${w.venda}" from Word Bomb?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#DC2626',
            cancelButtonColor: '#6B7280',
            confirmButtonText: 'Yes, Delete',
        });
        if (result.isConfirmed) {
            try {
                await deleteDoc(doc(db, "wordBombWords", w.id));
                await addDoc(collection(db, "logs"), {
                    action: "DELETE", details: `Deleted Word Bomb word: ${w.english}`,
                    adminEmail: "Admin", targetId: w.id, timestamp: serverTimestamp()
                });
                invalidateCache('wordBombWords');
                invalidateCache('auditLogs');
                Swal.fire('Deleted!', 'Word removed.', 'success');
                if (currentWords.length === 1 && currentPage > 1) setCurrentPage(currentPage - 1);
                loadWords();
            } catch (error) {
                Swal.fire('Error', 'Failed to delete.', 'error');
            }
        }
    };

    const indexOfLast = currentPage * wordsPerPage;
    const indexOfFirst = indexOfLast - wordsPerPage;
    const currentWords = words.slice(indexOfFirst, indexOfLast);
    const totalPages = Math.ceil(words.length / wordsPerPage);

    const difficultyColor = (d: string) => {
        if (d === 'Beginner') return '#10B981';
        if (d === 'Intermediate') return '#FACC15';
        return '#EF4444';
    };

    return (
        <div className="min-vh-100 pb-5 bg-light">
            <AdminNavbar />

            {/* HEADER */}
            <div className="py-5 bg-white border-bottom shadow-sm">
                <div className="container" style={{ maxWidth: '1100px' }}>
                    <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-end px-3">
                        <div>
                            <span className="fw-bold ls-2 text-uppercase smallest d-block mb-2 text-warning" style={{ animation: 'pulseAdmin 3s infinite ease-in-out' }}>
                                Game Content
                            </span>
                            <h1 className="fw-bold ls-tight mb-0 text-dark" style={{ fontSize: '2.5rem' }}>
                                Word <span style={{ color: '#FACC15' }}>Bomb</span> 💣
                            </h1>
                        </div>
                        <div className="mt-4 mt-md-0">
                            <button onClick={() => { resetForm(); setShowForm(!showForm); }}
                                className="btn btn-dark fw-bold smallest ls-1 px-4 py-2 rounded-pill shadow-sm d-flex align-items-center gap-2">
                                {showForm ? <><X size={14} /> CANCEL</> : <><Plus size={14} /> ADD WORD</>}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container py-5" style={{ maxWidth: '1100px' }}>

                {/* ADD/EDIT FORM */}
                {showForm && (
                    <div className="bg-white p-4 rounded-4 border shadow-sm mb-5">
                        <h5 className="fw-bold ls-1 mb-4 smallest text-uppercase text-muted border-bottom pb-2">
                            {editingId ? 'Edit Word' : 'Add New Word'}
                        </h5>
                        <form onSubmit={handleSubmit}>
                            <div className="row g-3">
                                <div className="col-md-4">
                                    <label className="smallest fw-bold ls-1 text-uppercase text-secondary mb-2 d-block">English Word *</label>
                                    <input className="form-control wb-admin-input" placeholder="e.g. Water"
                                        value={form.english} onChange={e => setForm({ ...form, english: e.target.value })} />
                                </div>
                                <div className="col-md-4">
                                    <label className="smallest fw-bold ls-1 text-uppercase text-secondary mb-2 d-block">Venda Translation *</label>
                                    <input className="form-control wb-admin-input" placeholder="e.g. Madi"
                                        value={form.venda} onChange={e => setForm({ ...form, venda: e.target.value })} />
                                </div>
                                <div className="col-md-4">
                                    <label className="smallest fw-bold ls-1 text-uppercase text-secondary mb-2 d-block">Difficulty</label>
                                    <select className="form-select wb-admin-input"
                                        value={form.difficulty} onChange={e => setForm({ ...form, difficulty: e.target.value })}>
                                        <option>Beginner</option>
                                        <option>Intermediate</option>
                                        <option>Advanced</option>
                                    </select>
                                </div>
                            </div>
                            <div className="mt-4 d-flex gap-3 justify-content-end">
                                <button type="button" onClick={resetForm} className="btn text-muted smallest fw-bold ls-1">CANCEL</button>
                                <button type="submit" className="btn game-btn-yellow px-5 py-2 fw-bold smallest ls-1">
                                    {editingId ? 'SAVE CHANGES' : 'ADD WORD'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* STATS */}
                <div className="bg-white rounded-4 border shadow-sm p-4 mb-4 d-flex align-items-center gap-3">
                    <div className="d-flex align-items-center justify-content-center rounded-3"
                        style={{ width: 48, height: 48, backgroundColor: '#FEF3C7' }}>
                        <Bomb size={24} style={{ color: '#D97706' }} />
                    </div>
                    <div>
                        <p className="smallest fw-bold ls-1 text-uppercase text-muted mb-0">Total Word Bomb Words</p>
                        <h3 className="fw-bold mb-0">{words.length}</h3>
                    </div>
                    <div className="ms-auto text-end d-none d-md-block">
                        <p className="smallest text-muted mb-0">These words are used in the Word Bomb falling words game.</p>
                    </div>
                </div>

                {/* WORD LIST */}
                {loading ? (
                    <div className="text-center py-5">
                        <Loader2 className="animate-spin text-warning mx-auto mb-3" size={48} />
                        <p className="ls-1 smallest fw-bold text-muted">LOADING WORDS...</p>
                    </div>
                ) : words.length === 0 ? (
                    <div className="text-center py-5 bg-white rounded-4 border">
                        <Bomb className="text-muted mx-auto mb-3" size={48} />
                        <p className="mt-3 fw-bold text-muted">No words yet. Add your first word!</p>
                    </div>
                ) : (
                    <>
                        <div className="row g-3 px-2">
                            {currentWords.map((w) => (
                                <div key={w.id} className="col-md-6 col-lg-4">
                                    <div className="bg-white border rounded-4 shadow-sm p-4 h-100 wb-admin-card">
                                        <div className="d-flex justify-content-between align-items-start mb-2">
                                            <div>
                                                <h5 className="fw-bold mb-0" style={{ color: '#111827' }}>{w.english}</h5>
                                                <p className="fw-bold mb-0" style={{ color: '#FACC15' }}>{w.venda}</p>
                                            </div>
                                            <span className="badge rounded-pill px-2 py-1" style={{
                                                backgroundColor: `${difficultyColor(w.difficulty)}20`,
                                                color: difficultyColor(w.difficulty),
                                                fontSize: 10, fontWeight: 700
                                            }}>
                                                {w.difficulty}
                                            </span>
                                        </div>
                                        <div className="d-flex gap-2 mt-3">
                                            <button onClick={() => handleEdit(w)} className="btn btn-sm btn-outline-dark rounded-pill px-3 d-flex align-items-center gap-1"
                                                style={{ fontSize: 11 }}>
                                                <Edit size={12} />Edit
                                            </button>
                                            <button onClick={() => handleDelete(w)} className="btn btn-sm btn-outline-danger rounded-pill px-3 d-flex align-items-center gap-1"
                                                style={{ fontSize: 11 }}>
                                                <Trash2 size={12} />Delete
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {totalPages > 1 && (
                            <div className="d-flex justify-content-center gap-2 mt-5">
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                    <button key={page} onClick={() => setCurrentPage(page)}
                                        className={`btn btn-sm fw-bold rounded-pill px-3 ${currentPage === page ? 'btn-dark' : 'btn-outline-secondary'}`}
                                        style={{ fontSize: 12 }}>
                                        {page}
                                    </button>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>

            <style>{`
                .ls-tight { letter-spacing: -1.5px; }
                .ls-1 { letter-spacing: 1px; }
                .ls-2 { letter-spacing: 2px; }
                .smallest { font-size: 11px; }
                @keyframes pulseAdmin { 0% { opacity: 0.7; } 50% { opacity: 1; } 100% { opacity: 0.7; } }
                .wb-admin-input { background-color: #f8f9fa; border: 1px solid #dee2e6; border-radius: 8px; font-size: 14px; }
                .wb-admin-input:focus { border-color: #FACC15; background-color: #fff; box-shadow: none; }
                .wb-admin-card { transition: all 0.2s; }
                .wb-admin-card:hover { border-color: #FACC15 !important; }
                .game-btn-yellow {
                    background-color: #FACC15 !important; color: #000 !important;
                    border-radius: 8px; box-shadow: 0 4px 0 #A1810B !important; border: none;
                }
                .game-btn-yellow:active { transform: translateY(2px); box-shadow: 0 2px 0 #A1810B !important; }
            `}</style>
        </div>
    );
};

export default AdminWordBomb;
