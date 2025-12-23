import React from 'react';

const Footer: React.FC = () => {
    return (
        <footer className="p-4 bg-white text-center border-top mt-auto">
            <div className="container">
                <div className="d-flex flex-column align-items-center">
                    <div className="mb-2" style={{ fontSize: '1.5rem' }}>🐘</div>
                    <div className="text-muted small">
                        <strong>Gudani Tshivenda</strong> &copy; 2025 — Kha ri gude!
                    </div>
                    <div className="mt-2">
                        <span className="badge rounded-pill bg-light text-dark border me-2">🇿🇦 Tshivenda</span>
                        <span className="badge rounded-pill bg-light text-dark border">📖 Learning</span>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;