import React, { useState, type FormEvent } from 'react';
import { Loader2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { signInAnonymously, signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, googleProvider } from '../../services/firebaseConfig';
import { updateStreak } from '../../services/streakUtils';

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
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        setError(null);
        setLoading(true);
        try {
            const result = await signInWithPopup(auth, googleProvider);
            const user = result.user;

            // 1. Check if user exists in Firestore
            const userDoc = await getDoc(doc(db, 'users', user.uid));

            if (!userDoc.exists()) {
                // Create user profile for new Google users
                await setDoc(doc(db, 'users', user.uid), {
                    username: user.displayName || 'Learner',
                    email: user.email,
                    points: 0,
                    level: 1,
                    streak: 0,
                    completedLessons: [],
                    isNativeSpeaker: false,
                    nativeVerificationStatus: 'none',
                    nativeSpeakerBio: "",
                    tourCompleted: false,
                    createdAt: new Date().toISOString()
                });
            }

            // 2. Update streak
            await updateStreak(user.uid);

            // 3. Handle Redirection
            const userData = !userDoc.exists() ? null : userDoc.data();
            const isAdmin = userData?.role === 'admin';

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
            console.error("Google Sign-In Error:", err);
            setError("Tshivhumbeo tsha Google tsho kundwa. Kha vha dovhe hafhu.");
        } finally {
            setLoading(false);
        }
    };

    const handleGuestSignIn = async () => {
        setError(null);
        setLoading(true);
        try {
            await signInAnonymously(auth);
            navigate('/');
        } catch (err: any) {
            console.error("Guest Sign-In Error:", err);
            setError("Tsho kundwa u dzhena sa mueni. Kha vha dovhe hafhu.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-vh-100 d-flex align-items-center justify-content-center bg-white px-3 py-5">
            <div className="w-100" style={{ maxWidth: '400px' }}>

                <div className="text-center mb-4 animate__animated animate__fadeIn">
                    <h3 className="fw-bold ls-1 text-dark mb-1">SIGN IN</h3>
                </div>

                {error && (
                    <div className="alert border-0 py-3 small mb-4 text-center"
                        style={{ backgroundColor: '#FEF2F2', color: '#B91C1C', borderBottom: '2px solid #EF4444' }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="mb-3">
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

                    <div className="mb-3">
                        <div className="d-flex justify-content-between">
                            <label className="form-label small fw-bold text-uppercase text-muted ls-1">Password</label>
                            <Link to="/reset-password" intrinsic-name="reset" className="small text-decoration-none fw-bold" style={{ color: '#111827' }}>
                                Forgot?
                            </Link>
                        </div>
                        <div className="custom-input-group">
                            <input
                                type="password"
                                className="form-control border-0 bg-transparent fs-6 px-0"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                disabled={loading}
                            />
                        </div>
                    </div>

                    <button type="submit" className="btn w-100 fw-bold py-2.5 mb-2 game-btn-primary d-flex align-items-center justify-content-center" disabled={loading}>
                        {loading ? <Loader2 className="animate-spin me-2" size={18} /> : 'SIGN IN'}
                    </button>
                </form>

                <div className="d-flex align-items-center my-3">
                    <hr className="flex-grow-1" />
                    <span className="mx-3 text-muted smallest fw-bold text-uppercase ls-1" style={{ fontSize: '10px' }}>Or use</span>
                    <hr className="flex-grow-1" />
                </div>

                <div className="d-grid gap-2">
                    <button
                        onClick={handleGoogleSignIn}
                        className="btn w-100 fw-bold py-2.5 btn-outline-dark d-flex align-items-center justify-content-center border-2 shadow-none"
                        style={{ borderRadius: '12px' }}
                        disabled={loading}
                    >
                        <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="me-2" style={{ width: '18px' }} />
                        CONTINUE WITH GOOGLE
                    </button>

                    <button
                        onClick={handleGuestSignIn}
                        className="btn w-100 fw-bold py-2.5 btn-outline-secondary d-flex align-items-center justify-content-center border-2 shadow-none text-uppercase ls-1"
                        style={{ borderRadius: '12px', fontSize: '13px' }}
                        disabled={loading}
                    >
                        <i className="bi bi-person-bounding-box me-2"></i>
                        Continue as Guest
                    </button>
                </div>

                <div className="text-center mt-4">
                    <p className="text-muted small">
                        New here? <Link to="/register" className="fw-bold text-decoration-none" style={{ color: '#111827' }}>Create an Account</Link>
                    </p>
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
                
                .form-control:focus { background-color: transparent !important; box-shadow: none; outline: none; }
            `}</style>
        </div>
    );
};

export default Login;


