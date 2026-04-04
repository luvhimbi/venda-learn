import React, { useState, type FormEvent, type ChangeEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { doc, setDoc, getDoc, collection, query, where, getDocs, type Firestore } from 'firebase/firestore';
import { createUserWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { Loader2, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3';
import { auth, db, googleProvider } from '../../services/firebaseConfig';
import MascotAuthHeader from '../../components/MascotAuthHeader';

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
    const [isTyping, setIsTyping] = useState(false);
    const typingTimeoutRef = React.useRef<number | null>(null);
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const referrerId = searchParams.get('ref');
    const stepMeta = {
        1: { label: 'Profile', value: 'Set your learner name' },
        2: { label: 'Account', value: 'Save progress to your email' },
        3: { label: 'Security', value: 'Protect streaks and XP' }
    } as const;

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        setIsTyping(true);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 500);

        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError(null);
        
        if (step === 1) {
            if (!formData.username.trim()) { setError("Please enter your name."); return; }
            setStep(2);
            return;
        }
        
        if (step === 2) {
            const emailRegex = /^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/;
            if (!emailRegex.test(formData.email)) { setError("Please enter a valid email address."); return; }
            
            setLoading(true);
            try {
                // Instantly check if email is already taken in the DB
                const usersRef = collection(db as Firestore, 'users');
                const q = query(usersRef, where('email', '==', formData.email.toLowerCase().trim()));
                const querySnapshot = await getDocs(q);
                
                if (!querySnapshot.empty) {
                    setError("This email is already registered. Try logging in instead.");
                    setLoading(false);
                    return;
                }
            } catch (err) {
                console.error("Early email verification failed:", err);
            }
            
            setLoading(false);
            setStep(3);
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match!");
            return;
        }
        if (formData.password.length < 6) {
            setError("Password must be at least 6 characters.");
            return;
        }

        setLoading(true);

        if (!executeRecaptcha) {
            setError("reCAPTCHA is not ready yet. Please try again.");
            setLoading(false);
            return;
        }

        try {
            const token = await executeRecaptcha("register");
            if (!token) {
                setError("reCAPTCHA verification failed.");
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
            console.error("Google Sign-In Error:", err);
            setError("Google sign-in failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-vh-100 d-flex align-items-center justify-content-center bg-white px-3 py-5">
            <div className="w-100" style={{ maxWidth: '450px' }}>

                <MascotAuthHeader isTyping={isTyping} />

                {/* Header Block */}
                <div className="d-flex align-items-center justify-content-center position-relative mb-4">
                    {step > 1 && (
                        <button 
                            className="btn btn-link text-secondary p-0 position-absolute start-0" 
                            type="button"
                            onClick={() => { setError(null); setStep(step - 1); }}
                        >
                            <ArrowLeft size={24} />
                        </button>
                    )}
                    <h2 className="fw-bold ls-tight text-dark mb-0 animate__animated animate__fadeIn">Start Learning Today</h2>
                </div>

                <div className="d-flex justify-content-between align-items-center mb-3 px-1">
                    <span className="smallest fw-bold text-muted ls-1 text-uppercase">Step {step} of 3</span>
                    <span className="smallest fw-bold text-muted ls-1">{stepMeta[step as 1 | 2 | 3].label}</span>
                </div>

                {/* Progress Indicators */}
                <div className="d-flex justify-content-center gap-2 mb-4">
                    {[1, 2, 3].map(s => (
                        <div key={s} style={{ 
                            height: '6px', 
                            flex: 1, 
                            maxWidth: '60px', 
                            borderRadius: '3px', 
                            backgroundColor: step >= s ? '#FACC15' : '#E5E7EB',
                            transition: 'all 0.3s ease'
                        }} />
                    ))}
                </div>
                
                <p className="text-center text-muted mb-4 small fw-bold text-uppercase ls-1 animate__animated animate__fadeIn">
                    {step === 1 && "What should we call you?"}
                    {step === 2 && "What's your email address?"}
                    {step === 3 && "Create your secure account"}
                </p>

                <div className="text-center mb-3">
                    <p className="small text-muted mb-0">{stepMeta[step as 1 | 2 | 3].value}</p>
                </div>

                {error && (
                    <div className="alert border-0 py-3 small mb-4 text-center animate__animated animate__shakeX"
                        style={{ backgroundColor: '#FEF2F2', color: '#B91C1C', borderBottom: '2px solid #EF4444' }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    
                    {/* STEP 1: NAME */}
                    {step === 1 && (
                        <div className="animate__animated animate__fadeInRight">
                            <div className="mb-4">
                                <div className="custom-input-group">
                                    <input name="username" type="text" className="border-0 bg-transparent fs-5 flex-grow-1" placeholder="John Doe" value={formData.username} onChange={handleChange} required autoFocus disabled={loading} />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STEP 2: EMAIL */}
                    {step === 2 && (
                        <div className="animate__animated animate__fadeInRight">
                            <div className="mb-4">
                                <div className="custom-input-group">
                                    <input name="email" type="email" className="border-0 bg-transparent fs-5 flex-grow-1" placeholder="vhadau@example.com" value={formData.email} onChange={handleChange} required autoFocus disabled={loading} />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STEP 3: PASSWORD & CAPTCHA */}
                    {step === 3 && (
                        <div className="animate__animated animate__fadeInRight">
                            <div className="mb-3">
                                <div className="custom-input-group d-flex align-items-center mb-3">
                                    <input name="password" type={showPassword ? "text" : "password"} className="border-0 bg-transparent fs-6 flex-grow-1" placeholder="Password (min. 6 characters)" value={formData.password} onChange={handleChange} required disabled={loading} autoFocus />
                                    <button
                                        type="button"
                                        className="btn border-0 p-0 text-muted me-3 shadow-none"
                                        onClick={() => setShowPassword(!showPassword)}
                                        tabIndex={-1}
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                                <div className="custom-input-group d-flex align-items-center mb-4">
                                    <input name="confirmPassword" type={showConfirmPassword ? "text" : "password"} className="border-0 bg-transparent fs-6 flex-grow-1" placeholder="Confirm Password" value={formData.confirmPassword} onChange={handleChange} required disabled={loading} />
                                    <button
                                        type="button"
                                        className="btn border-0 p-0 text-muted me-3 shadow-none"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        tabIndex={-1}
                                    >
                                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    <button
                        type="submit"
                        className="btn w-100 fw-bold py-3 mb-4 game-btn-primary d-flex align-items-center justify-content-center shadow-none text-uppercase ls-1"
                        disabled={loading}
                    >
                        {loading ? <Loader2 className="animate-spin me-2" size={18} /> : (step === 3 ? 'CREATE ACCOUNT' : 'CONTINUE')}
                    </button>
                </form>

                {/* Or Line */}
                {step === 1 && (
                    <div className="animate__animated animate__fadeInUp">
                        <div className="d-flex align-items-center my-3">
                            <hr className="flex-grow-1" />
                            <span className="mx-3 text-muted smallest fw-bold text-uppercase ls-1" style={{ fontSize: '10px' }}>Or</span>
                            <hr className="flex-grow-1" />
                        </div>

                        <button
                            onClick={handleGoogleSignIn}
                            className="btn w-100 fw-bold py-3 mb-3 btn-outline-dark d-flex align-items-center justify-content-center border-2"
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
                )}
            </div>

            <style>{`
                .ls-1 { letter-spacing: 1px; }
                .smallest { font-size: 10px; }
                .game-btn-primary { 
                    background-color: #FACC15 !important; 
                    color: #111827 !important; 
                    border: none !important; 
                    border-radius: 12px; 
                    box-shadow: 0 4px 0 #EAB308 !important; 
                    transition: all 0.2s; 
                }
                .game-btn-primary:active { transform: translateY(2px); box-shadow: 0 2px 0 #EAB308 !important; }
                .game-btn-primary:disabled { opacity: 0.6; transform: none; box-shadow: 0 4px 0 #EAB308 !important; }
                
                .custom-input-group { 
                    border: 2px solid #E5E7EB; 
                    border-radius: 12px;
                    background-color: #F9FAFB;
                    transition: 0.2s; 
                    overflow: hidden;
                    display: flex;
                    align-items: center;
                }
                .custom-input-group:focus-within { 
                    border-color: #FACC15; 
                    background-color: #FFFFFF;
                }
                .custom-input-group input {
                    border: none !important;
                    border-radius: 0 !important;
                    background: transparent !important;
                    background-color: transparent !important;
                    box-shadow: none !important;
                    outline: none !important;
                    padding: 1rem 1rem !important;
                    width: 100%;
                }
                
                input::-ms-reveal, input::-ms-clear { display: none; }
                input[type="password"]::-webkit-contacts-auto-fill-button, input[type="password"]::-webkit-credentials-auto-fill-button { display: none !important; }
            `}</style>
        </div>
    );
};

export default Register;
