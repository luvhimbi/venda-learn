import React from 'react';

const POPIAct: React.FC = () => {
    return (
        <div className="min-vh-100 bg-light py-5">
            <div className="container">
                <div className="card border-0 shadow-sm rounded-4 p-4 p-md-5 bg-white">
                    <h1 className="fw-bold mb-4 text-primary">POPI Act Compliance</h1>
                    <p className="lead text-muted mb-5">How Venda Learn protects your personal information in South Africa.</p>

                    <div className="row g-4">
                        <div className="col-md-6">
                            <h5 className="fw-bold">1. Accountability</h5>
                            <p className="small text-muted">We take full responsibility for the data we collect and ensure that processing is done lawfully and transparently.</p>
                        </div>
                        <div className="col-md-6">
                            <h5 className="fw-bold">2. Specific Purpose</h5>
                            <p className="small text-muted">Data is only collected to provide language learning services and leaderboard rankings.</p>
                        </div>
                        <div className="col-md-6">
                            <h5 className="fw-bold">3. Data Minimization</h5>
                            <p className="small text-muted">We only ask for the information absolutely necessary (Email, Username) to run your account.</p>
                        </div>
                        <div className="col-md-6">
                            <h5 className="fw-bold">4. Security Safeguards</h5>
                            <p className="small text-muted">Your data is stored securely via Firebase with industry-standard encryption to prevent unauthorized access.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default POPIAct;