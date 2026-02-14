import React, { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth, db } from '../services/firebaseConfig'; // Ensure db is exported from your config
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { updateStreak } from '../services/streakUtils';

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
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const uid = userCredential.user.uid;

            // 1. Update user streak
            await updateStreak(uid);

            // 2. Check Admin Status (Assuming you store roles in Firestore 'users' collection)
            const userDoc = await getDoc(doc(db, 'users', uid));
            const userData = userDoc.data();
            const isAdmin = userData?.role === 'admin';

            // 3. Handle Redirection
            if (isAdmin) {
                navigate('/admin/dashboard');
            } else {
                const redirectTo = localStorage.getItem('redirectUrl');
                if (redirectTo) {
                    localStorage.removeItem('redirectUrl');
                    navigate(redirectTo);
                } else {
                    navigate('/');
                }
            }
        } catch (err: any) {
            setError("Zi do do mbedzwa zwavho asi zone avha dovhe hafhu.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-vh-100 d-flex align-items-center justify-content-center bg-white px-3 py-5">
            <div className="w-100" style={{ maxWidth: '400px' }}>

                <div className="text-center mb-5 animate__animated animate__fadeIn">
                    <div className="d-inline-flex align-items-center justify-content-center rounded-3 mb-3"
                         style={{ width: '56px', height: '56px', backgroundColor: '#FACC15' }}>
                        <span className="fw-bold fs-2 text-dark">V</span>
                    </div>
                    <h2 className="fw-bold ls-1 text-dark mb-1">VENDA LEARN</h2>
                    <p className="text-muted small">VhoTanganedzwa kha Platform yashu<br/> Kha vha pange zidodombedzwa zwavho </p>
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
                                className="form-control form-control-lg border-0 bg-transparent fs-6 px-0"
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
                            <Link to="/reset-password" intrinsic-name="reset" className="small text-decoration-none fw-bold" style={{ color: '#111827' }}>
                                Forgot?
                            </Link>
                        </div>
                        <div className="custom-input-group">
                            <input
                                type="password"
                                className="form-control form-control-lg border-0 bg-transparent fs-6 px-0"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                disabled={loading}
                            />
                        </div>
                    </div>

                    <button type="submit" className="btn btn-lg w-100 fw-bold py-3 mb-4 game-btn-primary" disabled={loading}>
                        {loading ? <span className="spinner-border spinner-border-sm me-2"></span> : 'SIGN IN'}
                    </button>
                </form>

                <div className="text-center mt-3">
                    <p className="text-muted small mb-3">New here?</p>
                    <Link to="/register" className="btn btn-outline-dark w-100 fw-bold py-2 rounded-3 btn-signup-action">
                        CREATE ACCOUNT
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
                
                .btn-signup-action {
                    border: 2px solid #111827;
                    font-size: 0.85rem;
                    letter-spacing: 0.5px;
                }
                .btn-signup-action:hover {
                    background-color: #111827;
                    color: #fff;
                }
            `}</style>
        </div>
    );
};

export default Login;