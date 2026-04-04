import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Mascot from '../../components/Mascot';
import JuicyButton from '../../components/JuicyButton';
import { ArrowRight, Flame, Sparkles, Star } from 'lucide-react';
import TrophyIcon from '../../components/TrophyIcon';

const Onboarding: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [currentSlide, setCurrentSlide] = useState(0);

    const handleNext = () => {
        if (currentSlide < slides.length - 1) {
            setCurrentSlide(prev => prev + 1);
        } else {
            handleComplete();
        }
    };

    const handleComplete = () => {
        // Carry forward any referral params
        const ref = searchParams.get('ref');
        navigate(ref ? `/register?ref=${ref}` : '/register');
    };

    const slides = [
        {
            title: "Meet Elphie",
            subtitle: "Your Language Guide",
            description: "Say hello to your personal companion! Elphie will guide you through cultural stories, interactive quests, and celebrate your wins.",
            visual: (
                <div className="gamified-visual-container">
                    <div className="glow-ring"></div>
                    <div className="floating-element float-delay-1" style={{ top: '10%', left: '10%' }}><Star size={24} color="#FACC15" fill="#FACC15" /></div>
                    <div className="floating-element float-delay-2" style={{ bottom: '20%', right: '10%' }}><Sparkles size={28} color="#60A5FA" /></div>
                    <Mascot width="240px" height="240px" mood="excited" className="position-relative z-1 drop-shadow-heavy" />
                </div>
            )
        },
        {
            title: "Earn Your Stripes",
            subtitle: "Level Up with XP",
            description: "Every lesson completed and word learned earns you Experience Points (XP). Climb the ranks from a 'Traveler' to a true 'Local'.",
            visual: (
                <div className="gamified-visual-container">
                    <div className="glow-ring warning-glow"></div>
                    
                    <div className="floating-badge badge-xp">+50 XP</div>
                    <div className="floating-badge badge-rank">Rank Up!</div>

                    <div className="trophy-showcase">
                        <TrophyIcon rarity="special" size={100} animate={true} />
                    </div>
                </div>
            )
        },
        {
            title: "Protect the Fire",
            subtitle: "Build Your Habit",
            description: "Consistency is key to mastering a language. Keep your daily streak alive to earn bonus multipliers and unlock exclusive content.",
            visual: (
                <div className="gamified-visual-container">
                    <div className="glow-ring danger-glow"></div>
                    
                    <div className="floating-element float-delay-1" style={{ top: '15%', right: '15%' }}><Flame size={32} color="#EF4444" fill="#EF4444" opacity={0.5} /></div>
                    
                    <div className="streak-showcase">
                        <div className="fire-container">
                            <Flame size={90} className="text-danger animate-fire" strokeWidth={2.5} fill="#EF4444" />
                        </div>
                        <div className="streak-banner">
                            <span className="fw-black text-white ls-1">7 DAY STREAK</span>
                        </div>
                    </div>
                </div>
            )
        }
    ];

    return (
        <div className="onboarding-layout">
            {/* Soft Dot Pattern Background */}
            <div className="onboarding-bg-pattern"></div>
            
            {/* Top Navigation / Progress */}
            <div className="onboarding-header">
                <div className="progress-pills">
                    {slides.map((_, idx) => (
                        <div 
                            key={idx} 
                            className={`progress-pill ${currentSlide === idx ? 'active' : ''} ${currentSlide > idx ? 'completed' : ''}`}
                        />
                    ))}
                </div>
                <button onClick={handleComplete} className="skip-btn">
                    Skip
                </button>
            </div>

            {/* Main Content Area */}
            <div className="onboarding-content">
                
                {/* Visual Area */}
                <div className="visual-section">
                    <div key={currentSlide} className="animate__animated animate__zoomIn animate__faster">
                        {slides[currentSlide].visual}
                    </div>
                </div>

                {/* Text & Action Area */}
                <div className="text-section">
                    <div key={`text-${currentSlide}`} className="animate__animated animate__fadeInUp animate__faster text-center">
                        <span className="subtitle-badge">{slides[currentSlide].subtitle}</span>
                        <h1 className="fw-black text-dark mb-3 ls-tight main-title">{slides[currentSlide].title}</h1>
                        <p className="description-text">
                            {slides[currentSlide].description}
                        </p>
                    </div>

                    <div className="action-section">
                        <JuicyButton 
                            onClick={handleNext}
                            className={`gamified-btn ${currentSlide === slides.length - 1 ? 'btn-final' : 'btn-next'}`}
                        >
                            <span className="btn-text">
                                {currentSlide === slides.length - 1 ? "Let's Get Started" : "Continue"}
                            </span>
                            <div className="btn-icon">
                                <ArrowRight size={24} strokeWidth={3} />
                            </div>
                        </JuicyButton>
                    </div>
                </div>
            </div>

            <style>{`
                .onboarding-layout {
                    min-height: 100vh;
                    background-color: #F8FAFC;
                    position: relative;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    overflow: hidden;
                    user-select: none;
                }

                .onboarding-bg-pattern {
                    position: absolute;
                    inset: 0;
                    background-image: radial-gradient(#CBD5E1 1px, transparent 1px);
                    background-size: 24px 24px;
                    opacity: 0.4;
                    z-index: 0;
                }

                .onboarding-header {
                    width: 100%;
                    max-width: 600px;
                    padding: 2rem 1.5rem;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    position: relative;
                    z-index: 10;
                }

                .progress-pills {
                    display: flex;
                    gap: 8px;
                }

                .progress-pill {
                    height: 8px;
                    width: 16px;
                    border-radius: 8px;
                    background-color: #E2E8F0;
                    transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
                }

                .progress-pill.active {
                    width: 36px;
                    background-color: #0F172A;
                }

                .progress-pill.completed {
                    background-color: #94A3B8;
                }

                .skip-btn {
                    background: white;
                    border: 2px solid #E2E8F0;
                    color: #64748B;
                    font-weight: 800;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    font-size: 0.75rem;
                    padding: 0.5rem 1rem;
                    border-radius: 20px;
                    box-shadow: 0 2px 0 #E2E8F0;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .skip-btn:hover {
                    background: #F1F5F9;
                    color: #0F172A;
                }
                .skip-btn:active {
                    transform: translateY(2px);
                    box-shadow: 0 0 0 #E2E8F0;
                }

                .onboarding-content {
                    flex-grow: 1;
                    width: 100%;
                    max-width: 500px;
                    display: flex;
                    flex-direction: column;
                    justify-content: flex-end;
                    padding-bottom: 2rem;
                    position: relative;
                    z-index: 5;
                }

                .visual-section {
                    flex-grow: 1;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    min-height: 350px;
                }

                .gamified-visual-container {
                    position: relative;
                    width: 300px;
                    height: 300px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .glow-ring {
                    position: absolute;
                    width: 100%;
                    height: 100%;
                    border-radius: 50%;
                    background: radial-gradient(circle, rgba(250,204,21,0.2) 0%, rgba(250,204,21,0) 70%);
                    animation: pulse-glow 4s infinite alternate;
                }

                .glow-ring.warning-glow { background: radial-gradient(circle, rgba(250,204,21,0.25) 0%, rgba(250,204,21,0) 70%); }
                .glow-ring.danger-glow { background: radial-gradient(circle, rgba(239,68,68,0.2) 0%, rgba(239,68,68,0) 70%); }

                @keyframes pulse-glow {
                    0% { transform: scale(0.8); opacity: 0.5; }
                    100% { transform: scale(1.2); opacity: 1; }
                }

                .floating-element {
                    position: absolute;
                    animation: float-around 6s ease-in-out infinite;
                }

                .float-delay-1 { animation-delay: -2s; }
                .float-delay-2 { animation-delay: -4s; }

                @keyframes float-around {
                    0%, 100% { transform: translate(0, 0) rotate(0deg); }
                    33% { transform: translate(15px, -15px) rotate(10deg); }
                    66% { transform: translate(-10px, -20px) rotate(-5deg); }
                }

                .drop-shadow-heavy {
                    filter: drop-shadow(0 20px 25px rgba(0,0,0,0.15));
                }

                .trophy-showcase {
                    background: white;
                    padding: 2rem;
                    border-radius: 50%;
                    border: 6px solid #FACC15;
                    box-shadow: 0 15px 35px rgba(250,204,21,0.3), inset 0 0 20px rgba(250,204,21,0.2);
                    position: relative;
                    z-index: 2;
                }

                .floating-badge {
                    position: absolute;
                    background: #0F172A;
                    color: white;
                    font-weight: 900;
                    padding: 0.5rem 1.2rem;
                    border-radius: 30px;
                    border: 3px solid white;
                    box-shadow: 0 10px 15px rgba(0,0,0,0.1);
                    letter-spacing: 1px;
                    z-index: 3;
                    text-transform: uppercase;
                    font-size: 0.85rem;
                }

                .badge-xp {
                    top: 15%;
                    right: 5%;
                    transform: rotate(5deg);
                    animation: bounce-rotate 3s infinite ease-in-out;
                }

                .badge-rank {
                    bottom: 15%;
                    left: 0;
                    background: #FACC15;
                    color: #0F172A;
                    transform: rotate(-5deg);
                    animation: bounce-rotate 3s infinite ease-in-out reverse;
                }

                @keyframes bounce-rotate {
                    0%, 100% { transform: translateY(0) rotate(5deg); }
                    50% { transform: translateY(-10px) rotate(8deg); }
                }

                .streak-showcase {
                    position: relative;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    z-index: 2;
                }

                .fire-container {
                    background: white;
                    width: 140px;
                    height: 140px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border: 6px solid #EF4444;
                    box-shadow: 0 15px 35px rgba(239,68,68,0.3);
                }

                .animate-fire {
                    animation: fire-flicker 1.5s infinite alternate ease-in-out;
                    transform-origin: bottom;
                }

                @keyframes fire-flicker {
                    0% { transform: scale(1) skewX(0deg); }
                    50% { transform: scale(1.1) skewX(2deg); }
                    100% { transform: scale(1) skewX(-2deg); }
                }

                .streak-banner {
                    background: #EF4444;
                    padding: 0.6rem 2rem;
                    border-radius: 30px;
                    border: 4px solid white;
                    box-shadow: 0 10px 15px rgba(239,68,68,0.3);
                    margin-top: -20px;
                    position: relative;
                    z-index: 3;
                }

                .text-section {
                    background: white;
                    margin: 0 1.5rem;
                    border-radius: 32px;
                    padding: 2.5rem 2rem 2rem;
                    box-shadow: 0 20px 40px rgba(0,0,0,0.05);
                    position: relative;
                    z-index: 10;
                }

                .subtitle-badge {
                    display: inline-block;
                    background: #F1F5F9;
                    color: #64748B;
                    font-weight: 800;
                    text-transform: uppercase;
                    letter-spacing: 2px;
                    font-size: 0.75rem;
                    padding: 0.5rem 1rem;
                    border-radius: 20px;
                    margin-bottom: 1rem;
                }

                .main-title {
                    font-size: 2.2rem;
                    line-height: 1.1;
                    color: #0F172A;
                }

                .description-text {
                    color: #64748B;
                    font-size: 1.05rem;
                    line-height: 1.6;
                    font-weight: 600;
                    margin-bottom: 2.5rem;
                }

                .action-section {
                    margin-top: auto;
                }

                .gamified-btn {
                    width: 100%;
                    border: none;
                    border-radius: 20px;
                    padding: 1.2rem;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 1rem;
                    font-size: 1.2rem;
                    font-weight: 900;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    position: relative;
                    overflow: hidden;
                    transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
                }

                .btn-next {
                    background-color: #0F172A;
                    color: white;
                    box-shadow: 0 8px 0 #020617;
                }

                .btn-next:active {
                    transform: translateY(8px);
                    box-shadow: 0 0 0 #020617;
                }

                .btn-final {
                    background-color: #FACC15;
                    color: #0F172A;
                    box-shadow: 0 8px 0 #CA8A04;
                }

                .btn-final:active {
                    transform: translateY(8px);
                    box-shadow: 0 0 0 #CA8A04;
                }

                .btn-icon {
                    background: rgba(255,255,255,0.2);
                    border-radius: 50%;
                    width: 36px;
                    height: 36px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .btn-final .btn-icon {
                    background: rgba(0,0,0,0.1);
                }
            `}</style>
        </div>
    );
};

export default Onboarding;
