import React from 'react';
import Mascot from '../Mascot';

interface Props {
    onClose: () => void;
    onConfirm: () => void;
}

const ExitModal: React.FC<Props> = ({ onClose, onConfirm }) => (
    <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center bg-black bg-opacity-50" style={{ zIndex: 1050 }}>
        <div className="bg-white p-5 rounded-4 shadow-lg text-center animate__animated animate__fadeInUp" style={{ maxWidth: '450px', width: '90%' }}>
            <div className="mb-4 d-flex justify-content-center">
                <Mascot mood="sad" width="180px" height="180px" />
            </div>
            <h4 className="fw-bold mb-3 text-dark">Leaving so soon?</h4>
            <p className="text-muted mb-4">You'll lose your progress for this session.</p>
            <div className="d-flex gap-3">
                <button className="btn btn-light flex-grow-1 fw-bold text-dark py-3 rounded-pill" onClick={onClose}>
                    Stay
                </button>
                <button className="btn bg-game-primary flex-grow-1 fw-bold py-3 rounded-pill text-dark" onClick={onConfirm}>
                    Exit
                </button>
            </div>
        </div>
    </div>
);

export default ExitModal;
