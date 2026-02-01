import React from 'react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
    return (
        <footer className="bg-white border-top py-4">
            <div className="container" style={{ maxWidth: '1100px' }}>
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-center gap-4">

                    {/* LEFT: BRANDING WITH SLOGAN */}
                    <div className="d-flex align-items-center">
                        <div className="text-dark rounded-2 me-3 d-flex align-items-center justify-content-center fw-bold flex-shrink-0"
                             style={{ width: '32px', height: '32px', fontSize: '0.9rem', backgroundColor: '#FACC15' }}>
                            V
                        </div>
                        <div className="d-flex flex-column">
                            <p className="text-dark smallest-print mb-0 fw-bold ls-1 uppercase lh-1">
                                &copy; 2026 VENDA<span style={{ color: '#FACC15' }}>LEARN</span>
                            </p>
                            <span className="shumela-venda-pulse-footer fw-bold ls-2 text-uppercase">
                                Shumela Venda
                            </span>
                        </div>
                    </div>

                    {/* RIGHT: COMPACT NAV */}
                    <div className="d-flex gap-4">
                        <Link to="/privacy" className="text-decoration-none text-muted smallest-print fw-bold ls-1 uppercase hover-yellow">
                            Privacy
                        </Link>
                        <Link to="/terms" className="text-decoration-none text-muted smallest-print fw-bold ls-1 uppercase hover-yellow">
                            Terms
                        </Link>
                        <Link to="/popiact" className="text-decoration-none text-muted smallest-print fw-bold ls-1 uppercase hover-yellow">
                            POPIA
                        </Link>
                    </div>
                </div>
            </div>

            <style>{`
                footer {
                    font-family: 'Poppins', sans-serif;
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
                .hover-yellow {
                    transition: color 0.2s ease;
                }
                .hover-yellow:hover {
                    color: #FACC15 !important;
                }

                /* Pulse Animation for Footer Slogan */
                .shumela-venda-pulse-footer {
                    font-size: 8px;
                    color: #9CA3AF;
                    margin-top: 2px;
                    animation: pulseVendaFooter 3s infinite ease-in-out;
                }

                @keyframes pulseVendaFooter {
                    0% { opacity: 0.6; }
                    50% { opacity: 1; color: #FACC15; }
                    100% { opacity: 0.6; }
                }
                
                @media (max-width: 768px) {
                    .smallest-print {
                        font-size: 8px;
                    }
                    .shumela-venda-pulse-footer {
                        font-size: 7px;
                    }
                }
            `}</style>
        </footer>
    );
};

export default Footer;