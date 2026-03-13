import React from 'react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
    return (
        <footer className="bg-white border-top py-3">
            <div className="container" style={{ maxWidth: '1100px' }}>
                <div className="d-flex flex-column align-items-center gap-3">
                    {/* CENTERED NAV */}
                    <div className="d-flex flex-wrap justify-content-center gap-3 gap-md-4">
                        <Link to="/privacy" className="text-decoration-none text-muted smallest-print fw-bold ls-1 uppercase hover-yellow transition-all">
                            Privacy
                        </Link>
                        <Link to="/terms" className="text-decoration-none text-muted smallest-print fw-bold ls-1 uppercase hover-yellow transition-all">
                            Terms
                        </Link>
                        <Link to="/popiact" className="text-decoration-none text-muted smallest-print fw-bold ls-1 uppercase hover-yellow transition-all">
                            POPIA
                        </Link>
                        <Link to="/dmca" className="text-decoration-none text-muted smallest-print fw-bold ls-1 uppercase hover-yellow transition-all">
                            DMCA
                        </Link>
                    </div>

                    {/* COPYRIGHT NOTICE */}
                    <div className="text-center">
                        <p className="text-muted smallest-print mb-0 fw-bold ls-1 uppercase opacity-75">
                            &copy; 2026 All Rights Reserved • Luvhimbi Digitals
                        </p>
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
