import React, { useState, type FormEvent, type ChangeEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, updateDoc, increment } from 'firebase/firestore';
import { auth, db } from '../services/firebaseConfig';

const Register: React.FC = () => {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: ''
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    // Check URL for referral code (?ref=USER_ID)
    const [searchParams] = useSearchParams();
    const referrerId = searchParams.get('ref');

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError(null);

        if(formData.password !== formData.confirmPassword) {
            setError("Phaswidzi dza vhoiwe dzo fhambana! (Passwords do not match!)");
            return;
        }

        setLoading(true);

        try {
            // 1. Create the new user in Firebase Auth
            const userCredential = await createUserWithEmailAndPassword(
                auth,
                formData.email,
                formData.password
            );

            // 2. Save the new user's profile to Firestore
            await setDoc(doc(db, "users", userCredential.user.uid), {
                username: formData.username,
                email: formData.email,
                points: 0,
                level: 1,
                streak: 0,
                completedLessons: [],
                createdAt: new Date().toISOString()
            });

            // 3. REFERRAL LOGIC: Reward the friend who invited them
            if (referrerId) {
                try {
                    const referrerRef = doc(db, "users", referrerId);
                    await updateDoc(referrerRef, {
                        points: increment(500) // Automatically adds 500 LP to the inviter
                    });
                    console.log("Success: Referrer rewarded with 500 LP!");
                } catch (refErr) {
                    // We don't block registration if the referral update fails
                    console.error("Referral reward failed:", refErr);
                }
            }

            navigate('/');
        } catch (err: any) {
            if (err.code === 'auth/email-already-in-use') {
                setError("Iyi imeili yo no shumiswa. (This email is already in use.)");
            } else {
                setError(err.message);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container-fluid p-0 overflow-hidden">
            <div className="row g-0 min-vh-100">

                {/* LEFT SIDE: BRANDING */}
                <div className="col-lg-6 d-none d-lg-flex flex-column justify-content-center align-items-center bg-success text-white p-5 position-relative">
                    <div className="position-absolute top-0 start-0 p-4">
                        <h4 className="fw-bold mb-0 ls-1">VENDA LEARN</h4>
                    </div>

                    <div className="text-center animate__animated animate__fadeInLeft">
                        <div className="display-1 mb-4">🛡️</div>
                        <h1 className="display-3 fw-bold mb-3">Vhuya u fhedze!</h1>
                        <p className="fs-5 opacity-75 max-width-400">
                            Create your profile and start earning points to become a Tshivenda language legend.
                        </p>
                        {referrerId && (
                            <div className="badge bg-white text-success px-3 py-2 rounded-pill mt-3 shadow-sm animate__animated animate__pulse animate__infinite">
                                🎁 You were invited! Join to help your friend earn 500 LP.
                            </div>
                        )}
                    </div>

                    <div className="position-absolute bottom-0 start-0 w-100 p-4 opacity-25 text-center">
                        <small>© 2025 Venda Learn • Thoma u guda namusi</small>
                    </div>
                </div>

                {/* RIGHT SIDE: REGISTER FORM */}
                <div className="col-lg-6 d-flex align-items-center justify-content-center bg-white">
                    <div className="w-100 p-4 p-md-5" style={{ maxWidth: '550px' }}>

                        <div className="mb-4 animate__animated animate__fadeInUp">
                            <h2 className="fw-bold text-dark h1">Ṅwalisani</h2>
                            <p className="text-muted">Fill in your details to create a new account.</p>
                        </div>

                        {error && (
                            <div className="alert alert-danger border-0 shadow-sm py-3 small animate__animated animate__shakeX">
                                <strong>Ndaela:</strong> {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="animate__animated animate__fadeInUp animate__delay-1s">
                            <div className="row">
                                <div className="col-12 mb-3">
                                    <label className="form-label small fw-bold text-uppercase text-muted ls-1">Full Name (Dzina)</label>
                                    <input
                                        name="username"
                                        type="text"
                                        className="form-control form-control-lg bg-light border-0 fs-6"
                                        placeholder="John Doe"
                                        onChange={handleChange}
                                        required
                                        disabled={loading}
                                    />
                                </div>

                                <div className="col-12 mb-3">
                                    <label className="form-label small fw-bold text-uppercase text-muted ls-1">Email</label>
                                    <input
                                        name="email"
                                        type="email"
                                        className="form-control form-control-lg bg-light border-0 fs-6"
                                        placeholder="vhadau@example.com"
                                        onChange={handleChange}
                                        required
                                        disabled={loading}
                                    />
                                </div>

                                <div className="col-md-6 mb-3">
                                    <label className="form-label small fw-bold text-uppercase text-muted ls-1">Password</label>
                                    <input
                                        name="password"
                                        type="password"
                                        className="form-control form-control-lg bg-light border-0 fs-6"
                                        placeholder="••••••••"
                                        onChange={handleChange}
                                        required
                                        disabled={loading}
                                    />
                                </div>

                                <div className="col-md-6 mb-4">
                                    <label className="form-label small fw-bold text-uppercase text-muted ls-1">Confirm</label>
                                    <input
                                        name="confirmPassword"
                                        type="password"
                                        className="form-control form-control-lg bg-light border-0 fs-6"
                                        placeholder="••••••••"
                                        onChange={handleChange}
                                        required
                                        disabled={loading}
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="btn btn-success btn-lg w-100 fw-bold shadow-sm py-3 mb-4 transition-all hover-lift"
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm me-2"></span>
                                        U khou ṅwalisa...
                                    </>
                                ) : 'CREATE ACCOUNT'}
                            </button>
                        </form>

                        <div className="text-center pt-2">
                            <p className="text-muted">
                                Already have an account? <Link to="/login" className="text-decoration-none fw-bold text-success">Vho dzhena (Login)</Link>
                            </p>
                        </div>
                    </div>
                </div>

            </div>

            <style>{`
                .ls-1 { letter-spacing: 1px; }
                .max-width-400 { max-width: 400px; margin: 0 auto; }
                .hover-lift:hover { transform: translateY(-2px); box-shadow: 0 10px 20px rgba(0,0,0,0.1) !important; }
                .form-control:focus { background-color: #fff !important; box-shadow: none; border: 1px solid #198754; }
                .bg-success { background-color: #198754 !important; }
                .text-success { color: #198754 !important; }
            `}</style>
        </div>
    );
};

export default Register;