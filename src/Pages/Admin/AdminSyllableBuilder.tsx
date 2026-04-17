import React, { useState, useEffect } from 'react';
import { db } from '../../services/firebaseConfig';
import { collection, addDoc, doc, updateDoc, deleteDoc, getDocs, serverTimestamp, writeBatch, type Firestore } from 'firebase/firestore';
import AdminNavbar from '../../components/shared/navigation/AdminNavbar';
import { invalidateCache, fetchLanguages, difficultyToLevel } from '../../services/dataCache';
import Swal from 'sweetalert2';
import { Layout, Edit, Trash2, Loader2, Plus, X, Upload, Search, Globe } from 'lucide-react';

interface SyllableEntry {
    id: string;
    word: string;
    syllables: string[];
    translation: string;
    difficulty: string;
    languageId?: string;
}

interface Language {
    id: string;
    name: string;
    code?: string;
}

const AdminSyllableBuilder: React.FC = () => {
    const [entries, setEntries] = useState<SyllableEntry[]>([]);
    const [languages, setLanguages] = useState<Language[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [showBatch, setShowBatch] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState({ word: '', syllables: '', translation: '', difficulty: 'Beginner', languageId: '' });
    const [batchJson, setBatchJson] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [filterDifficulty, setFilterDifficulty] = useState('All');
    const [filterLanguage, setFilterLanguage] = useState('All');

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 12;

    const loadEntries = async () => {
        setLoading(true);
        try {
            const [snap, langs] = await Promise.all([
                getDocs(collection(db, "syllablePuzzles")),
                fetchLanguages()
            ]);
            const list = snap.docs.map(d => ({ id: d.id, ...d.data() })) as SyllableEntry[];
            setEntries(list);
            setLanguages(langs || []);
            // Default the form language to the first language
            if (langs && langs.length > 0 && !form.languageId) {
                setForm(prev => ({ ...prev, languageId: langs[0].id }));
            }
        } catch (error) {
            console.error("Error loading syllable puzzles:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadEntries(); }, []);

    const getLangName = (langId?: string) => {
        if (!langId) return 'No Language';
        return languages.find(l => l.id === langId)?.name || 'Unknown';
    };

    const resetForm = () => {
        setForm({ word: '', syllables: '', translation: '', difficulty: 'Beginner', languageId: languages[0]?.id || '' });
        setEditingId(null);
        setShowForm(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.word || !form.syllables || !form.translation) {
            return Swal.fire('Missing Fields', 'Word, syllables, and translation are required.', 'warning');
        }

        const syllablesArray = form.syllables.split(',').map(s => s.trim()).filter(Boolean);
        if (syllablesArray.length < 2) {
            return Swal.fire('Invalid Syllables', 'Please enter at least 2 syllables separated by commas.', 'warning');
        }

        try {
            const docData: any = {
                word: form.word.trim(),
                syllables: syllablesArray,
                translation: form.translation.trim(),
                difficulty: form.difficulty,
                level: difficultyToLevel(form.difficulty)
            };
            if (form.languageId) docData.languageId = form.languageId;

            if (editingId) {
                await updateDoc(doc(db, "syllablePuzzles", editingId), docData);
                await addDoc(collection(db, "logs"), {
                    action: "UPDATE", details: `Updated syllable puzzle: ${form.word}`,
                    adminEmail: "Admin", targetId: editingId, timestamp: serverTimestamp()
                });
                Swal.fire('Updated!', 'Syllable puzzle has been updated.', 'success');
            } else {
                const ref = await addDoc(collection(db, "syllablePuzzles"), docData);
                await addDoc(collection(db, "logs"), {
                    action: "CREATE", details: `Added syllable puzzle: ${form.word}`,
                    adminEmail: "Admin", targetId: ref.id, timestamp: serverTimestamp()
                });
                Swal.fire('Added!', 'New syllable puzzle added.', 'success');
            }
            invalidateCache('syllablePuzzles');
            invalidateCache('auditLogs');
            resetForm();
            loadEntries();
        } catch (error) {
            console.error("Save error:", error);
            Swal.fire('Error', 'Failed to save syllable puzzle.', 'error');
        }
    };

    const handleBatchImport = async () => {
        if (!batchJson.trim()) {
            return Swal.fire('Empty Input', 'Please paste JSON data to import.', 'warning');
        }

        try {
            const parsed = JSON.parse(batchJson);
            const items = Array.isArray(parsed) ? parsed : [parsed];

            const valid = items.every(item =>
                item.word && item.syllables && Array.isArray(item.syllables) && item.translation
            );
            if (!valid) {
                return Swal.fire('Invalid Format', 'Each item needs: word, syllables (array), translation. Optional: difficulty, languageId.', 'error');
            }

            const confirm = await Swal.fire({
                title: `Import ${items.length} items?`,
                text: `This will add ${items.length} syllable puzzles to the database.`,
                icon: 'question',
                showCancelButton: true,
                confirmButtonColor: '#FACC15',
                confirmButtonText: 'Yes, Import',
            });

            if (!confirm.isConfirmed) return;

            const batch = writeBatch(db as Firestore);
            let count = 0;

            for (const item of items) {
                const newRef = doc(collection(db as Firestore, "syllablePuzzles"));
                batch.set(newRef, {
                    word: item.word,
                    syllables: item.syllables,
                    translation: item.translation,
                    difficulty: item.difficulty || 'Beginner',
                    level: difficultyToLevel(item.difficulty || 'Beginner'),
                    ...(item.languageId ? { languageId: item.languageId } : (form.languageId ? { languageId: form.languageId } : {}))
                });
                count++;
            }

            await batch.commit();
            await addDoc(collection(db, "logs"), {
                action: "BATCH_CREATE", details: `Batch imported ${count} syllable puzzles`,
                adminEmail: "Admin", targetId: "batch", timestamp: serverTimestamp()
            });

            invalidateCache('syllablePuzzles');
            invalidateCache('auditLogs');
            Swal.fire('Imported!', `${count} syllable puzzles added successfully.`, 'success');
            setBatchJson('');
            setShowBatch(false);
            loadEntries();
        } catch (error: any) {
            console.error("Batch import error:", error);
            Swal.fire('Import Failed', `Invalid JSON: ${error.message}`, 'error');
        }
    };

    const handleEdit = (entry: SyllableEntry) => {
        setForm({
            word: entry.word,
            syllables: entry.syllables.join(', '),
            translation: entry.translation,
            difficulty: entry.difficulty,
            languageId: entry.languageId || ''
        });
        setEditingId(entry.id);
        setShowForm(true);
        setShowBatch(false);
    };

    const handleDelete = async (entry: SyllableEntry) => {
        const result = await Swal.fire({
            title: 'Delete Puzzle?',
            text: `Remove "${entry.word}" (${entry.translation})?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#DC2626',
            cancelButtonColor: '#6B7280',
            confirmButtonText: 'Yes, Delete',
        });
        if (result.isConfirmed) {
            try {
                await deleteDoc(doc(db, "syllablePuzzles", entry.id));
                await addDoc(collection(db, "logs"), {
                    action: "DELETE", details: `Deleted syllable puzzle: ${entry.word}`,
                    adminEmail: "Admin", targetId: entry.id, timestamp: serverTimestamp()
                });
                invalidateCache('syllablePuzzles');
                invalidateCache('auditLogs');
                Swal.fire('Deleted!', 'Puzzle removed.', 'success');
                loadEntries();
            } catch (error) {
                Swal.fire('Error', 'Failed to delete.', 'error');
            }
        }
    };

    // Filtering & pagination
    const filtered = entries.filter(e => {
        const matchesSearch = !searchQuery ||
            e.word.toLowerCase().includes(searchQuery.toLowerCase()) ||
            e.translation.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesDifficulty = filterDifficulty === 'All' || e.difficulty === filterDifficulty;
        const matchesLanguage = filterLanguage === 'All' || e.languageId === filterLanguage || (filterLanguage === 'none' && !e.languageId);
        return matchesSearch && matchesDifficulty && matchesLanguage;
    });

    const indexOfLast = currentPage * itemsPerPage;
    const indexOfFirst = indexOfLast - itemsPerPage;
    const currentItems = filtered.slice(indexOfFirst, indexOfLast);
    const totalPages = Math.ceil(filtered.length / itemsPerPage);

    const difficultyColor = (d: string) => {
        if (d === 'Beginner') return '#10B981';
        if (d === 'Intermediate') return '#FACC15';
        return '#EF4444';
    };

    const BATCH_TEMPLATE = `[
  {
    "word": "Madi",
    "syllables": ["Ma", "di"],
    "translation": "Water",
    "difficulty": "Beginner",
    "languageId": "${languages[0]?.id || 'LANGUAGE_ID_HERE'}"
  },
  {
    "word": "Muṱhannga",
    "syllables": ["Mu", "ṱha", "nnga"],
    "translation": "Boy",
    "difficulty": "Intermediate",
    "languageId": "${languages[0]?.id || 'LANGUAGE_ID_HERE'}"
  }
]`;

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
                                Syllable <span style={{ color: '#FACC15' }}>Builder</span> 🧱
                            </h1>
                        </div>
                        <div className="mt-4 mt-md-0 d-flex gap-2">
                            <button onClick={() => { resetForm(); setShowBatch(false); setShowForm(!showForm); }}
                                className="btn btn-dark fw-bold smallest ls-1 px-4 py-2 rounded-pill shadow-sm d-flex align-items-center gap-2">
                                {showForm ? <><X size={14} /> CANCEL</> : <><Plus size={14} /> ADD ENTRY</>}
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
                            {editingId ? 'Edit Syllable Puzzle' : 'Add New Syllable Puzzle'}
                        </h5>
                        <form onSubmit={handleSubmit}>
                            <div className="row g-3">
                                <div className="col-md-4 col-lg-3">
                                    <label className="smallest fw-bold ls-1 text-uppercase text-secondary mb-2 d-block">Language *</label>
                                    <select className="form-select admin-input"
                                        value={form.languageId} onChange={e => setForm({ ...form, languageId: e.target.value })}>
                                        <option value="">— No Language —</option>
                                        {languages.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                                    </select>
                                </div>
                                <div className="col-md-4 col-lg-2">
                                    <label className="smallest fw-bold ls-1 text-uppercase text-secondary mb-2 d-block">Word *</label>
                                    <input className="form-control admin-input" placeholder="e.g. Madi"
                                        value={form.word} onChange={e => setForm({ ...form, word: e.target.value })} />
                                </div>
                                <div className="col-md-4 col-lg-3">
                                    <label className="smallest fw-bold ls-1 text-uppercase text-secondary mb-2 d-block">Syllables (comma sep) *</label>
                                    <input className="form-control admin-input" placeholder="e.g. Ma, di"
                                        value={form.syllables} onChange={e => setForm({ ...form, syllables: e.target.value })} />
                                    <small className="text-muted" style={{ fontSize: 10 }}>Separate with commas</small>
                                </div>
                                <div className="col-md-6 col-lg-2">
                                    <label className="smallest fw-bold ls-1 text-uppercase text-secondary mb-2 d-block">Translation *</label>
                                    <input className="form-control admin-input" placeholder="e.g. Water"
                                        value={form.translation} onChange={e => setForm({ ...form, translation: e.target.value })} />
                                </div>
                                <div className="col-md-6 col-lg-2">
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
                                <button type="submit" className="btn game-btn-yellow px-5 py-2 fw-bold smallest ls-1">
                                    {editingId ? 'SAVE CHANGES' : 'ADD PUZZLE'}
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
                        <p className="text-muted small mb-3">Paste a JSON array. Each item needs: <code>word</code>, <code>syllables</code> (array), <code>translation</code>. Optional: <code>difficulty</code>, <code>languageId</code>.</p>
                        <div className="mb-3">
                            <div className="d-flex gap-2 mb-2 align-items-center flex-wrap">
                                <button className="btn btn-outline-secondary btn-sm smallest fw-bold"
                                    onClick={() => setBatchJson(BATCH_TEMPLATE)}>
                                    Load Template
                                </button>
                                <span className="smallest text-muted">Fallback language for items without languageId:</span>
                                <select className="form-select admin-input" style={{ width: 160, fontSize: 12 }}
                                    value={form.languageId} onChange={e => setForm({ ...form, languageId: e.target.value })}>
                                    <option value="">— None —</option>
                                    {languages.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                                </select>
                            </div>
                            <textarea
                                className="form-control admin-input font-monospace"
                                rows={10}
                                placeholder={BATCH_TEMPLATE}
                                value={batchJson}
                                onChange={e => setBatchJson(e.target.value)}
                                style={{ fontSize: 13 }}
                            />
                        </div>
                        <div className="d-flex gap-3 justify-content-end">
                            <button onClick={() => setShowBatch(false)} className="btn text-muted smallest fw-bold ls-1">CANCEL</button>
                            <button onClick={handleBatchImport} className="btn game-btn-yellow px-5 py-2 fw-bold smallest ls-1">
                                IMPORT ALL
                            </button>
                        </div>
                    </div>
                )}

                {/* STATS & FILTERS */}
                <div className="bg-white rounded-4 border shadow-sm p-4 mb-4 d-flex flex-column flex-md-row align-items-md-center gap-3">
                    <div className="d-flex align-items-center gap-3 flex-shrink-0">
                        <div className="d-flex align-items-center justify-content-center rounded-3"
                            style={{ width: 48, height: 48, backgroundColor: '#EFF6FF' }}>
                            <Layout size={24} style={{ color: '#3B82F6' }} />
                        </div>
                        <div>
                            <p className="smallest fw-bold ls-1 text-uppercase text-muted mb-0">Total Syllable Puzzles</p>
                            <h3 className="fw-bold mb-0">{entries.length}</h3>
                        </div>
                    </div>
                    <div className="ms-md-auto d-flex gap-2 flex-wrap">
                        <div className="position-relative">
                            <Search size={14} className="position-absolute top-50 translate-middle-y" style={{ left: 12, color: '#9CA3AF' }} />
                            <input className="form-control admin-input ps-4" placeholder="Search word or translation..."
                                style={{ minWidth: 180, fontSize: 13 }}
                                value={searchQuery} onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }} />
                        </div>
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
                    </div>
                </div>

                {/* PUZZLE LIST */}
                {loading ? (
                    <div className="text-center py-5">
                        <Loader2 className="animate-spin text-warning mx-auto mb-3" size={48} />
                        <p className="ls-1 smallest fw-bold text-muted">LOADING PUZZLES...</p>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-5 bg-white rounded-4 border">
                        <Layout className="text-muted mx-auto mb-3" size={48} />
                        <p className="mt-3 fw-bold text-muted">No syllable puzzles found. Add your first entry!</p>
                    </div>
                ) : (
                    <>
                        <div className="row g-3 px-2">
                            {currentItems.map((entry) => (
                                <div key={entry.id} className="col-md-6 col-lg-4">
                                    <div className="bg-white border rounded-4 shadow-sm p-4 h-100 admin-card">
                                        <div className="d-flex justify-content-between align-items-start mb-2">
                                            <div>
                                                <h5 className="fw-bold mb-0" style={{ color: '#111827' }}>{entry.word}</h5>
                                                <p className="text-muted small mb-1">{entry.translation}</p>
                                            </div>
                                            <div className="d-flex flex-column align-items-end gap-1">
                                                <span className="badge rounded-pill px-2 py-1" style={{
                                                    backgroundColor: `${difficultyColor(entry.difficulty)}20`,
                                                    color: difficultyColor(entry.difficulty),
                                                    fontSize: 10, fontWeight: 700
                                                }}>
                                                    {entry.difficulty === 'Advanced' ? 'Level 3' : entry.difficulty === 'Intermediate' ? 'Level 2' : 'Level 1'} ({entry.difficulty})
                                                </span>
                                                <span className="badge bg-light text-muted border px-2 py-1 d-flex align-items-center gap-1" style={{ fontSize: 9, fontWeight: 600 }}>
                                                    <Globe size={9} />{getLangName(entry.languageId)}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="d-flex flex-wrap gap-1 mb-3">
                                            {entry.syllables.map((syl, i) => (
                                                <span key={i} className="badge bg-light text-dark border px-2 py-1"
                                                    style={{ fontSize: 12, fontWeight: 600 }}>
                                                    {syl}
                                                </span>
                                            ))}
                                        </div>
                                        <div className="d-flex gap-2">
                                            <button onClick={() => handleEdit(entry)} className="btn btn-sm btn-outline-dark rounded-pill px-3 d-flex align-items-center gap-1"
                                                style={{ fontSize: 11 }}>
                                                <Edit size={12} />Edit
                                            </button>
                                            <button onClick={() => handleDelete(entry)} className="btn btn-sm btn-outline-danger rounded-pill px-3 d-flex align-items-center gap-1"
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
                .admin-input { background-color: #f8f9fa; border: 1px solid #dee2e6; border-radius: 8px; font-size: 14px; }
                .admin-input:focus { border-color: #FACC15; background-color: #fff; box-shadow: none; }
                .admin-card { transition: all 0.2s; }
                .admin-card:hover { border-color: #FACC15 !important; }
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

export default AdminSyllableBuilder;








