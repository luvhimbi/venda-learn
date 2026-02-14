import React from 'react';
import { Link } from 'react-router-dom';

const AuthNavbar: React.FC = () => {
    return (
        <nav className="navbar navbar-expand-lg bg-white border-bottom py-3 sticky-top">
            <div className="container" style={{ maxWidth: '1100px' }}>
                <Link className="navbar-brand d-flex align-items-center mb-0 text-decoration-none shadow-none" to="/">
                    <div className="text-dark rounded-3 me-3 d-flex align-items-center justify-content-center fw-bold flex-shrink-0 bg-warning shadow-sm"
                        style={{ width: '40px', height: '40px', fontSize: '1.1rem' }}>
                        V
                    </div>
                    <div className="d-flex flex-column justify-content-center">
                        <span className="fw-bold text-dark ls-tight lh-1" style={{ fontSize: '1.2rem' }}>
                            VENDA<span className="text-warning">LEARN</span>
                        </span>
                        <span className="smallest text-muted fw-bold ls-2 uppercase">Shumela Venda</span>
                    </div>
                </Link>

                <div className="ms-auto d-flex align-items-center gap-2 gap-md-3">
                    <Link to="/login" className="btn btn-link text-decoration-none text-dark fw-bold smallest ls-1 shadow-none px-2 px-md-3">
                        DZHENA
                    </Link>
                    <Link to="/register" className="btn btn-dark fw-bold smallest ls-1 px-3 px-md-4 py-2 rounded-pill shadow-sm">
                        JOIN FREE
                    </Link>
                </div>
            </div>

            <style>{`
                .ls-tight { letter-spacing: -1.2px; }
                .ls-1 { letter-spacing: 1px; }
                .ls-2 { letter-spacing: 2px; }
                .smallest { font-size: 10px; }
                .uppercase { text-transform: uppercase; }
            `}</style>
        </nav>
    );
};

export default AuthNavbar;
