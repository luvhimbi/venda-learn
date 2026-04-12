import React from 'react';
import { useNavigate } from 'react-router-dom';
import Mascot from '../components/Mascot';
import { motion } from 'framer-motion';

const AboutUs: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="bg-theme-base min-vh-100" style={{ fontFamily: '"Lexend", sans-serif' }}>
            {/* --- HERO SECTION --- */}
            <header className="py-5 border-bottom border-4 border-theme-main" style={{ backgroundColor: 'var(--venda-yellow)' }}>
                <div className="container py-5 text-center">
                    <motion.div 
                        initial={{ translateY: 20, opacity: 0 }}
                        animate={{ translateY: 0, opacity: 1 }}
                        transition={{ duration: 0.5 }}
                    >
                        <div className="d-inline-block bg-dark text-white px-3 py-1 fw-bold mb-4 border border-2 border-dark shadow-action-sm text-uppercase">
                            Our Story. Our Vibe.
                        </div>
                        <h1 className="display-2 fw-black text-theme-main mb-4 ls-tight text-uppercase">
                            More Than Just <br />
                            <span className="bg-theme-surface px-3 border border-4 border-theme-main d-inline-block mt-2">Talking.</span>
                        </h1>
                        <p className="lead fw-bold text-theme-main mb-0 mx-auto" style={{ maxWidth: '700px' }}>
                            Connecting South Africans, one "Aweh" at a time.
                        </p>
                    </motion.div>
                </div>
            </header>

            {/* --- THE WHY SECTION --- */}
            <section className="py-5 bg-theme-surface border-bottom border-4 border-theme-main">
                <div className="container py-5 text-theme-main">
                    <div className="row align-items-center g-5">
                        <div className="col-lg-6">
                            <h2 className="display-4 fw-black text-uppercase mb-4">The <span className="text-theme-accent">Why</span></h2>
                            <p className="fs-5 fw-bold mb-4 lh-base">
                                South Africa is a beautiful, diverse nation with 11 official languages. We live side-by-side, we work together, and we dance together—but all too often, we can't speak to each other in our mother tongues.
                            </p>
                            <p className="fs-5 fw-medium text-theme-muted mb-4 lh-base">
                                Most language apps feel like a classroom from the 90s. They're academic, they're slow, and let's be honest—they're <span className="text-theme-main fw-black">boring</span>. We wanted to change that.
                            </p>
                            <div className="p-4 bg-theme-card border border-4 border-theme-main shadow-action">
                                <p className="fw-black text-uppercase mb-0">
                                    "We're not just teaching words; we're breaking down walls that have stood for too long."
                                </p>
                            </div>
                        </div>
                        <div className="col-lg-6 text-center">
                            <div className="position-relative d-inline-block">
                                <div className="p-3 bg-theme-card border border-4 border-theme-main shadow-action position-relative z-1">
                                    <Mascot width="300px" height="auto" mood="happy" />
                                </div>
                                <div className="position-absolute top-0 start-0 w-100 h-100 bg-info border border-4 border-dark translate-middle-n-10 z-0" style={{ transform: 'translate(15px, 15px)' }}></div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- THE HOW SECTION --- */}
            <section className="py-5 bg-theme-base border-bottom border-4 border-theme-main text-theme-main">
                <div className="container py-5">
                    <div className="text-center mb-5">
                        <h2 className="display-4 fw-black text-uppercase mb-2">Un-Boring Learning</h2>
                        <p className="fw-bold text-theme-muted">We replaced textbooks with quests and exams with games.</p>
                    </div>
                    <div className="row g-4">
                        <div className="col-md-4">
                            <div className="p-4 bg-theme-card border border-4 border-theme-main shadow-action h-100">
                                <div className="bg-warning d-inline-block p-2 border border-2 border-dark mb-3 text-dark">
                                    <span className="fw-black text-uppercase small">01. Gamified DNA</span>
                                </div>
                                <h4 className="fw-black text-uppercase">Play to Learn</h4>
                                <p className="fw-medium text-theme-muted">From Word Bombs to Sentence Scrambles, our logic is simple: if you're having fun, you're learning faster.</p>
                            </div>
                        </div>
                        <div className="col-md-4">
                            <div className="p-4 bg-theme-card border border-4 border-theme-main shadow-action h-100">
                                <div className="bg-danger d-inline-block p-2 border border-2 border-dark mb-3 text-white">
                                    <span className="fw-black text-uppercase small">02. Street Cred</span>
                                </div>
                                <h4 className="fw-black text-uppercase">Real Lingo</h4>
                                <p className="fw-medium text-theme-muted">We don't just teach "The ball is red." We teach the slang, the rhythm, and the soul of Mzansi conversation.</p>
                            </div>
                        </div>
                        <div className="col-md-4">
                            <div className="p-4 bg-theme-card border border-4 border-theme-main shadow-action h-100">
                                <div className="bg-info d-inline-block p-2 border border-2 border-dark mb-3 text-white">
                                    <span className="fw-black text-uppercase small">03. All 11</span>
                                </div>
                                <h4 className="fw-black text-uppercase">Maximum Diversity</h4>
                                <p className="fw-medium text-theme-muted">Whether it's isiZulu, Tshivenda, or Sepedi—every language gets the premium treatment it deserves.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- DEVELOPER SECTION --- */}
            <section className="py-5 bg-theme-surface text-theme-main border-top border-4 border-theme-main">
                <div className="container py-5">
                    <div className="row align-items-center g-5">
                        <div className="col-lg-5 order-lg-2">
                            <h2 className="display-4 fw-black text-uppercase mb-4">Meet the <span className="text-warning">Lead Guide</span></h2>
                            <p className="fs-5 fw-bold mb-4">
                                Chommie was developed by Talifhani Luvhimbi, a South African dreamer who believes that technology should serve culture, not replace it.
                            </p>
                            <p className="fw-medium text-theme-muted mb-5">
                                Born from a passion for Mzansi's diversity, Talifhani built this platform to ensure that no South African ever feels like a stranger in their own country because of a language barrier.
                            </p>
                            <div className="d-flex flex-column gap-2">
                                <span className="small fw-black text-uppercase text-theme-muted">Get in touch:</span>
                                <a href="mailto:talifhaniluvhimbi@gmail.com" className="text-theme-main fw-black text-decoration-none fs-5 hover-yellow transition-all d-inline-block">
                                    talifhaniluvhimbi@gmail.com
                                </a>
                            </div>
                        </div>
                        <div className="col-lg-7 order-lg-1">
                            <div className="p-2 bg-theme-main border border-4 border-theme-main shadow-action bg-dark text-white">
                                <div className="bg-theme-card text-theme-main p-4 border border-2 border-theme-main d-flex align-items-center justify-content-center" style={{ minHeight: '300px' }}>
                                    <div className="text-center">
                                        <div className="bg-warning text-dark d-inline-block p-4 border border-4 border-dark mb-3 shadow-action-sm">
                                            <i className="bi bi-code-slash fs-1"></i>
                                        </div>
                                        <h3 className="fw-black text-uppercase d-block mb-1">Talifhani Luvhimbi</h3>
                                        <span className="badge bg-dark text-white rounded-0 border border-2 border-dark text-uppercase">Founder & Developer</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- FINAL CTA --- */}
            <section className="py-5 border-top border-4 border-dark" style={{ backgroundColor: '#1a1a1a' }}>
                <div className="container py-5 text-center">
                    <h2 className="display-3 fw-black text-white mb-4 text-uppercase">Join the <span className="text-warning">Movement.</span></h2>
                    <div className="d-flex flex-column flex-md-row justify-content-center gap-4">
                        <button onClick={() => navigate('/onboarding')} className="btn btn-warning btn-lg px-5 py-3 fw-black rounded-0 border-4 border-dark shadow-action-light hover-press text-uppercase">
                            Start Your Quest
                        </button>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default AboutUs;
