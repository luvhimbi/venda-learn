import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import Mascot from './Mascot';

interface ExitConfirmModalProps {
    visible: boolean;
    onConfirmExit: () => void;
    onCancel: () => void;
}

/**
 * Inline exit confirmation modal for games.
 * Shows a "Are you sure you want to leave?" prompt with mascot.
 * Doesn't rely on SweetAlert2 — renders directly in the React tree.
 */
const ExitConfirmModal: React.FC<ExitConfirmModalProps> = ({
    visible,
    onConfirmExit,
    onCancel,
}) => {
    if (!visible) return null;

    return (
        <div className="ecm-overlay" onClick={(e) => e.target === e.currentTarget && onCancel()}>
            <div className="ecm-modal">
                {/* Close */}
                <button onClick={onCancel} className="ecm-close" aria-label="Cancel">
                    <X size={20} strokeWidth={3} />
                </button>

                {/* Mascot */}
                <div className="ecm-mascot">
                    <Mascot width="70px" height="70px" mood="sad" />
                </div>

                {/* Warning icon */}
                <div className="ecm-icon-wrap">
                    <AlertTriangle size={28} strokeWidth={2.5} color="#EF4444" />
                </div>

                {/* Content */}
                <h2 className="ecm-title">Leave Game?</h2>
                <p className="ecm-desc">Your current progress will be lost. Are you sure you want to exit?</p>

                {/* Actions */}
                <div className="ecm-actions">
                    <button onClick={onCancel} className="ecm-btn-stay">
                        KEEP PLAYING
                    </button>
                    <button onClick={onConfirmExit} className="ecm-btn-exit">
                        YES, EXIT
                    </button>
                </div>
            </div>

            <style>{`
                .ecm-overlay {
                    position: fixed;
                    inset: 0;
                    background: rgba(0, 0, 0, 0.7);
                    z-index: 3000;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 20px;
                    backdrop-filter: blur(4px);
                    animation: ecmFadeIn 0.2s ease-out;
                }
                @keyframes ecmFadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                .ecm-modal {
                    background: var(--color-card-bg, #ffffff);
                    border: 4px solid var(--color-border, #111827);
                    box-shadow: 6px 6px 0 var(--color-border, #111827);
                    width: 100%;
                    max-width: 380px;
                    padding: 28px 24px 24px;
                    position: relative;
                    text-align: center;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    animation: ecmPopIn 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                }
                @keyframes ecmPopIn {
                    from { opacity: 0; transform: scale(0.9) translateY(10px); }
                    to { opacity: 1; transform: scale(1) translateY(0); }
                }
                .ecm-close {
                    position: absolute;
                    top: 10px;
                    right: 10px;
                    background: var(--color-surface-soft, #f3f4f6);
                    border: 2px solid var(--color-border, #111827);
                    color: var(--color-text);
                    width: 34px;
                    height: 34px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    z-index: 10;
                    transition: all 0.15s;
                }
                .ecm-close:active {
                    background: var(--color-border, #111827);
                    color: var(--color-text-inv);
                }
                .ecm-mascot {
                    margin-bottom: 8px;
                }
                .ecm-icon-wrap {
                    width: 52px;
                    height: 52px;
                    background: var(--color-surface-soft, #FEF2F2);
                    border: 3px solid #EF4444;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin-bottom: 14px;
                }
                .ecm-title {
                    font-weight: 900;
                    font-size: 1.3rem;
                    color: var(--color-text, #111827);
                    margin: 0 0 6px;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    font-family: var(--game-font-family, inherit);
                }
                .ecm-desc {
                    font-weight: 500;
                    font-size: 0.9rem;
                    color: var(--color-text-muted, #6b7280);
                    margin: 0 0 20px;
                    line-height: 1.5;
                    max-width: 280px;
                }
                .ecm-actions {
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                    width: 100%;
                }
                .ecm-btn-stay {
                    width: 100%;
                    padding: 14px 20px;
                    background: #FACC15;
                    border: 3px solid var(--color-border, #111827);
                    color: #000;
                    font-weight: 900;
                    font-size: 0.9rem;
                    cursor: pointer;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    font-family: var(--game-font-family, inherit);
                    box-shadow: 4px 4px 0 var(--color-border, #111827);
                    transition: all 0.15s;
                }
                .ecm-btn-stay:active {
                    transform: translateY(3px);
                    box-shadow: 1px 1px 0 var(--color-border, #111827);
                }
                .ecm-btn-exit {
                    width: 100%;
                    padding: 12px 20px;
                    background: transparent;
                    border: 2px solid var(--color-border-soft, #d1d5db);
                    color: #EF4444;
                    font-weight: 800;
                    font-size: 0.85rem;
                    cursor: pointer;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    font-family: var(--game-font-family, inherit);
                    transition: all 0.15s;
                }
                .ecm-btn-exit:active {
                    background: rgba(239, 68, 68, 0.1);
                    border-color: #EF4444;
                }
            `}</style>
        </div>
    );
};

export default ExitConfirmModal;
