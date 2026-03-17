import React, { useState, useEffect, useRef } from 'react';
import type { Firestore } from 'firebase/firestore';
import { db } from '../../services/firebaseConfig';
import { doc, updateDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { useNavigate, useParams } from 'react-router-dom';
import AdminNavbar from '../../components/AdminNavbar';
import QuestionBuilder from '../../components/QuestionBuilder';
import { fetchLessons, invalidateCache, getMicroLessons } from '../../services/dataCache';
import useAutoSave from '../../hooks/useAutoSave';
import Swal from 'sweetalert2';
import { ArrowLeft, CloudCheck, RotateCcw, Plus, Book, Layers, Trash2, X, GripVertical, MessageCircle, CheckCircle, Hash, Loader2 } from 'lucide-react';
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
                            <textarea className="editor-input" rows={2} placeholder="Explain how to use this word..." value={slide.context} onChange={(e) => onUpdate('context', e.target.value)} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const EditLesson: React.FC = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [course, setCourse] = useState<any>(null);
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

    const autoSaveKey = `draft-edit-lesson-${id}`;
    const { recovered, lastSaved, clearSaved, dismissRecovery } = useAutoSave(autoSaveKey, course, setCourse);
    const savedRef = useRef(false);

    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (!savedRef.current) { e.preventDefault(); }
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
        if (result.isConfirmed) { clearSaved(); navigate('/admin/lessons'); }
    };

    useEffect(() => {
        const loadCourse = async () => {
            if (!id) return;
            try {
                const lessons = await fetchLessons();
                const found = lessons.find((l: any) => l.id === id);
                if (found) {
                    const mls = getMicroLessons(found).map((ml: any, i: number) => ({
                        ...ml,
                        id: ml.id || `${id}__ml_${i}_${Date.now()}`,
                        slides: (ml.slides || []).map((s: any, si: number) => ({
                            ...s,
                            id: s.id || `s_${i}_${si}_${Date.now()}`
                        }))
                    }));
                    setCourse({
                        ...found,
                        microLessons: mls
                    });
                } else {
                    Swal.fire('Error', 'Course not found', 'error');
                    navigate('/admin/lessons');
                }
            } catch (error) {
                console.error("Error:", error);
            } finally {
                setLoading(false);
            }
        };
        loadCourse();
    }, [id, navigate]);

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            // Ensure micro lesson IDs are set correctly
            const microLessons = course.microLessons.map((ml: any, i: number) => ({
                ...ml,
                id: ml.id || `${id}__ml_${i}`
            }));

            await updateDoc(doc(db as Firestore, "lessons", id!), {
                title: course.title,
                vendaTitle: course.vendaTitle,
                difficulty: course.difficulty,
                microLessons
            });

            await addDoc(collection(db as Firestore, "logs"), {
                action: "UPDATE",
                details: `Updated course: ${course.title} (${id}) with ${microLessons.length} micro lessons`,
                adminEmail: "Admin",
                targetId: id,
                timestamp: serverTimestamp()
            });

            await Swal.fire({
                title: 'Changes Saved!',
                text: 'Course content has been updated successfully.',
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
            Swal.fire('Error', 'Failed to update course.', 'error');
        }
    };

    // Micro lesson helpers
    const currentMl = course?.microLessons?.[activeMlIndex] || { title: '', slides: [], questions: [] };

    const updateMl = (field: string, value: any) => {
        const newMls = [...course.microLessons];
        newMls[activeMlIndex] = { ...newMls[activeMlIndex], [field]: value };
        setCourse({ ...course, microLessons: newMls });
    };

    const addScene = () => updateMl('scenes', [...(currentMl.scenes || []), {
        id: `scene-${Date.now()}`,
        title: 'New Scene',
        background: '',
        dialogue: [{ characterName: '', venda: '', english: '', avatar: '' }]
    }]);

    const updateScene = (index: number, field: string, value: any) => {
        const newScenes = [...(currentMl.scenes || [])];
        newScenes[index] = { ...newScenes[index], [field]: value };
        updateMl('scenes', newScenes);
    };

    const removeScene = (index: number) => updateMl('scenes', currentMl.scenes.filter((_: any, i: number) => i !== index));

    const addDialogueLine = (sceneIndex: number) => {
        const newScenes = [...currentMl.scenes];
        newScenes[sceneIndex] = {
            ...newScenes[sceneIndex],
            dialogue: [...newScenes[sceneIndex].dialogue, { characterName: '', venda: '', english: '', avatar: '', position: 'left' }]
        };
        updateMl('scenes', newScenes);
    };

    const updateDialogueLine = (sceneIndex: number, lineIndex: number, field: string, value: string) => {
        const newScenes = [...currentMl.scenes];
        const newDialogue = [...newScenes[sceneIndex].dialogue];
        newDialogue[lineIndex] = { ...newDialogue[lineIndex], [field]: value };
        newScenes[sceneIndex] = { ...newScenes[sceneIndex], dialogue: newDialogue };
        updateMl('scenes', newScenes);
    };

    const removeDialogueLine = (sceneIndex: number, lineIndex: number) => {
        const newScenes = [...currentMl.scenes];
        const newDialogue = newScenes[sceneIndex].dialogue.filter((_: any, i: number) => i !== lineIndex);
        newScenes[sceneIndex] = { ...newScenes[sceneIndex], dialogue: newDialogue };
        updateMl('scenes', newScenes);
    };

    const addMicroLesson = () => {
        const newMl = {
            id: `${id}__ml_${Date.now()}`,
            title: `Part ${course.microLessons.length + 1}`,
            slides: [{ id: `s-${Date.now()}`, venda: '', english: '', context: '' }],
            scenes: [],
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

    const addSlide = () => updateMl('slides', [...currentMl.slides, { id: `s_${Date.now()}`, venda: '', english: '', context: '' }]);

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

    if (loading) return (
        <div className="min-vh-100 d-flex align-items-center justify-content-center" style={{ background: '#f4f5f7' }}>
            <div className="text-center">
                <Loader2 className="animate-spin text-warning mb-3 mx-auto" size={48} />
                <p className="smallest fw-bold ls-1 text-uppercase text-muted">Loading course...</p>
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
                                <ArrowLeft size={14} /> Back to Courses
                            </button>
                            <h1 className="fw-bold text-white mb-1 ls-tight" style={{ fontSize: '2.2rem' }}>
                                Editing <span style={{ color: '#FACC15' }}>{course?.title}</span>
                            </h1>
                            <span className="badge bg-white bg-opacity-10 text-white-50 smallest fw-bold ls-1 py-1 px-2 d-flex align-items-center gap-2">
                                <Hash size={12} />{id}
                            </span>
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

            <div className="container" style={{ maxWidth: '1100px' }}>

                {/* RECOVERY BANNER */}
                {recovered && (
                    <div className="recovery-banner d-flex align-items-center justify-content-between mb-4">
                        <div className="d-flex align-items-center gap-2">
                            <RotateCcw size={18} />
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
                                <h5 className="fw-bold mb-0 text-dark">Course Settings</h5>
                                <span className="smallest text-muted fw-bold ls-1">COURSE IDENTITY</span>
                            </div>
                        </div>
                        <div className="section-body">
                            <div className="row g-4">
                                <div className="col-md-4">
                                    <label className="editor-label">English Title</label>
                                    <input className="editor-input" value={course?.title || ''} onChange={(e) => setCourse({ ...course, title: e.target.value })} />
                                </div>
                                <div className="col-md-4">
                                    <label className="editor-label">Tshivenda Title</label>
                                    <input className="editor-input" value={course?.vendaTitle || ''} onChange={(e) => setCourse({ ...course, vendaTitle: e.target.value })} />
                                </div>
                                <div className="col-md-4">
                                    <label className="editor-label">Difficulty</label>
                                    <select className="editor-input" value={course?.difficulty || 'Beginner'} onChange={(e) => setCourse({ ...course, difficulty: e.target.value })}>
                                        <option value="Beginner">Beginner</option>
                                        <option value="Intermediate">Intermediate</option>
                                        <option value="Advanced">Advanced</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* ─── STEP 2: MICRO LESSONS ─── */}
                    <section className="editor-section mb-4">
                        <div className="section-header">
                            <div className="step-badge">2</div>
                            <div className="flex-grow-1">
                                <h5 className="fw-bold mb-0 text-dark">Micro Lessons</h5>
                                <span className="smallest text-muted fw-bold ls-1">{course?.microLessons?.length || 0} MICRO LESSON{(course?.microLessons?.length || 0) !== 1 ? 'S' : ''}</span>
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
                                        <span className="smallest text-muted fw-bold ls-1">{currentMl.slides?.length || 0} SLIDE{(currentMl.slides?.length || 0) !== 1 ? 'S' : ''}</span>
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

                            {/* CONVERSATION SCENES */}
                            <div className="mb-5 p-4 rounded-4" style={{
                                background: 'linear-gradient(to bottom right, #ffffff, #f0f7ff)',
                                border: '2px solid #e0e7ff',
                                boxShadow: '0 4px 20px rgba(0,0,0,0.03)'
                            }}>
                                <div className="d-flex align-items-center justify-content-between mb-4">
                                    <div className="d-flex align-items-center gap-3">
                                        <div className="bg-primary bg-opacity-10 p-2 rounded-3 text-primary">
                                            <MessageCircle size={24} />
                                        </div>
                                        <div>
                                            <h5 className="fw-bold mb-0 text-dark d-flex align-items-center gap-2">
                                                Conversation Scenes
                                                <span className="badge bg-primary rounded-pill smallest ls-1 px-2 py-1" style={{ fontSize: '10px' }}>NEW</span>
                                            </h5>
                                            <p className="smallest text-muted fw-semi-bold ls-1 mb-0">{(currentMl.scenes || []).length} SCENE{(currentMl.scenes || []).length !== 1 ? 'S' : ''} • TEACH THROUGH DIALOGUE</p>
                                        </div>
                                    </div>
                                    <button type="button" onClick={addScene} className="btn btn-primary fw-bold smallest ls-1 rounded-pill px-4 py-2 shadow-sm d-flex align-items-center gap-2 transition-transform hover-scale">
                                        <Plus size={18} /> ADD NEW SCENE
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    {(currentMl.scenes || []).map((scene: any, sIdx: number) => (
                                        <div key={scene.id} className="bg-white p-4 rounded-4 border shadow-sm position-relative mb-4">
                                            <button
                                                type="button"
                                                onClick={() => removeScene(sIdx)}
                                                className="btn btn-link text-danger p-0 position-absolute"
                                                style={{ top: '15px', right: '15px' }}
                                            >
                                                <X size={18} />
                                            </button>

                                            <div className="row g-3 mb-4">
                                                <div className="col-md-6">
                                                    <label className="smallest fw-bold ls-1 text-uppercase text-muted d-block mb-1">Scene Title</label>
                                                    <input
                                                        className="form-control form-control-sm fw-bold"
                                                        value={scene.title}
                                                        onChange={(e) => updateScene(sIdx, 'title', e.target.value)}
                                                    />
                                                </div>
                                                <div className="col-md-6">
                                                    <label className="smallest fw-bold ls-1 text-uppercase text-muted d-block mb-1">Background / Setting</label>
                                                    <input
                                                        className="form-control form-control-sm"
                                                        placeholder="e.g. At the Market"
                                                        value={scene.background}
                                                        onChange={(e) => updateScene(sIdx, 'background', e.target.value)}
                                                    />
                                                </div>
                                            </div>

                                            <div className="ps-3 border-start border-3 border-light">
                                                <h6 className="smallest fw-bold ls-2 text-uppercase text-muted mb-3">Dialogue</h6>
                                                {scene.dialogue.map((line: any, lIdx: number) => (
                                                    <div key={lIdx} className="bg-light p-3 rounded-3 mb-3 position-relative">
                                                        <button
                                                            type="button"
                                                            onClick={() => removeDialogueLine(sIdx, lIdx)}
                                                            className="btn btn-link text-muted p-0 position-absolute"
                                                            style={{ top: '10px', right: '10px' }}
                                                        >
                                                            <X size={14} />
                                                        </button>
                                                        <div className="row g-2">
                                                            <div className="col-md-3">
                                                                <input
                                                                    className="form-control form-control-sm smallest fw-bold"
                                                                    placeholder="Name"
                                                                    value={line.characterName}
                                                                    onChange={(e) => updateDialogueLine(sIdx, lIdx, 'characterName', e.target.value)}
                                                                />
                                                            </div>
                                                            <div className="col-md-9">
                                                                <div className="d-flex align-items-center gap-2 mb-2">
                                                                    <div className="btn-group btn-group-sm">
                                                                        <button
                                                                            type="button"
                                                                            className={`btn btn-xs fw-bold ${line.position === 'left' ? 'btn-primary' : 'btn-outline-secondary'}`}
                                                                            onClick={() => updateDialogueLine(sIdx, lIdx, 'position', 'left')}
                                                                        >
                                                                            LEFT
                                                                        </button>
                                                                        <button
                                                                            type="button"
                                                                            className={`btn btn-xs fw-bold ${line.position === 'right' ? 'btn-primary' : 'btn-outline-secondary'}`}
                                                                            onClick={() => updateDialogueLine(sIdx, lIdx, 'position', 'right')}
                                                                        >
                                                                            RIGHT
                                                                        </button>
                                                                    </div>
                                                                    <input
                                                                        className="form-control form-control-sm mb-0"
                                                                        placeholder="Venda text"
                                                                        value={line.venda}
                                                                        onChange={(e) => updateDialogueLine(sIdx, lIdx, 'venda', e.target.value)}
                                                                    />
                                                                </div>
                                                                <input
                                                                    className="form-control form-control-sm smallest"
                                                                    placeholder="English translation"
                                                                    value={line.english}
                                                                    onChange={(e) => updateDialogueLine(sIdx, lIdx, 'english', e.target.value)}
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                                <button
                                                    type="button"
                                                    onClick={() => addDialogueLine(sIdx)}
                                                    className="btn btn-outline-secondary btn-sm smallest fw-bold ls-1 w-100 mt-2"
                                                >
                                                    <Plus size={12} className="me-1" /> ADD DIALOGUE LINE
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                {(currentMl.scenes || []).length === 0 && (
                                    <div className="text-center py-4 border-2 border-dashed rounded-4">
                                        <p className="smallest fw-bold text-muted ls-1 mb-0">NO CONVERSATION SCENES ADDED YET</p>
                                    </div>
                                )}
                            </div>

                            {/* QUESTIONS */}
                            <div>
                                <h6 className="fw-bold mb-1 text-dark">Quiz Questions</h6>
                                <span className="smallest text-muted fw-bold ls-1 d-block mb-3">{currentMl.questions?.length || 0} QUESTION{(currentMl.questions?.length || 0) !== 1 ? 'S' : ''}</span>
                                <QuestionBuilder
                                    questions={currentMl.questions || []}
                                    onChange={(qs) => updateMl('questions', qs)}
                                />
                            </div>
                        </div>
                    </section>

                    {/* ─── STICKY FOOTER ACTION BAR ─── */}
                    <div className="sticky-action-bar">
                        <div className="container d-flex justify-content-between align-items-center" style={{ maxWidth: '1100px' }}>
                            <button type="button" onClick={confirmLeave} className="btn text-muted fw-bold smallest ls-1 d-flex align-items-center gap-2">
                                <X size={16} /> DISCARD
                            </button>
                            <button type="submit" className="btn game-btn-yellow px-5 py-2 fw-bold smallest ls-1 text-uppercase d-flex align-items-center gap-2">
                                <CheckCircle size={18} /> SAVE CHANGES
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

export default EditLesson;



