import React, { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MailCheck, Loader2, ArrowLeft } from 'lucide-react';
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
        <div className="min-vh-100 d-flex align-items-center justify-content-center bg-theme-base px-3 py-5" style={{ fontFamily: '"Lexend", sans-serif' }}>
            <div className="w-100 text-theme-main" style={{ maxWidth: '440px' }}>


                {!submitted ? (
                    <div className="mt-4">
                        <div className="text-center mb-5">
                            <h2 className="display-6 fw-black text-uppercase ls-tight text-theme-main mb-2">Forgot Password?</h2>
                            <p className="fw-bold text-theme-muted mb-0 small text-uppercase">Kha vha hulelwa phaswidzi yavho hafha</p>
                        </div>

                        {error && (
                            <div className="border border-4 border-theme-main p-3 mb-4 text-center fw-black text-uppercase shadow-action-sm"
                                 style={{ backgroundColor: '#FFD1D1', color: '#000', fontSize: '12px' }}>
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit}>
                            <div className="mb-4">
                                <label className="form-label smallest fw-black text-uppercase ls-1">Email Address</label>
                                <div className="custom-input-group custom-input-group--brutalist">
                                    <input
                                        type="email"
                                        className="fw-bold"
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
                                className="btn w-100 fw-black py-3 mb-4 text-dark border border-4 border-theme-main rounded-0 shadow-action text-uppercase ls-1 hover-press"
                                style={{ backgroundColor: 'var(--venda-yellow)' }}
                                disabled={loading}
                            >
                                {loading ? <Loader2 className="animate-spin" size={20} /> : 'Send Reset Link'}
                            </button>
                        </form>
                    </div>
                ) : (
                    <div className="text-center mt-4">
                        <div className="d-inline-flex align-items-center justify-content-center border border-4 border-theme-main mb-4 bg-theme-surface shadow-action-sm"
                             style={{ width: '80px', height: '80px' }}>
                            <MailCheck className="text-theme-main" size={40} />
                        </div>
                        <h2 className="display-6 fw-black text-uppercase ls-tight text-theme-main mb-3">Check Email</h2>
                        <p className="fw-bold text-theme-muted mb-4 small text-uppercase">
                            Instructions sent to:<br />
                            <span className="text-theme-main fw-black">{email}</span>
                        </p>

                        <button
                            onClick={() => navigate('/login')}
                            className="btn btn-dark w-100 py-3 fw-black rounded-0 mb-3 shadow-action text-uppercase ls-1 hover-press"
                        >
                            Back to Login
                        </button>

                        <button
                            onClick={() => setSubmitted(false)}
                            className="btn btn-link p-0 text-decoration-underline fw-black text-theme-main text-uppercase smallest ls-1"
                        >
                            Try another email?
                        </button>
                    </div>
                )}

                <div className="text-center mt-5 pt-3 border-top border-4 border-theme-main">
                    <Link to="/login" className="smallest fw-black text-uppercase text-decoration-none text-theme-main ls-1 d-flex align-items-center justify-content-center">
                        <ArrowLeft size={16} className="me-2" /> Back to Sign In
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;