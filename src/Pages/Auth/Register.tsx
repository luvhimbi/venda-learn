import React, { useState, type FormEvent, type ChangeEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { doc, setDoc, getDoc, type Firestore } from 'firebase/firestore';
import { createUserWithEmailAndPassword, signInWithPopup, signInAnonymously } from 'firebase/auth';
import { Loader2, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3';
import { auth, db, googleProvider } from '../../services/firebaseConfig';
import { useVisualJuice } from '../../hooks/useVisualJuice';

import Onboarding from './Onboarding';

const Register: React.FC = () => {
    const navigate = useNavigate();
    const { playClick, triggerHaptic } = useVisualJuice();
    const [searchParams] = useSearchParams();
    const referrerId = searchParams.get('ref');
    const skipIntro = searchParams.get('skipIntro') === 'true';

    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [step, setStep] = useState(skipIntro ? 1 : 0);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { executeRecaptcha } = useGoogleReCaptcha();

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError(null);

        if (step === 1) {
            if (!formData.username.trim()) { setError("Input your name, boss."); triggerHaptic('light'); return; }
            playClick();
            triggerHaptic('medium');
            setStep(2);
            return;
        }

        if (step === 2) {
            const emailRegex = /^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/;
            if (!emailRegex.test(formData.email)) { setError("That email doesn't look right."); return; }
            
            setLoading(true);
            try {
                const { findUserByEmail } = await import('../../services/authService');
                const existingProfile = await findUserByEmail(formData.email);
                
                if (existingProfile) {
                    setError("Email already exists.");
                    triggerHaptic('light');
                    setLoading(false);
                    return;
                }
                playClick();
                triggerHaptic('medium');
                setStep(3);
            } catch (err) {
                console.error("Email check error:", err);
                setError("Email already exists.");
            } finally {
                setLoading(false);
            }
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            setError("Passwords don't match!");
            return;
        }

        setLoading(true);

        if (!executeRecaptcha) {
            setError("reCAPTCHA isn't ready. Try again.");
            setLoading(false);
            return;
        }

        try {
            const token = await executeRecaptcha("register");
            if (!token) {
                setError("reCAPTCHA failed.");
                setLoading(false);
                return;
            }

            // --- ADDED: Check if profile exists by email in Firestore first ---
            const { findUserByEmail } = await import('../../services/authService');
            const existingProfile = await findUserByEmail(formData.email);
            
            if (existingProfile) {
                setError("Account already exists with this email. Sharp-sharp, just log in!");
                setLoading(false);
                return;
            }
            // ------------------------------------------------------------------

            const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
            await setDoc(doc(db as Firestore, "users", userCredential.user.uid), {
                username: formData.username,
                email: formData.email,
                points: 0,
                streak: 0,
                completedLessons: [],
                isNativeSpeaker: false,
                tourCompleted: false,
                createdAt: new Date().toISOString()
            });

            if (referrerId) {
                try {
                    await setDoc(doc(db as Firestore, "invites", `${referrerId}_${userCredential.user.uid}`), {
                        inviterId: referrerId,
                        inviteeId: userCredential.user.uid,
                        inviteeName: formData.username,
                        claimed: false,
                        createdAt: new Date().toISOString()
                    });
                } catch (err) {
                    console.error("Referral Error:", err);
                }
            }
            navigate('/');
        } catch (err: any) {
            setError(err.code === 'auth/email-already-in-use' ? "Email already exists." : "Registration failed.");
        } finally { setLoading(false); }
    };

    const handleGoogleSignIn = async () => {
        setError(null);
        setLoading(true);
        try {
            const result = await signInWithPopup(auth, googleProvider);
            const user = result.user;
            
            if (!user.email) {
                setError("Google didn't provide an email. Try regular registration.");
                return;
            }

            const userDoc = await getDoc(doc(db as Firestore, 'users', user.uid));

            if (!userDoc.exists()) {
                const { consolidateUserProfile } = await import('../../services/authService');
                const wasConsolidated = await consolidateUserProfile(user.uid, user.email);

                if (!wasConsolidated) {
                    await setDoc(doc(db as Firestore, 'users', user.uid), {
                        username: user.displayName || 'Learner',
                        email: user.email.toLowerCase(),
                        points: 0,
                        streak: 0,
                        completedLessons: [],
                        isNativeSpeaker: false,
                        tourCompleted: false,
                        createdAt: new Date().toISOString()
                    });
                }
            }
            navigate('/');
        } catch (err: any) {
            console.error("Google Sign-In Error:", err);
            setError("Google login failed.");
        } finally { setLoading(false); }
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

    // If step 0, show Onboarding
    if (step === 0) {
        return <Onboarding onComplete={() => setStep(1)} />;
    }

    return (
        <div className="min-vh-100 d-flex flex-column bg-theme-base font-auth position-relative overflow-hidden">
            {/* Background Pattern */}
            <div className="position-absolute inset-0" style={{ 
                backgroundImage: 'radial-gradient(var(--color-text) 1px, transparent 1px)', 
                backgroundSize: '32px 32px', 
                opacity: 0.05, 
                zIndex: 0 
            }}></div>

            {/* Header / Progress Fill */}
            <div className="w-100 py-3 px-3 d-flex align-items-center justify-content-center position-relative" style={{ zIndex: 10 }}>
                {step > 1 && (
                    <button 
                        onClick={() => {
                            playClick();
                            triggerHaptic('light');
                            setStep(step - 1);
                        }}
                        className="btn p-0 text-theme-main border-0 shadow-none hover-press me-3"
                        style={{ flexShrink: 0 }}
                    >
                        <ArrowLeft size={28} strokeWidth={2.5} />
                    </button>
                )}
                <div className="brutalist-card p-0" style={{ flexGrow: 1, maxWidth: '500px', height: '22px', backgroundColor: 'var(--color-surface-soft)' }}>
                    <div 
                        style={{ 
                            height: '100%', 
                            width: `${(step / 3) * 100}%`, 
                            backgroundColor: 'var(--venda-yellow)',
                            transition: 'width 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)'
                        }} 
                    />
                </div>
                {step > 1 && <div style={{ width: '28px', flexShrink: 0 }} className="ms-3 d-none d-md-block"></div>}
            </div>

            <div className="w-100 text-theme-main px-3 py-4 mx-auto" style={{ maxWidth: '440px', zIndex: 10 }}>

                <div className="text-center mb-4 mt-2">
                    <img src="/images/Logo.png" alt="Logo" style={{ height: '60px', objectFit: 'contain' }} />
                </div>

                <div className="text-center mb-4 mt-2">
                    <h2 className="fw-black text-uppercase ls-tight text-theme-main mb-2" style={{ fontSize: '1.6rem' }}>
                        {step === 1 ? "What's your name?" :
                         step === 2 ? `Thanks ${formData.username}, what's your email?` :
                         `Almost there ${formData.username}! Pick a password.`}
                    </h2>
                </div>

                {error && (
                    <div className="border border-4 border-theme-main p-3 mb-4 text-center fw-black text-uppercase shadow-action-sm"
                         style={{ backgroundColor: '#FFD1D1', color: '#000', fontSize: '12px' }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>

                    {step === 1 && (
                        <div className="mb-4">
                            <label className="form-label smallest fw-black text-uppercase ls-1">Your Name</label>
                            <div className="custom-input-group custom-input-group--brutalist">
                                <input name="username" type="text" className="fw-bold" placeholder="What should we call you?" value={formData.username} onChange={handleChange} required autoFocus disabled={loading} />
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="mb-4">
                            <label className="form-label smallest fw-black text-uppercase ls-1">Email Address</label>
                            <div className="custom-input-group custom-input-group--brutalist">
                                <input name="email" type="email" className="fw-bold" placeholder="vhadau@example.com" value={formData.email} onChange={handleChange} required autoFocus disabled={loading} />
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <>
                            <div className="mb-4">
                                <label className="form-label smallest fw-black text-uppercase ls-1">Create Password</label>
                                <div className="custom-input-group custom-input-group--brutalist position-relative d-flex align-items-center">
                                    <input name="password" type={showPassword ? "text" : "password"} className="fw-bold" placeholder="••••••••" value={formData.password} onChange={handleChange} required autoFocus disabled={loading} />
                                    <button type="button" className="btn border-0 p-0 text-theme-main me-3 position-absolute end-0" onClick={() => setShowPassword(!showPassword)} tabIndex={-1}>
                                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </button>
                                </div>
                            </div>
                            <div className="mb-4">
                                <label className="form-label smallest fw-black text-uppercase ls-1">Confirm Password</label>
                                <div className="custom-input-group custom-input-group--brutalist position-relative d-flex align-items-center">
                                    <input name="confirmPassword" type={showConfirmPassword ? "text" : "password"} className="fw-bold" placeholder="••••••••" value={formData.confirmPassword} onChange={handleChange} required disabled={loading} />
                                    <button type="button" className="btn border-0 p-0 text-theme-main me-3 position-absolute end-0" onClick={() => setShowConfirmPassword(!showConfirmPassword)} tabIndex={-1}>
                                        {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </button>
                                </div>
                            </div>
                        </>
                    )}

                    <button
                        type="submit"
                        className="btn w-100 fw-black py-3 mb-4 text-dark border border-4 border-theme-main rounded-0 shadow-action text-uppercase ls-1 hover-press"
                        style={{ backgroundColor: 'var(--venda-yellow)' }}
                        disabled={loading}
                    >
                        {loading ? <Loader2 className="animate-spin" size={20} /> : step === 3 ? 'Register Sharp-Sharp' : 'Continue'}
                    </button>
                </form>

                {step === 1 && (
                    <>
                        <div className="d-flex align-items-center my-4">
                            <div className="flex-grow-1 border-top border-4 border-theme-main"></div>
                            <span className="mx-3 text-theme-main smallest fw-black text-uppercase ls-1">OR</span>
                            <div className="flex-grow-1 border-top border-4 border-theme-main"></div>
                        </div>

                        <div className="row g-2 mb-4">
                            <div className="col-6">
                                <button
                                    onClick={handleGoogleSignIn}
                                    className="btn w-100 h-100 fw-black py-3 bg-theme-surface border border-4 border-theme-main rounded-0 shadow-action d-flex align-items-center justify-content-center text-uppercase smallest ls-1 hover-press text-theme-main"
                                    disabled={loading}
                                >
                                    <div className="d-flex align-items-center justify-content-center me-2" style={{ width: '20px', height: '20px' }}>
                                        <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                    </div>
                                    Google
                                </button>
                            </div>
                            <div className="col-6">
                                <button
                                    onClick={handleGuestSignIn}
                                    className="btn w-100 h-100 fw-black py-3 bg-theme-surface border border-4 border-theme-main rounded-0 shadow-action d-flex align-items-center justify-content-center text-uppercase smallest ls-1 hover-press text-theme-main"
                                    disabled={loading}
                                >
                                    <div className="d-flex align-items-center justify-content-center me-2" style={{ width: '20px', height: '20px' }}>
                                        <i className="bi bi-person-bounding-box fs-5 m-0 d-flex align-items-center" style={{ lineHeight: 1 }}></i>
                                    </div>
                                    Guest
                                </button>
                            </div>
                        </div>
                    </>
                )}

                <div className="text-center mt-5 mb-4">
                    <p className="fw-bold smallest text-uppercase text-theme-main mb-4">
                        Got an account? <Link to="/login" className="fw-black text-decoration-underline text-theme-main">Log In</Link>
                    </p>

                    <p className="text-theme-muted mx-auto" style={{ fontSize: '11px', maxWidth: '320px' }}>
                        This site is protected by reCAPTCHA and the Google <a href="https://policies.google.com/privacy" className="text-theme-muted text-decoration-underline" target="_blank" rel="noreferrer">Privacy Policy</a> and <a href="https://policies.google.com/terms" className="text-theme-muted text-decoration-underline" target="_blank" rel="noreferrer">Terms of Service</a> apply.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Register;