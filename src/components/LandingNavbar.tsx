import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const LandingNavbar: React.FC = () => {
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <nav className={`navbar navbar-expand-lg fixed-top transition-all py-3 ${scrolled ? 'bg-white shadow-sm' : 'bg-transparent'}`}>
            <div className="container" style={{ maxWidth: '1100px' }}>
                <Link className="navbar-brand d-flex align-items-center mb-0 text-decoration-none shadow-none" to="/">
                    <div className="text-dark rounded-3 me-2 d-flex align-items-center justify-content-center fw-bold flex-shrink-0 bg-warning shadow-sm"
                        style={{ width: '40px', height: '40px', fontSize: '1.1rem' }}>
                        V
                    </div>
                    <div className="d-flex flex-column justify-content-center">
                        <span className="fw-bold text-dark ls-tight lh-1" style={{ fontSize: '1.2rem' }}>
                            VENDA<span className="text-warning">LEARN</span>
                        </span>
                    </div>
                </Link>

                <div className="ms-auto d-flex align-items-center gap-2 gap-md-3">
                    <Link to="/login" className="btn btn-link text-decoration-none text-dark fw-bold smallest ls-1 shadow-none px-2 px-md-3">
                        LOG IN
                    </Link>
                    <Link to="/register" className="btn btn-game-primary fw-bold smallest ls-1 px-3 px-md-4 py-2 rounded-pill shadow-sm">
                        START FREE
                    </Link>
                </div>
            </div>

            <style>{`
                .transition-all { transition: all 0.3s ease; }
                .ls-tight { letter-spacing: -1.2px; }
                .ls-1 { letter-spacing: 1px; }
                .smallest { font-size: 11px; }
            `}</style>
        </nav>
    );
};

export default LandingNavbar;
