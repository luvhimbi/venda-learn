import React from 'react';
import { useNavigate } from 'react-router-dom';
import LandingNavbar from '../components/LandingNavbar';
import Mascot from '../components/Mascot';

const LandingPage: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="bg-white min-vh-100">
            <LandingNavbar />

            {/* --- HERO SECTION --- */}
            <header className="position-relative overflow-hidden pt-5 pb-5" style={{ background: 'linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)' }}>
                <div className="container position-relative z-1 pt-5 mt-3 mb-5" style={{ maxWidth: '1100px' }}>
                    <div className="row align-items-center">
                        <div className="col-lg-6 mb-5 mb-lg-0 order-2 order-lg-1 text-center text-lg-start">
                            <h1 className="h1-mobile display-4 fw-bold ls-tight mb-4 text-slate animate__animated animate__fadeInUp">
                                Learn <span className="text-warning">Tshivenda</span><br />
                                The Fun Way.
                            </h1>
                            <p className="lead text-muted mb-4 mb-md-5 ls-1 animate__animated animate__fadeInUp animate__delay-1s mx-auto mx-lg-0" style={{ maxWidth: '480px' }}>
                                Master the language of Venda through gamified lessons, interactive stories, and engaging minigames.
                            </p>
                            <div className="d-flex flex-column flex-md-row gap-3 justify-content-center justify-content-lg-start animate__animated animate__fadeInUp animate__delay-1s">
                                <button onClick={() => navigate('/register')} className="btn btn-dark btn-lg px-4 px-md-5 py-3 fw-bold rounded-pill shadow-lg hover-lift">
                                    START LEARNING
                                </button>
                                <button onClick={() => navigate('/courses')} className="btn btn-outline-dark btn-lg px-4 px-md-5 py-3 fw-bold rounded-pill hover-lift">
                                    EXPLORE
                                </button>
                            </div>
                        </div>
                        <div className="col-lg-6 text-center position-relative order-1 order-lg-2 mb-5 mb-lg-0">
                            {/* Decorative Blobs */}
                            <div className="position-absolute top-50 start-50 translate-middle"
                                style={{ width: '80%', paddingBottom: '80%', background: 'radial-gradient(circle, rgba(250,204,21,0.2) 0%, rgba(255,255,255,0) 70%)', zIndex: -1 }}></div>

                            <div className="animate__animated animate__bounceInRight">
                                <Mascot width="100%" height="auto" mood="excited" style={{ maxWidth: '300px', margin: '0 auto' }} />
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



            {/* --- FEATURES GRID --- */}
            <section id="features" className="py-5 my-5">
                <div className="container" style={{ maxWidth: '1100px' }}>
                    <div className="text-center mb-5 mx-auto" style={{ maxWidth: '700px' }}>
                        <span className="badge bg-light text-dark border mb-3 px-3 py-2 rounded-pill fw-bold ls-1 smallest">FEATURES</span>
                        <h2 className="fw-bold display-5 ls-tight mb-3">Everything you need to become fluent.</h2>
                        <p className="text-muted lead">We've combined the best of gamification with deep cultural immersion.</p>
                    </div>

                    <div className="row g-4">
                        {[
                            { icon: 'bi-controller', title: 'Gamified Learning', desc: 'Earn points, unlock badges, and climb the leaderboard as you master new words.', color: 'text-primary' },
                            { icon: 'bi-puzzle-fill', title: 'Minigames & Puzzles', desc: 'Reinforce your vocabulary with Word Bombs and Picture Puzzles.', color: 'text-success' },
                            { icon: 'bi-bank2', title: 'Cultural Stories', desc: 'Dive into interactive history lessons that bring Venda heritage to life.', color: 'text-warning' },
                            { icon: 'bi-trophy-fill', title: 'Daily Challenges', desc: 'Keep your streak alive with bite-sized daily tasks and quizzes.', color: 'text-danger' },
                            { icon: 'bi-soundwave', title: 'Authentic Audio', desc: 'Listen to clear audio pronunciations for every word.', color: 'text-info' },
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
            <section id="how-it-works" className="py-5 bg-dark text-white position-relative overflow-hidden">
                <div className="container position-relative z-1 py-5" style={{ maxWidth: '1100px' }}>
                    <div className="row align-items-center text-center text-lg-start">
                        <div className="col-lg-5 mb-5 mb-lg-0">
                            <h2 className="display-5 fw-bold ls-tight mb-4">How it works</h2>
                            <p className="lead opacity-75 mb-4 mb-md-5">Start speaking from day one with our proven method.</p>

                            <div className="d-flex flex-column gap-4">
                                {[
                                    { step: '01', title: 'Create a Profile', text: 'Set your goals and join the community.' },
                                    { step: '02', title: 'Start a Lesson', text: 'Learn vocabulary through interactive cards.' },
                                    { step: '03', title: 'Play & Reinforce', text: 'Master vocabulary through engaging minigames and quizzes.' },
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
                            <div className="bg-white rounded-5 p-2 shadow-lg section-rotation-mobile" style={{ transform: 'rotate(-2deg)' }}>
                                <div className="bg-light rounded-4 overflow-hidden section-height-mobile" style={{ height: '400px', background: 'url(https://images.unsplash.com/photo-1516321318423-f06f85e504b3?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80) center/cover' }}>
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

            {/* --- MINIGAMES SHOWCASE --- */}
            <section id="minigames" className="py-5 bg-white">
                <div className="container py-4" style={{ maxWidth: '1100px' }}>
                    <div className="row align-items-center g-5">
                        <div className="col-lg-6">
                            <div className="position-relative">
                                {/* Abstract Game Dashboard Mockup */}
                                <div className="bg-light rounded-4 p-4 border shadow-sm" style={{ transform: 'rotate(-1deg)' }}>
                                    <div className="d-flex justify-content-between align-items-center mb-4">
                                        <h5 className="fw-bold mb-0 text-dark">Mitambo (Games)</h5>
                                        <div className="badge bg-warning text-dark px-3 py-2 rounded-pill fw-bold">1200 XP</div>
                                    </div>
                                    <div className="row g-3">
                                        <div className="col-6">
                                            <div className="bg-white p-3 rounded-4 border text-center hover-lift transition-all">
                                                <i className="bi bi-heptagon-fill text-danger fs-1 mb-2 d-block"></i>
                                                <h6 className="fw-bold mb-1">Word Bomb</h6>
                                                <p className="smallest text-muted mb-0">Type fast to survive!</p>
                                            </div>
                                        </div>
                                        <div className="col-6">
                                            <div className="bg-white p-3 rounded-4 border text-center hover-lift transition-all">
                                                <i className="bi bi-image-fill text-primary fs-1 mb-2 d-block"></i>
                                                <h6 className="fw-bold mb-1">Picture Puzzle</h6>
                                                <p className="smallest text-muted mb-0">Guess the image!</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="position-absolute bg-warning rounded-circle" style={{ width: 60, height: 60, top: -20, right: -20, zIndex: -1, opacity: 0.5 }}></div>
                                <div className="position-absolute bg-primary rounded-circle" style={{ width: 40, height: 40, bottom: -10, left: -10, zIndex: -1, opacity: 0.3 }}></div>
                            </div>
                        </div>
                        <div className="col-lg-6">
                            <span className="badge bg-danger text-white mb-3 px-3 py-2 rounded-pill fw-bold ls-1 smallest">PLAY & LEARN</span>
                            <h2 className="display-5 fw-bold ls-tight mb-4">Master words under pressure.</h2>
                            <p className="lead text-muted mb-4">
                                Testing your memory is one thing, but recalling words under pressure builds true fluency.
                                Our interactive minigames are designed to make vocabulary stick while you have fun.
                            </p>
                            <ul className="list-unstyled d-flex flex-column gap-3 mb-5">
                                <li className="d-flex align-items-center gap-3">
                                    <i className="bi bi-check-circle-fill text-success fs-5"></i>
                                    <span className="fw-bold text-slate">Heart-pounding Word Bomb challenges</span>
                                </li>
                                <li className="d-flex align-items-center gap-3">
                                    <i className="bi bi-check-circle-fill text-success fs-5"></i>
                                    <span className="fw-bold text-slate">Visual learning with Picture Puzzles</span>
                                </li>
                                <li className="d-flex align-items-center gap-3">
                                    <i className="bi bi-check-circle-fill text-success fs-5"></i>
                                    <span className="fw-bold text-slate">Earn Leaderboard Points (XP) to rank up</span>
                                </li>
                            </ul>
                            <button onClick={() => navigate('/mitambo')} className="btn btn-outline-dark px-4 py-2 fw-bold rounded-pill shadow-none">
                                PREVIEW GAMES
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- CULTURE & HISTORY --- */}
            <section id="culture" className="py-5" style={{ backgroundColor: '#F9FAFB' }}>
                <div className="container py-4" style={{ maxWidth: '1100px' }}>
                    <div className="row align-items-center g-5">
                        <div className="col-lg-6 order-2 order-lg-1">
                            <span className="badge bg-warning text-dark border-warning mb-3 px-3 py-2 rounded-pill fw-bold ls-1 smallest">CULTURE FIRST</span>
                            <h2 className="display-5 fw-bold ls-tight mb-4">More than just vocabulary.</h2>
                            <p className="lead text-muted mb-4">
                                Language is deeply tied to culture. VendaLearn includes a dedicated <strong>Ḓivhazwakale (History)</strong> section to immerse you in the heritage, traditions, and stories of the Vhavenda people.
                            </p>
                            <p className="text-muted mb-4">
                                Read beautiful interactive stories, learn the significance of traditional attire, and understand the cultural context behind the phrases you are learning.
                            </p>
                            <button onClick={() => navigate('/history')} className="btn btn-dark px-4 py-2 fw-bold rounded-pill shadow-none">
                                EXPLORE HERITAGE
                            </button>
                        </div>
                        <div className="col-lg-6 order-1 order-lg-2">
                            <div className="row g-3 px-2 px-md-0">
                                <div className="col-6 col-sm-6 mt-md-5">
                                    <div className="bg-white p-3 p-md-4 rounded-4 shadow-sm border text-center hover-lift h-100 w-100">
                                        <div className="bg-warning bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3" style={{ width: 50, height: 50 }}>
                                            <i className="bi bi-book-half text-warning fs-3"></i>
                                        </div>
                                        <h6 className="fw-bold mb-1">Folktales</h6>
                                        <p className="smallest text-muted mb-0">Traditional stories</p>
                                    </div>
                                </div>
                                <div className="col-6 col-sm-6">
                                    <div className="bg-white p-3 p-md-4 rounded-4 shadow-sm border text-center hover-lift h-100 w-100">
                                        <div className="bg-primary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3" style={{ width: 50, height: 50 }}>
                                            <i className="bi bi-geo-alt-fill text-primary fs-3"></i>
                                        </div>
                                        <h6 className="fw-bold mb-1">Thohoyandou</h6>
                                        <p className="smallest text-muted mb-0">The capital city</p>
                                    </div>
                                </div>
                                <div className="col-6 col-sm-6 mt-md-n5">
                                    <div className="bg-white p-3 p-md-4 rounded-4 shadow-sm border text-center hover-lift h-100 w-100">
                                        <div className="bg-danger bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3" style={{ width: 50, height: 50 }}>
                                            <i className="bi bi-music-note-beamed text-danger fs-3"></i>
                                        </div>
                                        <h6 className="fw-bold mb-1">Music</h6>
                                        <p className="smallest text-muted mb-0">Rhythms of Venda</p>
                                    </div>
                                </div>
                                <div className="col-6 col-sm-6 mt-md-n5">
                                    <div className="bg-white p-3 p-md-4 rounded-4 shadow-sm border text-center hover-lift h-100 w-100">
                                        <div className="bg-success bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3" style={{ width: 50, height: 50 }}>
                                            <i className="bi bi-brush-fill text-success fs-3"></i>
                                        </div>
                                        <h6 className="fw-bold mb-1">Art & Craft</h6>
                                        <p className="smallest text-muted mb-0">Pottery & beadwork</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- FAQ SECTION --- */}
            <section id="faq" className="py-5 bg-white mb-5">
                <div className="container py-4" style={{ maxWidth: '800px' }}>
                    <div className="text-center mb-5">
                        <h2 className="display-6 fw-bold ls-tight mb-3">Frequently Asked Questions</h2>
                        <p className="text-muted lead">Common questions from our learners.</p>
                    </div>

                    <div className="accordion accordion-flush rounded-4 overflow-hidden border" id="faqAccordion">
                        {[
                            { q: "Is VendaLearn really free?", a: "Yes! The core learning experience, including courses, minigames, and cultural stories, is completely free to use." },
                            { q: "Do I need any prior experience with Tshivenda?", a: "Not at all. Our courses are designed for absolute beginners, starting from basic greetings and vocabulary." },
                            { q: "Can I use VendaLearn on my phone?", a: "Yes! VendaLearn is a Progressive Web App (PWA). You can 'Install' it directly from your mobile browser to your home screen." },
                            { q: "Are the audio pronunciations accurate?", a: "Yes, all our audio clips are recorded to ensure you learn the correct authentic Venda pronunciation." },
                            { q: "How does the Leaderboard work?", a: "You earn Leaderboard Points (XP) by completing lessons, maintaining streaks, and playing minigames. Compete with others to reach the top ranks!" }
                        ].map((faq, i) => (
                            <div className="accordion-item" key={i}>
                                <h2 className="accordion-header">
                                    <button className="accordion-button collapsed fw-bold py-4 shadow-none" type="button" data-bs-toggle="collapse" data-bs-target={`#faq${i}`}>
                                        {faq.q}
                                    </button>
                                </h2>
                                <div id={`faq${i}`} className="accordion-collapse collapse" data-bs-parent="#faqAccordion">
                                    <div className="accordion-body text-muted pb-4 pt-0">
                                        {faq.a}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* --- CONTACT SECTION --- */}
            <section id="contact" className="py-5" style={{ backgroundColor: '#F9FAFB' }}>
                <div className="container py-4" style={{ maxWidth: '800px' }}>
                    <div className="text-center mb-5">
                        <h2 className="display-6 fw-bold ls-tight mb-3">Get in touch</h2>
                        <p className="text-muted lead">Have questions? We're here to help you on your journey.</p>
                    </div>
                    <div className="row g-4 justify-content-center">
                        <div className="col-md-6">
                            <div className="bg-white p-4 rounded-4 border shadow-sm h-100 text-center">
                                <i className="bi bi-envelope-fill text-warning fs-1 mb-3 d-block"></i>
                                <h5 className="fw-bold mb-2">Email Us</h5>
                                <p className="text-muted mb-0">support@vendalearn.com</p>
                            </div>
                        </div>
                        <div className="col-md-6">
                            <div className="bg-white p-4 rounded-4 border shadow-sm h-100 text-center">
                                <i className="bi bi-chat-dots-fill text-primary fs-1 mb-3 d-block"></i>
                                <h5 className="fw-bold mb-2">Community</h5>
                                <p className="text-muted mb-0">Join our Discord server</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- CTA --- */}
            <section className="py-5 my-0 my-md-5 text-center">
                <div className="container px-4" style={{ maxWidth: '800px' }}>
                    <h2 className="display-5 fw-bold ls-tight mb-4">Ready to start your journey?</h2>
                    <p className="lead text-muted mb-4 mb-md-5">Join for free today and start speaking Tshivenda with confidence.</p>
                    <button onClick={() => navigate('/register')} className="btn btn-warning btn-lg px-4 px-md-5 py-3 fw-bold rounded-pill shadow-lg hover-scale w-100-mobile">
                        JOIN VENDALEARN FREE
                    </button>
                    <p className="mt-3 small text-muted">No credit card required • Cancel anytime</p>
                </div>
            </section>


            <style>{`
                .hover-lift:hover { transform: translateY(-5px); box-shadow: 0 10px 30px rgba(0,0,0,0.1) !important; }
                .hover-scale:hover { transform: scale(1.05); }
                .text-slate { color: #1e293b; }
                @media (max-width: 768px) {
                    .h1-mobile { font-size: 2.5rem !important; }
                    .display-5 { font-size: 2rem !important; }
                    .display-6 { font-size: 1.75rem !important; }
                    .lead { font-size: 1rem !important; }
                    .mt-md-n5 { margin-top: 0 !important; }
                    .mt-md-5 { margin-top: 0 !important; }
                    .section-rotation-mobile { transform: rotate(0deg) !important; }
                    .section-height-mobile { height: 250px !important; }
                    .w-100-mobile { width: 100% !important; }
                }
            `}</style>
        </div>
    );
};


export default LandingPage;
