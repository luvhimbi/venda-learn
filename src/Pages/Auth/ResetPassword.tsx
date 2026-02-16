import React, { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {  MailCheck, Loader2 } from 'lucide-react';
import { auth } from '../../services/firebaseConfig';
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
            console.error("Reset Password Error:", err);
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
        <div className="min-vh-100 d-flex align-items-center justify-content-center bg-white px-3 py-5">
            <div className="w-100" style={{ maxWidth: '400px' }}>

                {/*<div className="text-center mb-4 animate__animated animate__fadeIn">*/}
                {/*    <h3 className="fw-bold ls-1 text-dark mb-1">VENDA LEARN</h3>*/}
                {/*    <p className="text-muted small">Kha vha hulelwa phaswidzi yavho hafha</p>*/}
                {/*</div>*/}

                {!submitted ? (
                    <div className="animate__animated animate__fadeIn">
                        <div className="mb-4 text-center">
                            <h4 className="fw-bold text-dark mb-2">Forgot Password?</h4>
                            <p className="text-muted small">Enter your email and we'll send you a recovery link.</p>
                        </div>

                        {error && (
                            <div className="alert border-0 py-3 small mb-4 text-center"
                                style={{ backgroundColor: '#FEF2F2', color: '#B91C1C', borderBottom: '2px solid #EF4444' }}>
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit}>
                            <div className="mb-4">
                                <label className="form-label small fw-bold text-uppercase text-muted ls-1">Email</label>
                                <div className="custom-input-group">
                                    <input
                                        type="email"
                                        className="form-control border-0 bg-transparent fs-6 px-0"
                                        placeholder="vhadau@example.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        disabled={loading}
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="btn w-100 fw-bold py-2.5 mb-3 game-btn-primary d-flex align-items-center justify-content-center"
                                disabled={loading}
                            >
                                {loading ? <Loader2 className="animate-spin me-2" size={18} /> : 'SEND RESET LINK'}
                            </button>
                        </form>
                    </div>
                ) : (
                    <div className="text-center animate__animated animate__zoomIn">
                        <div className="d-inline-flex align-items-center justify-content-center rounded-circle mb-4"
                            style={{ width: '60px', height: '60px', backgroundColor: '#F0FDF4' }}>
                            <MailCheck className="text-success" size={32} />
                        </div>
                        <h4 className="fw-bold mb-2">Check your Email</h4>
                        <p className="text-muted mb-4 small">
                            Instructions sent to:<br />
                            <strong className="text-dark">{email}</strong>
                        </p>
                        <button onClick={() => navigate('/login')} className="btn btn-dark w-100 py-2.5 fw-bold rounded-3 mb-3 shadow-sm">
                            BACK TO LOGIN
                        </button>
                        <p className="text-muted small">
                            Didn't receive it? <button onClick={() => setSubmitted(false)} className="btn btn-link p-0 text-decoration-none fw-bold small" style={{ color: '#111827' }}>Try again</button>
                        </p>
                    </div>
                )}

                <div className="text-center mt-4 border-top pt-3">
                    <Link to="/login" className="small fw-bold text-decoration-none" style={{ color: '#4B5563' }}>
                        &larr; Back to Sign In
                    </Link>
                </div>
            </div>

            <style>{`
                .ls-1 { letter-spacing: 1px; }
                .game-btn-primary { 
                    background-color: #FACC15 !important; 
                    color: #111827 !important; 
                    border: none !important; 
                    border-radius: 12px; 
                    box-shadow: 0 4px 0 #EAB308 !important; 
                    transition: all 0.2s; 
                }
                .game-btn-primary:active { transform: translateY(2px); box-shadow: 0 2px 0 #EAB308 !important; }
                
                .custom-input-group { 
                    border-bottom: 2px solid #F3F4F6; 
                    transition: 0.2s; 
                    background: transparent; 
                }
                .custom-input-group:focus-within { border-color: #FACC15; }
                .form-control:focus { background-color: transparent !important; box-shadow: none; outline: none; }
            `}</style>
        </div>
    );
};

export default ResetPassword;
