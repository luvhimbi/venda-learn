import React from 'react';
import { Link } from 'react-router-dom';

const LandingFooter: React.FC = () => {
    return (
        <footer className="bg-white border-top pt-5 pb-4">
            <div className="container" style={{ maxWidth: '1100px' }}>
                <div className="row g-5 mb-5 align-items-center">
                    <div className="col-lg-6 text-center text-lg-start">
                        <div className="d-flex align-items-center justify-content-center justify-content-lg-start gap-2 mb-3">
                            <div className="text-dark rounded-3 d-flex align-items-center justify-content-center fw-bold bg-warning shadow-sm"
                                style={{ width: '32px', height: '32px' }}>V</div>
                            <span className="fw-bold text-dark ls-tight">VENDA<span className="text-warning">LEARN</span></span>
                        </div>
                        <p className="text-muted small mb-4">
                            Preserving the heart of Venda through gamified education. Join our community of learners today.
                        </p>
                        <div className="d-flex gap-3 justify-content-center justify-content-lg-start">
                            <a href="#" className="text-muted fs-5"><i className="bi bi-twitter"></i></a>
                            <a href="#" className="text-muted fs-5"><i className="bi bi-instagram"></i></a>
                            <a href="#" className="text-muted fs-5"><i className="bi bi-facebook"></i></a>
                        </div>
                    </div>
                    <div className="col-lg-6 col-12 d-flex justify-content-center justify-content-lg-end">
                        <div className="text-center text-lg-start">
                            <h6 className="fw-bold text-uppercase smallest ls-2 mb-3">Product</h6>
                            <ul className="list-unstyled d-flex flex-column gap-2 mb-0">
                                <li><Link to="/courses" className="text-decoration-none text-muted small">Lessons</Link></li>
                                <li><Link to="/mitambo" className="text-decoration-none text-muted small">Games</Link></li>
                                <li><Link to="/history" className="text-decoration-none text-muted small">Stories</Link></li>
                                <li><Link to="/muvhigo" className="text-decoration-none text-muted small">Leaderboard</Link></li>
                            </ul>
                        </div>
                    </div>
                </div>


            </div>
            <style>{`
                .ls-tight { letter-spacing: -1px; }
                .ls-2 { letter-spacing: 2px; }
                .smallest { font-size: 11px; }
            `}</style>
        </footer>
    );
};

export default LandingFooter;
