import React, { useState } from 'react';
import CustomAvatarSVG, { DEFAULT_AVATAR_CONFIG } from './CustomAvatar';
import type { AvatarConfig } from './CustomAvatar';
import JuicyButton from './JuicyButton';
import { CheckCircle } from 'lucide-react';

const COLORS = {
    skin: ['#FFDCB6', '#E5A073', '#C67A53', '#8D5524', '#5C3817', '#3B220B'],
    hair: ['#000000', '#2B1A0F', '#6B4226', '#E5A073', '#9ca3af', '#b91c1c', '#1d4ed8'],
    bg: ['#FFCDD2', '#F8BBD0', '#E1BEE7', '#D1C4E9', '#C5CAE9', '#BBDEFB', '#B3E5FC', '#B2EBF2', '#B2DFDB', '#C8E6C9', '#DCEDC8', '#F0F4C3', '#FFF9C4', '#FFECB3', '#FFE0B2', '#FFCCBC']
};

const PRESETS = [
    { label: 'The Voyager', config: { skinColor: '#8D5524', hairColor: '#000000', hairStyle: 'bald', eyes: 'focused', mouth: 'smirk', outfit: 'traditional-tunic', bgColor: '#B2DFDB' } as AvatarConfig },
    { label: 'The Scholar', config: { skinColor: '#5C3817', hairColor: '#000000', hairStyle: 'bald', eyes: 'normal', mouth: 'smile', outfit: 'scholar', bgColor: '#FFF9C4' } as AvatarConfig },
    { label: 'The Artist', config: { skinColor: '#E5A073', hairColor: '#6B4226', hairStyle: 'bald', eyes: 'happy', mouth: 'laugh', outfit: 'hoodie', bgColor: '#FFCDD2' } as AvatarConfig },
    { label: 'The Protector', config: { skinColor: '#3B220B', hairColor: '#000000', hairStyle: 'bald', eyes: 'surprised', mouth: 'open', outfit: 'sports', bgColor: '#DCEDC8' } as AvatarConfig },
    { label: 'The Matriarch', config: { skinColor: '#8D5524', hairColor: '#000000', hairStyle: 'makoti', eyes: 'happy', mouth: 'smile', outfit: 'minwenda', bgColor: '#F8BBD0' } as AvatarConfig },
    { label: 'The Sister', config: { skinColor: '#C67A53', hairColor: '#2B1A0F', hairStyle: 'braids', eyes: 'normal', mouth: 'smirk', outfit: 'casual', bgColor: '#E1BEE7' } as AvatarConfig },
    { label: 'The Warrior', config: { skinColor: '#3B220B', hairColor: '#000000', hairStyle: 'fade', eyes: 'focused', mouth: 'neutral', outfit: 'traditional-tunic', bgColor: '#C5CAE9' } as AvatarConfig },
    { label: 'The Chief', config: { skinColor: '#5C3817', hairColor: '#6B4226', hairStyle: 'afro', eyes: 'normal', mouth: 'laugh', outfit: 'minwenda', bgColor: '#FFCCBC' } as AvatarConfig },
    { label: 'The Student', config: { skinColor: '#FFDCB6', hairColor: '#E5A073', hairStyle: 'braids', eyes: 'happy', mouth: 'open', outfit: 'scholar', bgColor: '#BBDEFB' } as AvatarConfig },
    { label: 'The Athlete', config: { skinColor: '#8D5524', hairColor: '#000000', hairStyle: 'fade', eyes: 'focused', mouth: 'smile', outfit: 'sports', bgColor: '#B3E5FC' } as AvatarConfig },
    { label: 'The Auntie', config: { skinColor: '#5C3817', hairColor: '#000000', hairStyle: 'makoti', eyes: 'surprised', mouth: 'laugh', outfit: 'minwenda', bgColor: '#FFF9C4' } as AvatarConfig },
    { label: 'The Friend', config: { skinColor: '#E5A073', hairColor: '#1d4ed8', hairStyle: 'afro', eyes: 'wink', mouth: 'smirk', outfit: 'hoodie', bgColor: '#B2EBF2' } as AvatarConfig },
    { label: 'The Guide', config: { skinColor: '#3B220B', hairColor: '#000000', hairStyle: 'bald', eyes: 'normal', mouth: 'smile', outfit: 'minwenda', bgColor: '#C8E6C9' } as AvatarConfig },
    { label: 'The Dreamer', config: { skinColor: '#C67A53', hairColor: '#b91c1c', hairStyle: 'braids', eyes: 'happy', mouth: 'laugh', outfit: 'casual', bgColor: '#F0F4C3' } as AvatarConfig },
];

interface AvatarBuilderProps {
    initialConfig?: AvatarConfig;
    onSave: (config: AvatarConfig) => void;
    onCancel: () => void;
}

const AvatarBuilder: React.FC<AvatarBuilderProps> = ({ initialConfig, onSave, onCancel }) => {
    const [config, setConfig] = useState<AvatarConfig>(initialConfig || DEFAULT_AVATAR_CONFIG);
    const [activeTab, setActiveTab] = useState<'presets' | 'skin' | 'hair' | 'face' | 'outfit' | 'bg'>('presets');

    return (
        <div className="avatar-builder-container bg-white w-100 d-flex flex-column" style={{ minHeight: '600px', maxHeight: '90vh' }}>
            <div className="d-flex justify-content-between align-items-center p-3 border-bottom shadow-sm z-1 position-relative bg-white">
                <h5 className="mb-0 fw-bold ls-1 text-dark d-flex align-items-center gap-2">
                    <span className="bg-primary text-white px-2 py-1 rounded-3 smallest uppercase">SVG</span>
                    Character Builder
                </h5>
                <button onClick={onCancel} className="btn-close shadow-none" aria-label="Close"></button>
            </div>

            <div className="d-flex flex-column flex-md-row flex-grow-1 overflow-hidden">
                {/* PREVIEW PANEL */}
                <div className="preview-panel p-4 p-md-5 d-flex align-items-center justify-content-center bg-light border-end w-100 w-md-50">
                    <div className="shadow-lg rounded-circle" style={{ padding: '8px', background: 'white' }}>
                        <CustomAvatarSVG config={config} size={250} />
                    </div>
                </div>

                {/* CONTROLS PANEL */}
                <div className="controls-panel w-100 w-md-50 d-flex flex-column bg-white h-100">
                    {/* TABS */}
                    <div className="d-flex overflow-auto border-bottom hide-scrollbar">
                        {['presets', 'skin', 'hair', 'face', 'outfit', 'bg'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab as any)}
                                className={`flex-grow-1 btn shadow-none rounded-0 py-3 fw-bold ls-1 smallest uppercase ${activeTab === tab ? 'border-bottom border-3 border-primary text-primary' : 'text-muted border-bottom border-3 border-transparent'}`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>

                    {/* TAB CONTENT */}
                    <div className="flex-grow-1 overflow-auto p-4" style={{ maxHeight: '50vh', overflowY: 'auto', overflowX: 'hidden' }}>
                        {activeTab === 'presets' && (
                            <div>
                                <h6 className="fw-bold mb-3 ls-1 text-uppercase text-muted smallest">Starting Templates</h6>
                                <div className="row g-3">
                                    {PRESETS.map((preset, idx) => (
                                        <div key={idx} className="col-6">
                                            <button
                                                onClick={() => setConfig(preset.config)}
                                                className="btn btn-light border p-3 w-100 rounded-4 d-flex flex-column align-items-center gap-2 hover-lift transition-all"
                                            >
                                                <div className="shadow-sm rounded-circle p-1 bg-white">
                                                    <CustomAvatarSVG config={preset.config} size={60} />
                                                </div>
                                                <span className="smallest fw-bold text-dark ls-1 uppercase">{preset.label}</span>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {activeTab === 'skin' && (
                            <div>
                                <h6 className="fw-bold mb-3 ls-1 text-uppercase text-muted smallest">Skin Tone</h6>
                                <div className="d-flex flex-wrap gap-3">
                                    {COLORS.skin.map(color => (
                                        <button
                                            key={color}
                                            onClick={() => setConfig({ ...config, skinColor: color })}
                                            className="rounded-circle border border-2 shadow-sm position-relative hover-lift transition-all"
                                            style={{ 
                                                width: 50, height: 50, backgroundColor: color, 
                                                borderColor: config.skinColor === color ? '#0f172a' : 'white',
                                                transform: config.skinColor === color ? 'scale(1.1)' : 'scale(1)'
                                            }}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {activeTab === 'hair' && (
                            <div className="d-flex flex-column gap-4">
                                <div>
                                    <h6 className="fw-bold mb-3 ls-1 text-uppercase text-muted smallest">Hair Style</h6>
                                    <div className="d-flex flex-wrap gap-2">
                                        {['afro', 'fade', 'braids', 'makoti', 'bald'].map(style => (
                                            <button
                                                key={style}
                                                onClick={() => setConfig({ ...config, hairStyle: style as any })}
                                                className={`btn px-4 py-2 rounded-pill fw-bold ls-1 smallest uppercase transition-all ${config.hairStyle === style ? 'btn-primary shadow copy-badge' : 'btn-light border text-secondary'}`}
                                            >
                                                {style}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <hr className="opacity-10" />
                                <div>
                                    <h6 className="fw-bold mb-3 ls-1 text-uppercase text-muted smallest">Hair Color</h6>
                                    <div className="d-flex flex-wrap gap-3">
                                        {COLORS.hair.map(color => (
                                            <button
                                                key={color}
                                                onClick={() => setConfig({ ...config, hairColor: color })}
                                                className="rounded-circle border border-2 shadow-sm position-relative transition-all"
                                                style={{ 
                                                    width: 40, height: 40, backgroundColor: color, 
                                                    borderColor: config.hairColor === color ? '#0f172a' : 'white',
                                                    transform: config.hairColor === color ? 'scale(1.1)' : 'scale(1)'
                                                }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'face' && (
                            <div className="d-flex flex-column gap-4">
                                <div>
                                    <h6 className="fw-bold mb-3 ls-1 text-uppercase text-muted smallest">Eyes</h6>
                                    <div className="d-flex flex-wrap gap-2">
                                        {['normal', 'happy', 'focused', 'wink', 'surprised'].map(eye => (
                                            <button
                                                key={eye}
                                                onClick={() => setConfig({ ...config, eyes: eye as any })}
                                                className={`btn px-4 py-2 rounded-pill fw-bold ls-1 smallest uppercase transition-all ${config.eyes === eye ? 'btn-dark shadow' : 'btn-light border text-secondary'}`}
                                            >
                                                {eye}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <h6 className="fw-bold mb-3 ls-1 text-uppercase text-muted smallest">Mouth</h6>
                                    <div className="d-flex flex-wrap gap-2">
                                        {['smile', 'neutral', 'laugh', 'smirk', 'open'].map(mouth => (
                                            <button
                                                key={mouth}
                                                onClick={() => setConfig({ ...config, mouth: mouth as any })}
                                                className={`btn px-4 py-2 rounded-pill fw-bold ls-1 smallest uppercase transition-all ${config.mouth === mouth ? 'btn-dark shadow' : 'btn-light border text-secondary'}`}
                                            >
                                                {mouth}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'outfit' && (
                            <div>
                                <h6 className="fw-bold mb-3 ls-1 text-uppercase text-muted smallest">Clothing</h6>
                                <div className="d-flex flex-wrap gap-2">
                                    {['minwenda', 'casual', 'scholar', 'traditional-tunic', 'hoodie', 'sports'].map(outfit => (
                                        <button
                                            key={outfit}
                                            onClick={() => setConfig({ ...config, outfit: outfit as any })}
                                            className={`btn px-4 py-2 rounded-4 fw-bold ls-1 d-flex flex-column align-items-center justify-content-center gap-2 transition-all flex-grow-1 ${config.outfit === outfit ? 'btn-warning border border-dark text-dark shadow-sm' : 'btn-light border text-secondary'}`}
                                        >
                                            <span className="uppercase">{outfit} Style</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {activeTab === 'bg' && (
                            <div>
                                <h6 className="fw-bold mb-3 ls-1 text-uppercase text-muted smallest">Backdrop Color</h6>
                                <div className="d-flex flex-wrap gap-2">
                                    {COLORS.bg.map(color => (
                                        <button
                                            key={color}
                                            onClick={() => setConfig({ ...config, bgColor: color })}
                                            className="rounded-circle border border-3 shadow-sm transition-all"
                                            style={{ 
                                                width: 50, height: 50, backgroundColor: color, 
                                                borderColor: config.bgColor === color ? '#0f172a' : 'transparent',
                                                transform: config.bgColor === color ? 'scale(1.1)' : 'scale(1)'
                                            }}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            {/* FOOTER ACTIONS */}
            <div className="p-3 border-top bg-light d-flex justify-content-end gap-2 z-1">
                <button onClick={onCancel} className="btn btn-light fw-bold ls-1 border text-secondary px-4 rounded-pill">CANCEL</button>
                <JuicyButton onClick={() => onSave(config)} className="btn btn-primary fw-bold ls-1 shadow-sm px-5 rounded-pill d-flex align-items-center gap-2">
                    <CheckCircle size={18} /> SAVE CHARACTER
                </JuicyButton>
            </div>

            <style>{`
                .hover-lift:hover { transform: translateY(-3px) scale(1.05) !important; }
                .copy-badge { background: linear-gradient(135deg, #1D4ED8, #4F46E5); color: white; border: none; }
            `}</style>
        </div>
    );
};

export default AvatarBuilder;
