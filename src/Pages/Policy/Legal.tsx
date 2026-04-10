import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, ChevronRight, ArrowLeft } from 'lucide-react';

const Legal: React.FC = () => {
    const policies = [
        { label: 'Privacy Policy', path: '/privacy', desc: 'How we handle and protect your data' },
        { label: 'Terms of Use', path: '/terms', desc: 'Rules and guidelines for using our platform' },
        { label: 'DMCA Policy', path: '/dmca', desc: 'Intellectual property and copyright information' },
        { label: 'POPI Act', path: '/popiact', desc: 'Protection of Personal Information compliance' }
    ];

    return (
        <div className="min-vh-100 bg-light py-5 px-4">
            <div className="container" style={{ maxWidth: '600px' }}>
                <Link to="/profile" className="d-inline-flex align-items-center gap-2 text-decoration-none text-muted mb-4 hover-primary transition-all">
                    <ArrowLeft size={20} />
                    <span className="fw-bold small ls-1 uppercase">Back to Profile</span>
                </Link>

                <div className="text-center mb-5">
                    <div className="bg-primary bg-opacity-10 d-inline-flex p-3 rounded-circle text-primary mb-3">
                        <Shield size={40} />
                    </div>
                    <h1 className="fw-bold text-dark mb-2">Legal & Policies</h1>
                    <p className="text-muted">Important documents regarding your use of Chommie Language Companion</p>
                </div>

                <div className="d-flex flex-column gap-3">
                    {policies.map((policy, idx) => (
                        <Link 
                            key={idx} 
                            to={policy.path} 
                            className="card border-0 shadow-sm rounded-4 p-4 text-decoration-none hover-up transition-all bg-white"
                        >
                            <div className="d-flex align-items-center justify-content-between">
                                <div>
                                    <h5 className="fw-bold mb-1 text-dark">{policy.label}</h5>
                                    <p className="smallest text-muted mb-0">{policy.desc}</p>
                                </div>
                                <div className="bg-light p-2 rounded-3 text-muted">
                                    <ChevronRight size={20} />
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>

                <div className="mt-5 text-center">
                    <p className="smallest text-muted opacity-50 uppercase ls-2">© {new Date().getFullYear()} CHOMMIE LANGUAGE COMPANION. ALL RIGHTS RESERVED.</p>
                </div>
            </div>

            <style>{`
                .hover-up:hover { transform: translateY(-5px); box-shadow: 0 10px 20px rgba(0,0,0,0.05) !important; }
                .hover-primary:hover { color: #FACC15 !important; }
                .transition-all { transition: all 0.3s ease; }
                .ls-1 { letter-spacing: 1px; }
                .ls-2 { letter-spacing: 2px; }
                .smallest { font-size: 11px; }
                .uppercase { text-transform: uppercase; }
            `}</style>
        </div>
    );
};

export default Legal;
