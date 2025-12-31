import React from 'react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
    return (
        <footer className="bg-white border-top pt-5 pb-4 mt-auto animate__animated animate__fadeIn">
            <div className="container">
                <div className="row g-4 mb-5">

                    <div className="col-lg-5">
                        <div className="d-flex align-items-center mb-3">
                            <div className="bg-primary text-white rounded-3 me-2 d-flex align-items-center justify-content-center fw-bold shadow-sm"
                                 style={{ width: '32px', height: '32px' }}>V</div>
                            <h5 className="fw-bold mb-0 ls-1">VENDA<span className="text-primary">LEARN</span></h5>
                        </div>
                        <p className="text-muted small mb-4" style={{ maxWidth: '350px', lineHeight: '1.6' }}>
                            Dedication to preserving and spreading the beauty of the Tshivenda language.
                            From the heart of Venda to the world, kha ri gude vho-the!
                        </p>
                        <div className="d-flex gap-2">
                            <span className="badge rounded-pill bg-light text-primary border px-3 py-2 fw-bold">🇿🇦 South Africa</span>
                            <span className="badge rounded-pill bg-light text-success border px-3 py-2 fw-bold">🛡️ POPIA Compliant</span>
                        </div>
                    </div>

                    <div className="col-md-6 col-lg-3">
                        <h6 className="fw-bold text-uppercase small ls-1 mb-3 text-dark">Ndaela (Navigation)</h6>
                        <ul className="list-unstyled">
                            <li className="mb-2"><Link to="/" className="text-decoration-none text-muted small hover-primary transition-all">Hayani (Home)</Link></li>
                            <li className="mb-2"><Link to="/muvhigo" className="text-decoration-none text-muted small hover-primary transition-all">Muvhigo (Leaderboard)</Link></li>
                            <li className="mb-2"><Link to="/profile" className="text-decoration-none text-muted small hover-primary transition-all">Profile</Link></li>
                        </ul>
                    </div>

                    <div className="col-md-6 col-lg-4">
                        <h6 className="fw-bold text-uppercase small ls-1 mb-3 text-dark">Tsireledzo (Data Safety)</h6>
                        <div className="bg-light rounded-4 p-3 border-0 shadow-sm">
                            <p className="small text-muted mb-2">We respect your privacy in accordance with the <strong>POPI Act</strong> of South Africa.</p>
                            <Link to="/popiact" className="btn btn-white btn-sm border bg-white fw-bold w-100 rounded-3 shadow-sm py-2">
                                🛡️ View Compliance
                            </Link>
                        </div>
                    </div>
                </div>

                <div className="border-top pt-4">
                    <div className="row align-items-center">
                        <div className="col-md-6 text-center text-md-start">
                            <p className="text-muted small mb-0">
                                &copy; 2025 <strong>Venda Learn</strong>. All rights reserved.
                                <span className="d-block d-md-inline ms-md-2">Kha ri gude!</span>
                            </p>
                        </div>
                        <div className="col-md-6 text-center text-md-end mt-3 mt-md-0">
                            <div className="d-flex justify-content-center justify-content-md-end gap-3">
                                <Link to="/popiact" className="text-decoration-none text-muted smallest fw-bold ls-1 text-uppercase">POPIA</Link>
                                <Link to="/privacy" className="text-decoration-none text-muted smallest fw-bold ls-1 text-uppercase">Privacy</Link>
                                <Link to="/terms" className="text-decoration-none text-muted smallest fw-bold ls-1 text-uppercase">Terms</Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                .ls-1 { letter-spacing: 1px; }
                .smallest { font-size: 11px; }
                .hover-primary:hover { color: #0d6efd !important; padding-left: 5px; }
                .transition-all { transition: all 0.2s ease-in-out; }
            `}</style>
        </footer>
    );
};

export default Footer;