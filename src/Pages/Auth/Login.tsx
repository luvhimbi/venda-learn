import React, { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { doc, getDoc, setDoc, type Firestore } from 'firebase/firestore';
import { signInAnonymously, signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { auth, db, googleProvider } from '../../services/firebaseConfig';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3';


const Login: React.FC = () => {
    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [showPassword, setShowPassword] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const { executeRecaptcha } = useGoogleReCaptcha();

    const navigate = useNavigate();

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        if (!executeRecaptcha) {
            setError("Eish! reCAPTCHA isn't ready. Try again, chommie.");
            setLoading(false);
            return;
        }

        try {
            const token = await executeRecaptcha("login");
            if (!token) {
                setError("reCAPTCHA verification failed.");
                setLoading(false);
                return;
            }

            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const uid = userCredential.user.uid;

            const userDoc = await getDoc(doc(db as Firestore, 'users', uid));
            if (!userDoc.exists()) {
                await setDoc(doc(db as Firestore, 'users', uid), {
                    username: userCredential.user.displayName || email.split('@')[0],
                    email: email,
                    points: 0,
                    streak: 0,
                    completedLessons: [],
                    isNativeSpeaker: false,
                    tourCompleted: false,
                    createdAt: new Date().toISOString()
                });
            }

            const userData = userDoc.exists() ? userDoc.data() : { role: 'user' };
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
            console.error("Login Error:", err);
            setError(err.code === 'auth/user-not-found' ? "Account not found. Maybe register?" : "Login failed. Check your details and try again.");
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
            const userDoc = await getDoc(doc(db as Firestore, 'users', user.uid));

            if (!userDoc.exists()) {
                await setDoc(doc(db as Firestore, 'users', user.uid), {
                    username: user.displayName || 'Learner',
                    email: user.email,
                    points: 0,
                    streak: 0,
                    completedLessons: [],
                    isNativeSpeaker: false,
                    tourCompleted: false,
                    createdAt: new Date().toISOString()
                });
            }

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
            setError("Google login failed. Try again, boet.");
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
            setError("Couldn't jump in. Try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-vh-100 d-flex align-items-center justify-content-center bg-theme-base px-3 py-5" style={{ fontFamily: '"Lexend", sans-serif' }}>
            <div className="w-100 text-theme-main" style={{ maxWidth: '440px' }}>


                <div className="text-center mb-5 mt-4">
                    <h2 className="display-5 fw-black text-uppercase ls-tight text-theme-main mb-2">Aweh! Back Again?</h2>
                    <p className="fw-bold text-theme-muted mb-0 small text-uppercase">Log in to keep your streak burning bright!</p>
                </div>

                {error && (
                    <div className="border border-4 border-theme-main p-3 mb-4 text-center fw-black text-uppercase shadow-action-sm"
                         style={{ backgroundColor: '#FFD1D1', color: '#000', fontSize: '12px' }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="form-label smallest fw-black text-uppercase ls-1">Email</label>
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

                    <div className="mb-4">
                        <div className="d-flex justify-content-between align-items-end">
                            <label className="form-label smallest fw-black text-uppercase ls-1">Password</label>
                            <Link to="/reset-password" intrinsic-name="reset" className="smallest text-decoration-none fw-black text-uppercase mb-2 text-theme-main">
                                Forgot?
                            </Link>
                        </div>
                        <div className="custom-input-group custom-input-group--brutalist position-relative d-flex align-items-center">
                            <input
                                type={showPassword ? "text" : "password"}
                                className="fw-bold"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                disabled={loading}
                            />
                            <button
                                type="button"
                                className="btn border-0 p-0 text-theme-main me-3 shadow-none position-absolute end-0"
                                onClick={() => setShowPassword(!showPassword)}
                                tabIndex={-1}
                            >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="btn w-100 fw-black py-3 mb-4 text-dark border border-4 border-theme-main rounded-0 shadow-action text-uppercase ls-1 hover-press"
                        style={{ backgroundColor: 'var(--venda-yellow)' }}
                        disabled={loading}
                    >
                        {loading ? <Loader2 className="animate-spin" size={20} /> : 'Login Sharp-Sharp'}
                    </button>
                </form>

                <div className="d-flex align-items-center my-4">
                    <div className="flex-grow-1 border-top border-4 border-theme-main"></div>
                    <span className="mx-3 text-theme-main smallest fw-black text-uppercase ls-1">OR USE</span>
                    <div className="flex-grow-1 border-top border-4 border-theme-main"></div>
                </div>

                <div className="d-grid gap-3">
                    <button
                        onClick={handleGoogleSignIn}
                        className="btn w-100 fw-black py-3 bg-theme-surface border border-4 border-theme-main rounded-0 shadow-action d-flex align-items-center justify-content-center text-uppercase smallest ls-1 hover-press text-theme-main"
                        disabled={loading}
                    >
                        <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="me-2" style={{ width: '20px' }} />
                        Google Sign-In
                    </button>

                    <button
                        onClick={handleGuestSignIn}
                        className="btn w-100 fw-black py-3 bg-theme-surface border border-4 border-theme-main rounded-0 shadow-action d-flex align-items-center justify-content-center text-uppercase smallest ls-1 hover-press text-theme-main"
                        disabled={loading}
                    >
                        <i className="bi bi-person-bounding-box fs-5 me-2"></i>
                        Explore as Guest
                    </button>
                </div>

                <div className="text-center mt-5">
                    <p className="fw-bold smallest text-uppercase text-theme-main">
                        New crew? <Link to="/register" className="fw-black text-decoration-underline text-theme-main">Create an Account</Link>
                    </p>
                </div>
            </div>


        </div>
    );
};

export default Login;