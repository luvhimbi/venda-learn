import React from 'react';
import Mascot from './Mascot';

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
            <p className="text-muted mb-4">Are you sure you want to leave so soon?</p>
            <div className="d-flex flex-column flex-sm-row gap-3 mt-2">
                <button className="btn btn-light flex-grow-1 fw-bold py-3 rounded-pill" onClick={onClose} style={{ color: '#1e293b', border: '1px solid #e2e8f0' }}>
                    Stay
                </button>
                <button className="btn btn-primary flex-grow-1 fw-bold py-3 rounded-pill text-dark shadow-sm" onClick={onConfirm} style={{ backgroundColor: '#FACC15', border: 'none' }}>
                    Logout
                </button>
            </div>
        </div>
    </div>
);

export default LogoutModal;
