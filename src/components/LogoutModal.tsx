import React from 'react';
import Mascot from './Mascot';
import JuicyButton from './JuicyButton';

interface LogoutModalProps {
    onClose: () => void;
    onConfirm: () => void;
}

const LogoutModal: React.FC<LogoutModalProps> = ({ onClose, onConfirm }) => (
    <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center bg-black bg-opacity-50" style={{ zIndex: 2000 }}>
        <div className="bg-white p-5 rounded-4 shadow-lg text-center animate__animated animate__zoomIn" style={{ maxWidth: '450px', width: '90%' }}>
            <div className="mb-4 d-flex justify-content-center">
                <Mascot mood="sad" width="180px" height="180px" />
            </div>
            <h4 className="fw-bold mb-3 text-dark">Leaving so soon?</h4>
            <p className="text-muted mb-4 opacity-75">Vho khwaṱha uri vha khou fhedza u shumisa system?</p>
            <div className="d-flex flex-column flex-sm-row gap-3 mt-2">
                <JuicyButton 
                    className="btn flex-grow-1 fw-bold py-3 px-4 rounded-4 btn-juicy-stay shadow-none" 
                    onClick={onClose}
                >
                    STAY
                </JuicyButton>
                <JuicyButton 
                    className="btn flex-grow-1 fw-bold py-3 px-4 rounded-4 btn-juicy-logout shadow-none" 
                    onClick={onConfirm}
                    hapticType="heavy"
                >
                    LOGOUT
                </JuicyButton>
            </div>
        </div>

        <style>{`
            .btn-juicy-stay {
                background-color: #f8fafc !important;
                color: #475569 !important;
                border: 2px solid #e2e8f0 !important;
                border-bottom: 5px solid #cbd5e1 !important;
                transition: all 0.1s ease;
            }
            .btn-juicy-stay:active {
                transform: translateY(3px) !important;
                border-bottom-width: 2px !important;
            }

            .btn-juicy-logout {
                background-color: #FACC15 !important;
                color: #111827 !important;
                border: 2px solid #EAB308 !important;
                border-bottom: 5px solid #CA8A04 !important;
                transition: all 0.1s ease;
            }
            .btn-juicy-logout:active {
                transform: translateY(3px) !important;
                border-bottom-width: 2px !important;
            }
        `}</style>
    </div>
);

export default LogoutModal;
