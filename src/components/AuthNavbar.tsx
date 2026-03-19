import React from 'react';
import { Link } from 'react-router-dom';

interface AuthNavbarProps {
    user: any;
}

const AuthNavbar: React.FC<AuthNavbarProps> = ({ user }) => {
    return (
        <nav className="navbar navbar-expand-lg bg-white border-bottom py-3 sticky-top">
            <div className="container" style={{ maxWidth: '1100px' }}>
                <Link className="navbar-brand d-flex align-items-center mb-0 text-decoration-none shadow-none" to="/">
                    <img src="/images/VendaLearnLogo.png" alt="Venda Learn Logo" height="45" className="object-fit-contain" />
                </Link>

                <div className="ms-auto d-flex align-items-center gap-2 gap-md-3">
                    {user?.isAnonymous && (
                        <div className="d-none d-md-flex align-items-center px-3 py-1 bg-light rounded-pill border me-2">
                            <div className="bg-secondary rounded-circle me-2 animate-pulse" style={{ width: 8, height: 8 }}></div>
                            <span className="smallest fw-bold text-muted ls-1 uppercase">Guest Mode</span>
                        </div>
                    )}
                    <Link to="/login" className="btn btn-link text-decoration-none text-dark fw-bold smallest ls-1 shadow-none px-2 px-md-3">
                        LOGIN
                    </Link>
                    <Link to="/register" className="btn btn-game-primary fw-bold smallest ls-1 px-3 px-md-4 py-2 rounded-pill shadow-sm">
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
