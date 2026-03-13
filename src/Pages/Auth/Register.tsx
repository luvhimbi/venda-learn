import React, { useState, type FormEvent, type ChangeEvent } from 'react';
import { Loader2 } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { createUserWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db, googleProvider } from '../../services/firebaseConfig';
import ReCAPTCHA from 'react-google-recaptcha';

// Best-effort welcome email — never blocks registration
const sendWelcomeEmail = async (email: string, username: string) => {
    try {
        await fetch('/api/send-welcome-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, username }),
        });
    } catch (err) {
        console.error('Welcome email failed (non-blocking):', err);
    }
};

const Register: React.FC = () => {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [captchaValue, setCaptchaValue] = useState<string | null>(null);
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const referrerId = searchParams.get('ref');

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError(null);
        if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match!");
            return;
        }
        setLoading(true);
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
            await setDoc(doc(db, "users", userCredential.user.uid), {
                username: formData.username,
                email: formData.email,
                points: 0,
                level: 1,
                streak: 0,
                completedLessons: [],
                isNativeSpeaker: false,
                tourCompleted: false,
                createdAt: new Date().toISOString()
            });
            // Send welcome email (best-effort, non-blocking)
            sendWelcomeEmail(formData.email, formData.username);
            if (referrerId) {
                try {
                    await setDoc(doc(db, "invites", `${referrerId}_${userCredential.user.uid}`), {
                        inviterId: referrerId,
                        inviteeId: userCredential.user.uid,
                        inviteeName: formData.username,
                        claimed: false,
                        createdAt: new Date().toISOString()
                    });
                } catch (err) {
                    console.error("Referral failed:", err);
                }
            }
            navigate('/');
        } catch (err: any) {
            setError(err.code === 'auth/email-already-in-use' ? "This email is already in use." : err.message);
        } finally { setLoading(false); }
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
                    tourCompleted: false,
                    createdAt: new Date().toISOString()
                });

                // Send welcome email for new Google users (best-effort)
                sendWelcomeEmail(user.email || '', user.displayName || 'Learner');
            }

            // No referral handling for Google Sign-In for now to keep it simple,
            // but we could add it if result.user is new.

            navigate('/');
        } catch (err: any) {
            console.error("Google Sign-In Error:", err);
            setError("Google sign-in failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-vh-100 d-flex align-items-center justify-content-center bg-white px-3 py-5">
            <div className="w-100" style={{ maxWidth: '450px' }}>

                <div className="text-center mb-4 animate__animated animate__fadeInDown">
                    <h2 className="fw-bold ls-tight text-dark mb-2">Start Your Journey</h2>
                    <p className="text-muted mb-0">Create an account to track your progress and earn rewards!</p>
                </div>

                {error && (
                    <div className="alert border-0 py-3 small mb-4 text-center"
                        style={{ backgroundColor: '#FEF2F2', color: '#B91C1C', borderBottom: '2px solid #EF4444' }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="mb-2">
                        <label className="form-label smallest fw-bold text-uppercase text-muted ls-1">Full Name</label>
                        <div className="custom-input-group">
                            <input name="username" type="text" className="form-control border-0 bg-transparent fs-6 px-0" placeholder="John Doe" onChange={handleChange} required disabled={loading} />
                        </div>
                    </div>
                    <div className="mb-2">
                        <label className="form-label smallest fw-bold text-uppercase text-muted ls-1">Email</label>
                        <div className="custom-input-group">
                            <input name="email" type="email" className="form-control border-0 bg-transparent fs-6 px-0" placeholder="vhadau@example.com" onChange={handleChange} required disabled={loading} />
                        </div>
                    </div>
                    <div className="row mb-2">
                        <div className="col-md-6 mb-2 mb-md-0">
                            <label className="form-label smallest fw-bold text-uppercase text-muted ls-1">Password</label>
                            <div className="custom-input-group">
                                <input name="password" type="password" className="form-control border-0 bg-transparent fs-6 px-0" placeholder="••••••••" onChange={handleChange} required disabled={loading} />
                            </div>
                        </div>
                        <div className="col-md-6">
                            <label className="form-label smallest fw-bold text-uppercase text-muted ls-1">Confirm</label>
                            <div className="custom-input-group">
                                <input name="confirmPassword" type="password" className="form-control border-0 bg-transparent fs-6 px-0" placeholder="••••••••" onChange={handleChange} required disabled={loading} />
                            </div>
                        </div>
                    </div>

                    <div className="mb-4 d-flex justify-content-center">
                        <ReCAPTCHA
                            sitekey="6LeKx2ssAAAAAHk2f6trCWqsFxx7OkbceJFsGsFW" // Test key
                            onChange={(value) => setCaptchaValue(value)}
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn w-100 fw-bold py-2.5 mb-2 game-btn-primary d-flex align-items-center justify-content-center"
                        disabled={loading || !captchaValue}
                    >
                        {loading ? <Loader2 className="animate-spin me-2" size={18} /> : 'CREATE ACCOUNT'}
                    </button>
                </form>

                <div className="d-flex align-items-center my-3">
                    <hr className="flex-grow-1" />
                    <span className="mx-3 text-muted smallest fw-bold text-uppercase ls-1" style={{ fontSize: '10px' }}>Or</span>
                    <hr className="flex-grow-1" />
                </div>

                <button
                    onClick={handleGoogleSignIn}
                    className="btn w-100 fw-bold py-2.5 mb-3 btn-outline-dark d-flex align-items-center justify-content-center border-2"
                    style={{ borderRadius: '12px' }}
                    disabled={loading}
                >
                    <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="me-2" style={{ width: '18px' }} />
                    CONTINUE WITH GOOGLE
                </button>

                <div className="text-center mt-4">
                    <p className="text-muted small">
                        Already have an account? <Link to="/login" className="fw-bold text-decoration-none" style={{ color: '#111827' }}>Log In</Link>
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
                }
                .custom-input-group:focus-within { border-color: #FACC15; }
                .form-control:focus { background-color: transparent !important; box-shadow: none; outline: none; }
                
                .form-control:focus { background-color: transparent !important; box-shadow: none; outline: none; }
            `}</style>
        </div>
    );
};

export default Register;


