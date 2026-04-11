import React from 'react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
    return (
        <footer className="bg-white border-top border-4 border-dark pt-0 pb-4">
            {/* TOP DECORATIVE BAR (Game Style) */}
            <div className="bg-warning border-bottom border-4 border-dark mb-5" style={{ height: '12px', width: '100%' }}></div>

            <div className="container py-2" style={{ maxWidth: '1100px' }}>
                <div className="row gy-5 mb-5">
                    {/* BRAND & DESCRIPTION */}
                    <div className="col-12 col-md-4 pe-md-5">
                        <div className="mb-4">
                            <Link to="/" className="text-decoration-none">
                                <span className="fw-black fs-2 text-dark ls-tight text-uppercase border border-4 border-dark px-3 py-1 bg-white shadow-action-sm">
                                    Chommie
                                </span>
                            </Link>
                        </div>
                        <p className="fw-bold text-muted small mb-4 lh-base pe-md-4 text-uppercase">
                            Your language companion for mastering South African culture and conversation. Start your quest today.
                        </p>
                        <div className="d-flex align-items-center gap-2">
                            <div className="bg-dark text-white px-3 py-1 fw-black smallest-print text-uppercase border border-2 border-dark shadow-action-sm">
                                Level Up Your Voice
                            </div>
                        </div>
                    </div>

                    {/* EXPLORE LINKS */}
                    <div className="col-6 col-md-2">
                        <h6 className="fw-black mb-4 text-uppercase border-bottom border-3 border-dark d-inline-block pb-1" style={{ fontSize: '13px' }}>Explore</h6>
                        <ul className="list-unstyled d-flex flex-column gap-3 mb-0">
                            <li><Link to="/about" className="text-decoration-none text-dark small fw-black text-uppercase hover-yellow transition-all">About Us</Link></li>
                            <li><Link to="/courses" className="text-decoration-none text-dark small fw-black text-uppercase hover-yellow transition-all">Quests</Link></li>
                            <li><Link to="/#culture" className="text-decoration-none text-dark small fw-black text-uppercase hover-yellow transition-all">Heritage</Link></li>
                            <li><Link to="/#minigames" className="text-decoration-none text-dark small fw-black text-uppercase hover-yellow transition-all">Minigames</Link></li>
                            <li><Link to="/muvhigo" className="text-decoration-none text-dark small fw-black text-uppercase hover-yellow transition-all">Leaderboard</Link></li>
                        </ul>
                    </div>


                    {/* LEGAL & SOCIALS */}
                    <div className="col-12 col-md-4">
                        <h6 className="fw-black mb-4 text-uppercase border-bottom border-3 border-dark d-inline-block pb-1" style={{ fontSize: '13px' }}>Legal</h6>
                        <div className="d-flex flex-wrap gap-3 mb-4">
                            <Link to="/privacy" className="text-decoration-none text-muted small fw-black text-uppercase hover-yellow transition-all">Privacy</Link>
                            <Link to="/terms" className="text-decoration-none text-muted small fw-black text-uppercase hover-yellow transition-all">Terms</Link>
                            <Link to="/popiact" className="text-decoration-none text-muted small fw-black text-uppercase hover-yellow transition-all">POPIA</Link>
                        </div>

                        <h6 className="fw-black mb-3 text-uppercase" style={{ fontSize: '13px' }}>Connect with Elphie</h6>
                        <div className="d-flex gap-3">
                            {['twitter-x', 'facebook', 'instagram', 'linkedin'].map((social) => (
                                <a key={social} href="#" className="text-dark bg-white border border-3 border-dark d-flex align-items-center justify-content-center hover-press shadow-action-sm" style={{ width: '42px', height: '42px' }}>
                                    <i className={`bi bi-${social} fs-5`}></i>
                                </a>
                            ))}
                        </div>
                    </div>
                </div>

                {/* BOTTOM REGION */}
                <div className="border-top border-3 border-dark pt-4 mt-2 d-flex flex-column flex-md-row justify-content-between align-items-center gap-4">
                    <p className="text-muted smallest-print mb-0 fw-black text-uppercase ls-1 text-center text-md-start">
                        &copy; {new Date().getFullYear()} CHOMMIE. ALL RIGHTS RESERVED. <br className="d-md-none" />
                        <span className="text-dark">DESIGNED BY LUVHIMBI DIGITALS</span>
                    </p>
                    <div className="d-flex align-items-center gap-2">
                        <span className="bg-white text-dark border border-3 border-dark px-3 py-2 fw-black smallest-print d-flex align-items-center shadow-action-sm text-uppercase">
                            <img src="https://flagcdn.com/za.svg" width="20" alt="South Africa" className="me-2 border border-1 border-dark" />
                            Made in South Africa
                        </span>
                    </div>
                </div>
            </div>

            <style>{`
                footer {
                    font-family: 'Lexend', sans-serif;
                }
            `}</style>
        </footer>
    );
};

export default Footer;