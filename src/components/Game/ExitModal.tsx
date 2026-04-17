import React from 'react';
import Mascot from '../../features/gamification/components/Mascot';

interface Props {
    onClose: () => void;
    onConfirm: () => void;
}

const ExitModal: React.FC<Props> = ({ onClose, onConfirm }) => (
    <div
        className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
        style={{
            zIndex: 9999,
            backdropFilter: 'blur(12px)',
            backgroundColor: 'rgba(255, 255, 255, 0.3)'
        }}
    >
        {/* Switched to shadow-action-sm and custom-input-group--brutalist style logic from your CSS */}
        <div
            className="bg-white p-5 rounded-5 text-center animate__animated animate__bounceIn border border-4 border-dark shadow-action"
            style={{
                maxWidth: '440px',
                width: '92%'
            }}
        >
            {/* ELPHIE HEARTBREAK */}
            <div className="mb-4 d-flex justify-content-center">
                <Mascot mood="sad" width="180px" height="180px" />
            </div>

            <h2 className="fw-black text-dark mb-2 ls-tight text-uppercase">
                Wait, Friend!
            </h2>

            <p className="fw-bold text-muted mb-4 px-2" style={{ fontSize: '1.1rem', lineHeight: '1.4' }}>
                If you pull over now, you'll lose your progress for this leg of the trip. You're almost there!
            </p>

            <div className="d-flex flex-column gap-3 mt-2">
                {/* Using game-btn-primary for the big yellow brutalist button */}
                <button
                    className="btn game-btn-primary w-100 py-3 px-4"
                    onClick={onClose}
                >
                    KEEP GOING ⚡
                </button>

                {/* Using btn-press or a transparent variant for the exit link */}
                <button
                    className="btn border-0 text-muted fw-bold smallest-print text-uppercase ls-1"
                    style={{ background: 'none', textDecoration: 'underline' }}
                    onClick={onConfirm}
                >
                    End session anyway
                </button>
            </div>
        </div>
    </div>
);

export default ExitModal;





