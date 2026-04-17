import React, { useState, useEffect } from 'react';
import { db } from '../../services/firebaseConfig';
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc, serverTimestamp, writeBatch, type Firestore } from 'firebase/firestore';
import AdminNavbar from '../../components/shared/navigation/AdminNavbar';
import Swal from 'sweetalert2';
import { Loader2, Plus, Trash2, Image as ImageIcon, ExternalLink, X, Edit, Upload, Search, Globe } from 'lucide-react';
import { invalidateCache, fetchLanguages, difficultyToLevel } from '../../services/dataCache';

interface PicturePuzzlePart {
    id: string;
    imageUrl: string;
    nativeWord: string;
    english: string;
    difficulty?: string;
    languageId?: string;
}

interface Language {
    id: string;
    name: string;
}

const AdminPicturePuzzle: React.FC = () => {
    const [puzzles, setPuzzles] = useState<PicturePuzzlePart[]>([]);
    const [languages, setLanguages] = useState<Language[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [showBatch, setShowBatch] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterDifficulty, setFilterDifficulty] = useState('All');
    const [filterLanguage, setFilterLanguage] = useState('All');

    const [form, setForm] = useState({
        imageUrl: '',
        nativeWord: '',
        english: '',
        difficulty: 'Beginner',
        languageId: ''
    });
    const [batchJson, setBatchJson] = useState('');

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 12;

    const fetchPuzzles = async () => {
        setLoading(true);
        try {
            const [snap, langs] = await Promise.all([
                getDocs(collection(db, "picturePuzzles")),
                fetchLanguages()
            ]);
            const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as PicturePuzzlePart));
            setPuzzles(list);
            setLanguages(langs || []);
            
            if (langs && langs.length > 0 && !form.languageId) {
                setForm(prev => ({ ...prev, languageId: langs[0].id }));
            }
        } catch (error) {
            console.error("Fetch Error:", error);
            Swal.fire("Error", "Failed to load picture puzzles.", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchPuzzles(); }, []);

    const getLangName = (langId?: string) => {
        if (!langId) return 'No Language';
        return languages.find(l => l.id === langId)?.name || 'Unknown';
    };

    const resetForm = () => {
        setForm({ 
            imageUrl: '', 
            nativeWord: '', 
            english: '', 
            difficulty: 'Beginner',
            languageId: languages[0]?.id || '' 
        });
        setEditingId(null);
        setShowForm(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.nativeWord || !form.english) {
            return Swal.fire("Missing Fields", "Native word and English translation are required.", "warning");
        }

        setSubmitting(true);
        try {
            const docData = {
                imageUrl: form.imageUrl || 'placeholder',
                nativeWord: form.nativeWord.trim(),
                english: form.english.trim(),
                difficulty: form.difficulty,
                level: difficultyToLevel(form.difficulty || 'Beginner'),
                languageId: form.languageId
            };

            if (editingId) {
                await updateDoc(doc(db, "picturePuzzles", editingId), docData);
                await addDoc(collection(db, "logs"), {
                    action: "UPDATE", details: `Updated picture puzzle: ${form.english} → ${form.nativeWord}`,
                    adminEmail: "Admin", targetId: editingId, timestamp: serverTimestamp()
                });
                Swal.fire('Updated!', 'Picture puzzle has been updated.', 'success');
            } else {
                const ref = await addDoc(collection(db, "picturePuzzles"), {
                    ...docData,
                    createdAt: serverTimestamp()
                });
                await addDoc(collection(db, "logs"), {
                    action: "CREATE", details: `Added picture puzzle: ${form.english} → ${form.nativeWord}`,
                    adminEmail: "Admin", targetId: ref.id, timestamp: serverTimestamp()
                });
                Swal.fire('Added!', 'Picture puzzle added successfully.', 'success');
            }

            invalidateCache('picturePuzzles');
            invalidateCache('auditLogs');
            resetForm();
            fetchPuzzles();
        } catch (error) {
            console.error("Save Error:", error);
            Swal.fire("Error", "Failed to save puzzle.", "error");
        } finally {
            setSubmitting(false);
        }
    };

    const handleBatchImport = async () => {
        if (!batchJson.trim()) {
            return Swal.fire('Empty Input', 'Please paste JSON data to import.', 'warning');
        }

        try {
            const parsed = JSON.parse(batchJson);
            const items = Array.isArray(parsed) ? parsed : [parsed];

            const valid = items.every(item => item.nativeWord && item.english);
            if (!valid) {
                return Swal.fire('Invalid Format', 'Each item needs: nativeWord, english. Optional: imageUrl, difficulty.', 'error');
            }

            const confirm = await Swal.fire({
                title: `Import ${items.length} items?`,
                text: `This will add ${items.length} picture puzzles to the database.`,
                icon: 'question',
                showCancelButton: true,
                confirmButtonColor: '#FACC15',
                confirmButtonText: 'Yes, Import',
            });

            if (!confirm.isConfirmed) return;

            const batch = writeBatch(db as Firestore);
            let count = 0;

            for (const item of items) {
                const newRef = doc(collection(db as Firestore, "picturePuzzles"));
                batch.set(newRef, {
                    imageUrl: item.imageUrl || 'placeholder',
                    nativeWord: item.nativeWord,
                    english: item.english,
                     difficulty: item.difficulty || 'Beginner',
                    level: difficultyToLevel(item.difficulty || 'Beginner'),
                    languageId: item.languageId || form.languageId || '',
                    createdAt: new Date(),
                });
                count++;
            }

            await batch.commit();
            await addDoc(collection(db, "logs"), {
                action: "BATCH_CREATE", details: `Batch imported ${count} picture puzzles`,
                adminEmail: "Admin", targetId: "batch", timestamp: serverTimestamp()
            });

            invalidateCache('picturePuzzles');
            invalidateCache('auditLogs');
            Swal.fire('Imported!', `${count} picture puzzles added successfully.`, 'success');
            setBatchJson('');
            setShowBatch(false);
            fetchPuzzles();
        } catch (error: any) {
            console.error("Batch import error:", error);
            Swal.fire('Import Failed', `Invalid JSON: ${error.message}`, 'error');
        }
    };

    const handleEdit = (pz: PicturePuzzlePart) => {
        setForm({
            imageUrl: pz.imageUrl || '',
            nativeWord: pz.nativeWord,
            english: pz.english,
            difficulty: pz.difficulty || 'Beginner',
            languageId: pz.languageId || ''
        });
        setEditingId(pz.id);
        setShowForm(true);
        setShowBatch(false);
    };

    const handleDelete = async (pz: PicturePuzzlePart) => {
        const result = await Swal.fire({
            title: 'Delete Puzzle?',
            text: `Remove "${pz.english} → ${pz.nativeWord}"?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#DC2626',
            cancelButtonColor: '#6B7280',
            confirmButtonText: 'Yes, Delete',
        });
        if (result.isConfirmed) {
            try {
                await deleteDoc(doc(db, "picturePuzzles", pz.id));
                await addDoc(collection(db, "logs"), {
                    action: "DELETE", details: `Deleted picture puzzle: ${pz.english}`,
                    adminEmail: "Admin", targetId: pz.id, timestamp: serverTimestamp()
                });
                invalidateCache('picturePuzzles');
                invalidateCache('auditLogs');
                Swal.fire('Deleted', 'Puzzle removed.', 'success');
                fetchPuzzles();
            } catch (error) {
                Swal.fire('Error', 'Failed to delete.', 'error');
            }
        }
    };

    // Filtering & pagination
    const filtered = puzzles.filter(p => {
        const matchesSearch = !searchQuery || 
            p.nativeWord.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.english.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesDifficulty = filterDifficulty === 'All' || p.difficulty === filterDifficulty;
        const matchesLanguage = filterLanguage === 'All' || p.languageId === filterLanguage || (filterLanguage === 'none' && !p.languageId);
        return matchesSearch && matchesDifficulty && matchesLanguage;
    });

    const indexOfLast = currentPage * itemsPerPage;
    const indexOfFirst = indexOfLast - itemsPerPage;
    const currentItems = filtered.slice(indexOfFirst, indexOfLast);
    const totalPages = Math.ceil(filtered.length / itemsPerPage);

    const BATCH_TEMPLATE = `[
  {
    "nativeWord": "Mmbwa",
    "english": "Dog",
    "imageUrl": "https://example.com/dog.jpg",
    "difficulty": "Beginner"
  },
  {
    "nativeWord": "Khathu",
    "english": "Cat",
    "imageUrl": "",
    "difficulty": "Beginner"
  }
]`;

    return (
        <div className="min-vh-100 pb-5 bg-light">
            <AdminNavbar />

            <div className="py-5 bg-white border-bottom shadow-sm">
                <div className="container" style={{ maxWidth: '1100px' }}>
                    <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-end px-3">
                        <div>
                            <span className="fw-bold ls-2 text-uppercase smallest d-block mb-2 text-warning">Game Content</span>
                            <h1 className="fw-bold ls-tight mb-0 text-dark" style={{ fontSize: '2.5rem' }}>
                                Picture <span style={{ color: '#FACC15' }}>Puzzles</span> 🖼️
                            </h1>
                        </div>
                        <div className="mt-4 mt-md-0 d-flex gap-2">
                            <button onClick={() => { resetForm(); setShowBatch(false); setShowForm(!showForm); }}
                                className="btn btn-dark fw-bold smallest ls-1 px-4 py-2 rounded-pill shadow-sm d-flex align-items-center gap-2">
                                {showForm ? <><X size={14} /> CANCEL</> : <><Plus size={14} /> ADD PUZZLE</>}
                            </button>
                            <button onClick={() => { setShowForm(false); setShowBatch(!showBatch); }}
                                className="btn btn-outline-dark fw-bold smallest ls-1 px-4 py-2 rounded-pill shadow-sm d-flex align-items-center gap-2">
                                {showBatch ? <><X size={14} /> CANCEL</> : <><Upload size={14} /> BATCH IMPORT</>}
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
                            {editingId ? 'Edit Picture Puzzle' : 'Add New Picture Puzzle'}
                        </h5>
                        <form onSubmit={handleSubmit}>
                            <div className="row g-3">
                                <div className="col-md-3">
                                    <label className="smallest fw-bold ls-1 text-uppercase text-secondary mb-2 d-block">Language *</label>
                                    <select className="form-select admin-input"
                                        value={form.languageId} onChange={e => setForm({ ...form, languageId: e.target.value })}>
                                        <option value="">— No Language —</option>
                                        {languages.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                                    </select>
                                </div>
                                <div className="col-md-3">
                                    <label className="smallest fw-bold ls-1 text-uppercase text-secondary mb-2">Image URL (optional)</label>
                                    <input type="url" className="form-control admin-input" placeholder="https://example.com/image.jpg"
                                        value={form.imageUrl} onChange={e => setForm({ ...form, imageUrl: e.target.value })} />
                                </div>
                                <div className="col-md-3">
                                    <label className="smallest fw-bold ls-1 text-uppercase text-secondary mb-2">Native Word *</label>
                                    <input className="form-control admin-input" placeholder="e.g. Mmbwa"
                                        value={form.nativeWord} onChange={e => setForm({ ...form, nativeWord: e.target.value })} />
                                </div>
                                <div className="col-md-3">
                                    <label className="smallest fw-bold ls-1 text-uppercase text-secondary mb-2">English Translation *</label>
                                    <input className="form-control admin-input" placeholder="e.g. Dog"
                                        value={form.english} onChange={e => setForm({ ...form, english: e.target.value })} />
                                </div>
                                <div className="col-md-12">
                                    <label className="smallest fw-bold ls-1 text-uppercase text-secondary mb-2 d-block">Difficulty</label>
                                    <select className="form-select admin-input"
                                        value={form.difficulty} onChange={e => setForm({ ...form, difficulty: e.target.value })}>
                                        <option>Beginner</option>
                                        <option>Intermediate</option>
                                        <option>Advanced</option>
                                    </select>
                                </div>
                            </div>
                            <div className="mt-4 d-flex gap-3 justify-content-end">
                                <button type="button" onClick={resetForm} className="btn text-muted smallest fw-bold ls-1">CANCEL</button>
                                <button type="submit" disabled={submitting} className="btn game-btn-yellow px-5 py-2 fw-bold smallest ls-1">
                                    {submitting ? <Loader2 className="animate-spin" size={18} /> : editingId ? 'SAVE CHANGES' : 'ADD PUZZLE'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* BATCH IMPORT */}
                {showBatch && (
                    <div className="bg-white p-4 rounded-4 border shadow-sm mb-5">
                        <h5 className="fw-bold ls-1 mb-2 smallest text-uppercase text-muted border-bottom pb-2">
                            <Upload size={14} className="me-2" />Batch Import (JSON)
                        </h5>
                        <p className="text-muted small mb-3">Paste a JSON array. Each item needs: <code>nativeWord</code>, <code>english</code>. Optional: <code>imageUrl</code>, <code>difficulty</code>.</p>
                        <div className="mb-3">
                            <button className="btn btn-outline-secondary btn-sm smallest fw-bold mb-2"
                                onClick={() => setBatchJson(BATCH_TEMPLATE)}>
                                Load Template
                            </button>
                            <textarea className="form-control admin-input font-monospace" rows={10}
                                placeholder={BATCH_TEMPLATE} value={batchJson}
                                onChange={e => setBatchJson(e.target.value)} style={{ fontSize: 13 }} />
                        </div>
                        <div className="d-flex gap-3 justify-content-end">
                            <button onClick={() => setShowBatch(false)} className="btn text-muted smallest fw-bold ls-1">CANCEL</button>
                            <button onClick={handleBatchImport} className="btn game-btn-yellow px-5 py-2 fw-bold smallest ls-1">IMPORT ALL</button>
                        </div>
                    </div>
                )}

                {/* STATS & SEARCH */}
                <div className="bg-white rounded-4 border shadow-sm p-4 mb-4 d-flex flex-column flex-md-row align-items-md-center gap-3">
                    <div className="d-flex align-items-center gap-3 flex-shrink-0">
                        <div className="d-flex align-items-center justify-content-center rounded-3"
                            style={{ width: 48, height: 48, backgroundColor: '#FEF3C7' }}>
                            <ImageIcon size={24} style={{ color: '#D97706' }} />
                        </div>
                        <div>
                            <p className="smallest fw-bold ls-1 text-uppercase text-muted mb-0">Total Picture Puzzles</p>
                            <h3 className="fw-bold mb-0">{puzzles.length}</h3>
                        </div>
                    </div>
                    <div className="ms-md-auto d-flex gap-2 align-items-center">
                        <select className="form-select admin-input" style={{ width: 150, fontSize: 13 }}
                            value={filterLanguage} onChange={e => { setFilterLanguage(e.target.value); setCurrentPage(1); }}>
                            <option value="All">All Languages</option>
                            <option value="none">No Language</option>
                            {languages.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                        </select>
                        <select className="form-select admin-input" style={{ width: 170, fontSize: 13 }}
                            value={filterDifficulty} onChange={e => { setFilterDifficulty(e.target.value); setCurrentPage(1); }}>
                            <option value="All">All Levels</option>
                            <option value="Beginner">Level 1 (Beginner)</option>
                            <option value="Intermediate">Level 2 (Intermediate)</option>
                            <option value="Advanced">Level 3 (Advanced)</option>
                        </select>
                        <div className="position-relative">
                            <Search size={14} className="position-absolute top-50 translate-middle-y" style={{ left: 12, color: '#9CA3AF' }} />
                            <input className="form-control admin-input ps-4" placeholder="Search word or translation..."
                                style={{ minWidth: 200, fontSize: 13 }}
                                value={searchQuery} onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }} />
                        </div>
                    </div>
                </div>

                {/* LIST */}
                {loading ? (
                    <div className="text-center py-5">
                        <Loader2 className="animate-spin text-warning mx-auto mb-3" size={48} />
                        <p className="ls-1 smallest fw-bold text-muted">LOADING PUZZLES...</p>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-5 bg-white rounded-4 border">
                        <ImageIcon size={48} className="text-muted mx-auto mb-3 opacity-25" />
                        <h5 className="fw-bold text-muted">No picture puzzles found</h5>
                        <p className="smallest text-secondary ls-1">Add your first puzzle using the form above.</p>
                    </div>
                ) : (
                    <>
                        <div className="row g-3">
                            {currentItems.map(pz => (
                                <div key={pz.id} className="col-md-6 col-lg-4">
                                    <div className="bg-white border rounded-4 shadow-sm overflow-hidden h-100 admin-card">
                                        {pz.imageUrl && pz.imageUrl !== 'placeholder' ? (
                                            <div style={{ height: '140px', position: 'relative' }}>
                                                <img src={pz.imageUrl} alt={pz.english}
                                                    className="w-100 h-100 object-fit-cover"
                                                    onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/400x300?text=No+Image'; }} />
                                                <div className="position-absolute bottom-0 start-0 w-100 p-2 bg-gradient-dark text-white">
                                                    <a href={pz.imageUrl} target="_blank" rel="noreferrer" className="text-white smallest">
                                                        <ExternalLink size={12} className="me-1" />View Source
                                                    </a>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="d-flex align-items-center justify-content-center" style={{ height: 100, background: '#f3f4f6' }}>
                                                <ImageIcon size={32} className="text-muted opacity-25" />
                                            </div>
                                        )}
                                        <div className="p-3">
                                            <div className="d-flex justify-content-between align-items-start mb-2">
                                                <div>
                                                    <h6 className="fw-bold mb-0 text-dark">{pz.nativeWord}</h6>
                                                     <span className="smallest text-muted text-uppercase ls-1">{pz.english}</span>
                                                </div>
                                                <div className="d-flex flex-column align-items-end gap-1">
                                                    <span className="badge rounded-pill px-2 py-1" style={{
                                                        backgroundColor: `${pz.difficulty === 'Advanced' ? '#EF4444' : pz.difficulty === 'Intermediate' ? '#FACC15' : '#10B981'}20`,
                                                        color: pz.difficulty === 'Advanced' ? '#EF4444' : pz.difficulty === 'Intermediate' ? '#FACC15' : '#10B981',
                                                        fontSize: 10, fontWeight: 700
                                                    }}>
                                                        {pz.difficulty === 'Advanced' ? 'Level 3' : pz.difficulty === 'Intermediate' ? 'Level 2' : 'Level 1'} ({pz.difficulty || 'Beginner'})
                                                    </span>
                                                    <span className="badge bg-light text-muted border px-2 py-1 d-flex align-items-center gap-1" style={{ fontSize: 9, fontWeight: 600 }}>
                                                        <Globe size={9} />{getLangName(pz.languageId)}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="d-flex gap-2 mt-2">
                                                <button onClick={() => handleEdit(pz)} className="btn btn-sm btn-outline-dark rounded-pill px-3 d-flex align-items-center gap-1"
                                                    style={{ fontSize: 11 }}>
                                                    <Edit size={12} />Edit
                                                </button>
                                                <button onClick={() => handleDelete(pz)} className="btn btn-sm btn-outline-danger rounded-pill px-3 d-flex align-items-center gap-1"
                                                    style={{ fontSize: 11 }}>
                                                    <Trash2 size={12} />Delete
                                                </button>
                                            </div>
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
                .bg-gradient-dark { background: linear-gradient(0deg, rgba(0,0,0,0.6) 0%, transparent 100%); }
                .admin-input { background-color: #f8f9fa; border: 1px solid #dee2e6; border-radius: 8px; font-size: 14px; }
                .admin-input:focus { border-color: #FACC15; background-color: #fff; box-shadow: none; }
                .admin-card { transition: all 0.2s; }
                .admin-card:hover { border-color: #FACC15 !important; transform: translateY(-3px); }
                .game-btn-yellow {
                    background-color: #FACC15 !important; color: #000 !important;
                    border-radius: 8px; box-shadow: 0 4px 0 #A1810B !important; border: none;
                }
                .game-btn-yellow:active { transform: translateY(2px); box-shadow: 0 2px 0 #A1810B !important; }
                .animate-spin { animation: spin 1s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
};

export default AdminPicturePuzzle;








