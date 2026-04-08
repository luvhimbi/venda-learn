import React from 'react';
import { useNavigate } from 'react-router-dom';
import Mascot from '../components/Mascot';

const LandingPage: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="bg-white min-vh-100" style={{ fontFamily: '"Lexend", sans-serif', color: '#1a1a1a' }}>
            {/* --- HERO SECTION --- */}
            <header className="py-5 border-bottom border-4 border-dark" style={{ backgroundColor: '#FACC15' }}>
                <div className="container py-5">
                    <div className="row align-items-center g-5">
                        <div className="col-lg-7 text-center text-lg-start">
                            <div className="d-inline-block bg-dark text-white px-3 py-1 fw-bold mb-4 border border-2 border-dark shadow-action-sm text-uppercase">
                                Aweh! Mzansi's #1 Language Quest
                            </div>
                            <h1 className="display-2 fw-black text-dark mb-4 ls-tight text-uppercase">
                                Speak the <br />
                                <span className="bg-white px-3 border border-4 border-dark d-inline-block mt-2">Culture.</span>
                            </h1>
                            <p className="lead fw-bold text-dark mb-5 pe-lg-5">
                                Chommie is for the whole crew. Meet **Elphie**, your guide to mastering South Africa's 11 official languages through **Quick Quests**, **Word Bombs**, and real-world lingo.
                            </p>
                            <div className="d-flex flex-column flex-md-row gap-4 justify-content-center justify-content-lg-start">
                                <button onClick={() => navigate('/onboarding')} className="btn btn-dark btn-lg px-5 py-3 fw-black rounded-0 border-4 border-dark shadow-action hover-press text-uppercase">
                                    Start Quest with Elphie
                                </button>
                                <div className="d-flex align-items-center gap-3 bg-white border border-4 border-dark px-4 py-2 shadow-action">
                                    <i className="bi bi-trophy-fill fs-3 text-warning"></i>
                                    <div>
                                        <div className="fw-black lh-1 text-uppercase">Join the</div>
                                        <div className="small fw-bold text-muted text-uppercase" style={{ fontSize: '0.7rem' }}>Leaderboards</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="col-lg-5 text-center">
                            <div className="p-4 bg-white border border-4 border-dark shadow-action position-relative">
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
            <section className="py-5 bg-light border-bottom border-4 border-dark">
                <div className="container py-5">
                    <div className="text-center mb-5">
                        <h2 className="display-4 fw-black text-uppercase mb-2">How We Roll</h2>
                        <p className="fw-bold text-muted">More than just an app—it's a whole Mzansi experience.</p>
                    </div>
                    <div className="row g-4 text-center">
                        <div className="col-md-4">
                            <div className="p-4 bg-white border border-4 border-dark shadow-action h-100 hover-press">
                                <div className="bg-info d-inline-block p-3 border border-3 border-dark mb-4 shadow-action-sm">
                                    <i className="bi bi-lightning-charge-fill fs-1 text-white"></i>
                                </div>
                                <h4 className="fw-black text-uppercase">Bite-Sized Lessons</h4>
                                <p className="fw-bold text-muted mb-0">Got 5 minutes? That's all you need. Short lessons and quick-fire quizzes that fit your busy schedule.</p>
                            </div>
                        </div>
                        <div className="col-md-4">
                            <div className="p-4 bg-white border border-4 border-dark shadow-action h-100 hover-press">
                                <div className="bg-danger d-inline-block p-3 border border-3 border-dark mb-4 shadow-action-sm">
                                    <i className="bi bi-controller fs-1 text-white"></i>
                                </div>
                                <h4 className="fw-black text-uppercase">Lekker Games</h4>
                                <p className="fw-bold text-muted mb-0">From **Word Bombs** to **Syllable Builders**, master vocabulary while having a blast.</p>
                            </div>
                        </div>
                        <div className="col-md-4">
                            <div className="p-4 bg-white border border-4 border-dark shadow-action h-100 hover-press">
                                <div className="bg-warning d-inline-block p-3 border border-3 border-dark mb-4 shadow-action-sm">
                                    <i className="bi bi-bar-chart-fill fs-1 text-dark"></i>
                                </div>
                                <h4 className="fw-black text-uppercase">Leaderboards</h4>
                                <p className="fw-bold text-muted mb-0">Climb the ranks! Compete with friends to see who is the real language boss of South Africa.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- ARCADE EMBED SECTION --- */}
            <section className="py-5 bg-white border-bottom border-4 border-dark">
                <div className="container py-5">
                    <div className="row align-items-center">
                        <div className="col-lg-4 mb-5 mb-lg-0 text-center text-lg-start">
                            <h2 className="display-4 fw-black text-uppercase mb-3">See it in <span className="text-primary">Action</span></h2>
                            <p className="fw-bold text-muted mb-4">Take a look at how Elphie guides you through the app. If the video doesn't load, check your ad-blocker!</p>
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

            {/* --- FAQ SECTION --- */}
            <section className="py-5 bg-white">
                <div className="container py-5" style={{ maxWidth: '900px' }}>
                    <div className="text-center mb-5">
                        <h2 className="display-4 fw-black text-uppercase mb-2">The Knowledge Base</h2>
                        <div className="bg-dark mx-auto" style={{ height: '8px', width: '80px' }}></div>
                        <p className="fw-bold mt-3 text-muted">Curious? Don't be a shy-guy, here's the lowdown.</p>
                    </div>

                    <div className="accordion border border-4 border-dark rounded-0 shadow-action" id="chommieFaq">
                        {[
                            {
                                q: "Is Chommie actually free?",
                                a: "For real, boet! Our mission is to get South Africans talking to each other. All our primary lessons and games are 100% free."
                            },
                            {
                                q: "Which languages can I learn?",
                                a: "We're going for the full 11! From isiZulu to Afrikaans and Tshivenda, we've got quests loading for everyone."
                            }
                        ].map((faq, i) => (
                            <div className="accordion-item border-0 border-bottom border-4 border-dark rounded-0" key={i}>
                                <h2 className="accordion-header">
                                    <button className="accordion-button collapsed fw-black py-4 bg-white text-dark shadow-none text-uppercase" type="button" data-bs-toggle="collapse" data-bs-target={`#collapse${i}`}>
                                        {faq.q}
                                    </button>
                                </h2>
                                <div id={`collapse${i}`} className="accordion-collapse collapse" data-bs-parent="#chommieFaq">
                                    <div className="accordion-body fw-bold text-muted pb-4 pt-0">
                                        <hr className="border-2 border-dark opacity-10 mb-3" />
                                        {faq.a}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* --- FINAL CTA --- */}
            <section className="py-5 border-top border-4 border-dark" style={{ backgroundColor: '#1a1a1a' }}>
                <div className="container py-5 text-center">
                    <h2 className="display-3 fw-black text-white mb-4 text-uppercase">Start your <br /><span className="text-warning">Mzansi quest.</span></h2>
                    <div className="d-flex flex-column flex-md-row justify-content-center gap-4">
                        <button onClick={() => navigate('/onboarding')} className="btn btn-warning btn-lg px-5 py-3 fw-black rounded-0 border-4 border-dark shadow-action-light hover-press text-uppercase">
                            Join the Crew
                        </button>
                        <button onClick={() => navigate('/login')} className="btn btn-outline-light btn-lg px-5 py-3 fw-black rounded-0 border-4 border-white hover-press text-uppercase">
                            Log In
                        </button>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default LandingPage;