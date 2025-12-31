import React, { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { auth } from '../services/firebaseConfig';
import { sendPasswordResetEmail } from 'firebase/auth';

const ResetPassword: React.FC = () => {
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
        <div className="container-fluid p-0 overflow-hidden">
            <div className="row g-0 min-vh-100">

                {/* LEFT SIDE: BRANDING (Yellow/Warning Theme for Recovery) */}
                <div className="col-lg-6 d-none d-lg-flex flex-column justify-content-center align-items-center bg-warning text-dark p-5 position-relative">
                    <div className="position-absolute top-0 start-0 p-4">
                        <h4 className="fw-bold mb-0 ls-1">VENDA LEARN</h4>
                    </div>

                    <div className="text-center animate__animated animate__fadeInLeft">
                        <div className="display-1 mb-4">🔑</div>
                        <h1 className="display-3 fw-bold mb-3">U vusulusa</h1>
                        <p className="fs-5 opacity-75 max-width-400">
                            Don't worry, even the strongest warriors forget their way sometimes. Let's get you back into the arena.
                        </p>
                    </div>

                    <div className="position-absolute bottom-0 start-0 w-100 p-4 opacity-25 text-center">
                        <small>© 2025 Venda Learn • Tsireledzo ya mitaladzi</small>
                    </div>
                </div>

                {/* RIGHT SIDE: RESET FORM */}
                <div className="col-lg-6 d-flex align-items-center justify-content-center bg-white">
                    <div className="w-100 p-4 p-md-5" style={{ maxWidth: '500px' }}>

                        {!submitted ? (
                            <div className="animate__animated animate__fadeInRight">
                                <div className="mb-5">
                                    <h2 className="fw-bold text-dark h1">Forgot Password?</h2>
                                    <p className="text-muted">Enter the email associated with your account to receive a reset link.</p>
                                </div>

                                {error && (
                                    <div className="alert alert-danger border-0 shadow-sm py-3 small mb-4">
                                        {error}
                                    </div>
                                )}

                                <form onSubmit={handleSubmit}>
                                    <div className="mb-4">
                                        <label className="form-label small fw-bold text-uppercase text-muted ls-1">Email Address</label>
                                        <input
                                            type="email"
                                            className="form-control form-control-lg bg-light border-0 fs-6"
                                            placeholder="vhadau@example.com"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                            disabled={loading}
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        className="btn btn-warning btn-lg w-100 fw-bold shadow-sm py-3 mb-4 transition-all hover-lift"
                                        disabled={loading}
                                    >
                                        {loading ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm me-2"></span>
                                                U romba...
                                            </>
                                        ) : 'SEND RESET LINK'}
                                    </button>
                                </form>
                            </div>
                        ) : (
                            <div className="text-center animate__animated animate__zoomIn">
                                <div className="display-4 mb-4">📩</div>
                                <h2 className="fw-bold mb-3">Check your Email</h2>
                                <p className="text-muted mb-5">
                                    We have sent password recovery instructions to <br/>
                                    <strong>{email}</strong>
                                </p>
                                <Link to="/login" className="btn btn-primary btn-lg w-100 py-3 fw-bold shadow-sm">
                                    BACK TO LOGIN
                                </Link>
                                <button
                                    onClick={() => setSubmitted(false)}
                                    className="btn btn-link mt-3 text-decoration-none text-muted small"
                                >
                                    Didn't receive the email? Try again
                                </button>
                            </div>
                        )}

                        <div className="text-center mt-4">
                            <Link to="/login" className="text-decoration-none small fw-bold text-muted">
                                ← CANCEL AND GO BACK
                            </Link>
                        </div>
                    </div>
                </div>

            </div>

            <style>{`
                .ls-1 { letter-spacing: 1px; }
                .max-width-400 { max-width: 400px; margin: 0 auto; }
                .hover-lift:hover { transform: translateY(-2px); box-shadow: 0 10px 20px rgba(0,0,0,0.1) !important; }
                .form-control:focus { background-color: #fff !important; box-shadow: none; border: 1px solid #ffc107; }
                .bg-warning { background-color: #ffc107 !important; }
            `}</style>
        </div>
    );
};

export default ResetPassword;