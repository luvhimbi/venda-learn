import React, { useState, useEffect, useRef } from 'react';
import {
    ChevronLeft, ChevronRight, X, Settings,
    BookOpen, CheckCircle, ZoomIn, ZoomOut, ChevronDown, Volume2, VolumeX
} from 'lucide-react';

/* ───── Types ───── */
interface StoryPage { pageId: number; venda: string; english: string; image?: string; }
export interface Story {
    id: string; title: string; level: string;
    coverImage?: string;
    pages?: StoryPage[]; vendaText?: string; englishText?: string;
    vocabulary: { word: string; mean: string }[];
    lpReward: number;
}
interface Props {
    story: Story;
    onClose: () => void;
    onFinish: (id: string) => void;
    alreadyClaimed?: boolean;
}

/* ─── Fallback image when no image is set ─── */
const FALLBACK_IMG = 'https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?w=800&q=80';

/* ══════════════════════════════ */
const StoryReader: React.FC<Props> = ({ story, onClose, onFinish, alreadyClaimed = false }) => {
    const [view, setView] = useState<'cover' | 'reading' | 'finished'>('cover');
    const [currentPage, setCurrentPage] = useState(0);
    const [showEnglish, setShowEnglish] = useState(false);
    const [zoom, setZoom] = useState(1);
    const [animClass, setAnimClass] = useState('ngano-fade-in');
    const textRef = useRef<HTMLDivElement>(null);

    /* TTS — dead simple */
    const [speaking, setSpeaking] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [rate, setRate] = useState(0.9);

    const pages: StoryPage[] = story.pages || [
        { pageId: 1, venda: story.vendaText || '', english: story.englishText || '' }
    ];

    /* Cleanup on unmount */
    useEffect(() => {
        return () => { window.speechSynthesis.cancel(); };
    }, []);

    /* ─── TTS: Simple speak/stop ─── */
    function speak(txt: string) {
        const synth = window.speechSynthesis;

        // Use the browser's actual speaking state, not React state (avoids stale closures)
        if (synth.speaking) {
            synth.cancel();
            setSpeaking(false);
            return;
        }

        if (!txt) return;

        synth.cancel(); // clear any queued

        const u = new SpeechSynthesisUtterance(txt);
        u.rate = rate;
        u.lang = showEnglish ? 'en-US' : 'af-ZA';
        u.onend = () => setSpeaking(false);
        u.onerror = () => setSpeaking(false);

        synth.speak(u);
        setSpeaking(true);
    }

    function stopTTS() {
        window.speechSynthesis.cancel();
        setSpeaking(false);
    }

    /* ─── Navigation with animation ─── */
    function goNext() {
        stopTTS();
        if (currentPage < pages.length - 1) {
            setAnimClass('ngano-slide-out-left');
            setTimeout(() => {
                setCurrentPage(p => p + 1);
                setAnimClass('ngano-slide-in-right');
                textRef.current?.scrollTo(0, 0);
            }, 250);
        } else {
            setView('finished');
        }
    }

    function goPrev() {
        stopTTS();
        if (currentPage > 0) {
            setAnimClass('ngano-slide-out-right');
            setTimeout(() => {
                setCurrentPage(p => p - 1);
                setAnimClass('ngano-slide-in-left');
                textRef.current?.scrollTo(0, 0);
            }, 250);
        }
    }

    /* ─── Helpers ─── */
    const text = (showEnglish ? pages[currentPage]?.english : pages[currentPage]?.venda) || '';
    const firstLetter = text.charAt(0);
    const restText = text.slice(1);
    const img = pages[currentPage]?.image || FALLBACK_IMG;
    const coverImg = story.coverImage || pages[0]?.image || FALLBACK_IMG;

    /* ═══════════ COVER ═══════════ */
    if (view === 'cover') {
        return (
            <div className="ngano-root">
                <div className="ngano-cover-wrap">
                    {/* Back */}
                    <button className="ngano-back" onClick={onClose}><X size={18} /> Back</button>

                    {/* Big book cover */}
                    <div className="ngano-cover">
                        <div className="ngano-spine"></div>
                        <div className="ngano-front">
                            <img src={coverImg} alt="" className="ngano-front-img" />
                            <div className="ngano-front-overlay">
                                <div className="ngano-front-badge">{story.level}</div>
                                <h1 className="ngano-front-title">{story.title}</h1>
                                <p className="ngano-front-sub">Ngano dza Tshivenda</p>
                                <p className="ngano-front-pages">{pages.length} pages · {story.lpReward} LP</p>
                                <button className="ngano-open-btn" onClick={() => setView('reading')}>
                                    <BookOpen size={20} /> Open Story
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                <style>{CSS}</style>
            </div>
        );
    }

    /* ═══════════ FINISHED ═══════════ */
    if (view === 'finished') {
        return (
            <div className="ngano-root">
                <div className="ngano-cover-wrap">
                    <div className="ngano-done-card">
                        <div className="ngano-done-icon">🎉</div>
                        <h2 className="ngano-done-title">Zwi vhuya! Well done!</h2>
                        <p className="ngano-done-sub">You finished <strong>{story.title}</strong></p>

                        {alreadyClaimed ? (
                            <div className="ngano-done-claimed">
                                <CheckCircle size={18} /> Already claimed {story.lpReward} LP
                            </div>
                        ) : (
                            <button className="ngano-done-claim" onClick={() => onFinish(story.id)}>
                                <CheckCircle size={18} /> Claim {story.lpReward} LP
                            </button>
                        )}

                        <button className="ngano-done-reread" onClick={() => { setCurrentPage(0); setView('reading'); }}>
                            Read Again
                        </button>
                        <button className="ngano-done-close" onClick={onClose}>
                            Back to Stories
                        </button>
                    </div>
                </div>
                <style>{CSS}</style>
            </div>
        );
    }

    /* ═══════════ READING ═══════════ */
    return (
        <div className="ngano-root">
            {/* Header */}
            <div className="ngano-hdr">
                <button className="ngano-hdr-btn" onClick={() => { stopTTS(); setView('cover'); }}><X size={18} /></button>

                <div className="ngano-hdr-mid">
                    <BookOpen size={14} />
                    <span className="ngano-hdr-name">{story.title}</span>
                </div>

                <div className="ngano-hdr-nav">
                    <button className="ngano-hdr-btn" onClick={goPrev} disabled={currentPage === 0}><ChevronLeft size={16} /></button>
                    <span className="ngano-hdr-pg">{currentPage + 1}/{pages.length}</span>
                    <button className="ngano-hdr-btn" onClick={goNext}><ChevronRight size={16} /></button>
                </div>

                <button className={`ngano-listen-btn ${speaking ? 'on' : ''}`} onClick={() => speak(text)}>
                    {speaking ? <VolumeX size={16} /> : <Volume2 size={16} />}
                    {speaking ? 'Stop' : 'Listen'}
                </button>

                <button className="ngano-hdr-btn" onClick={() => setShowSettings(!showSettings)}><Settings size={16} /></button>
            </div>

            {/* Settings */}
            {showSettings && (
                <div className="ngano-settings">
                    <div className="ngano-settings-row">
                        <label>Speed: {rate.toFixed(1)}x</label>
                        <input type="range" min="0.5" max="1.5" step="0.1" value={rate}
                            onChange={e => setRate(+e.target.value)} />
                    </div>
                    <div className="ngano-settings-row">
                        <button className={`ngano-lang-btn ${!showEnglish ? 'active' : ''}`}
                            onClick={() => { stopTTS(); setShowEnglish(false); }}>Tshivenda</button>
                        <button className={`ngano-lang-btn ${showEnglish ? 'active' : ''}`}
                            onClick={() => { stopTTS(); setShowEnglish(true); }}>English</button>
                    </div>
                </div>
            )}

            {/* Progress */}
            <div className="ngano-prog"><div className="ngano-prog-fill" style={{ width: `${((currentPage + 1) / pages.length) * 100}%` }}></div></div>

            {/* Book */}
            <div className="ngano-book-area">
                <div className={`ngano-book ${animClass}`} style={{ transform: `scale(${zoom})` }}>
                    {/* Spine */}
                    <div className="ngano-book-spine"></div>

                    {/* Image page */}
                    <div className="ngano-pg-img">
                        <img src={img} alt={`Page ${currentPage + 1}`} className="ngano-pg-img-el"
                            onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_IMG; }} />
                        <div className="ngano-pg-num">{currentPage + 1}</div>
                    </div>

                    {/* Text page */}
                    <div className="ngano-pg-txt" ref={textRef}>
                        <div className="ngano-pg-label">NGANO DZA TSHIVENDA</div>
                        <div className="ngano-pg-body">
                            <span className="ngano-drop">{firstLetter}</span>
                            {restText}
                        </div>

                        {/* Vocab */}
                        {story.vocabulary.filter(v => text.toLowerCase().includes(v.word.toLowerCase())).length > 0 && (
                            <div className="ngano-vocab">
                                <div className="ngano-vocab-hd">📖 Vocabulary</div>
                                <div className="ngano-vocab-chips">
                                    {story.vocabulary
                                        .filter(v => text.toLowerCase().includes(v.word.toLowerCase()))
                                        .map((v, i) => (
                                            <button key={i} className="ngano-vchip" onClick={() => {
                                                const u = new SpeechSynthesisUtterance(v.word);
                                                u.rate = 0.75;
                                                window.speechSynthesis.speak(u);
                                            }}>
                                                <strong>{v.word}</strong>
                                                <span>{v.mean}</span>
                                            </button>
                                        ))}
                                </div>
                            </div>
                        )}

                        <button className="ngano-scroll-dn" onClick={() => textRef.current?.scrollBy({ top: 200, behavior: 'smooth' })}>
                            <ChevronDown size={18} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Zoom */}
            <div className="ngano-zoom-panel">
                <button className="ngano-zoom-b" onClick={() => setZoom(z => Math.min(z + 0.15, 1.8))}><ZoomIn size={16} /></button>
                <button className="ngano-zoom-b" onClick={() => setZoom(z => Math.max(z - 0.15, 0.6))}><ZoomOut size={16} /></button>
            </div>

            {/* Bottom */}
            <div className="ngano-btm">
                <button className="ngano-btm-btn" onClick={goPrev} disabled={currentPage === 0}
                    style={{ opacity: currentPage === 0 ? 0.3 : 1 }}>
                    <ChevronLeft size={18} /> Prev
                </button>
                <span className="ngano-btm-pg">Page {currentPage + 1} of {pages.length}</span>
                <button className="ngano-btm-btn ngano-btm-next" onClick={goNext}>
                    {currentPage === pages.length - 1 ? <><CheckCircle size={18} /> Finish</> : <>Next <ChevronRight size={18} /></>}
                </button>
            </div>

            <style>{CSS}</style>
        </div>
    );
};

/* ═══════════════════════════════════
   CSS
   ═══════════════════════════════════ */
const CSS = `
/* Root */
.ngano-root {
    position: fixed; inset: 0; z-index: 1060;
    display: flex; flex-direction: column;
    background: #0f172a;
    font-family: 'Poppins', sans-serif;
    color: #fff;
}

/* ═══ ANIMATIONS ═══ */
.ngano-fade-in { animation: ngFadeIn 0.4s ease; }
.ngano-slide-out-left { animation: ngSlideOutL 0.25s ease forwards; }
.ngano-slide-in-right { animation: ngSlideInR 0.3s ease; }
.ngano-slide-out-right { animation: ngSlideOutR 0.25s ease forwards; }
.ngano-slide-in-left { animation: ngSlideInL 0.3s ease; }

@keyframes ngFadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes ngSlideOutL { to { transform: translateX(-40px); opacity: 0; } }
@keyframes ngSlideInR { from { transform: translateX(40px); opacity: 0; } }
@keyframes ngSlideOutR { to { transform: translateX(40px); opacity: 0; } }
@keyframes ngSlideInL { from { transform: translateX(-40px); opacity: 0; } }

@keyframes coverPop { from { transform: scale(0.8); opacity: 0; } to { transform: scale(1); opacity: 1; } }
@keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.6; } }
@keyframes bounce { 0%,100% { transform: translateY(0); } 50% { transform: translateY(5px); } }

/* ═══ COVER ═══ */
.ngano-cover-wrap {
    width: 100%; height: 100%;
    background: radial-gradient(ellipse at center, #1e293b 0%, #0f172a 80%);
    display: flex; align-items: center; justify-content: center;
    padding: 16px;
}
.ngano-back {
    position: fixed; top: 14px; left: 14px; z-index: 10;
    background: rgba(255,255,255,0.12); border: 1px solid rgba(255,255,255,0.2);
    color: #fff; padding: 8px 16px; border-radius: 10px;
    font-size: 13px; font-weight: 700; cursor: pointer;
    display: flex; align-items: center; gap: 5px;
    backdrop-filter: blur(8px);
    transition: background 0.2s;
}
.ngano-back:hover { background: rgba(255,255,255,0.2); }

/* Cover book — BIG */
.ngano-cover {
    display: flex;
    width: 92vw; max-width: 600px;
    height: 88vh; max-height: 780px;
    animation: coverPop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
    filter: drop-shadow(0 24px 48px rgba(0,0,0,0.6));
}

.ngano-spine {
    width: 28px; flex-shrink: 0;
    background: linear-gradient(to right, #6b4f0c, #c9a227, #8b6914, #c9a227, #6b4f0c);
    border-radius: 10px 0 0 10px;
    box-shadow: inset -3px 0 6px rgba(0,0,0,0.3);
}
.ngano-front {
    flex: 1; position: relative; overflow: hidden;
    border-radius: 0 10px 10px 0;
}
.ngano-front-img {
    width: 100%; height: 100%; object-fit: cover;
    filter: brightness(0.5);
}
.ngano-front-overlay {
    position: absolute; inset: 0;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    padding: 32px; text-align: center;
    background: linear-gradient(transparent 5%, rgba(0,0,0,0.7) 100%);
}
.ngano-front-badge {
    background: #f59e0b; color: #000; font-size: 11px; font-weight: 800;
    padding: 4px 14px; border-radius: 20px; text-transform: uppercase;
    letter-spacing: 1px; margin-bottom: 16px;
}
.ngano-front-title {
    font-size: clamp(30px, 6vw, 48px); font-weight: 800;
    color: #fff; text-shadow: 0 4px 20px rgba(0,0,0,0.6);
    margin: 0 0 8px; line-height: 1.1;
}
.ngano-front-sub {
    font-size: 15px; color: rgba(255,255,255,0.7); font-style: italic; margin: 0 0 6px;
}
.ngano-front-pages {
    font-size: 13px; color: rgba(255,255,255,0.5); margin: 0 0 20px; font-weight: 600;
}
.ngano-open-btn {
    background: #f59e0b; color: #000; border: none;
    padding: 12px 28px; border-radius: 12px;
    font-size: 15px; font-weight: 800; text-transform: uppercase;
    letter-spacing: 0.5px; cursor: pointer;
    display: flex; align-items: center; gap: 8px;
    box-shadow: 0 4px 0 #b45309, 0 8px 24px rgba(245,158,11,0.3);
    transition: all 0.15s;
}
.ngano-open-btn:hover { transform: translateY(-2px); box-shadow: 0 6px 0 #b45309, 0 12px 30px rgba(245,158,11,0.4); }
.ngano-open-btn:active { transform: translateY(2px); box-shadow: 0 2px 0 #b45309; }

/* ═══ FINISHED ═══ */
.ngano-done-card {
    background: #fff; color: #1e293b; border-radius: 24px;
    padding: 36px 28px; text-align: center;
    max-width: 380px; width: 90%;
    animation: coverPop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
    box-shadow: 0 20px 60px rgba(0,0,0,0.4);
}
.ngano-done-icon { font-size: 64px; margin-bottom: 8px; }
.ngano-done-title { font-size: 22px; font-weight: 800; margin: 0 0 6px; color: #1e293b; }
.ngano-done-sub { font-size: 14px; color: #64748b; margin: 0 0 20px; }
.ngano-done-claim {
    width: 100%; padding: 12px; border: none; border-radius: 12px;
    background: #10b981; color: #fff; font-size: 14px; font-weight: 800;
    text-transform: uppercase; cursor: pointer; margin-bottom: 10px;
    display: flex; align-items: center; justify-content: center; gap: 6px;
    box-shadow: 0 3px 0 #059669;
    transition: all 0.15s;
}
.ngano-done-claim:hover { transform: translateY(-1px); }
.ngano-done-claim:active { transform: translateY(2px); box-shadow: 0 1px 0 #059669; }
.ngano-done-claimed {
    width: 100%; padding: 12px; border-radius: 12px;
    background: #f1f5f9; color: #64748b; font-size: 14px; font-weight: 700;
    display: flex; align-items: center; justify-content: center; gap: 6px;
    margin-bottom: 10px;
}
.ngano-done-reread {
    width: 100%; padding: 10px; border: 2px solid #f59e0b; border-radius: 12px;
    background: transparent; color: #f59e0b; font-size: 13px; font-weight: 700;
    cursor: pointer; margin-bottom: 8px; transition: all 0.2s;
}
.ngano-done-reread:hover { background: #fef3c7; }
.ngano-done-close {
    width: 100%; padding: 10px; border: none; border-radius: 12px;
    background: transparent; color: #94a3b8; font-size: 13px; font-weight: 600;
    cursor: pointer;
}
.ngano-done-close:hover { color: #64748b; }

/* ═══ READING HEADER ═══ */
.ngano-hdr {
    display: flex; align-items: center; gap: 6px;
    padding: 8px 10px; flex-shrink: 0;
    background: #1e293b;
    border-bottom: 2px solid #f59e0b;
}
.ngano-hdr-btn {
    background: rgba(255,255,255,0.08); border: none; color: #fff;
    width: 32px; height: 32px; border-radius: 8px;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; transition: background 0.2s;
}
.ngano-hdr-btn:hover { background: rgba(255,255,255,0.15); }
.ngano-hdr-btn:disabled { opacity: 0.25; }
.ngano-hdr-mid {
    display: flex; align-items: center; gap: 5px; flex: 1; min-width: 0;
    color: #f59e0b; font-size: 13px; font-weight: 700;
}
.ngano-hdr-name {
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: #fff;
}
.ngano-hdr-nav { display: flex; align-items: center; gap: 2px; }
.ngano-hdr-pg { font-size: 12px; font-weight: 700; min-width: 28px; text-align: center; color: rgba(255,255,255,0.7); }

/* Listen */
.ngano-listen-btn {
    background: #f59e0b; color: #000; border: none;
    padding: 6px 14px; border-radius: 20px;
    font-size: 12px; font-weight: 800; text-transform: uppercase;
    display: flex; align-items: center; gap: 5px;
    cursor: pointer; transition: all 0.15s;
    box-shadow: 0 3px 0 #b45309;
    white-space: nowrap;
}
.ngano-listen-btn:hover { transform: translateY(-1px); }
.ngano-listen-btn:active { transform: translateY(2px); box-shadow: 0 1px 0 #b45309; }
.ngano-listen-btn.on {
    background: #ef4444; color: #fff;
    box-shadow: 0 3px 0 #b91c1c;
    animation: pulse 1s infinite;
}

/* Settings */
.ngano-settings {
    background: #1e293b; padding: 10px 14px; flex-shrink: 0;
    border-bottom: 1px solid rgba(255,255,255,0.06);
    display: flex; gap: 12px; flex-wrap: wrap; align-items: center;
}
.ngano-settings-row {
    display: flex; align-items: center; gap: 8px;
}
.ngano-settings-row label { font-size: 12px; color: rgba(255,255,255,0.7); font-weight: 600; white-space: nowrap; }
.ngano-settings-row input[type="range"] { width: 100px; accent-color: #f59e0b; }
.ngano-lang-btn {
    background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.15);
    color: rgba(255,255,255,0.7); padding: 5px 14px; border-radius: 8px;
    font-size: 12px; font-weight: 700; cursor: pointer; transition: all 0.2s;
}
.ngano-lang-btn.active {
    background: #f59e0b; color: #000; border-color: #f59e0b;
}

/* Progress */
.ngano-prog { height: 3px; background: rgba(255,255,255,0.06); flex-shrink: 0; }
.ngano-prog-fill { height: 100%; background: linear-gradient(90deg, #f59e0b, #ef4444); transition: width 0.4s; }

/* ═══ BOOK ═══ */
.ngano-book-area {
    flex: 1; overflow: auto;
    display: flex; justify-content: center;
    -webkit-overflow-scrolling: touch;
}
.ngano-book {
    display: flex; width: 100%; max-width: 1200px;
    min-height: 100%;
    transform-origin: top center; transition: transform 0.3s;
}
.ngano-book-spine {
    width: 14px; flex-shrink: 0;
    background: linear-gradient(to right, rgba(0,0,0,0.4), rgba(255,255,255,0.1) 40%, rgba(255,255,255,0.1) 60%, rgba(0,0,0,0.4));
    z-index: 2;
}

/* Image page */
.ngano-pg-img {
    flex: 0 0 calc(50% - 7px); overflow: hidden;
    background: #111; position: relative;
}
.ngano-pg-img-el {
    width: 100%; height: 100%; object-fit: cover; display: block;
    transition: transform 0.5s ease;
}
.ngano-pg-img:hover .ngano-pg-img-el { transform: scale(1.03); }
.ngano-pg-num {
    position: absolute; bottom: 14px; left: 16px;
    background: rgba(0,0,0,0.5); color: #fff;
    width: 30px; height: 30px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 12px; font-weight: 700;
    backdrop-filter: blur(6px);
}

/* Text page */
.ngano-pg-txt {
    flex: 0 0 calc(50% - 7px);
    background: #faf8f3; color: #2c2c2c;
    padding: 32px 36px;
    display: flex; flex-direction: column;
    overflow-y: auto; position: relative;
    /* faint paper lines */
    background-image: linear-gradient(rgba(0,0,0,0.018) 1px, transparent 1px);
    background-size: 100% 30px;
}
.ngano-pg-label {
    font-size: 10px; font-weight: 700; letter-spacing: 2.5px;
    color: #bbb; text-align: right; margin-bottom: 22px;
}
.ngano-pg-body {
    font-family: 'Georgia', 'Times New Roman', serif;
    font-size: 20px; line-height: 1.85; color: #2c2c2c; flex: 1;
}
.ngano-drop {
    float: left; font-size: 68px; line-height: 0.76;
    font-family: 'Georgia', serif; font-weight: 700;
    color: #f59e0b;
    margin: 2px 12px 0 0;
    text-shadow: 2px 2px 0 rgba(0,0,0,0.06);
}

/* Vocab */
.ngano-vocab { border-top: 1px solid #e4ddd0; padding-top: 14px; margin-top: 24px; }
.ngano-vocab-hd {
    font-size: 11px; font-weight: 700; text-transform: uppercase;
    color: #999; margin-bottom: 8px; letter-spacing: 1px;
    font-family: 'Poppins', sans-serif;
}
.ngano-vocab-chips { display: flex; flex-wrap: wrap; gap: 6px; }
.ngano-vchip {
    background: #fff; border: 1.5px solid #f59e0b;
    border-radius: 8px; padding: 5px 10px; cursor: pointer;
    font-size: 12px; display: flex; flex-direction: column;
    transition: all 0.2s; text-align: left;
    font-family: 'Poppins', sans-serif;
}
.ngano-vchip:hover { background: #fef3c7; transform: translateY(-2px); box-shadow: 0 3px 8px rgba(0,0,0,0.08); }
.ngano-vchip strong { color: #b45309; font-size: 13px; }
.ngano-vchip span { color: #888; font-size: 10px; }

/* Scroll */
.ngano-scroll-dn {
    background: none; border: none; color: #ccc;
    text-align: center; padding: 8px; cursor: pointer; margin-top: auto;
    animation: bounce 2s infinite;
}

/* Zoom */
.ngano-zoom-panel {
    position: fixed; right: 10px; top: 50%; transform: translateY(-50%);
    display: flex; flex-direction: column; gap: 4px; z-index: 1070;
}
.ngano-zoom-b {
    width: 34px; height: 34px; border-radius: 8px;
    background: rgba(255,255,255,0.92); border: 1px solid #ddd;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; color: #555;
    box-shadow: 0 2px 6px rgba(0,0,0,0.12); transition: all 0.2s;
}
.ngano-zoom-b:hover { transform: scale(1.1); background: #fff; }

/* Bottom */
.ngano-btm {
    display: flex; align-items: center; justify-content: space-between;
    padding: 10px 14px; gap: 10px; flex-shrink: 0;
    background: #1e293b; border-top: 2px solid #f59e0b;
}
.ngano-btm-pg { font-size: 12px; color: rgba(255,255,255,0.35); font-weight: 600; }
.ngano-btm-btn {
    display: flex; align-items: center; gap: 4px;
    background: rgba(255,255,255,0.08); border: none; color: #fff;
    padding: 9px 16px; border-radius: 10px; font-size: 13px; font-weight: 700;
    cursor: pointer; transition: all 0.15s;
}
.ngano-btm-btn:hover { background: rgba(255,255,255,0.14); }
.ngano-btm-btn:disabled { opacity: 0.3; }
.ngano-btm-next { background: #f59e0b; color: #000; box-shadow: 0 3px 0 #b45309; }
.ngano-btm-next:hover { transform: translateY(-1px); }

/* ═══ MOBILE ═══ */
@media (max-width: 768px) {
    .ngano-book { flex-direction: column; }
    .ngano-book-spine { display: none; }
    .ngano-pg-img { flex: none; height: 35vh; min-height: 200px; }
    .ngano-pg-txt { flex: none; padding: 20px 18px; }
    .ngano-pg-body { font-size: 17px; }
    .ngano-drop { font-size: 48px; }
    .ngano-zoom-panel { display: none; }
    .ngano-hdr-mid { display: none; }
    .ngano-cover { height: 80vh; }
}
@media (max-width: 400px) {
    .ngano-pg-img { height: 26vh; }
    .ngano-pg-body { font-size: 16px; line-height: 1.7; }
    .ngano-cover { height: 75vh; }
}
`;

export default StoryReader;
