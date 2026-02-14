import React, { useState, useEffect, useRef } from 'react';
import { db } from '../services/firebaseConfig';
import { doc, updateDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { useNavigate, useParams } from 'react-router-dom';
import AdminNavbar from '../components/AdminNavbar';
import QuestionBuilder from '../components/QuestionBuilder';
import { fetchLessons, invalidateCache } from '../services/dataCache';
import useAutoSave from '../hooks/useAutoSave';
import Swal from 'sweetalert2';

const EditLesson: React.FC = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [lesson, setLesson] = useState<any>(null);
    const autoSaveKey = `draft-edit-lesson-${id}`;
    const { recovered, lastSaved, clearSaved, dismissRecovery } = useAutoSave(autoSaveKey, lesson, setLesson);
    const savedRef = useRef(false);

    // Warn on browser tab close / refresh
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (!savedRef.current) {
                e.preventDefault();
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, []);

    const confirmLeave = async () => {
        const result = await Swal.fire({
            title: 'Discard unsaved changes?',
            text: 'Any changes you made will be lost.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes, discard',
            cancelButtonText: 'Keep editing',
            confirmButtonColor: '#dc3545',
            cancelButtonColor: '#6c757d',
        });
        if (result.isConfirmed) {
            clearSaved();
            navigate('/admin/lessons');
        }
    };

    useEffect(() => {
        const loadLesson = async () => {
            if (!id) return;
            try {
                const lessons = await fetchLessons();
                const found = lessons.find((l: any) => l.id === id);
                if (found) {
                    setLesson(found);
                } else {
                    Swal.fire('Error', 'Lesson not found', 'error');
                    navigate('/admin/lessons');
                }
            } catch (error) {
                console.error("Error:", error);
            } finally {
                setLoading(false);
            }
        };
        loadLesson();
    }, [id, navigate]);

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await updateDoc(doc(db, "lessons", id!), lesson);

            await addDoc(collection(db, "logs"), {
                action: "UPDATE",
                details: `Updated lesson content: ${lesson.title} (${id})`,
                adminEmail: "Admin",
                targetId: id,
                timestamp: serverTimestamp()
            });

            await Swal.fire({
                title: 'Changes Saved!',
                text: 'Lesson content has been updated successfully.',
                icon: 'success',
                confirmButtonColor: '#FACC15'
            });
            invalidateCache('lessons');
            invalidateCache('auditLogs');
            savedRef.current = true;
            clearSaved();
            navigate('/admin/lessons');
        } catch (error) {
            console.error("Update error:", error);
            Swal.fire('Error', 'Failed to update lesson.', 'error');
        }
    };

    const updateSlide = (index: number, field: string, value: string) => {
        const newSlides = [...lesson.slides];
        newSlides[index] = { ...newSlides[index], [field]: value };
        setLesson({ ...lesson, slides: newSlides });
    };

    const addSlide = () => {
        setLesson({
            ...lesson,
            slides: [...lesson.slides, { venda: '', english: '', context: '' }]
        });
    };

    const handleBulkAdd = async () => {
        const { value: text } = await Swal.fire({
            title: 'Bulk Add Slides',
            input: 'textarea',
            inputLabel: 'Paste words (Venda | English | Context)',
            inputPlaceholder: 'Ndaa | Hello | Greeting\nVukani | Wake up\nMasiari | Afternoon',
            inputAttributes: {
                'aria-label': 'Paste your words here'
            },
            showCancelButton: true,
            confirmButtonColor: '#FACC15',
            confirmButtonText: 'Add Slides',
            footer: '<small>Format: Venda | English | Context (one per line)</small>'
        });

        if (text) {
            const lines = text.split('\n').filter((l: string) => l.trim());
            const newSlides = lines.map((line: string) => {
                const parts = line.split('|').map(p => p.trim());
                return {
                    venda: parts[0] || '',
                    english: parts[1] || '',
                    context: parts[2] || ''
                };
            });

            if (newSlides.length > 0) {
                // Remove the initial empty slide if it's the only one and is empty
                const currentSlides = [...lesson.slides];
                if (currentSlides.length === 1 && !currentSlides[0].venda && !currentSlides[0].english && !currentSlides[0].context) {
                    setLesson({ ...lesson, slides: newSlides });
                } else {
                    setLesson({ ...lesson, slides: [...currentSlides, ...newSlides] });
                }

                Swal.fire({
                    title: 'Success!',
                    text: `Added ${newSlides.length} slides.`,
                    icon: 'success',
                    timer: 2000,
                    showConfirmButton: false
                });
            }
        }
    };

    const removeSlide = (index: number) => {
        if (lesson.slides.length <= 1) return Swal.fire('Notice', 'A lesson must have at least one slide.', 'info');
        const newSlides = lesson.slides.filter((_: any, i: number) => i !== index);
        setLesson({ ...lesson, slides: newSlides });
    };

    if (loading) return (
        <div className="min-vh-100 d-flex align-items-center justify-content-center" style={{ background: '#f4f5f7' }}>
            <div className="text-center">
                <div className="spinner-border text-warning mb-3" style={{ width: '3rem', height: '3rem' }}></div>
                <p className="smallest fw-bold ls-1 text-uppercase text-muted">Loading lesson...</p>
            </div>
        </div>
    );

    return (
        <div className="lesson-editor-page min-vh-100 pb-5">
            <AdminNavbar />

            {/* HERO HEADER */}
            <div className="editor-hero">
                <div className="container" style={{ maxWidth: '1100px' }}>
                    <div className="d-flex justify-content-between align-items-end">
                        <div>
                            <button onClick={confirmLeave} className="btn btn-sm text-white-50 p-0 mb-2 d-flex align-items-center gap-1 smallest fw-bold ls-1 text-uppercase">
                                <i className="bi bi-arrow-left"></i> Back to Lessons
                            </button>
                            <h1 className="fw-bold text-white mb-1 ls-tight" style={{ fontSize: '2.2rem' }}>
                                Editing <span style={{ color: '#FACC15' }}>{lesson?.title}</span>
                            </h1>
                            <span className="badge bg-white bg-opacity-10 text-white-50 smallest fw-bold ls-1 py-1 px-2">
                                <i className="bi bi-hash me-1"></i>{id}
                            </span>
                        </div>
                        <div className="text-end">
                            {lastSaved && !recovered && (
                                <span className="badge bg-white bg-opacity-10 text-white-50 smallest fw-bold ls-1 py-2 px-3">
                                    <i className="bi bi-cloud-check me-1 text-success"></i> Saved {lastSaved}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="container" style={{ maxWidth: '1100px' }}>

                {/* RECOVERY BANNER */}
                {recovered && (
                    <div className="recovery-banner d-flex align-items-center justify-content-between mb-4">
                        <div className="d-flex align-items-center gap-2">
                            <i className="bi bi-arrow-counterclockwise fs-5"></i>
                            <span className="fw-bold small">Unsaved changes recovered from your last session!</span>
                        </div>
                        <button type="button" onClick={dismissRecovery} className="btn btn-sm btn-outline-dark fw-bold smallest ls-1 rounded-pill">DISMISS</button>
                    </div>
                )}

                <form onSubmit={handleUpdate}>

                    {/* ─── STEP 1: CORE SETTINGS ─── */}
                    <section className="editor-section mb-4">
                        <div className="section-header">
                            <div className="step-badge">1</div>
                            <div>
                                <h5 className="fw-bold mb-0 text-dark">Core Settings</h5>
                                <span className="smallest text-muted fw-bold ls-1">LESSON IDENTITY</span>
                            </div>
                        </div>
                        <div className="section-body">
                            <div className="row g-4">
                                <div className="col-md-4">
                                    <label className="editor-label">English Title</label>
                                    <input className="editor-input" value={lesson?.title || ''} onChange={(e) => setLesson({ ...lesson, title: e.target.value })} />
                                </div>
                                <div className="col-md-4">
                                    <label className="editor-label">Tshivenda Title</label>
                                    <input className="editor-input" value={lesson?.vendaTitle || ''} onChange={(e) => setLesson({ ...lesson, vendaTitle: e.target.value })} />
                                </div>
                                <div className="col-md-4">
                                    <label className="editor-label">Difficulty</label>
                                    <select className="editor-input" value={lesson?.difficulty || 'Easy'} onChange={(e) => setLesson({ ...lesson, difficulty: e.target.value })}>
                                        <option value="Easy">Easy</option>
                                        <option value="Medium">Medium</option>
                                        <option value="Hard">Hard</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* ─── STEP 2: TEACHING SLIDES ─── */}
                    <section className="editor-section mb-4">
                        <div className="section-header">
                            <div className="step-badge">2</div>
                            <div className="flex-grow-1">
                                <h5 className="fw-bold mb-0 text-dark">Teaching Slides</h5>
                                <span className="smallest text-muted fw-bold ls-1">{lesson?.slides?.length || 0} SLIDE{(lesson?.slides?.length || 0) !== 1 ? 'S' : ''}</span>
                            </div>
                            <div className="d-flex gap-2">
                                <button type="button" onClick={handleBulkAdd} className="btn btn-outline-dark btn-sm fw-bold smallest ls-1 rounded-pill px-3 py-1 shadow-sm">
                                    <i className="bi bi-stack me-1"></i> BULK ADD
                                </button>
                                <button type="button" onClick={addSlide} className="btn btn-dark btn-sm fw-bold smallest ls-1 rounded-pill px-3 py-1 shadow-sm">
                                    <i className="bi bi-plus-lg me-1"></i> ADD SLIDE
                                </button>
                            </div>
                        </div>
                        <div className="section-body">
                            <div className="row g-4">
                                {lesson?.slides?.map((slide: any, index: number) => (
                                    <div key={index} className="col-lg-6">
                                        <div className="slide-card">
                                            <div className="slide-card-header">
                                                <span className="slide-number">{index + 1}</span>
                                                <span className="fw-bold smallest ls-1 text-uppercase text-muted">Slide</span>
                                                <button type="button" onClick={() => removeSlide(index)} className="btn btn-sm text-danger shadow-none p-0 ms-auto">
                                                    <i className="bi bi-trash3-fill"></i>
                                                </button>
                                            </div>
                                            <div className="slide-card-body">
                                                <div className="row g-3">
                                                    <div className="col-6">
                                                        <label className="editor-label">Tshivenda</label>
                                                        <input className="editor-input" placeholder="e.g. Ndaa" value={slide.venda} onChange={(e) => updateSlide(index, 'venda', e.target.value)} />
                                                    </div>
                                                    <div className="col-6">
                                                        <label className="editor-label">English</label>
                                                        <input className="editor-input" placeholder="e.g. Hello" value={slide.english} onChange={(e) => updateSlide(index, 'english', e.target.value)} />
                                                    </div>
                                                    <div className="col-12">
                                                        <label className="editor-label">Context / Notes</label>
                                                        <textarea className="editor-input" rows={2} placeholder="Explain how to use this word..." value={slide.context} onChange={(e) => updateSlide(index, 'context', e.target.value)} />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>

                    {/* ─── STEP 3: QUIZ QUESTIONS ─── */}
                    <section className="editor-section mb-4">
                        <div className="section-header">
                            <div className="step-badge">3</div>
                            <div>
                                <h5 className="fw-bold mb-0 text-dark">Quiz Questions</h5>
                                <span className="smallest text-muted fw-bold ls-1">{lesson?.questions?.length || 0} QUESTION{(lesson?.questions?.length || 0) !== 1 ? 'S' : ''}</span>
                            </div>
                        </div>
                        <div className="section-body">
                            <QuestionBuilder
                                questions={lesson?.questions || []}
                                onChange={(qs) => setLesson({ ...lesson, questions: qs })}
                            />
                        </div>
                    </section>

                    {/* ─── STICKY FOOTER ACTION BAR ─── */}
                    <div className="sticky-action-bar">
                        <div className="container d-flex justify-content-between align-items-center" style={{ maxWidth: '1100px' }}>
                            <button type="button" onClick={confirmLeave} className="btn text-muted fw-bold smallest ls-1">
                                <i className="bi bi-x-lg me-1"></i> DISCARD
                            </button>
                            <button type="submit" className="btn game-btn-yellow px-5 py-2 fw-bold smallest ls-1 text-uppercase">
                                <i className="bi bi-check2-circle me-1"></i> SAVE CHANGES
                            </button>
                        </div>
                    </div>

                </form>
            </div>

            <style>{`
                .lesson-editor-page { background: #f4f5f7; }

                .editor-hero {
                    background: linear-gradient(135deg, #111827, #1F2937);
                    padding: 2.5rem 1rem 2rem;
                    margin-bottom: 2rem;
                }

                .recovery-banner {
                    background: #FEF3C7;
                    border: 1px solid #FDE68A;
                    border-radius: 16px;
                    padding: 14px 20px;
                }

                /* ─── Section System ─── */
                .editor-section {
                    background: #ffffff;
                    border-radius: 20px;
                    border: 1px solid #e5e7eb;
                    overflow: hidden;
                    box-shadow: 0 1px 3px rgba(0,0,0,.04);
                    transition: box-shadow 0.2s;
                }
                .editor-section:hover { box-shadow: 0 4px 12px rgba(0,0,0,.06); }

                .section-header {
                    display: flex;
                    align-items: center;
                    gap: 14px;
                    padding: 20px 24px;
                    border-bottom: 1px solid #f0f0f0;
                    background: #fafafa;
                }

                .step-badge {
                    width: 36px; height: 36px;
                    border-radius: 50%;
                    background: #111827;
                    color: #FACC15;
                    display: flex; align-items: center; justify-content: center;
                    font-weight: 800; font-size: 14px;
                    flex-shrink: 0;
                }

                .section-body { padding: 24px; }

                /* ─── Inputs ─── */
                .editor-label {
                    display: block;
                    font-size: 11px;
                    font-weight: 700;
                    letter-spacing: 1px;
                    text-transform: uppercase;
                    color: #6b7280;
                    margin-bottom: 6px;
                }

                .editor-input {
                    display: block;
                    width: 100%;
                    padding: 12px 14px;
                    font-size: 14px;
                    color: #111827;
                    background-color: #f9fafb;
                    border: 1.5px solid #e5e7eb;
                    border-radius: 10px;
                    outline: none;
                    transition: all 0.2s;
                }
                .editor-input:focus {
                    background-color: #ffffff;
                    border-color: #FACC15;
                    box-shadow: 0 0 0 3px rgba(250,204,21,.12);
                }

                /* ─── Slide Cards ─── */
                .slide-card {
                    border: 1.5px solid #e5e7eb;
                    border-radius: 16px;
                    overflow: hidden;
                    background: #ffffff;
                    transition: all 0.2s;
                    height: 100%;
                }
                .slide-card:hover {
                    border-color: #FACC15;
                    box-shadow: 0 4px 12px rgba(250,204,21,.1);
                }

                .slide-card-header {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 12px 16px;
                    background: #fafafa;
                    border-bottom: 1px solid #f0f0f0;
                }

                .slide-number {
                    width: 28px; height: 28px;
                    border-radius: 8px;
                    background: linear-gradient(135deg, #FACC15, #F59E0B);
                    color: #111827;
                    display: flex; align-items: center; justify-content: center;
                    font-weight: 800; font-size: 12px;
                    flex-shrink: 0;
                }

                .slide-card-body { padding: 16px; }

                /* ─── Sticky Footer ─── */
                .sticky-action-bar {
                    position: sticky;
                    bottom: 0;
                    left: 0; right: 0;
                    background: rgba(255,255,255,.92);
                    backdrop-filter: blur(12px);
                    border-top: 1px solid #e5e7eb;
                    padding: 16px 24px;
                    z-index: 100;
                    margin-top: 2rem;
                }

                /* ─── Buttons ─── */
                .game-btn-yellow {
                    background-color: #FACC15 !important;
                    color: #111827 !important;
                    border-radius: 10px;
                    box-shadow: 0 4px 0 #d4a90a !important;
                    border: none;
                    transition: all 0.15s;
                }
                .game-btn-yellow:hover { filter: brightness(1.05); }
                .game-btn-yellow:active { transform: translateY(2px); box-shadow: 0 2px 0 #d4a90a !important; }

                /* ─── Utility ─── */
                .ls-tight { letter-spacing: -1.5px; }
                .ls-1 { letter-spacing: 1px; }
                .smallest { font-size: 11px; }
            `}</style>
        </div>
    );
};

export default EditLesson;