import React, { useState, type FormEvent, type ChangeEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { doc, setDoc, getDoc, type Firestore } from 'firebase/firestore';
import { createUserWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { Loader2, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3';
import { auth, db, googleProvider } from '../../services/firebaseConfig';
import BaobabAuthHeader from '../../components/BaobabAuthHeader';

const Register: React.FC = () => {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [step, setStep] = useState(1);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { executeRecaptcha } = useGoogleReCaptcha();

    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const referrerId = searchParams.get('ref');

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError(null);

        if (step === 1) {
            if (!formData.username.trim()) { setError("Input your name, boss."); return; }
            setStep(2);
            return;
        }

        if (step === 2) {
            const emailRegex = /^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/;
            if (!emailRegex.test(formData.email)) { setError("That email doesn't look right."); return; }
            setStep(3);
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
            navigate('/');
        } catch (err: any) {
            setError("Google login failed.");
        } finally { setLoading(false); }
    };

    return (
        <div className="min-vh-100 d-flex align-items-center justify-content-center bg-white px-3 py-5" style={{ fontFamily: '"Lexend", sans-serif' }}>
            <div className="w-100" style={{ maxWidth: '440px' }}>

                <BaobabAuthHeader />

                <div className="text-center mb-5 mt-4">
                    <div className="d-flex align-items-center justify-content-center position-relative">
                        {step > 1 && (
                            <button
                                className="btn p-0 position-absolute start-0 text-dark border-0 shadow-none"
                                onClick={() => setStep(step - 1)}
                            >
                                <ArrowLeft size={24} />
                            </button>
                        )}
                        <h2 className="display-6 fw-black text-uppercase ls-tight text-dark mb-0">Join the Crew</h2>
                    </div>
                    <p className="fw-bold text-muted mt-2 mb-0 small text-uppercase">Step {step} of 3: {step === 1 ? 'Profile' : step === 2 ? 'Account' : 'Security'}</p>
                </div>

                {error && (
                    <div className="border border-4 border-dark p-3 mb-4 text-center fw-black text-uppercase shadow-action-sm"
                         style={{ backgroundColor: '#FFD1D1', color: '#000', fontSize: '12px' }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>

                    {step === 1 && (
                        <div className="mb-4">
                            <label className="form-label smallest fw-black text-uppercase ls-1">Learner Name</label>
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
                                    <button type="button" className="btn border-0 p-0 text-dark me-3 position-absolute end-0" onClick={() => setShowPassword(!showPassword)} tabIndex={-1}>
                                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </button>
                                </div>
                            </div>
                            <div className="mb-4">
                                <label className="form-label smallest fw-black text-uppercase ls-1">Confirm Password</label>
                                <div className="custom-input-group custom-input-group--brutalist position-relative d-flex align-items-center">
                                    <input name="confirmPassword" type={showConfirmPassword ? "text" : "password"} className="fw-bold" placeholder="••••••••" value={formData.confirmPassword} onChange={handleChange} required disabled={loading} />
                                    <button type="button" className="btn border-0 p-0 text-dark me-3 position-absolute end-0" onClick={() => setShowConfirmPassword(!showConfirmPassword)} tabIndex={-1}>
                                        {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </button>
                                </div>
                            </div>
                        </>
                    )}

                    <button
                        type="submit"
                        className="btn w-100 fw-black py-3 mb-4 btn-primary border border-4 border-dark rounded-0 shadow-action text-uppercase ls-1 btn-press"
                        disabled={loading}
                    >
                        {loading ? <Loader2 className="animate-spin" size={20} /> : step === 3 ? 'Register Sharp-Sharp' : 'Continue'}
                    </button>
                </form>

                {step === 1 && (
                    <>
                        <div className="d-flex align-items-center my-4">
                            <div className="flex-grow-1 border-top border-4 border-dark"></div>
                            <span className="mx-3 text-dark smallest fw-black text-uppercase ls-1">OR</span>
                            <div className="flex-grow-1 border-top border-4 border-dark"></div>
                        </div>

                        <button
                            onClick={handleGoogleSignIn}
                            className="btn w-100 fw-black py-3 bg-white border border-4 border-dark rounded-0 shadow-action d-flex align-items-center justify-content-center text-uppercase smallest ls-1 btn-press mb-4"
                            disabled={loading}
                        >
                            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="me-2" style={{ width: '20px' }} />
                            Google Sign-Up
                        </button>
                    </>
                )}

                <div className="text-center mt-4">
                    <p className="fw-bold smallest text-uppercase">
                        Got an account? <Link to="/login" className="fw-black text-decoration-underline" style={{ color: '#000' }}>Log In</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Register;