import React, { useState, useEffect, useRef } from 'react';
import { db } from '../../services/firebaseConfig';
import { doc, setDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import AdminNavbar from '../../components/AdminNavbar';
import QuestionBuilder from '../../components/QuestionBuilder';
import { invalidateCache } from '../../services/dataCache';
import useAutoSave from '../../hooks/useAutoSave';
import Swal from 'sweetalert2';
import { ArrowLeft, CloudCheck, RotateCcw, Plus, Book, Layers, Trash2, X, Rocket, GripVertical } from 'lucide-react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    type DragEndEvent
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    horizontalListSortingStrategy,
    useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface SortableTabProps {
    id: string;
    index: number;
    active: boolean;
    title: string;
    onClick: () => void;
    onRemove: (e: React.MouseEvent) => void;
    showRemove: boolean;
}

const SortableTab: React.FC<SortableTabProps> = ({ id, index, active, title, onClick, onRemove, showRemove }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 10 : 1,
        opacity: isDragging ? 0.5 : 1,
        backgroundColor: active ? '#ffffff' : 'transparent',
        borderBottom: active ? '3px solid #FACC15' : '3px solid transparent',
    };

    return (
        <button
            ref={setNodeRef}
            style={style}
            type="button"
            onClick={onClick}
            className={`btn btn-sm fw-bold smallest ls-1 px-3 py-2 rounded-top-3 border-0 d-flex align-items-center gap-2 ${active ? 'text-dark' : 'text-muted'}`}
            {...attributes}
            {...listeners}
        >
            <GripVertical size={12} className="text-muted" style={{ cursor: 'grab' }} />
            <Book size={14} /> {title || `Part ${index + 1}`}
            {showRemove && (
                <span onClick={onRemove} className="ms-1 text-danger" style={{ cursor: 'pointer' }}>×</span>
            )}
        </button>
    );
};

interface SortableSlideProps {
    id: string;
    index: number;
    slide: any;
    onUpdate: (field: string, value: string) => void;
    onRemove: () => void;
}

const SortableSlide: React.FC<SortableSlideProps> = ({ id, index, slide, onUpdate, onRemove }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 10 : 1,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div ref={setNodeRef} style={style} className="col-lg-6 mb-4">
            <div className="slide-card">
                <div className="slide-card-header">
                    <div {...attributes} {...listeners} className="me-2" style={{ cursor: 'grab' }}>
                        <GripVertical size={16} className="text-muted" />
                    </div>
                    <span className="slide-number">{index + 1}</span>
                    <span className="fw-bold smallest ls-1 text-uppercase text-muted">Slide</span>
                    <button type="button" onClick={onRemove} className="btn btn-sm text-danger shadow-none p-0 ms-auto">
                        <Trash2 size={16} />
                    </button>
                </div>
                <div className="slide-card-body">
                    <div className="row g-3">
                        <div className="col-6">
                            <label className="editor-label">Tshivenda</label>
                            <input className="editor-input" placeholder="e.g. Ndaa" value={slide.venda} onChange={(e) => onUpdate('venda', e.target.value)} />
                        </div>
                        <div className="col-6">
                            <label className="editor-label">English</label>
                            <input className="editor-input" placeholder="e.g. Hello" value={slide.english} onChange={(e) => onUpdate('english', e.target.value)} />
                        </div>
                        <div className="col-12">
                            <label className="editor-label">Context / Notes</label>
                            <textarea className="editor-input" rows={2} placeholder="How is this word used?" value={slide.context} onChange={(e) => onUpdate('context', e.target.value)} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
const AddLesson: React.FC = () => {
    const navigate = useNavigate();
    const [course, setCourse] = useState<any>({
        id: '',
        title: '',
        vendaTitle: '',
        difficulty: 'Easy',
        microLessons: [
            {
                id: `ml-${Date.now()}`,
                title: 'Part 1',
                slides: [{ id: `s-${Date.now()}`, venda: '', english: '', context: '' }],
                questions: []
            }
        ]
    });
    const [activeMlIndex, setActiveMlIndex] = useState(0);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleMlDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            const oldIndex = course.microLessons.findIndex((ml: any) => ml.id === active.id);
            const newIndex = course.microLessons.findIndex((ml: any) => ml.id === over.id);
            const newMls = arrayMove(course.microLessons, oldIndex, newIndex);
            setCourse({ ...course, microLessons: newMls });
            // Keep the active tab focused if it was moved
            if (activeMlIndex === oldIndex) {
                setActiveMlIndex(newIndex);
            } else if (activeMlIndex > oldIndex && activeMlIndex <= newIndex) {
                setActiveMlIndex(activeMlIndex - 1);
            } else if (activeMlIndex < oldIndex && activeMlIndex >= newIndex) {
                setActiveMlIndex(activeMlIndex + 1);
            }
        }
    };

    const handleSlideDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            const currentMl = course.microLessons[activeMlIndex];
            const oldIndex = currentMl.slides.findIndex((s: any) => s.id === active.id);
            const newIndex = currentMl.slides.findIndex((s: any) => s.id === over.id);
            const newSlides = arrayMove(currentMl.slides, oldIndex, newIndex);

            const newMls = [...course.microLessons];
            newMls[activeMlIndex] = { ...currentMl, slides: newSlides };
            setCourse({ ...course, microLessons: newMls });
        }
    };

    const { recovered, lastSaved, clearSaved, dismissRecovery } = useAutoSave('draft-add-lesson', course, setCourse);
    const publishedRef = useRef(false);

    const hasWork = Boolean(course.id || course.title || course.vendaTitle ||
        course.microLessons.some((ml: any) => ml.title || ml.slides.some((s: any) => s.venda || s.english || s.context) || ml.questions.length > 0));

    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (hasWork && !publishedRef.current) {
                e.preventDefault();
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [hasWork]);

    const confirmLeave = async () => {
        if (!hasWork) { navigate('/admin/lessons'); return; }
        const result = await Swal.fire({
            title: 'Leave without publishing?',
            text: 'Your draft will be discarded and all progress will be lost.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes, discard',
            cancelButtonText: 'Keep editing',
            confirmButtonColor: '#dc3545',
            cancelButtonColor: '#6c757d',
        });
        if (result.isConfirmed) { clearSaved(); navigate('/admin/lessons'); }
    };

    // Auto-generate micro lesson IDs on save
    const generateMlIds = (courseId: string) => {
        return course.microLessons.map((ml: any, i: number) => ({
            ...ml,
            id: `${courseId}__ml_${i}`
        }));
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!course.id || !course.title) {
            return Swal.fire('Error', 'Please fill in the Course ID and Title', 'error');
        }

        try {
            const courseRef = course.id.toLowerCase().replace(/\s+/g, '-');
            const microLessons = generateMlIds(courseRef);

            await setDoc(doc(db, "lessons", courseRef), {
                id: courseRef,
                title: course.title,
                vendaTitle: course.vendaTitle,
                difficulty: course.difficulty,
                microLessons
            });

            await addDoc(collection(db, "logs"), {
                action: "CREATE",
                details: `Created new course: ${course.title} (${courseRef}) with ${microLessons.length} micro lessons`,
                adminEmail: "Admin",
                targetId: courseRef,
                timestamp: serverTimestamp()
            });

            invalidateCache('lessons');
            invalidateCache('auditLogs');
            publishedRef.current = true;
            clearSaved();

            await Swal.fire({
                title: 'Course Created!',
                text: `The course is now live with ${microLessons.length} micro lessons.`,
                icon: 'success',
                confirmButtonColor: '#FACC15'
            });

            navigate('/admin/lessons');
        } catch (error) {
            console.error("Save error:", error);
            Swal.fire('Error', 'Failed to save course.', 'error');
        }
    };

    // Micro lesson helpers
    const currentMl = course.microLessons[activeMlIndex] || course.microLessons[0];

    const updateMl = (field: string, value: any) => {
        const newMls = [...course.microLessons];
        newMls[activeMlIndex] = { ...newMls[activeMlIndex], [field]: value };
        setCourse({ ...course, microLessons: newMls });
    };

    const addMicroLesson = () => {
        const newMl = {
            id: `ml-${Date.now()}`,
            title: `Part ${course.microLessons.length + 1}`,
            slides: [{ id: `s-${Date.now()}`, venda: '', english: '', context: '' }],
            questions: []
        };
        setCourse({ ...course, microLessons: [...course.microLessons, newMl] });
        setActiveMlIndex(course.microLessons.length);
    };

    const removeMicroLesson = async (index: number) => {
        if (course.microLessons.length <= 1) return Swal.fire('Notice', 'A course must have at least 1 micro lesson.', 'info');
        const result = await Swal.fire({ title: 'Delete micro lesson?', text: `Remove "${course.microLessons[index].title}"?`, icon: 'warning', showCancelButton: true, confirmButtonColor: '#dc3545', confirmButtonText: 'Delete' });
        if (result.isConfirmed) {
            const newMls = course.microLessons.filter((_: any, i: number) => i !== index);
            setCourse({ ...course, microLessons: newMls });
            setActiveMlIndex(Math.min(activeMlIndex, newMls.length - 1));
        }
    };

    const updateSlide = (index: number, field: string, value: string) => {
        const newSlides = [...currentMl.slides];
        newSlides[index] = { ...newSlides[index], [field]: value };
        updateMl('slides', newSlides);
    };

    const addSlide = () => updateMl('slides', [...currentMl.slides, { id: `s-${Date.now()}`, venda: '', english: '', context: '' }]);

    const removeSlide = (index: number) => {
        if (currentMl.slides.length <= 1) return Swal.fire('Notice', 'A micro lesson must have at least one slide.', 'info');
        updateMl('slides', currentMl.slides.filter((_: any, i: number) => i !== index));
    };

    const handleBulkAdd = async () => {
        const { value: text } = await Swal.fire({
            title: 'Bulk Add Slides',
            input: 'textarea',
            inputLabel: 'Paste words (Venda | English | Context)',
            inputPlaceholder: 'Ndaa | Hello | Greeting\nVukani | Wake up\nMasiari | Afternoon',
            showCancelButton: true,
            confirmButtonColor: '#FACC15',
            confirmButtonText: 'Add Slides',
            footer: '<small>Format: Venda | English | Context (one per line)</small>'
        });

        if (text) {
            const lines = text.split('\n').filter((l: string) => l.trim());
            const newSlides = lines.map((line: string, i: number) => {
                const parts = line.split('|').map((p: string) => p.trim());
                return { id: `s-${Date.now()}-${i}`, venda: parts[0] || '', english: parts[1] || '', context: parts[2] || '' };
            });
            if (newSlides.length > 0) {
                const current = [...currentMl.slides];
                if (current.length === 1 && !current[0].venda && !current[0].english && !current[0].context) {
                    updateMl('slides', newSlides);
                } else {
                    updateMl('slides', [...current, ...newSlides]);
                }
                Swal.fire({ title: 'Success!', text: `Added ${newSlides.length} slides.`, icon: 'success', timer: 2000, showConfirmButton: false });
            }
        }
    };

    const filledDetails = [course.id, course.title, course.vendaTitle].filter(Boolean).length;

    return (
        <div className="lesson-editor-page min-vh-100 pb-5">
            <AdminNavbar />

            {/* HERO HEADER */}
            <div className="editor-hero">
                <div className="container" style={{ maxWidth: '960px' }}>
                    <div className="d-flex justify-content-between align-items-end">
                        <div>
                            <button onClick={confirmLeave} className="btn btn-sm text-white-50 p-0 mb-2 d-flex align-items-center gap-1 smallest fw-bold ls-1 text-uppercase">
                                <ArrowLeft size={14} /> Back to Courses
                            </button>
                            <h1 className="fw-bold text-white mb-0 ls-tight" style={{ fontSize: '2.2rem' }}>
                                New <span style={{ color: '#FACC15' }}>Course</span>
                            </h1>
                        </div>
                        <div className="text-end">
                            {lastSaved && !recovered && (
                                <span className="badge bg-white bg-opacity-10 text-white-50 smallest fw-bold ls-1 py-2 px-3 d-flex align-items-center gap-2">
                                    <CloudCheck size={14} className="text-success" /> Saved {lastSaved}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="container" style={{ maxWidth: '960px' }}>

                {/* RECOVERY BANNER */}
                {recovered && (
                    <div className="recovery-banner d-flex align-items-center justify-content-between mb-4">
                        <div className="d-flex align-items-center gap-2">
                            <RotateCcw size={18} />
                            <span className="fw-bold small">Unsaved draft recovered!</span>
                        </div>
                        <button type="button" onClick={dismissRecovery} className="btn btn-sm btn-outline-dark fw-bold smallest ls-1 rounded-pill">DISMISS</button>
                    </div>
                )}

                <form onSubmit={handleSave}>

                    {/* ─── STEP 1: COURSE DETAILS ─── */}
                    <section className="editor-section mb-4">
                        <div className="section-header">
                            <div className="step-badge">1</div>
                            <div>
                                <h5 className="fw-bold mb-0 text-dark">Course Details</h5>
                                <span className="smallest text-muted fw-bold ls-1">{filledDetails}/3 FIELDS COMPLETED</span>
                            </div>
                        </div>
                        <div className="section-body">
                            <div className="row g-4">
                                <div className="col-md-6">
                                    <label className="editor-label">Unique Course ID</label>
                                    <input className="editor-input" placeholder="e.g. food-and-drinks" value={course.id} onChange={(e) => setCourse({ ...course, id: e.target.value })} />
                                    <span className="editor-hint">Used in the URL. No spaces.</span>
                                </div>
                                <div className="col-md-6">
                                    <label className="editor-label">Difficulty Level</label>
                                    <select className="editor-input" value={course.difficulty} onChange={(e) => setCourse({ ...course, difficulty: e.target.value })}>
                                        <option value="Easy">Easy</option>
                                        <option value="Medium">Medium</option>
                                        <option value="Hard">Hard</option>
                                    </select>
                                </div>
                                <div className="col-md-6">
                                    <label className="editor-label">English Title</label>
                                    <input className="editor-input" placeholder="e.g. Family" value={course.title} onChange={(e) => setCourse({ ...course, title: e.target.value })} />
                                </div>
                                <div className="col-md-6">
                                    <label className="editor-label">Tshivenda Title</label>
                                    <input className="editor-input" placeholder="e.g. Muta" value={course.vendaTitle} onChange={(e) => setCourse({ ...course, vendaTitle: e.target.value })} />
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* ─── STEP 2: MICRO LESSONS TABS ─── */}
                    <section className="editor-section mb-4">
                        <div className="section-header">
                            <div className="step-badge">2</div>
                            <div className="flex-grow-1">
                                <h5 className="fw-bold mb-0 text-dark">Micro Lessons</h5>
                                <span className="smallest text-muted fw-bold ls-1">{course.microLessons.length} MICRO LESSON{course.microLessons.length !== 1 ? 'S' : ''}</span>
                            </div>
                            <button type="button" onClick={addMicroLesson} className="btn btn-dark btn-sm fw-bold smallest ls-1 rounded-pill px-3 py-1 shadow-sm d-flex align-items-center gap-2">
                                <Plus size={14} /> ADD MICRO LESSON
                            </button>
                        </div>

                        {/* Micro lesson tabs */}
                        <div className="d-flex gap-1 px-4 pt-3 flex-wrap" style={{ borderBottom: '1px solid #f0f0f0' }}>
                            <DndContext
                                sensors={sensors}
                                collisionDetection={closestCenter}
                                onDragEnd={handleMlDragEnd}
                            >
                                <SortableContext
                                    items={course.microLessons.map((ml: any) => ml.id)}
                                    strategy={horizontalListSortingStrategy}
                                >
                                    {course.microLessons.map((ml: any, i: number) => (
                                        <SortableTab
                                            key={ml.id}
                                            id={ml.id}
                                            index={i}
                                            active={activeMlIndex === i}
                                            title={ml.title}
                                            onClick={() => setActiveMlIndex(i)}
                                            onRemove={(e) => { e.stopPropagation(); removeMicroLesson(i); }}
                                            showRemove={course.microLessons.length > 1}
                                        />
                                    ))}
                                </SortableContext>
                            </DndContext>
                        </div>

                        <div className="section-body">
                            {/* Micro lesson title */}
                            <div className="mb-4">
                                <label className="editor-label">Micro Lesson Title</label>
                                <input className="editor-input" placeholder="e.g. Basic Hello" value={currentMl.title} onChange={(e) => updateMl('title', e.target.value)} />
                            </div>

                            {/* SLIDES */}
                            <div className="mb-4">
                                <div className="d-flex align-items-center justify-content-between mb-3">
                                    <div>
                                        <h6 className="fw-bold mb-0 text-dark">Teaching Slides</h6>
                                        <span className="smallest text-muted fw-bold ls-1">{currentMl.slides.length} SLIDE{currentMl.slides.length !== 1 ? 'S' : ''}</span>
                                    </div>
                                    <div className="d-flex gap-2">
                                        <button type="button" onClick={handleBulkAdd} className="btn btn-outline-dark btn-sm fw-bold smallest ls-1 rounded-pill px-3 py-1 shadow-sm d-flex align-items-center gap-2">
                                            <Layers size={14} /> BULK ADD
                                        </button>
                                        <button type="button" onClick={addSlide} className="btn btn-dark btn-sm fw-bold smallest ls-1 rounded-pill px-3 py-1 shadow-sm d-flex align-items-center gap-2">
                                            <Plus size={14} /> ADD SLIDE
                                        </button>
                                    </div>
                                </div>
                                <div className="row g-4">
                                    <DndContext
                                        sensors={sensors}
                                        collisionDetection={closestCenter}
                                        onDragEnd={handleSlideDragEnd}
                                    >
                                        <SortableContext
                                            items={currentMl.slides.map((s: any) => s.id)}
                                            strategy={verticalListSortingStrategy}
                                        >
                                            {currentMl.slides.map((slide: any, index: number) => (
                                                <SortableSlide
                                                    key={slide.id}
                                                    id={slide.id}
                                                    index={index}
                                                    slide={slide}
                                                    onUpdate={(field, value) => updateSlide(index, field, value)}
                                                    onRemove={() => removeSlide(index)}
                                                />
                                            ))}
                                        </SortableContext>
                                    </DndContext>
                                </div>
                            </div>

                            {/* QUESTIONS */}
                            <div>
                                <h6 className="fw-bold mb-1 text-dark">Quiz Questions</h6>
                                <span className="smallest text-muted fw-bold ls-1 d-block mb-3">{currentMl.questions.length} QUESTION{currentMl.questions.length !== 1 ? 'S' : ''}</span>
                                <QuestionBuilder
                                    questions={currentMl.questions}
                                    onChange={(qs) => updateMl('questions', qs)}
                                />
                            </div>
                        </div>
                    </section>

                    {/* ─── STICKY FOOTER ACTION BAR ─── */}
                    <div className="sticky-action-bar">
                        <div className="container d-flex justify-content-between align-items-center" style={{ maxWidth: '960px' }}>
                            <button type="button" onClick={confirmLeave} className="btn text-muted fw-bold smallest ls-1 d-flex align-items-center gap-2">
                                <X size={16} /> DISCARD
                            </button>
                            <button type="submit" className="btn game-btn-yellow px-5 py-2 fw-bold smallest ls-1 text-uppercase d-flex align-items-center gap-2">
                                <Rocket size={18} /> PUBLISH COURSE
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

                .editor-hint {
                    display: block;
                    font-size: 10px;
                    color: #9ca3af;
                    margin-top: 4px;
                    letter-spacing: 0.5px;
                }

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

                .ls-tight { letter-spacing: -1.5px; }
                .ls-1 { letter-spacing: 1px; }
                .smallest { font-size: 11px; }
            `}</style>
        </div>
    );
};
export default AddLesson;


