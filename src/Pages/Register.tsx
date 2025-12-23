import React, { useState, type FormEvent, type ChangeEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebaseConfig';
const Register: React.FC = () => {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: ''
    });

    // States for feedback
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError(null);

        // Validation
        if(formData.password !== formData.confirmPassword) {
            setError("Passwords do not match!");
            return;
        }

        setLoading(true);

        try {
            // 2. Create the user in Firebase Auth
            const userCredential = await createUserWithEmailAndPassword(
                auth,
                formData.email,
                formData.password
            );

            // 3. Save additional user data to Firestore
            // This creates a 'users' collection and stores the username
            await setDoc(doc(db, "users", userCredential.user.uid), {
                username: formData.username,
                email: formData.email,
                points: 0,
                completedLessons: [],
                createdAt: new Date().toISOString()
            });

            console.log("Success! User registered.");
            navigate('/'); // Redirect to Home/Dashboard
        } catch (err: any) {
            // Handle Firebase specific errors (e.g., email already in use)
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mt-5">
            <div className="row justify-content-center">
                <div className="col-md-5">
                    <div className="card shadow border-0">
                        <div className="card-body p-4">
                            <h2 className="text-center mb-4">Ṅwalisani</h2>
                            <p className="text-muted text-center">Start your journey to learn Tshivenda</p>

                            {/* Show error message if it exists */}
                            {error && <div className="alert alert-danger py-2 small">{error}</div>}

                            <form onSubmit={handleSubmit}>
                                <div className="mb-3">
                                    <label className="form-label small fw-bold">Full Name (Dzina)</label>
                                    <input
                                        name="username"
                                        type="text"
                                        className="form-control"
                                        onChange={handleChange}
                                        required
                                        disabled={loading}
                                    />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label small fw-bold">Email</label>
                                    <input
                                        name="email"
                                        type="email"
                                        className="form-control"
                                        onChange={handleChange}
                                        required
                                        disabled={loading}
                                    />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label small fw-bold">Password</label>
                                    <input
                                        name="password"
                                        type="password"
                                        className="form-control"
                                        onChange={handleChange}
                                        required
                                        disabled={loading}
                                    />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label small fw-bold">Confirm Password</label>
                                    <input
                                        name="confirmPassword"
                                        type="password"
                                        className="form-control"
                                        onChange={handleChange}
                                        required
                                        disabled={loading}
                                    />
                                </div>
                                <button
                                    type="submit"
                                    className="btn btn-success w-100 mb-3 fw-bold"
                                    disabled={loading}
                                >
                                    {loading ? 'Processing...' : 'Create Account'}
                                </button>
                            </form>
                            <div className="text-center">
                                <small>Already have an account? <Link to="/login" className="text-decoration-none">Login</Link></small>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;