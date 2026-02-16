import React from 'react';
import { GripVertical, Trash2 } from 'lucide-react';
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
    useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

type QuestionType = 'multiple-choice' | 'true-false' | 'fill-in-the-blank' | 'match-pairs' | 'listen-and-choose';

const QUESTION_TYPES: { value: QuestionType; label: string; icon: string }[] = [
    { value: 'multiple-choice', label: 'Multiple Choice', icon: 'bi-list-check' },
    { value: 'true-false', label: 'True / False', icon: 'bi-toggle-on' },
    { value: 'fill-in-the-blank', label: 'Fill in the Blank', icon: 'bi-input-cursor-text' },
    { value: 'match-pairs', label: 'Match Pairs', icon: 'bi-arrows-expand' },
    { value: 'listen-and-choose', label: 'Listen & Choose', icon: 'bi-headphones' },
];

const newQuestion = (type: QuestionType, id: string | number): any => {
    const base = { id, type, explanation: '' };
    switch (type) {
        case 'multiple-choice':
            return { ...base, question: '', options: ['', '', ''], correctAnswer: '' };
        case 'true-false':
            return { ...base, question: '', correctAnswer: false };
        case 'fill-in-the-blank':
            return { ...base, question: '', correctAnswer: '', hint: '' };
        case 'match-pairs':
            return { ...base, question: '', pairs: [{ venda: '', english: '' }] };
        case 'listen-and-choose':
            return { ...base, vendaWord: '', question: '', options: ['', '', ''], correctAnswer: '' };
    }
};

interface Props {
    questions: any[];
    onChange: (questions: any[]) => void;
}

interface SortableQuestionProps {
    id: string;
    index: number;
    q: any;
    typeInfo: any;
    getTypeColor: (type: QuestionType) => string;
    changeType: (index: number, newType: QuestionType) => void;
    removeQuestion: (index: number) => void;
    renderFields: (q: any, idx: number) => React.ReactNode;
    update: (index: number, field: string, value: any) => void;
}

const SortableQuestion: React.FC<SortableQuestionProps> = ({
    id, index, q, typeInfo, getTypeColor, changeType, removeQuestion, renderFields, update
}) => {
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
        <div ref={setNodeRef} style={style} className="bg-white border rounded-4 shadow-sm mb-4 overflow-hidden">
            {/* Header */}
            <div className="px-4 py-3 border-bottom d-flex justify-content-between align-items-center"
                style={{ backgroundColor: `${getTypeColor(q.type)}10` }}>
                <div className="d-flex align-items-center gap-2">
                    <div {...attributes} {...listeners} className="me-2" style={{ cursor: 'grab' }}>
                        <GripVertical size={16} className="text-muted" />
                    </div>
                    <i className={`bi ${typeInfo.icon}`} style={{ color: getTypeColor(q.type), fontSize: 18 }}></i>
                    <span className="fw-bold" style={{ fontSize: 12, letterSpacing: 1, textTransform: 'uppercase', color: '#374151' }}>
                        Q{index + 1}
                    </span>
                    <select className="form-select form-select-sm border-0 bg-transparent fw-bold shadow-none"
                        style={{ fontSize: 12, width: 'auto', color: getTypeColor(q.type) }}
                        value={q.type} onChange={e => changeType(index, e.target.value as QuestionType)}>
                        {QUESTION_TYPES.map(t => (
                            <option key={t.value} value={t.value}>{t.label}</option>
                        ))}
                    </select>
                </div>
                <button type="button" className="btn btn-sm text-danger p-0 shadow-none" onClick={() => removeQuestion(index)}>
                    <Trash2 size={16} />
                </button>
            </div>

            {/* Body */}
            <div className="p-4">
                {renderFields(q, index)}
                <div>
                    <label className="qb-label">Explanation (shown after answering)</label>
                    <textarea className="form-control qb-input" rows={2} placeholder="Why is this the correct answer?"
                        value={q.explanation || ''} onChange={e => update(index, 'explanation', e.target.value)} />
                </div>
            </div>
        </div>
    );
};

const QuestionBuilder: React.FC<Props> = ({ questions, onChange }) => {

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

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            const oldIndex = questions.findIndex((q: any) => q.id === active.id);
            const newIndex = questions.findIndex((q: any) => q.id === over.id);
            onChange(arrayMove(questions, oldIndex, newIndex));
        }
    };

    const update = (index: number, field: string, value: any) => {
        const copy = [...questions];
        copy[index] = { ...copy[index], [field]: value };
        onChange(copy);
    };

    const updateOption = (qIdx: number, oIdx: number, value: string) => {
        const copy = [...questions];
        const opts = [...copy[qIdx].options];
        opts[oIdx] = value;
        copy[qIdx] = { ...copy[qIdx], options: opts };
        onChange(copy);
    };

    const addOption = (qIdx: number) => {
        const copy = [...questions];
        copy[qIdx] = { ...copy[qIdx], options: [...(copy[qIdx].options || []), ''] };
        onChange(copy);
    };

    const removeOption = (qIdx: number, oIdx: number) => {
        const copy = [...questions];
        const opts = copy[qIdx].options.filter((_: any, i: number) => i !== oIdx);
        copy[qIdx] = { ...copy[qIdx], options: opts };
        onChange(copy);
    };

    const updatePair = (qIdx: number, pIdx: number, field: string, value: string) => {
        const copy = [...questions];
        const pairs = [...copy[qIdx].pairs];
        pairs[pIdx] = { ...pairs[pIdx], [field]: value };
        copy[qIdx] = { ...copy[qIdx], pairs };
        onChange(copy);
    };

    const addPair = (qIdx: number) => {
        const copy = [...questions];
        copy[qIdx] = { ...copy[qIdx], pairs: [...(copy[qIdx].pairs || []), { venda: '', english: '' }] };
        onChange(copy);
    };

    const removePair = (qIdx: number, pIdx: number) => {
        const copy = [...questions];
        const pairs = copy[qIdx].pairs.filter((_: any, i: number) => i !== pIdx);
        copy[qIdx] = { ...copy[qIdx], pairs };
        onChange(copy);
    };

    const addQuestion = (type: QuestionType) => {
        const nextId = `q-${Date.now()}`;
        onChange([...questions, newQuestion(type, nextId)]);
    };

    const removeQuestion = (index: number) => {
        onChange(questions.filter((_: any, i: number) => i !== index));
    };

    const changeType = (index: number, newType: QuestionType) => {
        const copy = [...questions];
        const id = copy[index].id;
        copy[index] = newQuestion(newType, id);
        onChange(copy);
    };

    const getTypeColor = (type: QuestionType) => {
        switch (type) {
            case 'multiple-choice': return '#3B82F6';
            case 'true-false': return '#10B981';
            case 'fill-in-the-blank': return '#F59E0B';
            case 'match-pairs': return '#8B5CF6';
            case 'listen-and-choose': return '#EC4899';
        }
    };

    const renderFields = (q: any, idx: number) => {
        switch (q.type) {

            case 'multiple-choice':
                return (
                    <>
                        <div className="mb-3">
                            <label className="qb-label">Question</label>
                            <input className="form-control qb-input" placeholder="e.g. How do you say 'Hello' as a man?"
                                value={q.question || ''} onChange={e => update(idx, 'question', e.target.value)} />
                        </div>
                        <label className="qb-label">Options</label>
                        {(q.options || []).map((opt: string, oIdx: number) => (
                            <div key={oIdx} className="d-flex align-items-center gap-2 mb-2">
                                <span className="badge bg-secondary rounded-circle" style={{ width: 24, height: 24, lineHeight: '24px', fontSize: 11 }}>{oIdx + 1}</span>
                                <input className="form-control qb-input flex-grow-1" placeholder={`Option ${oIdx + 1}`}
                                    value={opt} onChange={e => updateOption(idx, oIdx, e.target.value)} />
                                {q.options.length > 2 && (
                                    <button type="button" className="btn btn-sm text-danger p-0" onClick={() => removeOption(idx, oIdx)}>
                                        <i className="bi bi-x-lg"></i>
                                    </button>
                                )}
                            </div>
                        ))}
                        <button type="button" className="btn btn-sm btn-outline-secondary fw-bold mb-3" style={{ fontSize: 11 }} onClick={() => addOption(idx)}>
                            + Add Option
                        </button>
                        <div className="mb-3">
                            <label className="qb-label">Correct Answer</label>
                            <select className="form-select qb-input" value={q.correctAnswer || ''}
                                onChange={e => update(idx, 'correctAnswer', e.target.value)}>
                                <option value="">— Pick correct answer —</option>
                                {(q.options || []).filter((o: string) => o).map((opt: string, i: number) => (
                                    <option key={i} value={opt}>{opt}</option>
                                ))}
                            </select>
                        </div>
                    </>
                );

            case 'true-false':
                return (
                    <>
                        <div className="mb-3">
                            <label className="qb-label">Statement</label>
                            <input className="form-control qb-input" placeholder="e.g. 'Aa' is the greeting used by men."
                                value={q.question || ''} onChange={e => update(idx, 'question', e.target.value)} />
                        </div>
                        <div className="mb-3">
                            <label className="qb-label">Correct Answer</label>
                            <div className="d-flex gap-3 mt-1">
                                <button type="button"
                                    className={`btn px-4 py-2 fw-bold ${q.correctAnswer === true ? 'btn-success text-white' : 'btn-outline-secondary'}`}
                                    style={{ fontSize: 13 }}
                                    onClick={() => update(idx, 'correctAnswer', true)}>
                                    TRUE
                                </button>
                                <button type="button"
                                    className={`btn px-4 py-2 fw-bold ${q.correctAnswer === false ? 'btn-danger text-white' : 'btn-outline-secondary'}`}
                                    style={{ fontSize: 13 }}
                                    onClick={() => update(idx, 'correctAnswer', false)}>
                                    FALSE
                                </button>
                            </div>
                        </div>
                    </>
                );

            case 'fill-in-the-blank':
                return (
                    <>
                        <div className="mb-3">
                            <label className="qb-label">Question (use ___ for the blank)</label>
                            <input className="form-control qb-input" placeholder="e.g. Ndi ___ (Good morning)"
                                value={q.question || ''} onChange={e => update(idx, 'question', e.target.value)} />
                        </div>
                        <div className="row g-3 mb-3">
                            <div className="col-md-6">
                                <label className="qb-label">Correct Answer</label>
                                <input className="form-control qb-input" placeholder="e.g. matsheloni"
                                    value={q.correctAnswer || ''} onChange={e => update(idx, 'correctAnswer', e.target.value)} />
                            </div>
                            <div className="col-md-6">
                                <label className="qb-label">Hint</label>
                                <input className="form-control qb-input" placeholder="e.g. matsh..."
                                    value={q.hint || ''} onChange={e => update(idx, 'hint', e.target.value)} />
                            </div>
                        </div>
                    </>
                );

            case 'match-pairs':
                return (
                    <>
                        <div className="mb-3">
                            <label className="qb-label">Question</label>
                            <input className="form-control qb-input" placeholder="e.g. Match the Venda greetings to their English meanings"
                                value={q.question || ''} onChange={e => update(idx, 'question', e.target.value)} />
                        </div>
                        <label className="qb-label">Pairs</label>
                        {(q.pairs || []).map((pair: any, pIdx: number) => (
                            <div key={pIdx} className="d-flex align-items-center gap-2 mb-2">
                                <input className="form-control qb-input" placeholder="Venda word"
                                    value={pair.venda || ''} onChange={e => updatePair(idx, pIdx, 'venda', e.target.value)} />
                                <i className="bi bi-arrow-right text-muted"></i>
                                <input className="form-control qb-input" placeholder="English meaning"
                                    value={pair.english || ''} onChange={e => updatePair(idx, pIdx, 'english', e.target.value)} />
                                {q.pairs.length > 1 && (
                                    <button type="button" className="btn btn-sm text-danger p-0" onClick={() => removePair(idx, pIdx)}>
                                        <i className="bi bi-x-lg"></i>
                                    </button>
                                )}
                            </div>
                        ))}
                        <button type="button" className="btn btn-sm btn-outline-secondary fw-bold mb-3" style={{ fontSize: 11 }} onClick={() => addPair(idx)}>
                            + Add Pair
                        </button>
                    </>
                );

            case 'listen-and-choose':
                return (
                    <>
                        <div className="mb-3">
                            <label className="qb-label">Venda Word (played via TTS)</label>
                            <input className="form-control qb-input" placeholder="e.g. Ndi madekwana"
                                value={q.vendaWord || ''} onChange={e => update(idx, 'vendaWord', e.target.value)} />
                        </div>
                        <div className="mb-3">
                            <label className="qb-label">Question</label>
                            <input className="form-control qb-input" placeholder="e.g. What did you hear?"
                                value={q.question || ''} onChange={e => update(idx, 'question', e.target.value)} />
                        </div>
                        <label className="qb-label">Options</label>
                        {(q.options || []).map((opt: string, oIdx: number) => (
                            <div key={oIdx} className="d-flex align-items-center gap-2 mb-2">
                                <span className="badge bg-secondary rounded-circle" style={{ width: 24, height: 24, lineHeight: '24px', fontSize: 11 }}>{oIdx + 1}</span>
                                <input className="form-control qb-input flex-grow-1" placeholder={`Option ${oIdx + 1}`}
                                    value={opt} onChange={e => updateOption(idx, oIdx, e.target.value)} />
                                {q.options.length > 2 && (
                                    <button type="button" className="btn btn-sm text-danger p-0" onClick={() => removeOption(idx, oIdx)}>
                                        <i className="bi bi-x-lg"></i>
                                    </button>
                                )}
                            </div>
                        ))}
                        <button type="button" className="btn btn-sm btn-outline-secondary fw-bold mb-3" style={{ fontSize: 11 }} onClick={() => addOption(idx)}>
                            + Add Option
                        </button>
                        <div className="mb-3">
                            <label className="qb-label">Correct Answer</label>
                            <select className="form-select qb-input" value={q.correctAnswer || ''}
                                onChange={e => update(idx, 'correctAnswer', e.target.value)}>
                                <option value="">— Pick correct answer —</option>
                                {(q.options || []).filter((o: string) => o).map((opt: string, i: number) => (
                                    <option key={i} value={opt}>{opt}</option>
                                ))}
                            </select>
                        </div>
                    </>
                );
        }
    };

    return (
        <div>
            {/* Question Cards */}
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >
                <SortableContext
                    items={questions.map((q: any) => q.id || q.question)}
                    strategy={verticalListSortingStrategy}
                >
                    {questions.map((q: any, idx: number) => {
                        const typeInfo = QUESTION_TYPES.find(t => t.value === q.type) || QUESTION_TYPES[0];
                        return (
                            <SortableQuestion
                                key={q.id || idx}
                                id={q.id || q.question}
                                index={idx}
                                q={q}
                                typeInfo={typeInfo}
                                getTypeColor={getTypeColor}
                                changeType={changeType}
                                removeQuestion={removeQuestion}
                                renderFields={renderFields}
                                update={update}
                            />
                        );
                    })}
                </SortableContext>
            </DndContext>

            {/* Add Question Controls */}
            <div className="bg-white border rounded-4 p-4 shadow-sm">
                <p className="fw-bold mb-3" style={{ fontSize: 12, letterSpacing: 1, textTransform: 'uppercase', color: '#6B7280' }}>
                    Add Question
                </p>
                <div className="d-flex flex-wrap gap-2">
                    {QUESTION_TYPES.map(t => (
                        <button key={t.value} type="button"
                            className="btn btn-sm btn-outline-dark fw-bold d-flex align-items-center gap-2 rounded-pill px-3"
                            style={{ fontSize: 11, letterSpacing: 0.5 }}
                            onClick={() => addQuestion(t.value)}>
                            <i className={`bi ${t.icon}`} style={{ color: getTypeColor(t.value) }}></i>
                            {t.label}
                        </button>
                    ))}
                </div>
            </div>

            <style>{`
                .qb-label {
                    font-size: 11px;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    color: #6B7280;
                    margin-bottom: 6px;
                    display: block;
                }
                .qb-input {
                    background-color: #f8f9fa !important;
                    border: 1px solid #dee2e6 !important;
                    font-size: 14px;
                    border-radius: 8px !important;
                }
                .qb-input:focus {
                    background-color: #fff !important;
                    border-color: #FACC15 !important;
                    box-shadow: none !important;
                }
            `}</style>
        </div>
    );
};

export default QuestionBuilder;
