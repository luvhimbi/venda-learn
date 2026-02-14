import React from 'react';
import { useNavigate } from 'react-router-dom';
import LandingNavbar from '../components/LandingNavbar';
import LandingFooter from '../components/LandingFooter';
import Mascot from '../components/Mascot';

const LandingPage: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="bg-white min-vh-100">
            <LandingNavbar />

            {/* --- HERO SECTION --- */}
            <header className="position-relative overflow-hidden pt-5 pb-5" style={{ background: 'linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)' }}>
                <div className="container position-relative z-1 pt-5 mt-5 mb-5" style={{ maxWidth: '1100px' }}>
                    <div className="row align-items-center">
                        <div className="col-lg-6 mb-5 mb-lg-0 order-2 order-lg-1 text-center text-lg-start">
                            <div className="d-inline-flex align-items-center gap-2 px-3 py-1 rounded-pill bg-white shadow-sm mb-4 border border-warning animate__animated animate__fadeInDown">
                                <span className="badge bg-warning text-dark">NEW</span>
                                <span className="smallest fw-bold text-muted ls-1 uppercase">Native Speaker Chat is Live!</span>
                            </div>
                            <h1 className="display-4 fw-bold ls-tight mb-4 text-slate animate__animated animate__fadeInUp">
                                Learn <span className="text-warning">Tshivenda</span><br />
                                The Fun Way.
                            </h1>
                            <p className="lead text-muted mb-5 ls-1 animate__animated animate__fadeInUp animate__delay-1s mx-auto mx-lg-0" style={{ maxWidth: '480px' }}>
                                Master the language of Venda through gamified lessons, interactive stories, and real-time practice with native speakers.
                            </p>
                            <div className="d-flex gap-3 justify-content-center justify-content-lg-start animate__animated animate__fadeInUp animate__delay-1s">
                                <button onClick={() => navigate('/register')} className="btn btn-dark btn-lg px-4 px-md-5 py-3 fw-bold rounded-pill shadow-lg hover-lift smallest-md">
                                    START LEARNING
                                </button>
                                <button onClick={() => navigate('/courses')} className="btn btn-outline-dark btn-lg px-4 px-md-5 py-3 fw-bold rounded-pill hover-lift smallest-md">
                                    EXPLORE
                                </button>
                            </div>
                            <div className="mt-5 d-flex align-items-center justify-content-center justify-content-lg-start gap-3 animate__animated animate__fadeIn animate__delay-2s">
                                <div className="d-flex position-relative modules-avatars">
                                    {[1, 2, 3, 4].map(i => (
                                        <div key={i} className="rounded-circle border border-2 border-white bg-secondary"
                                            style={{ width: 40, height: 40, marginLeft: i > 1 ? -15 : 0, backgroundImage: `url(https://i.pravatar.cc/100?img=${10 + i})`, backgroundSize: 'cover' }}></div>
                                    ))}
                                </div>
                                <div className="d-flex flex-column text-start">
                                    <div className="d-flex text-warning small">
                                        <i className="bi bi-star-fill"></i><i className="bi bi-star-fill"></i><i className="bi bi-star-fill"></i><i className="bi bi-star-fill"></i><i className="bi bi-star-fill"></i>
                                    </div>
                                    <span className="smallest fw-bold text-muted">Loved by 10,000+ Learners</span>
                                </div>
                            </div>
                        </div>
                        <div className="col-lg-6 text-center position-relative order-1 order-lg-2 mb-5 mb-lg-0">
                            {/* Decorative Blobs */}
                            <div className="position-absolute top-50 start-50 translate-middle"
                                style={{ width: '80%', paddingBottom: '80%', background: 'radial-gradient(circle, rgba(250,204,21,0.2) 0%, rgba(255,255,255,0) 70%)', zIndex: -1 }}></div>

                            <div className="animate__animated animate__bounceInRight">
                                <Mascot width="100%" height="auto" mood="excited" style={{ maxWidth: '380px' }} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Wave Separator */}
                <div className="position-absolute bottom-0 start-0 w-100" style={{ lineHeight: 0 }}>
                    <svg viewBox="0 0 1440 320" xmlns="http://www.w3.org/2000/svg">
                        <path fill="#ffffff" fillOpacity="1" d="M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,112C672,96,768,96,864,112C960,128,1056,160,1152,160C1248,160,1344,128,1392,112L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
                    </svg>
                </div>
            </header>

            {/* --- STATS SECTION --- */}
            <section className="py-5 bg-white">
                <div className="container" style={{ maxWidth: '1100px' }}>
                    <div className="row g-4 text-center">
                        {[
                            { label: 'Active Learners', val: '10k+' },
                            { label: 'Interactive Lessons', val: '500+' },
                            { label: 'Native Speakers', val: '50+' },
                            { label: 'App Rating', val: '4.9/5' },
                        ].map((stat, idx) => (
                            <div key={idx} className="col-6 col-md-3">
                                <h2 className="fw-bold mb-0 text-slate ls-tight">{stat.val}</h2>
                                <p className="text-muted smallest uppercase ls-2 fw-bold">{stat.label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* --- FEATURES GRID --- */}
            <section className="py-5 my-5">
                <div className="container" style={{ maxWidth: '1100px' }}>
                    <div className="text-center mb-5 mx-auto" style={{ maxWidth: '700px' }}>
                        <span className="badge bg-light text-dark border mb-3 px-3 py-2 rounded-pill fw-bold ls-1 smallest">FEATURES</span>
                        <h2 className="fw-bold display-5 ls-tight mb-3">Everything you need to become fluent.</h2>
                        <p className="text-muted lead">We've combined the best of gamification with deep cultural immersion.</p>
                    </div>

                    <div className="row g-4">
                        {[
                            { icon: 'bi-controller', title: 'Gamified Learning', desc: 'Earn points, unlock badges, and climb the leaderboard as you master new words.', color: 'text-primary' },
                            { icon: 'bi-chat-dots-fill', title: 'Native Chat', desc: 'Practice real conversations with verified native Tshivenda speakers.', color: 'text-success' },
                            { icon: 'bi-bank2', title: 'Cultural Stories', desc: 'Dive into interactive history lessons that bring Venda heritage to life.', color: 'text-warning' },
                            { icon: 'bi-trophy-fill', title: 'Daily Challenges', desc: 'Keep your streak alive with bite-sized daily tasks and quizzes.', color: 'text-danger' },
                            { icon: 'bi-soundwave', title: 'Audio Pronunciation', desc: 'Listen to native audio for every word and record your own voice.', color: 'text-info' },
                            { icon: 'bi-people-fill', title: 'Community', desc: 'Join a vibrant community of learners supporting each other.', color: 'text-secondary' },
                        ].map((feat, i) => (
                            <div key={i} className="col-md-4">
                                <div className="p-4 rounded-4 h-100 bg-light border hover-lift transition-all">
                                    <div className={`fs-1 mb-3 ${feat.color}`}><i className={`bi ${feat.icon}`}></i></div>
                                    <h4 className="fw-bold mb-2">{feat.title}</h4>
                                    <p className="text-muted mb-0">{feat.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* --- HOW IT WORKS --- */}
            <section className="py-5 bg-dark text-white position-relative overflow-hidden">
                <div className="container position-relative z-1 py-5" style={{ maxWidth: '1100px' }}>
                    <div className="row align-items-center text-center text-lg-start">
                        <div className="col-lg-5 mb-5 mb-lg-0">
                            <h2 className="display-4 fw-bold ls-tight mb-4">How it works</h2>
                            <p className="lead opacity-75 mb-5">Start speaking from day one with our proven method.</p>

                            <div className="d-flex flex-column gap-4">
                                {[
                                    { step: '01', title: 'Create a Profile', text: 'Set your goals and join the community.' },
                                    { step: '02', title: 'Start a Lesson', text: 'Learn vocabulary through interactive cards.' },
                                    { step: '03', title: 'Practice & Speak', text: 'Chat with natives to refine your accent.' },
                                ].map((step, i) => (
                                    <div key={i} className="d-flex gap-4 align-items-start">
                                        <div className="fs-1 fw-bold text-warning opacity-50" style={{ lineHeight: 1 }}>{step.step}</div>
                                        <div className="text-start">
                                            <h5 className="fw-bold mb-1">{step.title}</h5>
                                            <p className="opacity-75 mb-0">{step.text}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="col-lg-6 offset-lg-1">
                            <div className="bg-white rounded-5 p-2 shadow-lg" style={{ transform: 'rotate(-2deg)' }}>
                                <div className="bg-light rounded-4 overflow-hidden" style={{ height: '400px', background: 'url(https://images.unsplash.com/photo-1516321318423-f06f85e504b3?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80) center/cover' }}>
                                    {/* Placeholder for screenshot */}
                                    <div className="d-flex align-items-center justify-content-center h-100 bg-black bg-opacity-25">
                                        <div className="bg-white p-3 rounded-pill shadow-sm d-flex align-items-center gap-2">
                                            <i className="bi bi-play-circle-fill text-warning fs-1"></i>
                                            <span className="fw-bold text-dark pe-2">See it in action</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- CTA --- */}
            <section className="py-5 my-5 text-center">
                <div className="container" style={{ maxWidth: '800px' }}>
                    <h2 className="display-5 fw-bold ls-tight mb-4">Ready to start your journey?</h2>
                    <p className="lead text-muted mb-5">Join for free today and start speaking Tshivenda with confidence.</p>
                    <button onClick={() => navigate('/register')} className="btn btn-warning btn-lg px-5 py-3 fw-bold rounded-pill shadow-lg hover-scale">
                        JOIN VENDALEARN FREE
                    </button>
                    <p className="mt-3 small text-muted">No credit card required • Cancel anytime</p>
                </div>
            </section>

            <LandingFooter />

            <style>{`
                .hover-lift:hover { transform: translateY(-5px); box-shadow: 0 10px 30px rgba(0,0,0,0.1) !important; }
                .hover-scale:hover { transform: scale(1.05); }
                .text-slate { color: #1e293b; }
            `}</style>
        </div>
    );
};

export default LandingPage;
