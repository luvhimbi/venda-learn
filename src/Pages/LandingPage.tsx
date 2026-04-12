import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Mascot from '../components/Mascot';

const LandingPage: React.FC = () => {
    const navigate = useNavigate();
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isStandalone, setIsStandalone] = useState(false);

    useEffect(() => {
        const checkStandalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone === true;
        setIsStandalone(checkStandalone);

        const handler = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e);
        };
        window.addEventListener('beforeinstallprompt', handler);
        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const handleInstallClick = async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === 'accepted') setDeferredPrompt(null);
        } else {
            alert("To install: Tap the Share button (iOS) or the Browser Menu (Android/Desktop) and select 'Add to Home Screen' or 'Install App'.");
        }
    };

    return (
        <div className="bg-theme-base min-vh-100" style={{ fontFamily: '"Lexend", sans-serif' }}>
            {/* --- HERO SECTION --- */}
            <header className="py-5 border-bottom border-4 border-theme-main" style={{ backgroundColor: 'var(--venda-yellow)' }}>
                <div className="container py-5">
                    <div className="row align-items-center g-5">
                        <div className="col-lg-7 text-center text-lg-start">
                            <div className="d-inline-block bg-dark text-white px-3 py-1 fw-bold mb-4 border border-2 border-dark shadow-action-sm text-uppercase">
                                Aweh! Mzansi's #1 Language Quest
                            </div>
                            <h1 className="display-2 fw-black text-theme-main mb-4 ls-tight text-uppercase">
                                Speak the <br />
                                <span className="bg-theme-surface px-3 border border-4 border-theme-main d-inline-block mt-2">Culture.</span>
                            </h1>
                            <p className="lead fw-bold text-theme-main mb-5 pe-lg-5">
                                Chommie is for the whole crew. Meet Elphie, your guide to mastering South Africa's 11 official languages through Quick Quests, Word Bombs, and real-world lingo.
                            </p>
                            <div className="d-flex flex-column flex-md-row gap-4 justify-content-center justify-content-lg-start">
                                <button onClick={() => navigate('/onboarding')} className="btn btn-dark btn-lg px-5 py-3 fw-black rounded-0 border-4 border-dark shadow-action hover-press text-uppercase">
                                    Start Quest with Elphie
                                </button>
                                <div className="d-flex align-items-center gap-3 bg-theme-surface border border-4 border-theme-main px-4 py-2 shadow-action text-theme-main">
                                    <i className="bi bi-trophy-fill fs-3 text-warning"></i>
                                    <div>
                                        <div className="fw-black lh-1 text-uppercase">Join the</div>
                                        <div className="small fw-bold text-muted text-uppercase" style={{ fontSize: '0.7rem' }}>Leaderboards</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="col-lg-5 text-center">
                            <div className="p-4 bg-theme-surface border border-4 border-theme-main shadow-action position-relative text-theme-main">
                                <div className="bg-dark text-white p-2 border border-2 border-dark position-absolute top-0 start-50 translate-middle-x shadow-action-sm" style={{ marginTop: '-20px', width: '220px' }}>
                                    <span className="fw-black text-uppercase small">Sharp-Sharp! I'm Elphie! 👋</span>
                                </div>

                                <div className="mb-3 text-start mt-2">
                                    <span className="badge bg-dark rounded-0 border border-2 border-dark mb-2 text-uppercase">Rank: Traveler</span>
                                    <div className="fw-black text-uppercase small">Adventure Awaits</div>
                                </div>

                                <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '300px' }}>
                                    <Mascot width="100%" height="auto" mood="excited" style={{ maxWidth: '280px', margin: '0 auto' }} />
                                </div>

                                <div className="mt-3 pt-3 border-top border-4 border-dark">
                                    <div className="d-flex justify-content-between fw-black small text-uppercase mb-1">
                                        <span>Daily Goal</span>
                                        <span className="text-muted">130 / 500 XP</span>
                                    </div>
                                    <div className="progress rounded-0 border border-3 border-dark mt-1" style={{ height: '24px', background: '#e2e8f0' }}>
                                        <div className="progress-bar bg-warning" style={{ width: '26%' }}></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* --- CORE FEATURES --- */}
            <section className="py-5 bg-theme-surface border-bottom border-4 border-theme-main">
                <div className="container py-5 text-theme-main">
                    <div className="text-center mb-5">
                        <h2 className="display-4 fw-black text-uppercase mb-2">How We Roll</h2>
                        <p className="fw-bold text-theme-muted">More than just an app—it's a whole Mzansi experience.</p>
                    </div>
                    <div className="row g-4 text-center">
                        <div className="col-md-4">
                            <div className="p-4 bg-theme-card border border-4 border-theme-main shadow-action h-100 hover-press">
                                <div className="bg-info d-inline-block p-3 border border-3 border-dark mb-4 shadow-action-sm">
                                    <i className="bi bi-lightning-charge-fill fs-1 text-white"></i>
                                </div>
                                <h4 className="fw-black text-uppercase">Bite-Sized Lessons</h4>
                                <p className="fw-bold text-muted mb-0">Got 5 minutes? That's all you need. Short lessons and quick-fire quizzes that fit your busy schedule.</p>
                            </div>
                        </div>
                        <div className="col-md-4">
                            <div className="p-4 bg-theme-card border border-4 border-theme-main shadow-action h-100 hover-press">
                                <div className="bg-danger d-inline-block p-3 border border-3 border-dark mb-4 shadow-action-sm">
                                    <i className="bi bi-controller fs-1 text-white"></i>
                                </div>
                                <h4 className="fw-black text-uppercase">Lekker Games</h4>
                                <p className="fw-bold text-theme-muted mb-0">From Word Bombs to Syllable Builders, master vocabulary while having a blast.</p>
                            </div>
                        </div>
                        <div className="col-md-4">
                            <div className="p-4 bg-theme-card border border-4 border-theme-main shadow-action h-100 hover-press">
                                <div className="bg-warning d-inline-block p-3 border border-3 border-dark mb-4 shadow-action-sm">
                                    <i className="bi bi-bar-chart-fill fs-1 text-dark"></i>
                                </div>
                                <h4 className="fw-black text-uppercase">Leaderboards</h4>
                                <p className="fw-bold text-theme-muted mb-0">Climb the ranks! Compete with friends to see who is the real language boss of South Africa.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- ARCADE EMBED SECTION --- */}
            <section className="py-5 bg-theme-base border-bottom border-4 border-theme-main text-theme-main">
                <div className="container py-5">
                    <div className="row align-items-center">
                        <div className="col-lg-4 mb-5 mb-lg-0 text-center text-lg-start">
                            <h2 className="display-4 fw-black text-uppercase mb-3">See it in <span className="text-theme-accent">Action</span></h2>
                            <p className="fw-bold text-theme-muted mb-4">Take a look at how Elphie guides you through the app. If the video doesn't load, check your ad-blocker!</p>
                            <div className="p-3 bg-dark text-white border border-4 border-dark shadow-action d-inline-block">
                                <span className="fw-black text-uppercase small">Interactive Preview 🕹️</span>
                            </div>
                        </div>
                        <div className="col-lg-8">
                            <div className="position-relative p-2 bg-dark border border-4 border-dark shadow-action" style={{ minHeight: '350px' }}>
                                <div style={{ position: 'relative', paddingBottom: 'calc(46.925329428989755% + 41px)', height: '0', width: '100%', overflow: 'hidden' }}>
                                    <iframe
                                        src="https://app.arcade.software/share/8BSgnsMKx7JWxPbOLAUH?embed"
                                        title="Explore Language Games and Build Vocabulary"
                                        frameBorder="0"
                                        loading="lazy"
                                        allowFullScreen
                                        allow="clipboard-write"
                                        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', colorScheme: 'light' }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- MZANSI'S VOICES SECTION --- */}
            <section className="py-5 border-bottom border-4 border-theme-main text-theme-main" style={{ backgroundColor: 'var(--color-surface-soft)' }}>
                <div className="container py-5">
                    <div className="row align-items-center g-5">
                        <div className="col-lg-6 order-2 order-lg-1">
                            <div className="row g-3">
                                {[
                                    { lang: "IsiZulu", greeting: "Sawubona!", color: "#FF6B6B" },
                                    { lang: "IsiXhosa", greeting: "Molo!", color: "#FF9F43" },
                                    { lang: "Afrikaans", greeting: "Haai!", color: "#4ECDC4" },
                                    { lang: "Sepedi", greeting: "Thobela!", color: "#FFD93D" },
                                    { lang: "Setswana", greeting: "Dumela!", color: "#F39C12" },
                                    { lang: "Sesotho", greeting: "Dumela!", color: "#1DD1A1" },
                                    { lang: "Xitsonga", greeting: "Avuxeni!", color: "#95A5A6" },
                                    { lang: "siSwati", greeting: "Sawubona!", color: "#54A0FF" },
                                    { lang: "Tshivenda", greeting: "Nda! / Aa!", color: "#2980B9" },
                                    { lang: "isiNdebele", greeting: "Lotjhani!", color: "#EE5253" }
                                ].map((item, index) => (
                                    <div key={index} className="col-6 col-md-4">
                                        <div className="p-3 border border-3 border-theme-main bg-theme-card shadow-action-sm hover-press text-center h-100 d-flex flex-column justify-content-center">
                                            <div className="fw-black text-uppercase small mb-1">{item.lang}</div>
                                            <div className="fw-bold text-theme-muted smallest-print">{item.greeting}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="col-lg-6 order-1 order-lg-2 text-center text-lg-start">
                            <h2 className="display-4 fw-black text-uppercase mb-3">Mzansi's <span className="px-2 bg-theme-accent border border-3 border-theme-main text-dark">Voices</span></h2>
                            <p className="fw-bold text-theme-muted mb-4 fs-5">
                                South Africa is a symphony of 11 official languages. From the rhythmic clicks of isiXhosa to the lyrical flow of Tshivenda, every language is a gateway to a unique culture.
                            </p>
                            <div className="d-inline-block bg-dark text-white px-4 py-2 border border-2 border-dark shadow-action-sm fw-black text-uppercase small mb-2">
                                11 Languages. 1 People. 🌍
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- WHY CHOMMIE SECTION --- */}
            <section className="py-5 bg-theme-base border-bottom border-4 border-theme-main overflow-hidden text-theme-main">
                <div className="container py-5">
                    <div className="row align-items-center">
                        <div className="col-lg-12 text-center mb-5">
                            <h2 className="display-4 fw-black text-uppercase mb-2">Why Chommie?</h2>
                            <div className="bg-theme-main mx-auto" style={{ height: '8px', width: '120px', backgroundColor: 'var(--color-border)' }}></div>
                        </div>
                        <div className="col-md-6 mb-4">
                            <div className="d-flex align-items-start gap-4 p-4 border border-4 border-theme-main shadow-action bg-theme-card h-100 hover-press">
                                <div className="bg-info p-3 border border-3 border-dark shadow-action-sm flex-shrink-0">
                                    <i className="bi bi-heart-fill fs-2 text-white"></i>
                                </div>
                                <div>
                                    <h4 className="fw-black text-uppercase">Cultural Connection</h4>
                                    <p className="fw-bold text-theme-muted mb-0 small">We don't just teach words; we teach the soul of the language. Understand the context, the slang, and the heart of every conversation.</p>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-6 mb-4">
                            <div className="d-flex align-items-start gap-4 p-4 border border-4 border-theme-main shadow-action bg-theme-card h-100 hover-press">
                                <div className="bg-success p-3 border border-3 border-dark shadow-action-sm flex-shrink-0">
                                    <i className="bi bi-graph-up-arrow fs-2 text-white"></i>
                                </div>
                                <div>
                                    <h4 className="fw-black text-uppercase">Zero Friction</h4>
                                    <p className="fw-bold text-theme-muted mb-0 small">No complicated registrations or paywalls for core content. Start learning in seconds and keep the momentum going.</p>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-6 mb-4">
                            <div className="d-flex align-items-start gap-4 p-4 border border-4 border-theme-main shadow-action bg-theme-card h-100 hover-press">
                                <div className="bg-warning p-3 border border-3 border-dark shadow-action-sm flex-shrink-0">
                                    <i className="bi bi-lightning-charge-fill fs-2 text-dark"></i>
                                </div>
                                <div>
                                    <h4 className="fw-black text-uppercase">Hyper-Fast Quests</h4>
                                    <p className="fw-bold text-theme-muted mb-0 small">Our lessons are designed for the busy life. 5 minutes is all it takes to complete a quest and level up your skills.</p>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-6 mb-4">
                            <div className="d-flex align-items-start gap-4 p-4 border border-4 border-theme-main shadow-action bg-theme-card h-100 hover-press">
                                <div className="bg-danger p-3 border border-3 border-dark shadow-action-sm flex-shrink-0">
                                    <i className="bi bi-people-fill fs-2 text-white"></i>
                                </div>
                                <div>
                                    <h4 className="fw-black text-uppercase">Built for Us</h4>
                                    <p className="fw-bold text-theme-muted mb-0 small">Created by South Africans for the world. We know the nuances that make our languages special.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- INSTALL APP SECTION --- */}
            {!isStandalone && (
                <section className="py-5 bg-theme-surface border-bottom border-4 border-theme-main overflow-hidden text-theme-main text-center">
                    <div className="container py-5">
                        <div className="row justify-content-center">
                            <div className="col-lg-8">
                                <div className="p-4 p-md-5 border border-4 border-theme-main shadow-action bg-theme-card position-relative overflow-visible" style={{ marginTop: '2rem' }}>
                                    <div className="position-absolute top-0 start-50 translate-middle">
                                        <div className="bg-success p-3 border border-3 border-dark shadow-action-sm d-flex align-items-center justify-content-center" style={{ width: '80px', height: '80px', borderRadius: '50%' }}>
                                            <i className="bi bi-phone-fill fs-1 text-white"></i>
                                        </div>
                                    </div>
                                    <h2 className="display-6 fw-black text-uppercase mt-4 mb-3">Install the App</h2>
                                    <p className="fw-bold fs-5 text-theme-muted mb-4">
                                        Did you know you can install Chommie directly to your home screen? No app store needed! 
                                        Get instant access, full screen learning, and a lightning-fast native experience.
                                    </p>
                                    <button className="btn btn-success btn-lg px-5 py-3 fw-black rounded-0 border-4 border-dark shadow-action hover-press text-uppercase" onClick={handleInstallClick}>
                                        <i className="bi bi-download me-2"></i> Download App Now
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            )}

            {/* --- FINAL CTA --- */}
            <section className="py-5 border-top border-4 border-theme-main" style={{ backgroundColor: '#1a1a1a' }}>
                <div className="container py-5 text-center">
                    <h2 className="display-3 fw-black text-white mb-4 text-uppercase">Start your <br /><span className="text-warning">Mzansi quest.</span></h2>
                    <div className="d-flex flex-column flex-md-row justify-content-center gap-4">
                        <button onClick={() => navigate('/onboarding')} className="btn btn-warning btn-lg px-5 py-3 fw-black rounded-0 border-4 border-dark shadow-action-light hover-press text-uppercase">
                            Join the Crew
                        </button>
                        <button onClick={() => navigate('/login')} className="btn btn-outline-light btn-lg px-5 py-3 fw-black rounded-0 border-4 border-white hover-press text-uppercase text-white">
                            Log In
                        </button>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default LandingPage;