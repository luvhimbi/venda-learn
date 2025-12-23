import React, { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';

const ResetPassword: React.FC = () => {
    const [email, setEmail] = useState<string>('');
    const [submitted, setSubmitted] = useState<boolean>(false);

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        console.log("Sending reset link to:", email);
        setSubmitted(true);
    };

    return (
        <div className="container mt-5">
            <div className="row justify-content-center">
                <div className="col-md-4">
                    <div className="card shadow border-0">
                        <div className="card-body p-4">
                            <h2 className="text-center mb-4">U vusulusa</h2> {/* Reset/Restore */}

                            {!submitted ? (
                                <form onSubmit={handleSubmit}>
                                    <p className="text-muted text-center">
                                        Enter your email to reset your password.
                                    </p>
                                    <div className="mb-3">
                                        <label className="form-label">Email address</label>
                                        <input
                                            type="email"
                                            className="form-control"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <button type="submit" className="btn btn-warning w-100 mb-3 text-white">
                                        Send Reset Link
                                    </button>
                                </form>
                            ) : (
                                <div className="text-center">
                                    <div className="alert alert-success">
                                        Check your email for instructions!
                                    </div>
                                    <Link to="/login" className="btn btn-primary w-100">Back to Login</Link>
                                </div>
                            )}

                            <div className="text-center mt-3">
                                <small><Link to="/login">Cancel</Link></small>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;