import React, { useState, useEffect } from 'react';
import { db } from '../../services/firebaseConfig';
import { collection, addDoc, doc, updateDoc, deleteDoc, getDocs, serverTimestamp } from 'firebase/firestore';
import AdminNavbar from '../../components/AdminNavbar';
import Swal from 'sweetalert2';
import { BookOpen, BookText, Edit, Trash2, Loader2, Plus, X, Globe, Search } from 'lucide-react';
import { invalidateCache, fetchLanguages } from '../../services/dataCache';

interface WordEntry {
    id: string;
    word: string;
    meaning: string;
    explanation: string;
    example: string;
    pronunciation?: string;
    languageId?: string;
}

interface Language {
    id: string;
    name: string;
}

const AdminDailyWords: React.FC = () => {
    const [words, setWords] = useState<WordEntry[]>([]);
    const [languages, setLanguages] = useState<Language[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState({ word: '', meaning: '', explanation: '', example: '', pronunciation: '', languageId: '' });
    const [searchQuery, setSearchQuery] = useState('');
    const [filterLanguage, setFilterLanguage] = useState('All');

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const wordsPerPage = 8;

    const loadWords = async () => {
        setLoading(true);
        try {
            const [snap, langs] = await Promise.all([
                getDocs(collection(db, "dailyWords")),
                fetchLanguages()
            ]);
            const list = snap.docs.map(d => ({ id: d.id, ...d.data() })) as WordEntry[];
            setWords(list);
            setLanguages(langs || []);
            
            if (langs && langs.length > 0 && !form.languageId) {
                setForm(prev => ({ ...prev, languageId: langs[0].id }));
            }
        } catch (error) {
            console.error("Error loading words:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadWords(); }, []);

    const getLangName = (langId?: string) => {
        if (!langId) return 'No Language';
        return languages.find(l => l.id === langId)?.name || 'Unknown';
    };

    const resetForm = () => {
        setForm({ word: '', meaning: '', explanation: '', example: '', pronunciation: '', languageId: languages[0]?.id || '' });
        setEditingId(null);
        setShowForm(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.word || !form.meaning) {
            return Swal.fire('Missing Fields', 'Word and Meaning are required.', 'warning');
        }

        try {
            if (editingId) {
                await updateDoc(doc(db, "dailyWords", editingId), { ...form });
                await addDoc(collection(db, "logs"), {
                    action: "UPDATE", details: `Updated daily word: ${form.word}`,
                    adminEmail: "Admin", targetId: editingId, timestamp: serverTimestamp()
                });
                Swal.fire('Updated!', 'Word has been updated.', 'success');
            } else {
                const ref = await addDoc(collection(db, "dailyWords"), { ...form });
                await addDoc(collection(db, "logs"), {
                    action: "CREATE", details: `Added daily word: ${form.word}`,
                    adminEmail: "Admin", targetId: ref.id, timestamp: serverTimestamp()
                });
                Swal.fire('Added!', 'New word added to the pool.', 'success');
            }
            invalidateCache('auditLogs');
            resetForm();
            loadWords();
        } catch (error) {
            console.error("Save error:", error);
            Swal.fire('Error', 'Failed to save word.', 'error');
        }
    };

    const handleEdit = (w: WordEntry) => {
        setForm({ 
            word: w.word, 
            meaning: w.meaning, 
            explanation: w.explanation, 
            example: w.example, 
            pronunciation: w.pronunciation || '',
            languageId: w.languageId || '' 
        });
        setEditingId(w.id);
        setShowForm(true);
    };

    const handleDelete = async (w: WordEntry) => {
        const result = await Swal.fire({
            title: 'Delete Word?',
            text: `Remove "${w.word}" from the pool?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#DC2626',
            cancelButtonColor: '#6B7280',
            confirmButtonText: 'Yes, Delete',
        });
        if (result.isConfirmed) {
            try {
                await deleteDoc(doc(db, "dailyWords", w.id));
                await addDoc(collection(db, "logs"), {
                    action: "DELETE", details: `Deleted daily word: ${w.word}`,
                    adminEmail: "Admin", targetId: w.id, timestamp: serverTimestamp()
                });
                invalidateCache('allDailyWords');
                invalidateCache('auditLogs');
                Swal.fire('Deleted!', 'Word removed.', 'success');
                if (currentWords.length === 1 && currentPage > 1) setCurrentPage(currentPage - 1);
                loadWords();
            } catch (error) {
                Swal.fire('Error', 'Failed to delete.', 'error');
            }
        }
    };

    // Filtering & pagination
    const filtered = words.filter(w => {
        const matchesSearch = !searchQuery ||
            w.word.toLowerCase().includes(searchQuery.toLowerCase()) ||
            w.meaning.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesLanguage = filterLanguage === 'All' || w.languageId === filterLanguage || (filterLanguage === 'none' && !w.languageId);
        return matchesSearch && matchesLanguage;
    });

    const indexOfLast = currentPage * wordsPerPage;
    const indexOfFirst = indexOfLast - wordsPerPage;
    const currentWords = filtered.slice(indexOfFirst, indexOfLast);
    const totalPages = Math.ceil(filtered.length / wordsPerPage);

    return (
        <div className="min-vh-100 pb-5 bg-light">
            <AdminNavbar />

            {/* HEADER */}
            <div className="py-5 bg-white border-bottom shadow-sm">
                <div className="container" style={{ maxWidth: '1100px' }}>
                    <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-end px-3">
                        <div>
                            <span className="shumela-venda-pulse fw-bold ls-2 text-uppercase smallest d-block mb-2 text-warning">
                                Word Pool
                            </span>
                            <h1 className="fw-bold ls-tight mb-0 text-dark" style={{ fontSize: '2.5rem' }}>
                                Daily <span style={{ color: '#FACC15' }}>Words</span>
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
                                <div className="col-md-3">
                                    <label className="smallest fw-bold ls-1 text-uppercase text-secondary mb-2 d-block">Language *</label>
                                    <select className="form-select dw-input"
                                        value={form.languageId} onChange={e => setForm({ ...form, languageId: e.target.value })}>
                                        <option value="">— No Language —</option>
                                        {languages.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                                    </select>
                                </div>
                                <div className="col-md-3">
                                    <label className="smallest fw-bold ls-1 text-uppercase text-secondary mb-2 d-block">Native Word *</label>
                                    <input className="form-control dw-input" placeholder="e.g. Vhuthu"
                                        value={form.word} onChange={e => setForm({ ...form, word: e.target.value })} />
                                </div>
                                <div className="col-md-3">
                                    <label className="smallest fw-bold ls-1 text-uppercase text-secondary mb-2 d-block">Meaning *</label>
                                    <input className="form-control dw-input" placeholder="e.g. Humanity"
                                        value={form.meaning} onChange={e => setForm({ ...form, meaning: e.target.value })} />
                                </div>
                                <div className="col-md-3">
                                    <label className="smallest fw-bold ls-1 text-uppercase text-secondary mb-2 d-block">Pronunciation</label>
                                    <input className="form-control dw-input" placeholder="e.g. voo-too"
                                        value={form.pronunciation} onChange={e => setForm({ ...form, pronunciation: e.target.value })} />
                                </div>
                                <div className="col-12">
                                    <label className="smallest fw-bold ls-1 text-uppercase text-secondary mb-2 d-block">Explanation</label>
                                    <textarea className="form-control dw-input" rows={2} placeholder="Cultural context..."
                                        value={form.explanation} onChange={e => setForm({ ...form, explanation: e.target.value })} />
                                </div>
                                <div className="col-12">
                                    <label className="smallest fw-bold ls-1 text-uppercase text-secondary mb-2 d-block">Example Sentence</label>
                                    <input className="form-control dw-input" placeholder="e.g. Vhuthu ndi tshumelo — Humanity is service."
                                        value={form.example} onChange={e => setForm({ ...form, example: e.target.value })} />
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
                        <BookOpen size={24} style={{ color: '#D97706' }} />
                    </div>
                    <div>
                        <p className="smallest fw-bold ls-1 text-uppercase text-muted mb-0">Total Words in Pool</p>
                        <h3 className="fw-bold mb-0">{words.length}</h3>
                    </div>
                    <div className="ms-auto d-flex gap-2">
                        <div className="position-relative">
                            <Search size={14} className="position-absolute top-50 translate-middle-y" style={{ left: 12, color: '#9CA3AF' }} />
                            <input className="form-control dw-input ps-4" placeholder="Search word..."
                                style={{ minWidth: 180, fontSize: 13 }}
                                value={searchQuery} onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }} />
                        </div>
                        <select className="form-select dw-input" style={{ width: 150, fontSize: 13 }}
                            value={filterLanguage} onChange={e => { setFilterLanguage(e.target.value); setCurrentPage(1); }}>
                            <option value="All">All Languages</option>
                            <option value="none">No Language</option>
                            {languages.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                        </select>
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
                        <BookText className="text-muted mx-auto mb-3" size={48} />
                        <p className="mt-3 fw-bold text-muted">No words yet. Add your first word!</p>
                    </div>
                ) : (
                    <>
                        <div className="row g-3 px-2">
                            {currentWords.map((w) => (
                                <div key={w.id} className="col-md-6">
                                    <div className="bg-white border rounded-4 shadow-sm p-4 h-100 dw-card">
                                        <div className="d-flex justify-content-between align-items-start mb-3">
                                            <div>
                                                <h4 className="fw-bold mb-0" style={{ color: '#111827' }}>{w.word}</h4>
                                                <div className="d-flex align-items-center gap-2">
                                                    <span className="smallest fw-bold text-warning ls-1 text-uppercase">{w.meaning}</span>
                                                    <span className="badge bg-light text-muted border px-2 py-0 d-flex align-items-center gap-1" style={{ fontSize: 9, fontWeight: 600 }}>
                                                        <Globe size={9} />{getLangName(w.languageId)}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="d-flex gap-2">
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
                                        {w.explanation && <p className="text-muted small mb-2">{w.explanation}</p>}
                                        {w.example && (
                                            <div className="p-2 bg-light rounded-3">
                                                <p className="mb-0 fst-italic small">"{w.example}"</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Pagination */}
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
                .shumela-venda-pulse { animation: pulseAdmin 3s infinite ease-in-out; }
                @keyframes pulseAdmin { 0% { opacity: 0.7; } 50% { opacity: 1; } 100% { opacity: 0.7; } }
                .dw-input { background-color: #f8f9fa; border: 1px solid #dee2e6; border-radius: 8px; font-size: 14px; }
                .dw-input:focus { border-color: #FACC15; background-color: #fff; box-shadow: none; }
                .dw-card { transition: all 0.2s; }
                .dw-card:hover { border-color: #FACC15 !important; }
                .game-btn-yellow {
                    background-color: #FACC15 !important; color: #000 !important;
                    border-radius: 8px; box-shadow: 0 4px 0 #A1810B !important; border: none;
                }
                .game-btn-yellow:active { transform: translateY(2px); box-shadow: 0 2px 0 #A1810B !important; }
            `}</style>
        </div>
    );
};

export default AdminDailyWords;



