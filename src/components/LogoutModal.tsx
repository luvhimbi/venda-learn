import React from 'react';
import Mascot from './Mascot';
import JuicyButton from './JuicyButton';

interface LogoutModalProps {
    onClose: () => void;
    onConfirm: () => void;
}

const LogoutModal: React.FC<LogoutModalProps> = ({ onClose, onConfirm }) => (
    <div
        className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
        style={{
            zIndex: 9999,
            backdropFilter: 'blur(8px)',
            backgroundColor: 'var(--color-bg-overlay, rgba(255, 255, 255, 0.4))'
        }}
    >
        {/* Using shadow-action and rounded-4 from your global CSS Section 6 & 2 */}
        <div
            className="bg-theme-card p-5 rounded-4 text-center animate__animated animate__zoomIn border border-4 border-theme-main shadow-action"
            style={{
                maxWidth: '420px',
                width: '90%'
            }}
        >

            {/* MASCOT CONTAINER - Relying on animate-chommie or float-around from Section 11 */}
            <div className="mb-4 d-flex justify-content-center animate-chommie">
                <Mascot mood="sad" width="160px" height="160px" />
            </div>

            <h3 className="fw-black mb-2 text-theme-main ls-tight text-uppercase">
                Taking a break?
            </h3>

            <p className="text-theme-muted fw-bold mb-4" style={{ fontSize: '1.1rem', lineHeight: '1.3' }}>
                Are you sure you want to log out, chommie? Your language journey is just getting to the fun part!
            </p>

            <div className="d-flex flex-column gap-3 mt-2">
                {/* Section 8: game-btn-primary handles the yellow, the border, and the 4px shadow */}
                <JuicyButton
                    className="btn game-btn-primary w-100 py-3 px-4"
                    onClick={onClose}
                >
                    NO, KEEP LEARNING! 🚀
                </JuicyButton>

                {/* Section 3 & 5: Using utility classes for the secondary link */}
                <JuicyButton
                    className="btn border-0 text-muted fw-bold smallest-print text-uppercase ls-1"
                    style={{ background: 'none', textDecoration: 'underline' }}
                    onClick={onConfirm}
                    hapticType="heavy"
                >
                    Log out for now
                </JuicyButton>
            </div>
        </div>
    </div>
);

export default LogoutModal;