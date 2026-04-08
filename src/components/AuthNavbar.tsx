import React from 'react';
import { Link } from 'react-router-dom';

interface AuthNavbarProps {
    user: any;
}

const AuthNavbar: React.FC<AuthNavbarProps> = ({ user }) => {
    return (
        <nav className="bg-white border-bottom border-4 border-dark py-3 sticky-top shadow-sm">
            <div className="container" style={{ maxWidth: '1100px' }}>
                <div className="d-flex justify-content-between align-items-center">
                    {/* BRAND LOGO - Kept as requested with added Neubrutal style */}
                    <Link className="d-flex align-items-center text-decoration-none shadow-none p-1 border border-3 border-dark bg-white hover-press" to="/">
                        <img
                            src="/images/Logo.png"
                            alt="South African Languages Learning Platform"
                            height="40"
                            className="object-fit-contain"
                        />
                    </Link>

                    <div className="d-flex align-items-center gap-2 gap-md-4">
                        {/* GUEST STATUS - Gamified */}
                        {user?.isAnonymous && (
                            <div className="d-none d-lg-flex align-items-center px-3 py-1 bg-light border border-2 border-dark shadow-action-sm">
                                <div className="bg-warning border border-1 border-dark rounded-circle me-2" style={{ width: 10, height: 10 }}></div>
                                <span className="smallest fw-black text-dark ls-1 text-uppercase">Guest Mode</span>
                            </div>
                        )}

                        <div className="d-flex align-items-center gap-2">
                            <Link to="/login" className="btn btn-link text-decoration-none text-dark fw-black smallest ls-1 text-uppercase px-2 px-md-3 hover-yellow">
                                Login
                            </Link>

                            {/* REGISTER BUTTON - Neubrutal Game Style */}
                            <Link
                                to="/register"
                                className="btn btn-dark fw-black smallest ls-1 px-3 px-md-4 py-2 rounded-0 border border-3 border-dark shadow-action-sm text-uppercase hover-press"
                                style={{ backgroundColor: '#1a1a1a' }}
                            >
                                Join Free
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                nav {
                    font-family: 'Lexend', sans-serif;
                }

                @keyframes pulse-custom {
                    0% { opacity: 1; }
                    50% { opacity: 0.5; }
                    100% { opacity: 1; }
                }

                nav .bg-warning {
                    animation: pulse-custom 2s infinite ease-in-out;
                }
            `}</style>
        </nav>
    );
};

export default AuthNavbar;