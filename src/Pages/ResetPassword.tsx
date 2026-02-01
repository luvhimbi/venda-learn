import React, { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth } from '../services/firebaseConfig';
import { sendPasswordResetEmail } from 'firebase/auth';

const ResetPassword: React.FC = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);
    const [submitted, setSubmitted] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            await sendPasswordResetEmail(auth, email);
            setSubmitted(true);
        } catch (err: any) {
            if (err.code === 'auth/user-not-found') {
                setError("Imeili iyi a i athu u ṅwaliswa. (Email not found.)");
            } else {
                setError("Hu na vhuthada. (An error occurred. Please try again.)");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container-fluid bg-white min-vh-100 d-flex align-items-center justify-content-center py-5">
            <div className="w-100 p-4" style={{ maxWidth: '450px' }}>

                {/* CENTERED LOGO SECTION */}
                <div className="text-center mb-5">
                    <div className="d-inline-flex align-items-center justify-content-center rounded-4 mb-3"
                         style={{ width: '64px', height: '64px', backgroundColor: '#FACC15', boxShadow: '0 4px 12px rgba(250, 204, 21, 0.2)' }}>
                        <span className="fw-bold fs-2 text-dark">V</span>
                    </div>
                    <h2 className="fw-bold text-dark ls-tight mb-1">VENDA<span style={{ color: '#FACC15' }}>LEARN</span></h2>
                    <p className="shumela-venda-pulse fw-bold ls-2 text-uppercase smallest">Shumela Venda</p>
                </div>

                {!submitted ? (
                    <div className="animate__animated animate__fadeIn">
                        <div className="mb-4 text-center">
                            <h3 className="fw-bold text-dark ls-tight mb-2">Forgot Password?</h3>
                            <p className="text-muted small ls-1">Enter your email and we'll send you a recovery link.</p>
                        </div>

                        {error && (
                            <div className="alert alert-danger border-0 rounded-4 small mb-4 py-3 fw-bold ls-1 text-center"
                                 style={{ backgroundColor: '#FEF2F2', color: '#DC2626' }}>
                                <i className="bi bi-exclamation-circle me-2"></i> {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit}>
                            <div className="mb-4">
                                <label className="smallest fw-bold text-uppercase text-muted ls-2 mb-2 d-block">Email Address</label>
                                <div className="position-relative">
                                    <i className="bi bi-envelope position-absolute top-50 start-0 translate-middle-y ms-3 text-muted"></i>
                                    <input
                                        type="email"
                                        className="form-control form-control-lg border rounded-4 fs-6 ps-5 py-3 shadow-none"
                                        placeholder="vhadau@example.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        disabled={loading}
                                        style={{ backgroundColor: '#F9FAFB' }}
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="btn game-btn-primary btn-lg w-100 fw-bold py-3 mb-4 ls-1 shadow-none"
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm me-2"></span>
                                        U ROMBA...
                                    </>
                                ) : 'SEND RESET LINK'}
                            </button>
                        </form>
                    </div>
                ) : (
                    <div className="text-center animate__animated animate__zoomIn">
                        <div className="d-inline-flex align-items-center justify-content-center rounded-circle mb-4"
                             style={{ width: '70px', height: '70px', backgroundColor: '#F0FDF4' }}>
                            <i className="bi bi-envelope-check text-success display-6"></i>
                        </div>
                        <h3 className="fw-bold mb-2 ls-tight">Check your Email</h3>
                        <p className="text-muted mb-4 small ls-1">
                            Instructions sent to:<br/>
                            <strong className="text-dark">{email}</strong>
                        </p>
                        <button onClick={() => navigate('/login')} className="btn btn-dark btn-lg w-100 py-3 fw-bold rounded-4 mb-3 ls-1 shadow-none">
                            BACK TO LOGIN
                        </button>
                        <button
                            onClick={() => setSubmitted(false)}
                            className="btn btn-link text-decoration-none text-muted smallest fw-bold ls-1 uppercase shadow-none"
                        >
                            Didn't receive it? Try again
                        </button>
                    </div>
                )}

                <div className="text-center mt-4">
                    <Link to="/login" className="text-decoration-none smallest fw-bold text-muted ls-2 uppercase hover-yellow">
                        ← Back to Sign In
                    </Link>
                </div>
            </div>

            <style>{`
                .ls-tight { letter-spacing: -1px; }
                .ls-1 { letter-spacing: 0.5px; }
                .ls-2 { letter-spacing: 2px; }
                .smallest { font-size: 10px; }
                .uppercase { text-transform: uppercase; }
                
                .form-control:focus { 
                    background-color: #fff !important; 
                    border-color: #FACC15 !important; 
                }

                .game-btn-primary { 
                    background-color: #FACC15 !important; 
                    color: #111827 !important; 
                    border: none !important; 
                    border-radius: 12px; 
                    box-shadow: 0 4px 0 #EAB308 !important; 
                }
                .game-btn-primary:active { 
                    transform: translateY(2px); 
                    box-shadow: 0 2px 0 #EAB308 !important; 
                }

                .shumela-venda-pulse {
                    color: #9CA3AF;
                    animation: pulseVenda 3s infinite ease-in-out;
                }

                @keyframes pulseVenda {
                    0% { opacity: 0.6; }
                    50% { opacity: 1; color: #FACC15; }
                    100% { opacity: 0.6; }
                }

                .hover-yellow:hover { color: #FACC15 !important; }
            `}</style>
        </div>
    );
};

export default ResetPassword;