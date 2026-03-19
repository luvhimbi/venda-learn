import React from 'react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
    return (
        <footer className="bg-white pt-0 pb-3">
            <div className="bg-munwenda mb-4" style={{ height: '6px', width: '100%' }}></div>
            <div className="container py-4" style={{ maxWidth: '1100px' }}>
                <div className="row gy-4 mb-4">
                    {/* BRAND & DESCRIPTION */}
                    <div className="col-12 col-md-4 pe-md-5">
                        <div className="d-flex align-items-center mb-3">
                            <Link to="/" className="text-decoration-none text-dark">
                                <img src="/images/VendaLearnLogo.png" alt="Venda Learn Logo" height="40" className="object-fit-contain" />
                            </Link>
                        </div>
                        <p className="text-muted small mb-0 lh-lg pe-md-4">
                            Master the beauty of Tshivenda through culture, history, and gamified learning. The premium way to become fluent.
                        </p>
                    </div>

                    {/* EXPLORE LINKS */}
                    <div className="col-6 col-md-2">
                        <h6 className="fw-bold mb-3 ls-1 uppercase" style={{ fontSize: '11px', color: '#6B7280' }}>Explore</h6>
                        <ul className="list-unstyled d-flex flex-column gap-2 mb-0">
                            <li><Link to="/courses" className="text-decoration-none text-dark small fw-medium hover-yellow transition-all">Courses</Link></li>
                            <li><Link to="/#culture" className="text-decoration-none text-dark small fw-medium hover-yellow transition-all">Heritage</Link></li>
                            <li><Link to="/#minigames" className="text-decoration-none text-dark small fw-medium hover-yellow transition-all">Minigames</Link></li>
                            <li><Link to="/muvhigo" className="text-decoration-none text-dark small fw-medium hover-yellow transition-all">Leaderboard</Link></li>
                        </ul>
                    </div>

                    {/* SUPPORT LINKS */}
                    <div className="col-6 col-md-2">
                        <h6 className="fw-bold mb-3 ls-1 uppercase" style={{ fontSize: '11px', color: '#6B7280' }}>Support</h6>
                        <ul className="list-unstyled d-flex flex-column gap-2 mb-0">
                            <li><Link to="/#faq" className="text-decoration-none text-dark small fw-medium hover-yellow transition-all">FAQ</Link></li>
                            <li><Link to="/#contact" className="text-decoration-none text-dark small fw-medium hover-yellow transition-all">Contact Us</Link></li>
                            <li><Link to="/achievements" className="text-decoration-none text-dark small fw-medium hover-yellow transition-all">Community</Link></li>
                        </ul>
                    </div>

                    {/* LEGAL & SOCIALS */}
                    <div className="col-12 col-md-4">
                        <h6 className="fw-bold mb-3 ls-1 uppercase" style={{ fontSize: '11px', color: '#6B7280' }}>Legal</h6>
                        <div className="d-flex flex-wrap gap-3 mb-4">
                            <Link to="/privacy" className="text-decoration-none text-muted small fw-medium hover-yellow transition-all">Privacy</Link>
                            <Link to="/terms" className="text-decoration-none text-muted small fw-medium hover-yellow transition-all">Terms</Link>
                            <Link to="/popiact" className="text-decoration-none text-muted small fw-medium hover-yellow transition-all">POPIA</Link>
                            <Link to="/dmca" className="text-decoration-none text-muted small fw-medium hover-yellow transition-all">DMCA</Link>
                        </div>
                        
                        <h6 className="fw-bold mb-3 ls-1 uppercase" style={{ fontSize: '11px', color: '#6B7280' }}>Connect</h6>
                        <div className="d-flex gap-3">
                            <a href="#" className="text-dark bg-light rounded-circle d-flex align-items-center justify-content-center hover-yellow transition-all" style={{ width: '36px', height: '36px' }} aria-label="Twitter">
                                <i className="bi bi-twitter-x"></i>
                            </a>
                            <a href="#" className="text-dark bg-light rounded-circle d-flex align-items-center justify-content-center hover-yellow transition-all" style={{ width: '36px', height: '36px' }} aria-label="Facebook">
                                <i className="bi bi-facebook"></i>
                            </a>
                            <a href="#" className="text-dark bg-light rounded-circle d-flex align-items-center justify-content-center hover-yellow transition-all" style={{ width: '36px', height: '36px' }} aria-label="Instagram">
                                <i className="bi bi-instagram"></i>
                            </a>
                            <a href="#" className="text-dark bg-light rounded-circle d-flex align-items-center justify-content-center hover-yellow transition-all" style={{ width: '36px', height: '36px' }} aria-label="LinkedIn">
                                <i className="bi bi-linkedin"></i>
                            </a>
                        </div>
                    </div>
                </div>

                {/* BOTTOM REGION */}
                <div className="border-top pt-4 mt-2 d-flex flex-column flex-md-row justify-content-between align-items-center gap-3">
                    <p className="text-muted smallest-print mb-0 fw-bold ls-1 uppercase opacity-75 text-center text-md-start">
                        &copy; {new Date().getFullYear()} VendaLearn. All Rights Reserved. • Luvhimbi Digitals
                    </p>
                    <div className="d-flex align-items-center gap-2">
                        <span className="badge bg-light text-dark border rounded-pill px-3 py-2 fw-medium">
                            <i className="bi bi-globe-americas me-1 text-primary"></i> Made in South Africa
                        </span>
                    </div>
                </div>
            </div>

            <style>{`
                footer {
                    font-family: 'Outfit', sans-serif;
                }
                .smallest-print {
                    font-size: 9px;
                    letter-spacing: 1.5px;
                }
                .ls-1 {
                    letter-spacing: 1px;
                }
                .ls-2 {
                    letter-spacing: 2px;
                }
                .uppercase {
                    text-transform: uppercase;
                }
                .transition-all {
                    transition: all 0.2s ease;
                }
                .hover-yellow:hover {
                    color: #FACC15 !important;
                }
                
                @media (max-width: 768px) {
                    .smallest-print {
                        font-size: 8px;
                    }
                }
            `}</style>
        </footer>
    );
};

export default Footer;
