import React from 'react';

const TermsOfUse: React.FC = () => {
    return (
        <div className="min-vh-100 bg-light py-5">
            <div className="container">
                <div className="card border-0 shadow-sm rounded-4 p-4 p-md-5 bg-white">
                    <h1 className="fw-bold mb-4">Terms of Use</h1>
                    <p className="text-muted mb-4">Last Updated: December 2025</p>

                    <section className="mb-4">
                        <h5 className="fw-bold">Acceptance of Terms</h5>
                        <p className="small text-muted">By accessing Venda Learn, you agree to follow our community guidelines. We reserve the right to ban users who exhibit abusive behavior or cheat on the leaderboard.</p>
                    </section>

                    <section className="mb-4">
                        <h5 className="fw-bold">User Conduct</h5>
                        <p className="small text-muted">Users must provide accurate information. Harassment of other learners or manipulation of LP points is strictly prohibited.</p>
                    </section>

                    <section className="mb-0">
                        <h5 className="fw-bold">Intellectual Property</h5>
                        <p className="small text-muted">The educational content, Venda audio, and curriculum are owned by Venda Learn and may not be redistributed without permission.</p>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default TermsOfUse;