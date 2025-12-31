import React from 'react';

const PrivacyPolicy: React.FC = () => {
    return (
        <div className="min-vh-100 bg-light py-5">
            <div className="container">
                <div className="card border-0 shadow-sm rounded-4 p-4 p-md-5 bg-white">
                    <h1 className="fw-bold mb-4">Privacy Policy</h1>
                    <p className="text-muted mb-5">Your privacy is our priority. This policy outlines how we handle your data.</p>

                    <div className="mb-4">
                        <h5 className="fw-bold border-start border-primary border-4 ps-3">Data Collection</h5>
                        <p className="text-muted ps-3">We collect your email for account authentication and your username for display on the public leaderboard.</p>
                    </div>

                    <div className="mb-4">
                        <h5 className="fw-bold border-start border-primary border-4 ps-3">Data Usage</h5>
                        <p className="text-muted ps-3">Your data is used to track your learning progress, award LP points, and determine your rank among other warriors.</p>
                    </div>

                    <div className="mb-0">
                        <h5 className="fw-bold border-start border-primary border-4 ps-3">Third Parties</h5>
                        <p className="text-muted ps-3">We do not sell your data. We use Firebase (Google) for secure data storage and authentication.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PrivacyPolicy;