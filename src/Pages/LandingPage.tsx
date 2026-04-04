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
                                Your Language Companion
                            </div>
                            <h1 className="display-2 fw-black text-dark mb-4 ls-tight text-uppercase">
                                Speak the <br />
                                <span className="bg-white px-3 border border-4 border-dark d-inline-block mt-2">Culture.</span>
                            </h1>
                            <p className="lead fw-bold text-dark mb-5 pe-lg-5">
                                Chommie is for everyone. Meet **Elphie**, your personal guide to mastering South African languages through interactive quests, stories, and real-world practice.
                            </p>
                            <div className="d-flex flex-column flex-md-row gap-4 justify-content-center justify-content-lg-start">
                                <button onClick={() => navigate('/onboarding')} className="btn btn-dark btn-lg px-5 py-3 fw-black rounded-0 border-4 border-dark shadow-action hover-press text-uppercase">
                                    Start Quest with Elphie
                                </button>
                                <div className="d-flex align-items-center gap-3 bg-white border border-4 border-dark px-4 py-2 shadow-action">
                                    <i className="bi bi-fire fs-3 text-warning"></i>
                                    <div>
                                        <div className="fw-black lh-1 text-uppercase">2,400+</div>
                                        <div className="small fw-bold text-muted text-uppercase" style={{ fontSize: '0.7rem' }}>Global Streaks</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="col-lg-5 text-center">
                            <div className="p-4 bg-white border border-4 border-dark shadow-action position-relative">
                                {/* ELPHIE INTRODUCTION BOX */}
                                <div className="bg-dark text-white p-2 border border-2 border-dark position-absolute top-0 start-50 translate-middle-x shadow-action-sm" style={{ marginTop: '-20px', width: '200px' }}>
                                    <span className="fw-black text-uppercase small">I'm Elphie! 👋</span>
                                </div>

                                <div className="mb-3 text-start mt-2">
                                    <span className="badge bg-dark rounded-0 border border-2 border-dark mb-2 text-uppercase">Rank: Traveler</span>
                                    <div className="fw-black text-uppercase small">Adventure Awaits</div>
                                </div>

                                <Mascot width="100%" height="auto" mood="excited" style={{ maxWidth: '300px' }} />

                                <div className="mt-3 pt-3 border-top border-4 border-dark">
                                    <div className="d-flex justify-content-between fw-black small text-uppercase mb-1">
                                        <span>Next Milestone</span>
                                        <span className="text-muted">150 / 500 XP</span>
                                    </div>
                                    <div className="progress rounded-0 border border-3 border-dark mt-1" style={{ height: '24px', background: '#e2e8f0' }}>
                                        <div className="progress-bar bg-warning" style={{ width: '30%' }}></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* --- INCLUSIVE BENEFITS --- */}
            <section className="py-5 bg-light border-bottom border-4 border-dark">
                <div className="container py-5">
                    <div className="row g-4 text-center">
                        <div className="col-md-4">
                            <div className="p-4 bg-white border border-4 border-dark shadow-action h-100 hover-press">
                                <div className="bg-warning d-inline-block p-3 border border-3 border-dark mb-4 shadow-action-sm">
                                    <i className="bi bi-heart-fill fs-1 text-dark"></i>
                                </div>
                                <h4 className="fw-black text-uppercase">For Everyone</h4>
                                <p className="fw-bold text-muted mb-0">From business professionals to curious travelers, Chommie adapts to your pace and your goals.</p>
                            </div>
                        </div>
                        <div className="col-md-4">
                            <div className="p-4 bg-white border border-4 border-dark shadow-action h-100 hover-press">
                                <div className="bg-info d-inline-block p-3 border border-3 border-dark mb-4 shadow-action-sm">
                                    <i className="bi bi-controller fs-1 text-dark"></i>
                                </div>
                                <h4 className="fw-black text-uppercase">XP Rewards</h4>
                                <p className="fw-bold text-muted mb-0">Earn Experience Points for every interaction. Level up your profile and unlock deeper cultural insights.</p>
                            </div>
                        </div>
                        <div className="col-md-4">
                            <div className="p-4 bg-white border border-4 border-dark shadow-action h-100 hover-press">
                                <div className="bg-danger d-inline-block p-3 border border-3 border-dark mb-4 shadow-action-sm">
                                    <i className="bi bi-lightning-fill fs-1 text-white"></i>
                                </div>
                                <h4 className="fw-black text-uppercase">Daily Streaks</h4>
                                <p className="fw-bold text-muted mb-0">Stay consistent and watch your streak grow. The more you play, the faster you'll find your voice.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- EXPANDED FAQ SECTION --- */}
            <section className="py-5 bg-white">
                <div className="container py-5" style={{ maxWidth: '900px' }}>
                    <div className="text-center mb-5">
                        <h2 className="display-4 fw-black text-uppercase mb-2">The Knowledge Base</h2>
                        <div className="bg-dark mx-auto" style={{ height: '8px', width: '80px' }}></div>
                    </div>

                    <div className="accordion border border-4 border-dark rounded-0 shadow-action" id="chommieFaq">
                        {[
                            {
                                q: "Is Chommie actually free?",
                                a: "Yes, 100%. Our core mission is to promote unity and communication across South Africa. All primary language lessons, vocabulary builders, and culture stories are free for all users."
                            },
                            {
                                q: "Who is Elphie?",
                                a: "Elphie is your dedicated language companion! She'll guide you through your lessons, help you out when you're stuck on a tricky translation, and celebrate every milestone you reach with a dance."
                            },
                            {
                                q: "Which languages are currently available?",
                                a: "We currently offer comprehensive paths for Tshivenda, isiZulu, isiXhosa, and Sepedi. Our team is actively working on Afrikaans, Setswana, and Xitsonga to be added soon."
                            },
                            {
                                q: "How do Daily Streaks work?",
                                a: "A streak starts when you complete at least one activity in a day. If you skip a day, your streak resets. Maintaining a high streak earns you bonus XP multipliers and exclusive badges from Elphie!"
                            },
                            {
                                q: "Can I use Chommie for business?",
                                a: "Absolutely. The curriculum is designed to help you handle real-world situations—from office greetings and professional introductions to navigating local markets confidently."
                            },
                            {
                                q: "What is XP and why do I need it?",
                                a: "XP (Experience Points) measures your learning progress. As you earn XP, you level up your rank. High XP also unlocks advanced folktales and hidden 'Pro' levels in your favorite language."
                            },
                            {
                                q: "Is there a mobile app?",
                                a: "Chommie is a web-based experience optimized for mobile browsers, so you can learn on any smartphone. A native app for Android and iOS is currently in development."
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

            {/* --- FINAL CALL TO ACTION --- */}
            <section className="py-5 border-top border-4 border-dark" style={{ backgroundColor: '#1a1a1a' }}>
                <div className="container py-5 text-center">
                    <h2 className="display-3 fw-black text-white mb-4 text-uppercase">Start your <br /><span className="text-warning">quest with Elphie.</span></h2>
                    <div className="d-flex flex-column flex-md-row justify-content-center gap-4">
                        <button onClick={() => navigate('/onboarding')} className="btn btn-warning btn-lg px-5 py-3 fw-black rounded-0 border-4 border-dark shadow-action-light hover-press text-uppercase">
                            Join Chommie Now
                        </button>
                        <button onClick={() => navigate('/login')} className="btn btn-outline-light btn-lg px-5 py-3 fw-black rounded-0 border-4 border-white hover-press text-uppercase">
                            Log In
                        </button>
                    </div>
                </div>
            </section>

            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Lexend:wght@400;700;900&display=swap');

                .fw-black { font-weight: 900; }
                .ls-tight { letter-spacing: -2px; }
                
                .shadow-action { box-shadow: 10px 10px 0px 0px #000; }
                .shadow-action-sm { box-shadow: 4px 4px 0px 0px #000; }
                .shadow-action-light { box-shadow: 10px 10px 0px 0px #FACC15; }

                .hover-press {
                    transition: transform 0.1s ease, box-shadow 0.1s ease;
                }

                .hover-press:hover {
                    transform: translate(-2px, -2px);
                    box-shadow: 12px 12px 0px 0px #000;
                }

                .hover-press:active {
                    transform: translate(6px, 6px);
                    box-shadow: 0px 0px 0px 0px #000;
                }

                .accordion-button:not(.collapsed) {
                    background-color: #f8fafc;
                    color: #000;
                }

                .accordion-button::after {
                    background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='%23000'%3e%3cpath fill-rule='evenodd' d='M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z'/%3e%3c/svg%3e");
                    width: 1.5rem;
                    height: 1.5rem;
                    background-size: 1.5rem;
                }

                @media (max-width: 768px) {
                    .display-2 { font-size: 2.5rem; }
                    .display-3 { font-size: 2rem; }
                    .shadow-action { box-shadow: 6px 6px 0px 0px #000; }
                }
            `}</style>
        </div>
    );
};

export default LandingPage;