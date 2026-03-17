import React from 'react';
import { useVisualJuice } from '../hooks/useVisualJuice';

interface JuicyButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    children: React.ReactNode;
    hapticType?: 'light' | 'medium' | 'heavy';
    silent?: boolean;
}

/**
 * JuicyButton - A reusable button component that provides automatic 
 * audio and haptic feedback to enhance the tactile feel of the app.
 */
const JuicyButton: React.FC<JuicyButtonProps> = ({ 
    children, 
    hapticType = 'light', 
    silent = false, 
    onClick, 
    className = '', 
    style,
    ...props 
}) => {
    const { playClick, triggerHaptic } = useVisualJuice();

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        // Trigger feedback
        if (!silent) playClick();
        triggerHaptic(hapticType);

        // Execute original onClick
        if (onClick) onClick(e);
    };

    return (
        <button
            {...props}
            onClick={handleClick}
            className={`juicy-btn transition-all ${className}`}
            style={{ 
                ...style,
                position: 'relative'
            }}
        >
            {children}
            
            <style>{`
                .juicy-btn:active {
                    transform: scale(0.96);
                }
                .juicy-btn {
                    transition: transform 0.1s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                }
            `}</style>
        </button>
    );
};

export default JuicyButton;
