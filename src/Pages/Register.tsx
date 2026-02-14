import React, { useState, type FormEvent, type ChangeEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebaseConfig';
import ReCAPTCHA from 'react-google-recaptcha';

const Register: React.FC = () => {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        isNativeSpeaker: false,
        nativeSpeakerBio: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [captchaValue, setCaptchaValue] = useState<string | null>(null);
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const referrerId = searchParams.get('ref');

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError(null);
        if (formData.password !== formData.confirmPassword) {
            setError("Phaswidzi dza vhoiwe dzo fhambana!");
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
                isNativeSpeaker: false, // Remains false until verified
                nativeVerificationStatus: formData.isNativeSpeaker ? 'pending' : 'none',
                nativeSpeakerBio: formData.isNativeSpeaker ? formData.nativeSpeakerBio : "",
                tourCompleted: false,
                createdAt: new Date().toISOString()
            });
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
            setError(err.code === 'auth/email-already-in-use' ? "Iyi imeili yo no shumiswa." : err.message);
        } finally { setLoading(false); }
    };

    return (
        <div className="min-vh-100 d-flex align-items-center justify-content-center bg-white px-3 py-5">
            <div className="w-100" style={{ maxWidth: '450px' }}>

                <div className="text-center mb-5 animate__animated animate__fadeIn">
                    <div className="d-inline-flex align-items-center justify-content-center rounded-3 mb-3"
                        style={{ width: '56px', height: '56px', backgroundColor: '#FACC15' }}>
                        <span className="fw-bold fs-2 text-dark">V</span>
                    </div>
                    <h2 className="fw-bold ls-1 text-dark mb-1">VENDA LEARN</h2>
                </div>

                {error && (
                    <div className="alert border-0 py-3 small mb-4 text-center"
                        style={{ backgroundColor: '#FEF2F2', color: '#B91C1C', borderBottom: '2px solid #EF4444' }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="mb-3">
                        <label className="form-label small fw-bold text-uppercase text-muted ls-1">Full Name</label>
                        <div className="custom-input-group">
                            <input name="username" type="text" className="form-control form-control-lg border-0 bg-transparent fs-6 px-0" placeholder="John Doe" onChange={handleChange} required disabled={loading} />
                        </div>
                    </div>
                    <div className="mb-3">
                        <label className="form-label small fw-bold text-uppercase text-muted ls-1">Email</label>
                        <div className="custom-input-group">
                            <input name="email" type="email" className="form-control form-control-lg border-0 bg-transparent fs-6 px-0" placeholder="vhadau@example.com" onChange={handleChange} required disabled={loading} />
                        </div>
                    </div>
                    <div className="row mb-3">
                        <div className="col-md-6 mb-3 mb-md-0">
                            <label className="form-label small fw-bold text-uppercase text-muted ls-1">Password</label>
                            <div className="custom-input-group">
                                <input name="password" type="password" className="form-control form-control-lg border-0 bg-transparent fs-6 px-0" placeholder="••••••••" onChange={handleChange} required disabled={loading} />
                            </div>
                        </div>
                        <div className="col-md-6">
                            <label className="form-label small fw-bold text-uppercase text-muted ls-1">Confirm</label>
                            <div className="custom-input-group">
                                <input name="confirmPassword" type="password" className="form-control form-control-lg border-0 bg-transparent fs-6 px-0" placeholder="••••••••" onChange={handleChange} required disabled={loading} />
                            </div>
                        </div>
                    </div>

                    <div className="mb-4 p-3 rounded-3 border d-flex align-items-start gap-3 bg-light border-light">
                        <div className="form-check form-switch pt-1">
                            <input
                                className="form-check-input"
                                type="checkbox"
                                name="isNativeSpeaker"
                                id="isNativeSpeaker"
                                checked={formData.isNativeSpeaker}
                                onChange={handleChange}
                                disabled={loading}
                            />
                        </div>
                        <div>
                            <label className="form-check-label fw-bold d-block mb-1" style={{ fontSize: '13px' }} htmlFor="isNativeSpeaker">
                                I am a Native Venda Speaker
                            </label>
                            <p className="text-muted mb-0" style={{ fontSize: '11px', lineHeight: '1.4' }}>
                                Your status will be pending until verified by an admin. Once verified, you'll appear in the Practice Hub.
                            </p>
                        </div>
                    </div>

                    {formData.isNativeSpeaker && (
                        <div className="mb-4 animate__animated animate__fadeIn">
                            <label className="form-label small fw-bold text-uppercase text-muted ls-1">Why are you a native speaker?</label>
                            <div className="custom-input-group">
                                <input
                                    name="nativeSpeakerBio"
                                    type="text"
                                    className="form-control form-control-lg border-0 bg-transparent fs-6 px-0"
                                    placeholder="e.g. Born and raised in Venda, Tshifudi village."
                                    onChange={handleChange}
                                    required={formData.isNativeSpeaker}
                                    disabled={loading}
                                />
                            </div>
                            <p className="smallest text-muted mt-1">This helps us vet your profile for the Practice Hub.</p>
                        </div>
                    )}

                    <div className="mb-4 d-flex justify-content-center">
                        <ReCAPTCHA
                            sitekey="6LeKx2ssAAAAAHk2f6trCWqsFxx7OkbceJFsGsFW" // Test key
                            onChange={(value) => setCaptchaValue(value)}
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn btn-lg w-100 fw-bold py-3 mb-4 game-btn-primary"
                        disabled={loading || !captchaValue}
                    >
                        {loading ? <span className="spinner-border spinner-border-sm me-2"></span> : 'CREATE ACCOUNT'}
                    </button>
                </form>

                <div className="text-center mt-3">
                    <p className="text-muted small mb-3">Already have an account?</p>
                    <Link to="/login" className="btn btn-outline-dark w-100 fw-bold py-2 rounded-3 btn-login-action">
                        LOG IN
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
                }
                .custom-input-group:focus-within { border-color: #FACC15; }
                .form-control:focus { background-color: transparent !important; box-shadow: none; outline: none; }
                
                .btn-login-action {
                    border: 2px solid #111827;
                    font-size: 0.85rem;
                    letter-spacing: 0.5px;
                }
                .btn-login-action:hover {
                    background-color: #111827;
                    color: #fff;
                }
            `}</style>
        </div>
    );
};

export default Register;