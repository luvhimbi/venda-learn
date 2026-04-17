import React, { useState, useEffect } from 'react';
import { db } from '../../services/firebaseConfig';
import { collection, doc, deleteDoc, addDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import AdminNavbar from '../../components/shared/navigation/AdminNavbar';
import { fetchLessons as fetchLessonsFromCache, invalidateCache, getMicroLessons, incrementGlobalCacheVersion } from '../../services/dataCache';
import { clearCollection, migrateLanguages } from '../../services/dataAdmin';
import { seedLessons } from '../../services/seedDatabase';
import { seedPuzzles } from '../../services/seedPuzzles';
import { runSystemOverhaul } from '../../services/gameSeeder';
import Swal from 'sweetalert2';
import { Trash2, Edit, Plus, RefreshCw, Loader2, Download, ArrowDownUp, Folder, ChevronDown, ChevronRight, Bomb } from 'lucide-react';

const AdminLessons: React.FC = () => {
    const [lessons, setLessons] = useState<any[]>([]);
    const [languages, setLanguages] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});

    const loadLessons = async () => {
        setLoading(true);
        try {
            const list = await fetchLessonsFromCache();
            setLessons(list);
            
            const q = collection(db, "languages");
            const { getDocs } = await import('firebase/firestore');
            const snap = await getDocs(q);
            setLanguages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        } catch (error) {
            console.error("Error fetching:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadLessons();
    }, []);

    const toggleFolder = (langId: string) => {
        setExpandedFolders(prev => ({ ...prev, [langId]: !prev[langId] }));
    };

    const getGroupedData = () => {
        const groups = languages.map(lang => ({
            ...lang,
            lessons: lessons.filter(l => l.languageId === lang.id || (lang.id === 'venda' && (!l.languageId || l.languageId === 'venda')))
        }));

        const matchedIds = new Set(languages.map(l => l.id));
        const orphaned = lessons.filter(l => l.languageId && !matchedIds.has(l.languageId));
        
        if (orphaned.length > 0) {
            groups.push({ id: 'orphaned', name: 'Other Content', code: '??', lessons: orphaned });
        }

        return groups.filter(g => g.lessons.length > 0);
    };

    const groupedData = getGroupedData();

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
                invalidateCache('lessons');
                invalidateCache('auditLogs');
                await incrementGlobalCacheVersion();
                loadLessons();
            } catch (error) {
                Swal.fire('Error', 'Failed to delete.', 'error');
            }
        }
    };

    const handleSeedDatabase = async () => {
        const result = await Swal.fire({
            title: 'Deep System Sync?',
            text: "This will: 1. Standardize language IDs, 2. Clear ALL existing lessons, 3. Seed fresh lessons & games. Your progress logic remains unchanged.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#FACC15',
            cancelButtonColor: '#d33',
            confirmButtonText: 'YES, SYNC EVERYTHING'
        });

        if (result.isConfirmed) {
            setLoading(true);
            try {
                // 1. Migrate languages to slugs
                await migrateLanguages();
                
                // 2. Clear lessons collection
                await clearCollection("lessons");
                
                // 3. Clear puzzle collection
                await clearCollection("puzzleWords");

                // 4. Seed fresh data
                await seedLessons();
                await seedPuzzles();
                
                await createAuditLog("DEEP_SYNC", "Performed systematic database cleanup and re-seeding.", "System-Wide");
                
                invalidateCache('lessons');
                invalidateCache('auditLogs');
                invalidateCache('languages');
                invalidateCache('puzzles');
                
                await incrementGlobalCacheVersion();
                loadLessons();
                
                Swal.fire('Success', 'Deep sync completed! 6 lessons and puzzles are now active.', 'success');
            } catch (error) {
                console.error("Deep sync failed:", error);
                Swal.fire('Error', 'Deep sync failed. Check console.', 'error');
            } finally {
                setLoading(false);
            }
        }
    };

    const handleSystemOverhaul = async () => {
        const result = await Swal.fire({
            title: '☢️ NUCLEAR SYSTEM RESET?',
            text: "This is a CRITICAL operation. It will: 1. Wipe ALL old game data, 2. Import levels from JSON, 3. Reset all world tracking. This cannot be undone.",
            icon: 'error',
            showCancelButton: true,
            confirmButtonColor: '#DC2626',
            cancelButtonColor: '#6B7280',
            confirmButtonText: 'YES, NUKE & REBOOT'
        });

        if (result.isConfirmed) {
            setLoading(true);
            try {
                await runSystemOverhaul();
                await createAuditLog("SYSTEM_OVERHAUL", "Performed a full data wipe and level-based restoration from JSON sources.", "Global");
                
                invalidateCache(); // Full purge
                await incrementGlobalCacheVersion();
                loadLessons();
                
                Swal.fire('Success', 'Game system overhauled! All data is now level-driven.', 'success');
            } catch (error) {
                console.error("Overhaul failed:", error);
                Swal.fire('Error', 'Overhaul failed. See console.', 'error');
            } finally {
                setLoading(false);
            }
        }
    };

    const handleExport = (lesson: any) => {
        try {
            const dataStr = JSON.stringify(lesson, null, 2);
            const blob = new Blob([dataStr], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `course-${lesson.id}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            createAuditLog("EXPORT", `Exported course data for: ${lesson.id}`, lesson.id);
        } catch (error) {
            console.error("Export error:", error);
            Swal.fire({
                title: 'Export Failed',
                text: 'Could not export course data.',
                icon: 'error',
                confirmButtonColor: '#DC2626'
            });
        }
    };

    const handleUpdateOrder = async (lessonId: string, currentOrder: number | undefined, newValue: string) => {
        const newOrder = parseInt(newValue, 10);
        if (isNaN(newOrder) || newOrder === currentOrder) return;
        try {
            await updateDoc(doc(db, "lessons", lessonId), { order: newOrder });
            createAuditLog("UPDATE", `Updated order for course ${lessonId} to ${newOrder}`, lessonId);
            Swal.fire({
                toast: true,
                position: 'bottom-end',
                icon: 'success',
                title: 'Order updated',
                showConfirmButton: false,
                timer: 2000
            });
            invalidateCache('lessons');
            await incrementGlobalCacheVersion();
            loadLessons();
        } catch (error) {
            console.error("Error updating order:", error);
            Swal.fire({
                toast: true, position: 'bottom-end', icon: 'error', title: 'Failed to update order', showConfirmButton: false, timer: 2000
            });
        }
    };

    return (
        <div className="min-vh-100 pb-5 bg-theme-base">
            <AdminNavbar />

            <div className="py-5 bg-theme-surface border-bottom shadow-sm">
                <div className="container" style={{ maxWidth: '1100px' }}>
                    <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-end px-3">
                        <div>
                            <span className="shumela-venda-pulse fw-bold ls-1 text-uppercase smallest d-block mb-2 text-warning-custom">
                                Admin Control
                            </span>
                            <h1 className="fw-bold ls-tight mb-0 text-theme-main" style={{ fontSize: '2.5rem' }}>
                                Manage <span className="text-warning-custom">Courses</span>
                            </h1>
                        </div>
                        <div className="mt-4 mt-md-0 d-flex gap-2">
                             <button onClick={handleSeedDatabase} className="btn-premium-action warning d-flex align-items-center gap-2 smallest fw-bold" title="Sync lessons and standardized data">
                                <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> DEEP SYNC
                            </button>
                            <button onClick={handleSystemOverhaul} className="btn-premium-action secondary d-flex align-items-center gap-2 smallest fw-bold text-danger" title="SYSTEM OVERHAUL: Wipe games and create levels from JSON">
                                <Bomb size={14} /> NUCLEAR REBOOT
                            </button>
                             <Link to="/admin/add-lesson" className="btn-premium-action info d-flex align-items-center gap-2 smallest fw-bold">
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
                        <p className="ls-1 smallest fw-bold text-theme-muted">FETCHING DATABASE...</p>
                    </div>
                ) : (
                    <div className="row g-4 px-2">
                        {groupedData.length === 0 ? (
                            <div className="text-center py-5 bg-theme-surface rounded-4 border w-100 shadow-sm">
                                <Folder className="text-theme-muted mx-auto mb-3" size={48} />
                                <p className="mt-3 fw-bold text-theme-muted">No courses found. Add your first course to a language!</p>
                            </div>
                        ) : (
                            groupedData.map((group) => (
                                <div key={group.id} className="col-12 mb-3">
                                    <div 
                                        onClick={() => toggleFolder(group.id)}
                                        className="folder-header p-3 rounded-4 bg-theme-surface border border-theme-soft cursor-pointer shadow-sm d-flex align-items-center justify-content-between"
                                        style={{ transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }}
                                    >
                                        <div className="d-flex align-items-center gap-3">
                                            <div className="icon-box-premium" style={{ backgroundColor: 'var(--color-bg)' }}>
                                                <Folder size={20} className="text-warning-custom" />
                                            </div>
                                            <div>
                                                <h5 className="fw-bold mb-0 text-theme-main d-flex align-items-center gap-2">
                                                    {group.name}
                                                    <span className="badge-pill-premium" style={{ fontSize: 10 }}>
                                                        {group.code.toUpperCase()}
                                                    </span>
                                                </h5>
                                                <p className="smallest text-theme-muted fw-bold ls-1 mb-0 text-uppercase">
                                                    {group.lessons.length} COURSE{group.lessons.length !== 1 ? 'S' : ''} INSIDE
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-theme-muted">
                                            {expandedFolders[group.id] ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                                        </div>
                                    </div>

                                    {expandedFolders[group.id] && (
                                        <div className="row g-3 px-3 mt-2">
                                            {group.lessons.sort((a: any, b: any) => (a.order || 0) - (b.order || 0)).map((lesson: any) => (
                                                <div key={lesson.id} className="col-12">
                                                    <div className="card-premium p-4 position-relative overflow-hidden lesson-card-admin">
                                                        <div className="row align-items-center">
                                                            <div className="col-md-5">
                                                                <div className="d-flex align-items-center gap-3 mb-2">
                                                                    <div className="d-flex align-items-center bg-theme-base border border-theme-soft rounded-pill px-2 py-1" style={{ width: 'fit-content' }}>
                                                                        <ArrowDownUp size={12} className="text-theme-muted me-1" />
                                                                        <input 
                                                                            type="number" 
                                                                            className="border-0 bg-transparent text-center smallest fw-bold ls-1 p-0 m-0 text-theme-main" 
                                                                            style={{ width: '30px', outline: 'none' }}
                                                                            defaultValue={lesson.order || ''}
                                                                            placeholder="—"
                                                                            onBlur={(e) => handleUpdateOrder(lesson.id, lesson.order, e.target.value)}
                                                                            onKeyDown={(e) => { if(e.key === 'Enter') e.currentTarget.blur() }}
                                                                            title="Set course order (1 = first)"
                                                                        />
                                                                    </div>
                                                                    <span className={`badge-pill-difficulty ${lesson.difficulty === 'Beginner' ? 'beginner' :
                                                                            lesson.difficulty === 'Intermediate' ? 'intermediate' : 'expert'}`}>
                                                                        {lesson.difficulty}
                                                                    </span>
                                                                    <span className="text-theme-muted smallest fw-bold ls-1">ID: {lesson.id}</span>
                                                                </div>
                                                                <h3 className="fw-bold mb-1 ls-1 text-theme-main">
                                                                    {lesson.title} <span className="text-theme-muted" style={{ fontWeight: 400 }}>/ {lesson.vendaTitle}</span>
                                                                </h3>
                                                                <p className="text-theme-muted mb-0 smallest fw-bold ls-1 text-uppercase">
                                                                    {getMicroLessons(lesson).length} Micro Lessons • {getMicroLessons(lesson).reduce((acc: number, ml: any) => acc + (ml.slides?.length || 0), 0)} Slides
                                                                </p>
                                                            </div>
                                                            <div className="col-md-7 text-md-end mt-3 mt-md-0 d-flex gap-2 justify-content-md-end">
                                                                <button onClick={() => handleExport(lesson)} className="btn-premium-action secondary" title="Export Course JSON">
                                                                    <Download size={16} />
                                                                </button>
                                                                <Link to={`/admin/edit-lesson/${lesson.id}`} className="btn-premium-action secondary d-flex align-items-center gap-2 text-decoration-none">
                                                                    <Edit size={14} /> EDIT
                                                                </Link>
                                                                <button onClick={() => handleDelete(lesson.id)} className="btn-premium-action danger">
                                                                    <Trash2 size={16} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                        <div className="accent-bar-premium"></div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
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
                .lesson-card-admin:hover {
                    transform: translateX(8px);
                    border-color: var(--venda-yellow-dark);
                }
                .accent-bar-premium {
                    position: absolute;
                    left: 0;
                    top: 0;
                    bottom: 0;
                    width: 5px;
                    background-color: var(--venda-yellow);
                }
                .icon-box-premium {
                    width: 44px;
                    height: 44px;
                    background-color: var(--color-surface-soft);
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .badge-pill-premium {
                    background-color: var(--color-surface-soft);
                    color: var(--color-text-muted);
                    padding: 4px 10px;
                    border-radius: 50px;
                    border: 1px solid var(--color-border);
                }
                .badge-pill-difficulty {
                    padding: 4px 12px;
                    border-radius: 50px;
                    font-size: 10px;
                    font-weight: 800;
                    letter-spacing: 1px;
                    text-transform: uppercase;
                }
                .badge-pill-difficulty.beginner { background-color: #dcfce7; color: #166534; }
                .badge-pill-difficulty.intermediate { background-color: #fef3c7; color: #92400e; }
                .badge-pill-difficulty.expert { background-color: #fee2e2; color: #b91c1c; }
                
                [data-theme='dark'] .badge-pill-difficulty.beginner { background-color: #064e3b; color: #6ee7b7; }
                [data-theme='dark'] .badge-pill-difficulty.intermediate { background-color: #451a03; color: #fcd34d; }
                [data-theme='dark'] .badge-pill-difficulty.expert { background-color: #450a0a; color: #f87171; }

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
                .btn-premium-action.danger { background-color: #fee2e2; color: #ef4444; }
                .btn-premium-action.danger:hover { background-color: #fecaca; }
                [data-theme='dark'] .btn-premium-action.danger { background-color: #450a0a; color: #f87171; }
                
                .folder-header:hover { border-color: var(--venda-yellow-dark) !important; transform: scale(1.01); }
                .shumela-venda-pulse { animation: pulseAdmin 3s infinite ease-in-out; }
                @keyframes pulseAdmin { 0% { opacity: 0.7; } 50% { opacity: 1; color: var(--venda-yellow-dark); } 100% { opacity: 0.7; } }
            `}</style>
        </div>
    );
};

export default AdminLessons;








