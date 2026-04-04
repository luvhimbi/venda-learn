import React, { useState, useEffect } from 'react';
import { db } from '../../services/firebaseConfig';
import { collection, addDoc, doc, updateDoc, getDocs, serverTimestamp, query, orderBy } from 'firebase/firestore';
import AdminNavbar from '../../components/AdminNavbar';
import { invalidateCache } from '../../services/dataCache';
import Swal from 'sweetalert2';
import { Globe, Edit, Loader2, Plus, X, Languages } from 'lucide-react';

interface LanguageEntry {
    id: string;
    name: string;
    code: string;
    createdAt?: any;
}

const AdminLanguages: React.FC = () => {
    const [languages, setLanguages] = useState<LanguageEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState({ name: '', code: '' });

    const loadLanguages = async () => {
        setLoading(true);
        try {
            const q = query(collection(db, "languages"), orderBy("name", "asc"));
            const snap = await getDocs(q);
            const list = snap.docs.map(d => ({ id: d.id, ...d.data() })) as LanguageEntry[];
            setLanguages(list);
            
            // If empty, seed Venda as default
            if (list.length === 0) {
                await addDoc(collection(db, "languages"), {
                    name: "Venda",
                    code: "ve",
                    createdAt: serverTimestamp()
                });
                loadLanguages();
            }
        } catch (error) {
            console.error("Error loading languages:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadLanguages(); }, []);

    const resetForm = () => {
        setForm({ name: '', code: '' });
        setEditingId(null);
        setShowForm(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name || !form.code) {
            return Swal.fire('Missing Fields', 'Name and Code are required.', 'warning');
        }

        try {
            if (editingId) {
                await updateDoc(doc(db, "languages", editingId), { ...form });
                await addDoc(collection(db, "logs"), {
                    action: "UPDATE", details: `Updated language: ${form.name}`,
                    adminEmail: "Admin", targetId: editingId, timestamp: serverTimestamp()
                });
                Swal.fire('Updated!', 'Language has been updated.', 'success');
            } else {
                const ref = await addDoc(collection(db, "languages"), { 
                    ...form,
                    createdAt: serverTimestamp()
                });
                await addDoc(collection(db, "logs"), {
                    action: "CREATE", details: `Added language: ${form.name}`,
                    adminEmail: "Admin", targetId: ref.id, timestamp: serverTimestamp()
                });
                Swal.fire('Added!', 'New language added.', 'success');
            }
            invalidateCache('languages'); // Invalidate cache
            invalidateCache('auditLogs');
            resetForm();
            loadLanguages();
        } catch (error) {
            console.error("Save error:", error);
            Swal.fire('Error', 'Failed to save language.', 'error');
        }
    };

    const handleEdit = (lang: LanguageEntry) => {
        setForm({ name: lang.name, code: lang.code });
        setEditingId(lang.id);
        setShowForm(true);
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
                                Localization
                            </span>
                            <h1 className="fw-bold ls-tight mb-0 text-dark" style={{ fontSize: '2.5rem' }}>
                                Manage <span style={{ color: '#FACC15' }}>Languages</span>
                            </h1>
                        </div>
                        <div className="mt-4 mt-md-0">
                            <button onClick={() => { resetForm(); setShowForm(!showForm); }}
                                className="btn btn-dark fw-bold smallest ls-1 px-4 py-2 rounded-pill shadow-sm d-flex align-items-center gap-2">
                                {showForm ? <><X size={14} /> CANCEL</> : <><Plus size={14} /> ADD LANGUAGE</>}
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
                            {editingId ? 'Edit Language' : 'Add New Language'}
                        </h5>
                        <form onSubmit={handleSubmit}>
                            <div className="row g-3">
                                <div className="col-md-6">
                                    <label className="smallest fw-bold ls-1 text-uppercase text-secondary mb-2 d-block">Language Name *</label>
                                    <input className="form-control lang-input" placeholder="e.g. Zulu"
                                        value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                                </div>
                                <div className="col-md-6">
                                    <label className="smallest fw-bold ls-1 text-uppercase text-secondary mb-2 d-block">ISO Code *</label>
                                    <input className="form-control lang-input" placeholder="e.g. zu"
                                        value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} />
                                </div>
                            </div>
                            <div className="mt-4 d-flex gap-3 justify-content-end">
                                <button type="button" onClick={resetForm} className="btn text-muted smallest fw-bold ls-1">CANCEL</button>
                                <button type="submit" className="btn game-btn-yellow px-5 py-2 fw-bold smallest ls-1">
                                    {editingId ? 'SAVE CHANGES' : 'ADD LANGUAGE'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* STATS */}
                <div className="bg-white rounded-4 border shadow-sm p-4 mb-4 d-flex align-items-center gap-3">
                    <div className="d-flex align-items-center justify-content-center rounded-3"
                        style={{ width: 48, height: 48, backgroundColor: '#FEF3C7' }}>
                        <Languages size={24} style={{ color: '#D97706' }} />
                    </div>
                    <div>
                        <p className="smallest fw-bold ls-1 text-uppercase text-muted mb-0">Total Languages Supported</p>
                        <h3 className="fw-bold mb-0">{languages.length}</h3>
                    </div>
                    <div className="ms-auto text-end d-none d-md-block">
                        <p className="smallest text-muted mb-0">Courses and quizzes can be linked to these languages.</p>
                    </div>
                </div>

                {/* LANGUAGE LIST */}
                {loading ? (
                    <div className="text-center py-5">
                        <Loader2 className="animate-spin text-warning mx-auto mb-3" size={48} />
                        <p className="ls-1 smallest fw-bold text-muted">LOADING LANGUAGES...</p>
                    </div>
                ) : languages.length === 0 ? (
                    <div className="text-center py-5 bg-white rounded-4 border">
                        <Globe className="text-muted mx-auto mb-3" size={48} />
                        <p className="mt-3 fw-bold text-muted">No languages yet. Add your first language!</p>
                    </div>
                ) : (
                    <div className="row g-3 px-2">
                        {languages.map((lang) => (
                            <div key={lang.id} className="col-md-6 col-lg-4">
                                <div className="bg-white border rounded-4 shadow-sm p-4 h-100 lang-card">
                                    <div className="d-flex justify-content-between align-items-start mb-3">
                                        <div>
                                            <h4 className="fw-bold mb-0" style={{ color: '#111827' }}>{lang.name}</h4>
                                            <p className="smallest fw-bold text-warning ls-1 text-uppercase mb-0">Code: {lang.code}</p>
                                        </div>
                                        <div className="d-flex gap-2">
                                            <button onClick={() => handleEdit(lang)} className="btn btn-sm btn-outline-dark rounded-pill px-3 d-flex align-items-center gap-1"
                                                style={{ fontSize: 11 }}>
                                                <Edit size={12} />Edit
                                            </button>
                                        </div>
                                    </div>
                                    <div className="p-2 bg-light rounded-3 mt-2">
                                        <p className="mb-0 smallest text-muted">Language ID: <span className="fw-bold text-dark">{lang.id}</span></p>
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
                @keyframes pulseAdmin { 0% { opacity: 0.7; } 50% { opacity: 1; } 100% { opacity: 0.7; } }
                .lang-input { background-color: #f8f9fa; border: 1px solid #dee2e6; border-radius: 8px; font-size: 14px; }
                .lang-input:focus { border-color: #FACC15; background-color: #fff; box-shadow: none; }
                .lang-card { transition: all 0.2s; }
                .lang-card:hover { border-color: #FACC15 !important; border-bottom: 4px solid #FACC15 !important; transform: translateY(-2px); }
                .game-btn-yellow {
                    background-color: #FACC15 !important; color: #000 !important;
                    border-radius: 8px; box-shadow: 0 4px 0 #A1810B !important; border: none;
                    transition: all 0.1s;
                }
                .game-btn-yellow:active { transform: translateY(2px); box-shadow: 0 2px 0 #A1810B !important; }
            `}</style>
        </div>
    );
};

export default AdminLanguages;
