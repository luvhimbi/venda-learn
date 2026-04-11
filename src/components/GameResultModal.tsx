import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Star, ArrowRight, RotateCcw, Sparkles } from 'lucide-react';
import Mascot from './Mascot';

interface GameResultModalProps {
    isOpen: boolean;
    isSuccess: boolean;
    title: string;
    message: string;
    points?: number;
    primaryActionText: string;
    secondaryActionText?: string;
    onPrimaryAction: () => void;
    onSecondaryAction?: () => void;
}

const GameResultModal: React.FC<GameResultModalProps> = ({
    isOpen,
    isSuccess,
    title,
    message,
    points,
    primaryActionText,
    secondaryActionText,
    onPrimaryAction,
    onSecondaryAction
}) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center p-3" style={{ zIndex: 3000 }}>
                    <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        exit={{ opacity: 0 }}
                        className="position-absolute top-0 start-0 w-100 h-100"
                        style={{ backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(5px)' }}
                    />
                    
                    <motion.div 
                        initial={{ scale: 0.8, y: 50, opacity: 0 }}
                        animate={{ scale: 1, y: 0, opacity: 1 }}
                        exit={{ scale: 0.8, y: 50, opacity: 0 }}
                        className="brutalist-card bg-white p-4 p-md-5 w-100 text-center shadow-action-lg position-relative overflow-hidden"
                        style={{ maxWidth: '500px' }}
                    >
                        {/* Decorative Background Elements */}
                        {isSuccess && (
                            <div className="position-absolute top-0 start-0 w-100 h-100 opacity-10 pointer-events-none">
                                <Sparkles className="position-absolute" style={{ top: '10%', left: '10%' }} size={40} />
                                <Star className="position-absolute" style={{ top: '20%', right: '15%' }} size={32} />
                                <Trophy className="position-absolute" style={{ bottom: '15%', left: '20%' }} size={36} />
                            </div>
                        )}

                        <div className="mb-4 d-flex justify-content-center">
                            <Mascot 
                                width="140px" 
                                height="140px" 
                                mood={isSuccess ? "excited" : "sad"} 
                            />
                        </div>

                        <div className={`badge ${isSuccess ? 'bg-warning' : 'bg-danger'} text-dark border border-dark border-2 rounded-pill px-4 py-2 smallest fw-black ls-1 uppercase mb-3 shadow-action-sm`}>
                            {isSuccess ? 'MUWINA! (WINNER)' : 'LOSE (TRY AGAIN)'}
                        </div>

                        <h1 className="fw-black mb-2 text-dark ls-tight uppercase" style={{ fontSize: '2.5rem' }}>
                            {title}
                        </h1>
                        
                        <div className="fw-bold text-muted mb-4 fs-6" dangerouslySetInnerHTML={{ __html: message || '' }}></div>

                        {points !== undefined && isSuccess && (
                            <div className="brutalist-card bg-warning p-3 mb-5 shadow-action-sm d-inline-flex align-items-center gap-3">
                                <div className="p-2 bg-white rounded-circle border border-2 border-dark">
                                    <Star className="text-warning fill-warning" size={24} strokeWidth={3} />
                                </div>
                                <div className="text-start">
                                    <span className="smallest fw-black text-dark opacity-75 uppercase d-block">Reward earned</span>
                                    <span className="fw-black text-dark fs-4">+{points} XP</span>
                                </div>
                            </div>
                        )}

                        <div className="d-grid gap-3 mt-2">
                            <button 
                                onClick={(e) => { e.stopPropagation(); onPrimaryAction(); }} 
                                className={`btn-game ${isSuccess ? 'btn-game-warning' : 'btn-game-primary'} py-4 smallest fw-black uppercase d-flex align-items-center justify-content-center gap-2`}
                            >
                                <RotateCcw size={20} strokeWidth={4} />
                                {primaryActionText}
                            </button>
                            
                            {secondaryActionText && onSecondaryAction && (
                                <button 
                                    onClick={(e) => { e.stopPropagation(); onSecondaryAction(); }} 
                                    className="btn-game btn-game-white py-3 smallest fw-black uppercase d-flex align-items-center justify-content-center gap-2"
                                >
                                    <ArrowRight size={20} strokeWidth={4} />
                                    {secondaryActionText}
                                </button>
                            )}
                        </div>

                        {!isSuccess && onSecondaryAction && !secondaryActionText && (
                            <button 
                                onClick={(e) => { e.stopPropagation(); onSecondaryAction(); }} 
                                className="btn border-0 text-muted smallest fw-bold mt-4 uppercase text-decoration-underline hover-opacity"
                            >
                                BACK TO DASHBOARD
                            </button>
                        )}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default GameResultModal;
