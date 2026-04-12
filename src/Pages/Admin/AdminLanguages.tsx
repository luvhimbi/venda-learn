import React, { useState, useEffect } from 'react';
import { db } from '../../services/firebaseConfig';
import { collection, addDoc, doc, updateDoc, getDocs, serverTimestamp, query, orderBy } from 'firebase/firestore';
import AdminNavbar from '../../components/AdminNavbar';
import { invalidateCache } from '../../services/dataCache';
import Swal from 'sweetalert2';
import { Globe, Edit, Loader2, Plus, X, Languages } from 'lucide-react';
import LanguageCharacter from '../../components/illustrations/LanguageCharacters';

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
        <div className="min-vh-100 pb-5 bg-theme-base">
            <AdminNavbar />

            {/* HEADER */}
            <div className="py-5 bg-theme-surface border-bottom shadow-sm">
                <div className="container" style={{ maxWidth: '1100px' }}>
                    <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-end px-3">
                        <div>
                            <span className="shumela-venda-pulse fw-bold ls-1 text-uppercase smallest d-block mb-2 text-warning-custom">
                                Localization
                            </span>
                            <h1 className="fw-bold ls-tight mb-0 text-theme-main" style={{ fontSize: '2.5rem' }}>
                                Manage <span className="text-warning-custom">Languages</span>
                            </h1>
                        </div>
                        <div className="mt-4 mt-md-0">
                            <button onClick={() => { resetForm(); setShowForm(!showForm); }}
                                className={`btn-premium-action ${showForm ? 'secondary' : 'warning'} px-4 py-2 d-flex align-items-center gap-2`}>
                                {showForm ? <><X size={14} /> CANCEL</> : <><Plus size={14} /> ADD LANGUAGE</>}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container py-5" style={{ maxWidth: '1100px' }}>

                {/* ADD/EDIT FORM */}
                {showForm && (
                    <div className="card-premium p-4 mb-5">
                        <h5 className="fw-bold ls-1 mb-4 smallest text-uppercase text-theme-muted border-bottom border-theme-soft pb-2">
                            {editingId ? 'Edit Language' : 'Add New Language'}
                        </h5>
                        <form onSubmit={handleSubmit}>
                            <div className="row g-3">
                                <div className="col-md-6">
                                    <label className="smallest fw-bold ls-1 text-uppercase text-theme-muted mb-2 d-block">Language Name *</label>
                                    <input className="form-control premium-search" placeholder="e.g. Zulu"
                                        value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                                </div>
                                <div className="col-md-6">
                                    <label className="smallest fw-bold ls-1 text-uppercase text-theme-muted mb-2 d-block">ISO Code *</label>
                                    <input className="form-control premium-search" placeholder="e.g. zu"
                                        value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} />
                                </div>
                            </div>
                            <div className="mt-4 d-flex gap-3 justify-content-end">
                                <button type="button" onClick={resetForm} className="btn-premium-action secondary">CANCEL</button>
                                <button type="submit" className="btn-premium-action warning px-5">
                                    {editingId ? 'SAVE CHANGES' : 'ADD LANGUAGE'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* STATS */}
                <div className="card-premium p-4 mb-4 d-flex align-items-center gap-3">
                    <div className="icon-box-premium">
                        <Languages size={24} className="text-warning-custom" />
                    </div>
                    <div>
                        <p className="smallest fw-bold ls-1 text-uppercase text-theme-muted mb-0">Total Languages Supported</p>
                        <h3 className="fw-bold mb-0 text-theme-main">{languages.length}</h3>
                    </div>
                    <div className="ms-auto text-end d-none d-md-block">
                        <p className="smallest text-theme-muted mb-0">Courses and quizzes can be linked to these languages.</p>
                    </div>
                </div>

                {/* LANGUAGE LIST */}
                {loading ? (
                    <div className="text-center py-5">
                        <Loader2 className="animate-spin text-warning mx-auto mb-3" size={48} />
                        <p className="ls-1 smallest fw-bold text-theme-muted">LOADING LANGUAGES...</p>
                    </div>
                ) : languages.length === 0 ? (
                    <div className="text-center py-5 bg-theme-surface rounded-4 border">
                        <Globe className="text-theme-muted mx-auto mb-3" size={48} />
                        <p className="mt-3 fw-bold text-theme-muted">No languages yet. Add your first language!</p>
                    </div>
                ) : (
                    <div className="row g-3 px-2">
                        {languages.map((lang) => (
                            <div key={lang.id} className="col-md-6 col-lg-4">
                                <div className="card-premium p-4 h-100 lang-card">
                                    <div className="d-flex justify-content-between align-items-start mb-3">
                                        <div className="d-flex align-items-center gap-3">
                                            <div className="avatar-premium-lg">
                                                <LanguageCharacter languageName={lang.name} style={{ height: '70%', width: 'auto' }} />
                                            </div>
                                            <div>
                                                <h4 className="fw-bold mb-0 text-theme-main">{lang.name}</h4>
                                                <p className="smallest fw-bold text-warning-custom ls-1 text-uppercase mb-0">Code: {lang.code}</p>
                                            </div>
                                        </div>
                                        <div className="d-flex gap-2">
                                            <button onClick={() => handleEdit(lang)} className="btn-premium-action secondary px-3 py-1"
                                                style={{ fontSize: 11 }}>
                                                <Edit size={12} />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="p-2 bg-theme-surface-soft rounded-3 mt-2 border border-theme-soft">
                                        <p className="mb-0 smallest text-theme-muted">Language ID: <span className="fw-bold text-theme-main">{lang.id}</span></p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <style>{`
                .text-warning-custom { color: var(--venda-yellow-dark) !important; }
                .card-premium {
                    background-color: var(--color-surface);
                    border: 1px solid var(--color-border);
                    border-radius: 20px;
                    box-shadow: var(--shadow-premium);
                    transition: all 0.3s ease;
                }
                .lang-card:hover {
                    transform: translateY(-8px);
                    border-color: var(--venda-yellow-dark);
                }
                .icon-box-premium {
                    width: 48px;
                    height: 48px;
                    background-color: var(--color-surface-soft);
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .avatar-premium-lg {
                    width: 60px;
                    height: 60px;
                    background-color: var(--color-surface-soft);
                    border-radius: 16px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                }
                .btn-premium-action {
                    font-weight: 700;
                    font-size: 0.75rem;
                    letter-spacing: 1px;
                    padding: 10px 16px;
                    border-radius: 12px;
                    transition: all 0.2s;
                    border: 1px solid transparent;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .btn-premium-action.warning { background-color: var(--venda-yellow); color: #000; }
                .btn-premium-action.warning:hover { background-color: var(--venda-yellow-dark); }
                .btn-premium-action.secondary { background-color: var(--color-surface-soft); color: var(--color-text); border-color: var(--color-border); }
                .btn-premium-action.secondary:hover { background-color: var(--color-border); }
                
                .premium-search {
                    background-color: var(--color-surface-soft) !important;
                    border: 1px solid var(--color-border) !important;
                    border-radius: 12px !important;
                    padding: 12px 15px !important;
                    color: var(--color-text) !important;
                }
                .shumela-venda-pulse { animation: pulseAdmin 3s infinite ease-in-out; }
                @keyframes pulseAdmin { 0% { opacity: 0.7; } 50% { opacity: 1; color: var(--venda-yellow-dark); } 100% { opacity: 0.7; } }
            `}</style>
        </div>
    );
};

export default AdminLanguages;
