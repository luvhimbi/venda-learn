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
            console.log("Vho dzhena!");

            // --- REDIRECT LOGIC START ---
            // Check if there is a saved Duel URL in memory
            const redirectTo = localStorage.getItem('redirectUrl');
            if (redirectTo) {
                localStorage.removeItem('redirectUrl'); // Clean up memory
                navigate(redirectTo); // Send friend to the Duel
            } else {
                navigate('/'); // Default to Home
            }
            // --- REDIRECT LOGIC END ---

        } catch (err: any) {
            if (err.code === 'auth/invalid-credential') {
                setError("Invalid email or password.");
            } else {
                setError("Something went wrong. Please try again.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mt-5">
            <div className="row justify-content-center">
                <div className="col-md-4">
                    <div className="card shadow border-0 rounded-4">
                        <div className="card-body p-4">
                            <h2 className="text-center mb-4 fw-bold">Vho Dzhena</h2>
                            <p className="text-muted text-center small">Welcome back to Venda Learn</p>

                            {error && <div className="alert alert-danger py-2 small text-center">{error}</div>}

                            <form onSubmit={handleSubmit}>
                                <div className="mb-3">
                                    <label className="form-label small fw-bold text-uppercase">Email</label>
                                    <input
                                        type="email"
                                        className="form-control py-2"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        disabled={loading}
                                    />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label small fw-bold text-uppercase">Password</label>
                                    <input
                                        type="password"
                                        className="form-control py-2"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        disabled={loading}
                                    />
                                    <div className="text-end mt-1">
                                        {/* REMOVED size-sm TO FIX CONSOLE ERROR */}
                                        <Link to="/reset-password" name="reset" className="small text-decoration-none">
                                            Forgot Password?
                                        </Link>
                                    </div>
                                </div>
                                <button
                                    type="submit"
                                    className="btn btn-primary w-100 mb-3 fw-bold py-2 shadow-sm"
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <span className="spinner-border spinner-border-sm me-2"></span>
                                    ) : 'Login'}
                                </button>
                            </form>
                            <div className="text-center border-top pt-3">
                                <small>Don't have an account? <Link to="/register" className="text-decoration-none fw-bold">Sign Up</Link></small>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;