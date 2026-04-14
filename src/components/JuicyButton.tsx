import React, { useRef } from 'react';
import { useVisualJuice } from '../hooks/useVisualJuice';
import gsap from 'gsap';

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
    const buttonRef = useRef<HTMLButtonElement>(null);

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        // Trigger feedback
        if (!silent) playClick();
        triggerHaptic(hapticType);

        // Play snappy GSAP animation
        gsap.to(buttonRef.current, {
            scale: 0.92,
            duration: 0.1,
            ease: "power2.out",
            onComplete: () => {
                gsap.to(buttonRef.current, {
                    scale: 1,
                    duration: 0.4,
                    ease: "elastic.out(1, 0.3)"
                });
            }
        });

        // Execute original onClick
        if (onClick) onClick(e);
    };

    return (
        <button
            {...props}
            ref={buttonRef}
            onClick={handleClick}
            className={`juicy-btn ${className}`}
            style={{ 
                ...style,
                position: 'relative'
            }}
        >
            {children}
            
            <style>{`
                .juicy-btn {
                    transition: none; /* Let GSAP handle transforms */
                    will-change: transform;
                }
            `}</style>
        </button>
    );
};

export default JuicyButton;
