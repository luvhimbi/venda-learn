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
            <div className="container px-3 px-md-4" style={{ maxWidth: '1100px' }}>
                <Link className="navbar-brand d-flex align-items-center mb-0 text-decoration-none shadow-none" to="/">
                    <img src="/images/VendaLearnLogo.png" alt="Venda Learn Logo" height="45" className="object-fit-contain d-none d-md-block" />
                    <img src="/images/VendaLearnLogo.png" alt="Venda Learn Logo" height="35" className="object-fit-contain d-md-none" />
                </Link>

                <div className="ms-auto d-flex align-items-center gap-1 gap-sm-2 gap-md-3">
                    <Link to="/login" className="btn btn-link text-decoration-none text-dark fw-bold smallest-mobile ls-1 shadow-none px-2 px-md-3">
                        LOG IN
                    </Link>
                    <Link to="/register" className="btn btn-game-primary fw-bold smallest-mobile ls-1 px-3 px-md-4 py-2 rounded-pill shadow-sm">
                        START FREE
                    </Link>
                </div>
            </div>

            <style>{`
                .transition-all { transition: all 0.3s ease; }
                .ls-tight { letter-spacing: -1.2px; }
                .ls-1 { letter-spacing: 1px; }
                .smallest { font-size: 11px; }
                @media (max-width: 576px) {
                    .smallest-mobile { font-size: 10px; padding-left: 0.5rem !important; padding-right: 0.5rem !important; }
                }
            `}</style>
        </nav>
    );
};

export default LandingNavbar;
