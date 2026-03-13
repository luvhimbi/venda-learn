import React, { useState, useEffect } from 'react';
import type { Scene, DialogueLine } from '../../types/game';
import { Volume2, ChevronRight, Languages } from 'lucide-react';

interface SceneViewProps {
    scene: Scene;
    onComplete: () => void;
    speakVenda: (text: string) => void;
}

const SceneView: React.FC<SceneViewProps> = ({ scene, onComplete, speakVenda }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [showEnglish, setShowEnglish] = useState(false);
    const [isAnimating, setIsAnimating] = useState(true);

    const currentLine = scene.dialogue[currentIndex];

    // Get unique characters and their positions
    // We try to infer position if not provided: alternate left/right
    const characters = scene.dialogue.reduce((acc: Record<string, DialogueLine>, line) => {
        if (!acc[line.characterName]) {
            acc[line.characterName] = {
                ...line,
                position: line.position || (Object.keys(acc).length % 2 === 0 ? 'left' : 'right')
            };
        }
        return acc;
    }, {});

    useEffect(() => {
        setIsAnimating(true);
        const timer = setTimeout(() => setIsAnimating(false), 500);
        return () => clearTimeout(timer);
    }, [currentIndex]);

    const handleNext = (e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        if (currentIndex < scene.dialogue.length - 1) {
            setCurrentIndex(currentIndex + 1);
            setShowEnglish(false);
        } else {
            onComplete();
        }
    };

    return (
        <div className="vn-container animate__animated animate__fadeIn">
            {/* Background Layer */}
            <div className="vn-background" style={{
                background: scene.background ?
                    `linear-gradient(to bottom, rgba(0,0,0,0.2), rgba(0,0,0,0.5)), url('https://images.unsplash.com/photo-1549608276-5786d751849d?auto=format&fit=crop&q=80&w=1000')` :
                    `linear-gradient(135deg, #1e293b, #0f172a)`
            }}>
                <div className="vn-overlay"></div>
            </div>

            {/* Title / Scene Header */}
            <div className="vn-scene-header p-4">
                <h4 className="fw-bold text-white mb-0 shadow-sm">{scene.title}</h4>
                {scene.background && <span className="smallest fw-bold text-white-50 ls-2 text-uppercase">{scene.background}</span>}
            </div>

            {/* Character Stage */}
            <div className="vn-stage">
                {Object.values(characters).map((char, charIdx) => {
                    const isActive = char.characterName === currentLine.characterName;
                    const posClass = char.position === 'right' ? 'vn-char-right' : 'vn-char-left';
                    const activeClass = isActive ? 'active' : 'inactive';

                    return (
                        <div
                            key={charIdx}
                            className={`vn-character ${posClass} ${activeClass}`}
                        >
                            <img
                                src={char.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${char.characterName}`}
                                alt={char.characterName}
                                className="vn-char-img"
                            />
                        </div>
                    );
                })}
            </div>

            {/* Dialogue Box */}
            <div className="vn-dialogue-wrapper" onClick={() => handleNext()}>
                <div className="vn-dialogue-box">
                    {/* Character Name Tag */}
                    <div className={`vn-name-tag ${currentLine.position === 'right' ? 'right' : 'left'}`}>
                        {currentLine.characterName}
                    </div>

                    <div className="vn-dialogue-content">
                        <div className="d-flex justify-content-between align-items-start gap-3">
                            <div className="flex-grow-1">
                                <h3 className={`vn-text ${isAnimating ? 'typing' : ''}`}>
                                    {currentLine.venda}
                                </h3>
                                {showEnglish && (
                                    <p className="vn-translation animate__animated animate__fadeIn">
                                        {currentLine.english}
                                    </p>
                                )}
                            </div>
                            <div className="d-flex flex-column gap-2" onClick={(e) => e.stopPropagation()}>
                                <button
                                    className="vn-icon-btn speak"
                                    onClick={() => speakVenda(currentLine.venda)}
                                    title="Listen"
                                >
                                    <Volume2 size={24} />
                                </button>
                                <button
                                    className={`vn-icon-btn translate ${showEnglish ? 'active' : ''}`}
                                    onClick={() => setShowEnglish(!showEnglish)}
                                    title="Translate"
                                >
                                    <Languages size={24} />
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="vn-next-indicator">
                        <ChevronRight size={24} className="next-arrow" />
                        <span className="smallest fw-bold ls-1">TAP TO CONTINUE</span>
                    </div>
                </div>
            </div>

            <style>{`
                .vn-container {
                    position: relative;
                    width: 100%;
                    height: 650px;
                    border-radius: 2rem;
                    overflow: hidden;
                    display: flex;
                    flex-direction: column;
                    box-shadow: 0 20px 50px rgba(0,0,0,0.3);
                    background: #000;
                }

                .vn-background {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background-size: cover !important;
                    background-position: center !important;
                    z-index: 0;
                    transition: background 1s ease;
                }

                .vn-overlay {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.7));
                }

                .vn-scene-header {
                    position: relative;
                    z-index: 10;
                    background: linear-gradient(to bottom, rgba(0,0,0,0.5), transparent);
                }

                .vn-stage {
                    flex: 1;
                    position: relative;
                    z-index: 5;
                    width: 100%;
                    height: 100%;
                }

                .vn-character {
                    width: 320px;
                    transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
                    filter: drop-shadow(0 10px 30px rgba(0,0,0,0.5));
                    position: absolute;
                    bottom: -30px;
                }

                .vn-char-left { left: 0%; transform-origin: bottom center; }
                .vn-char-right { right: 0%; transform-origin: bottom center; }
                .vn-char-right .vn-char-img { transform: scaleX(-1); }

                .vn-char-img {
                    width: 100%;
                    height: auto;
                    display: block;
                }

                .vn-character.inactive {
                    opacity: 0.3;
                    filter: grayscale(1) blur(2px) drop-shadow(0 5px 15px rgba(0,0,0,0.3));
                    transform: translateY(20px) scale(0.95);
                    z-index: 4;
                }

                .vn-character.active {
                    opacity: 1;
                    filter: grayscale(0) blur(0) drop-shadow(0 15px 40px rgba(0,0,0,0.6));
                    transform: translateY(0) scale(1.1);
                    z-index: 6;
                }

                .vn-dialogue-wrapper {
                    position: relative;
                    z-index: 20;
                    padding: 0 1.5rem 1.5rem;
                    cursor: pointer;
                }

                .vn-dialogue-box {
                    background: rgba(15, 23, 42, 0.8);
                    backdrop-filter: blur(16px);
                    -webkit-backdrop-filter: blur(16px);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 2rem;
                    padding: 2.5rem 2.5rem 1.5rem;
                    position: relative;
                    min-height: 160px;
                    box-shadow: 0 -10px 50px rgba(0,0,0,0.5);
                }

                .vn-name-tag {
                    position: absolute;
                    top: -20px;
                    background: linear-gradient(135deg, #FACC15, #EAB308);
                    color: #000;
                    padding: 0.5rem 2rem;
                    border-radius: 1rem;
                    font-weight: 900;
                    font-size: 1.1rem;
                    text-transform: uppercase;
                    letter-spacing: 1.5px;
                    box-shadow: 0 8px 20px rgba(234, 179, 8, 0.4);
                    border: 2px solid rgba(255, 255, 255, 0.2);
                }

                .vn-name-tag.left { left: 2.5rem; }
                .vn-name-tag.right { right: 2.5rem; }

                .vn-text {
                    color: white;
                    font-weight: 700;
                    font-size: 1.6rem;
                    line-height: 1.4;
                    margin-bottom: 0.5rem;
                    text-shadow: 0 2px 8px rgba(0,0,0,0.5);
                }

                .vn-translation {
                    color: #94a3b8;
                    font-style: italic;
                    font-size: 1.2rem;
                    margin-bottom: 0;
                    opacity: 0.9;
                }

                .vn-icon-btn {
                    background: rgba(255,255,255,0.05);
                    border: 1px solid rgba(255,255,255,0.1);
                    color: white;
                    width: 48px;
                    height: 48px;
                    border-radius: 14px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                }

                .vn-icon-btn:hover {
                    background: rgba(255,255,255,0.15);
                    transform: translateY(-3px);
                    border-color: rgba(255,255,255,0.2);
                }

                .vn-icon-btn.active {
                    background: #FACC15;
                    color: #000;
                    box-shadow: 0 4px 15px rgba(250, 204, 21, 0.4);
                }

                .vn-next-indicator {
                    margin-top: 1rem;
                    display: flex;
                    align-items: center;
                    justify-content: flex-end;
                    gap: 0.5rem;
                    color: rgba(255,255,255,0.3);
                }

                .next-arrow {
                    animation: bounceRight 1.5s infinite ease-in-out;
                }

                @keyframes bounceRight {
                    0%, 100% { transform: translateX(0); }
                    50% { transform: translateX(8px); }
                }

                @media (max-width: 768px) {
                    .vn-container { height: 650px; }
                    .vn-character { width: 220px; }
                    .vn-char-left { left: -10%; }
                    .vn-char-right { right: -10%; }
                    .vn-text { font-size: 1.3rem; }
                    .vn-dialogue-box { padding: 2.5rem 1.5rem 1rem; }
                }
            `}</style>
        </div>
    );
};

export default SceneView;
