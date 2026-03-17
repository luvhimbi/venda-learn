import React from 'react';
import baobabImg from '../assets/mapungubwe_baobab.jpg';

/**
 * BaobabAuthHeader - A premium header for auth pages featuring the Mapungubwe Baobab.
 * Includes a subtle floating animation.
 */
const BaobabAuthHeader: React.FC = () => {
    return (
        <div className="baobab-header-container text-center mb-4">
            <div className="baobab-wrapper d-inline-block position-relative">
                <img
                    src={baobabImg}
                    alt="Mapungubwe Baobab"
                    className="baobab-image rounded-circle shadow-sm"
                    style={{
                        width: '140px',
                        height: '140px',
                        objectFit: 'cover',
                        border: '4px solid #FACC15'
                    }}
                />

                {/* Decorative Pattern Accent */}
                <div className="position-absolute bottom-0 end-0 bg-warning rounded-circle d-flex align-items-center justify-content-center shadow-sm"
                    style={{ width: '40px', height: '40px', transform: 'translate(10%, 10%)' }}>
                    <i className="bi bi-stars text-dark fs-5"></i>
                </div>
            </div>

            <style>{`
                @keyframes floatBaobab {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-8px); }
                }
                .baobab-image {
                    animation: floatBaobab 6s infinite ease-in-out;
                }
                .baobab-header-container {
                    perspective: 1000px;
                }
            `}</style>
        </div>
    );
};

export default BaobabAuthHeader;
