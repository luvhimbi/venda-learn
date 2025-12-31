import React, { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth } from '../services/firebaseConfig';
import { signInWithEmailAndPassword } from 'firebase/auth';

const Login: React.FC = () => {
    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const navigate = useNavigate();

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            await signInWithEmailAndPassword(auth, email, password);
            const redirectTo = localStorage.getItem('redirectUrl');
            if (redirectTo) {
                localStorage.removeItem('redirectUrl');
                navigate(redirectTo);
            } else {
                navigate('/');
            }
        } catch (err: any) {
            setError("Tshikwama tsha u dzhena tsho xela. (Login failed. Please check your details.)");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container-fluid p-0 overflow-hidden">
            <div className="row g-0 min-vh-100">

                {/* LEFT SIDE: BRANDING & WELCOME (Visible on md and up) */}
                <div className="col-lg-6 d-none d-lg-flex flex-column justify-content-center align-items-center bg-primary text-white p-5 position-relative">
                    <div className="position-absolute top-0 start-0 p-4">
                        <h4 className="fw-bold mb-0 ls-1">VENDA LEARN</h4>
                    </div>

                    <div className="text-center animate__animated animate__fadeInLeft">
                        <div className="display-1 mb-4">🇿🇦</div>
                        <h1 className="display-3 fw-bold mb-3">Ndaa & Aa!</h1>
                        <p className="fs-5 opacity-75 max-width-400">
                            Join thousands of warriors mastering the Tshivenda language and climbing the Muvhigo.
                        </p>
                    </div>

                    {/* Decorative element */}
                    <div className="position-absolute bottom-0 start-0 w-100 p-4 opacity-25 text-center">
                        <small>© 2025 Venda Learn • Built for the Community</small>
                    </div>
                </div>

                {/* RIGHT SIDE: LOGIN FORM */}
                <div className="col-lg-6 d-flex align-items-center justify-content-center bg-white">
                    <div className="w-100 p-4 p-md-5" style={{ maxWidth: '500px' }}>

                        <div className="mb-5 animate__animated animate__fadeInUp">
                            <h2 className="fw-bold text-dark h1">Vho Dzhena</h2>
                            <p className="text-muted">Sign in to continue your learning journey.</p>
                        </div>

                        {error && (
                            <div className="alert alert-danger border-0 shadow-sm py-3 small animate__animated animate__shakeX">
                                <strong>Ndaela:</strong> {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="animate__animated animate__fadeInUp animate__delay-1s">
                            <div className="mb-4">
                                <label className="form-label small fw-bold text-uppercase text-muted ls-1">Email Address</label>
                                <div className="input-group">
                                    <span className="input-group-text bg-light border-end-0">
                                        <i className="bi bi-envelope text-muted"></i>
                                    </span>
                                    <input
                                        type="email"
                                        className="form-control form-control-lg bg-light border-start-0 fs-6"
                                        placeholder="vhadau@example.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        disabled={loading}
                                    />
                                </div>
                            </div>

                            <div className="mb-4">
                                <div className="d-flex justify-content-between">
                                    <label className="form-label small fw-bold text-uppercase text-muted ls-1">Password</label>
                                    <Link to="/reset-password" name="reset" className="small text-decoration-none fw-bold text-primary">
                                        Forgot?
                                    </Link>
                                </div>
                                <div className="input-group">
                                    <span className="input-group-text bg-light border-end-0">
                                        <i className="bi bi-lock text-muted"></i>
                                    </span>
                                    <input
                                        type="password"
                                        className="form-control form-control-lg bg-light border-start-0 fs-6"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        disabled={loading}
                                    />
                                </div>
                            </div>

                            <div className="mb-4 d-flex align-items-center">
                                <input type="checkbox" className="form-check-input me-2" id="remember" />
                                <label htmlFor="remember" className="small text-muted mb-0">Remember me</label>
                            </div>

                            <button
                                type="submit"
                                className="btn btn-primary btn-lg w-100 fw-bold shadow-sm py-3 mb-4 transition-all hover-lift"
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm me-2"></span>
                                        U khou dzhena...
                                    </>
                                ) : 'SIGN IN'}
                            </button>
                        </form>

                        <div className="text-center pt-2">
                            <p className="text-muted">
                                New here? <Link to="/register" className="text-decoration-none fw-bold text-primary">Dzhenisani Dzina (Sign Up)</Link>
                            </p>
                        </div>
                    </div>
                </div>

            </div>

            <style>{`
                .ls-1 { letter-spacing: 1px; }
                .max-width-400 { max-width: 400px; margin: 0 auto; }
                .hover-lift:hover { transform: translateY(-2px); box-shadow: 0 10px 20px rgba(0,0,0,0.1) !important; }
                .form-control:focus { background-color: #fff !important; box-shadow: none; border-color: #0d6efd; }
                .input-group-text { border-color: #dee2e6; }
            `}</style>
        </div>
    );
};

export default Login;