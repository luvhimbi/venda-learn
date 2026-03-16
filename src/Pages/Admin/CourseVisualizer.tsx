import React, { useState } from 'react';
import AdminNavbar from '../../components/AdminNavbar';
import { useTheme } from '../../contexts/ThemeContext';
import type { ThemeSettings } from '../../contexts/ThemeContext';
import { saveThemeSettings } from '../../services/dataCache';
import Swal from 'sweetalert2';
import { Palette, CheckCircle, Smartphone, LayoutTemplate } from 'lucide-react';

const CourseVisualizer: React.FC = () => {
    const { theme, setTheme } = useTheme();
    const [localTheme, setLocalTheme] = useState<ThemeSettings>(theme);
    const [isSaving, setIsSaving] = useState(false);

    const handleColorChange = (key: keyof ThemeSettings, value: string) => {
        const newTheme = { ...localTheme, [key]: value };
        setLocalTheme(newTheme);
        setTheme(newTheme); // Apply immediately to preview
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await saveThemeSettings(localTheme);
            Swal.fire('Saved!', 'Global theme has been updated for all students.', 'success');
        } catch (e) {
            Swal.fire('Error', 'Failed to save theme.', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const resetTheme = () => {
        const defaultTheme: ThemeSettings = {
            primaryColor: '#f59e0b',
            bgPrimary: '#0f172a',
            bgSecondary: '#1e293b',
            fontFamily: 'Outfit, sans-serif'
        };
        setLocalTheme(defaultTheme);
        setTheme(defaultTheme);
    };

    return (
        <div className="admin-visualizer min-vh-100 bg-light">
            <AdminNavbar />

            {/* HERO HEADER */}
            <div className="editor-hero" style={{ background: 'linear-gradient(135deg, #111827, #1F2937)', padding: '2.5rem 1rem 2rem' }}>
                <div className="container" style={{ maxWidth: '1200px' }}>
                    <h1 className="fw-bold text-white mb-1" style={{ fontSize: '2.2rem', letterSpacing: '-1.5px' }}>
                        Course <span style={{ color: '#FACC15' }}>Visualizer & Designer</span>
                    </h1>
                    <p className="text-white-50 smallest fw-bold ls-1 text-uppercase">Customize the student learning experience</p>
                </div>
            </div>

            <div className="container py-4" style={{ maxWidth: '1200px' }}>
                <div className="row g-4">
                    
                    {/* DESIGNER PANEL */}
                    <div className="col-lg-4">
                        <div className="card border-0 shadow-sm rounded-4 h-100">
                            <div className="card-header bg-white border-bottom-0 pt-4 px-4 pb-0">
                                <h5 className="fw-bold d-flex align-items-center gap-2 mb-0">
                                    <Palette size={20} className="text-primary" /> Global Theme
                                </h5>
                                <p className="text-muted smallest mt-1 mb-0">Changes apply to all student views</p>
                            </div>
                            <div className="card-body p-4">
                                <div className="mb-4">
                                    <label className="smallest fw-bold text-muted text-uppercase d-block mb-2">Primary Accent Color</label>
                                    <div className="d-flex align-items-center gap-3">
                                        <input 
                                            type="color" 
                                            className="form-control form-control-color border-0 p-0" 
                                            value={localTheme.primaryColor} 
                                            onChange={(e) => handleColorChange('primaryColor', e.target.value)} 
                                            style={{ width: '50px', height: '50px', cursor: 'pointer' }}
                                        />
                                        <span className="fw-bold">{localTheme.primaryColor}</span>
                                    </div>
                                    <div className="mt-2 d-flex gap-2">
                                        <button className="badge border-0" style={{ background: '#f59e0b', color: 'white' }} onClick={() => handleColorChange('primaryColor', '#f59e0b')}>Amber (Default)</button>
                                        <button className="badge border-0" style={{ background: '#3b82f6', color: 'white' }} onClick={() => handleColorChange('primaryColor', '#3b82f6')}>Blue</button>
                                        <button className="badge border-0" style={{ background: '#10b981', color: 'white' }} onClick={() => handleColorChange('primaryColor', '#10b981')}>Green</button>
                                        <button className="badge border-0" style={{ background: '#8b5cf6', color: 'white' }} onClick={() => handleColorChange('primaryColor', '#8b5cf6')}>Purple</button>
                                    </div>
                                </div>

                                <div className="mb-4">
                                    <label className="smallest fw-bold text-muted text-uppercase d-block mb-2">App Background (Dark)</label>
                                    <div className="d-flex align-items-center gap-3">
                                        <input 
                                            type="color" 
                                            className="form-control form-control-color border-0 p-0" 
                                            value={localTheme.bgPrimary} 
                                            onChange={(e) => handleColorChange('bgPrimary', e.target.value)} 
                                            style={{ width: '50px', height: '50px', cursor: 'pointer' }}
                                        />
                                        <span className="fw-bold">{localTheme.bgPrimary}</span>
                                    </div>
                                </div>

                                <div className="mb-4">
                                    <label className="smallest fw-bold text-muted text-uppercase d-block mb-2">Typography Font</label>
                                    <select 
                                        className="form-select border-2 shadow-none" 
                                        value={localTheme.fontFamily}
                                        onChange={(e) => handleColorChange('fontFamily', e.target.value)}
                                    >
                                        <option value="'Outfit', sans-serif">Outfit (Modern)</option>
                                        <option value="'Inter', sans-serif">Inter (Clean)</option>
                                        <option value="'Poppins', sans-serif">Poppins (Playful)</option>
                                    </select>
                                </div>

                                <hr className="my-4" />

                                <div className="d-flex flex-column gap-2">
                                    <button 
                                        onClick={handleSave} 
                                        disabled={isSaving}
                                        className="btn game-btn-primary fw-bold text-uppercase d-flex align-items-center justify-content-center gap-2 py-3"
                                        style={{ backgroundColor: '#FACC15', color: '#111827', border: 'none', borderRadius: '10px', boxShadow: '0 4px 0 #EAB308' }}
                                    >
                                        <CheckCircle size={18} /> {isSaving ? 'Saving...' : 'Publish Theme'}
                                    </button>
                                    <button 
                                        onClick={resetTheme} 
                                        className="btn btn-light fw-bold text-muted text-uppercase py-2 rounded-3"
                                    >
                                        Reset to Default
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* LIVE PREVIEW PANEL */}
                    <div className="col-lg-8">
                        <div className="card border-0 shadow-sm rounded-4 h-100 overflow-hidden" style={{ backgroundColor: '#e2e8f0' }}>
                            <div className="card-header bg-white border-bottom px-4 py-3 d-flex align-items-center justify-content-between">
                                <h5 className="fw-bold d-flex align-items-center gap-2 mb-0 text-dark">
                                    <LayoutTemplate size={20} /> Live UI Preview
                                </h5>
                                <div className="d-flex align-items-center gap-2 px-3 py-1 bg-light rounded-pill border">
                                    <Smartphone size={14} className="text-muted" />
                                    <span className="smallest fw-bold text-muted ls-1">Mock Student View</span>
                                </div>
                            </div>
                            
                            {/* Simulated Device Screen */}
                            <div className="card-body p-0 d-flex justify-content-center align-items-center" style={{ minHeight: '600px' }}>
                                <div 
                                    className="preview-screen rounded-4 overflow-hidden position-relative shadow-lg"
                                    style={{ 
                                        width: '400px', 
                                        height: '700px', 
                                        backgroundColor: 'var(--game-bg-primary)',
                                        border: '8px solid #1e293b'
                                    }}
                                >
                                    {/* MOCK STUDENT COURSES PAGE */}
                                    <div className="h-100 overflow-auto bg-white">
                                        
                                        {/* Mock Header */}
                                        <div className="p-4 bg-white">
                                            <p className="smallest fw-bold text-muted mb-1 text-uppercase" style={{ letterSpacing: '2px' }}>Tshivenda Learning Path</p>
                                            <h2 className="fw-bold mb-2 text-dark" style={{ fontSize: '1.8rem', letterSpacing: '-1px' }}>PFUNZO DZOTHE</h2>
                                            <p className="text-muted small mb-0">Preview Mode • Real components shown</p>
                                        </div>

                                        {/* Mock Course Path */}
                                        <div className="p-4 pt-2">
                                            <div className="position-relative">
                                                <div className="position-absolute" style={{ left: '20px', top: 0, bottom: 0, width: '2px', background: 'linear-gradient(to bottom, var(--game-primary), #E5E7EB)', zIndex: 0 }}></div>

                                                {/* Card 1: Completed */}
                                                <div className="position-relative mb-4 ps-5">
                                                    <div className="position-absolute start-0 d-flex align-items-center justify-content-center rounded-circle"
                                                        style={{ width: '42px', height: '42px', zIndex: 1, backgroundColor: '#10B981', border: '3px solid white', boxShadow: '0 0 12px rgba(16,185,129,.3)' }}>
                                                        <i className="bi bi-check-lg text-white fw-bold"></i>
                                                    </div>
                                                    <div className="p-4 rounded-4 border" style={{ backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' }}>
                                                        <span className="smallest fw-bold ls-1 px-2 py-1 rounded-pill" style={{ color: '#10B981', backgroundColor: '#EDFDF5' }}>MAVHAYI</span>
                                                        <h5 className="fw-bold mb-1 mt-2 text-dark">Basics 1</h5>
                                                        <p className="text-muted small mb-3">Muteo wa u thoma</p>
                                                        <button className="btn btn-outline-dark border-2 px-4 py-2 smallest fw-bold w-100 rounded-3">🔄 REVIEW</button>
                                                    </div>
                                                </div>

                                                {/* Card 2: Active (Takes Primary Color) */}
                                                <div className="position-relative mb-4 ps-5">
                                                    <div className="position-absolute start-0 d-flex align-items-center justify-content-center rounded-circle"
                                                        style={{ width: '42px', height: '42px', zIndex: 1, backgroundColor: 'var(--game-primary)', border: '3px solid white', boxShadow: '0 0 12px var(--game-primary)' }}>
                                                        <span className="fw-bold smallest text-dark">2</span>
                                                    </div>
                                                    <div className="p-4 rounded-4 border" style={{ backgroundColor: 'white', borderColor: '#E5E7EB' }}>
                                                        <span className="smallest fw-bold ls-1 px-2 py-1 rounded-pill" style={{ color: '#F59E0B', backgroundColor: '#FFFBEB' }}>VHUKATI</span>
                                                        <h5 className="fw-bold mb-1 mt-2 text-dark">Family</h5>
                                                        <p className="text-muted small mb-3">Muta washu</p>
                                                        
                                                        {/* Previewing Primary Game Button */}
                                                        <button 
                                                            className="btn px-4 py-2 smallest fw-bold w-100 rounded-3 text-dark text-uppercase"
                                                            style={{ 
                                                                backgroundColor: 'var(--game-primary)', 
                                                                boxShadow: '0 4px 0 rgba(0,0,0,0.1)',
                                                                border: 'none',
                                                                letterSpacing: '1px'
                                                            }}
                                                        >
                                                            ▶ THOMA
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Card 3: Locked */}
                                                <div className="position-relative mb-4 ps-5">
                                                    <div className="position-absolute start-0 d-flex align-items-center justify-content-center rounded-circle"
                                                        style={{ width: '42px', height: '42px', zIndex: 1, backgroundColor: '#E5E7EB', border: '3px solid white' }}>
                                                        <i className="bi bi-lock-fill text-muted small"></i>
                                                    </div>
                                                    <div className="p-4 rounded-4 border opacity-50 bg-white">
                                                        <span className="smallest fw-bold ls-1 px-2 py-1 rounded-pill" style={{ color: '#EF4444', backgroundColor: '#FEF2F2' }}>VHUḒU</span>
                                                        <h5 className="fw-bold mb-1 mt-2 text-dark">Advanced Verbs</h5>
                                                        <p className="text-muted small mb-2">Maitele</p>
                                                        <span className="smallest fw-bold text-muted ls-1"><i className="bi bi-lock-fill me-1"></i>LOCKED</span>
                                                    </div>
                                                </div>

                                            </div>
                                        </div>

                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            <style>{`
                .ls-1 { letter-spacing: 1px; }
                .smallest { font-size: 11px; }
            `}</style>
        </div>
    );
};

export default CourseVisualizer;
