import React from 'react';
import { getBadgeDetails } from "../../services/levelUtils";

interface Props {
    level: number;
    onClose: () => void;
}

const LevelUpModal: React.FC<Props> = ({ level, onClose }) => {
    const badge = getBadgeDetails(level);
    return (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center z-3 bg-white">
            <div className="text-center p-4 animate__animated animate__zoomIn" style={{ maxWidth: '500px' }}>
                <div className="display-1 mb-4">{badge.icon}</div>
                <h1 className="fw-bold display-4 mb-2 ls-tight text-dark">LEVEL UP!</h1>
                <p className="text-muted mb-5 ls-1">Zwi khou bvelela! You are now Level {level}.</p>
                <div className="py-4 border-top border-bottom mb-5">
                    <p className="smallest fw-bold text-muted mb-1 ls-2 text-uppercase">New Rank</p>
                    <h2 className="fw-bold mb-0" style={{ color: '#FACC15' }}>{badge.name}</h2>
                </div>
                <button className="btn game-btn-primary w-100 py-3 fw-bold" onClick={onClose}>PHANDA (CONTINUE)</button>
            </div>
        </div>
    );
};

export default LevelUpModal;
