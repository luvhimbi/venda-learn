import React, { useState } from 'react';
import { Star, X,  Send, Heart } from 'lucide-react';
import { db, auth } from '../../../services/firebaseConfig';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import Mascot from '../../../features/gamification/components/Mascot';
import { popupService } from '../../../services/popupService';
import JuicyButton from '../../../components/ui/JuicyButton/JuicyButton';

interface ReviewModalProps {
    onClose: () => void;
    username: string;
}

const ReviewModal: React.FC<ReviewModalProps> = ({ onClose, username }) => {
    const [rating, setRating] = useState(0);
    const [hover, setHover] = useState(0);
    const [comment, setComment] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (rating === 0) {
            popupService.error('Missing Rating', 'Give us some stars, chommie!');
            return;
        }
        if (!auth.currentUser) return;

        setSubmitting(true);
        try {
            await setDoc(doc(db, "reviews", auth.currentUser.uid), {
                uid: auth.currentUser.uid,
                username: username,
                rating,
                comment,
                timestamp: serverTimestamp()
            });

            popupService.innerSuccess(
                'Lekker!',
                'Thanks for the feedback! You’re helping us build the best companion in Mzansi.',
                'Sharp!'
            );
            onClose();
        } catch (error) {
            console.error("Error:", error);
            popupService.error('Eish!', 'Something went wrong. Give it another shot?');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div
            className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
            style={{
                zIndex: 9999,
                backdropFilter: 'blur(10px)',
                backgroundColor: 'rgba(255, 255, 255, 0.3)'
            }}
        >
            <div
                className="bg-white rounded-5 shadow-2xl overflow-hidden animate__animated animate__bounceIn border border-4 border-dark"
                style={{
                    maxWidth: '480px',
                    width: '95%',
                    boxShadow: '15px 15px 0px rgba(0,0,0,0.1)'
                }}
            >

                {/* Header: "The Shout-Out" */}
                <div className="bg-warning p-3 border-bottom border-4 border-dark d-flex justify-content-between align-items-center">
                    <div className="d-flex align-items-center gap-2">
                        <Heart size={20} fill="black" />
                        <h5 className="fw-black mb-0 text-dark text-uppercase ls-tight">Rate the Trip</h5>
                    </div>
                    <button onClick={onClose} className="btn p-0 border-0 shadow-none">
                        <X size={28} color="black" strokeWidth={3} />
                    </button>
                </div>

                <div className="p-4 p-md-5 text-center">
                    <div className="mb-3 mascot-container">
                        <Mascot
                            mood={rating >= 4 ? 'excited' : rating >= 2 ? 'happy' : 'happy'}
                            width="130px"
                            height="130px"
                        />
                    </div>

                    <h3 className="fw-black text-dark mb-1">How’s the vibe, {username}?</h3>
                    <p className="text-muted fw-bold mb-4">
                        Is your language journey feeling lekker?
                    </p>

                    <form onSubmit={handleSubmit}>
                        {/* Mzansi Star Rating */}
                        <div className="d-flex justify-content-center gap-2 mb-4">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    className="btn p-0 border-0 shadow-none bg-transparent"
                                    onClick={() => setRating(star)}
                                    onMouseEnter={() => setHover(star)}
                                    onMouseLeave={() => setHover(0)}
                                >
                                    <Star
                                        size={46}
                                        fill={(hover || rating) >= star ? "#FACC15" : "white"}
                                        color="black"
                                        strokeWidth={3}
                                        style={{
                                            transform: (hover || rating) >= star ? 'scale(1.15) rotate(5deg)' : 'scale(1)',
                                            transition: 'all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                                        }}
                                    />
                                </button>
                            ))}
                        </div>

                        <div className="mb-4">
                            <textarea
                                className="form-control rounded-4 border-3 border-dark bg-light p-3 fw-bold"
                                style={{ minHeight: '100px', resize: 'none' }}
                                placeholder="Any suggestions for the crew? (Optional)"
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                            />
                        </div>

                        <div className="d-flex flex-column flex-sm-row gap-3">
                            <button
                                type="button"
                                className="btn btn-link text-dark fw-black text-decoration-none order-2 order-sm-1"
                                onClick={onClose}
                            >
                                SKIP FOR NOW
                            </button>
                            <JuicyButton
                                type="submit"
                                className="chommie-btn-submit order-1 order-sm-2 flex-grow-1"
                                disabled={submitting || rating === 0}
                            >
                                {submitting ? (
                                    <span className="spinner-border spinner-border-sm"></span>
                                ) : (
                                    <>SEND IT! <Send size={18} /></>
                                )}
                            </JuicyButton>
                        </div>
                    </form>
                </div>
            </div>

            <style>{`
                .fw-black { font-weight: 900; }
                .ls-tight { letter-spacing: -1px; }
                
                .mascot-container {
                    filter: drop-shadow(0 10px 10px rgba(0,0,0,0.1));
                }

                .chommie-btn-submit {
                    background-color: #FACC15 !important;
                    color: #000 !important;
                    border: 3px solid #000 !important;
                    border-radius: 50px !important;
                    padding: 12px 24px !important;
                    font-weight: 900 !important;
                    display: flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                    gap: 10px !important;
                    box-shadow: 5px 5px 0px #000 !important;
                    transition: all 0.1s !important;
                }

                .chommie-btn-submit:active {
                    transform: translate(3px, 3px) !important;
                    box-shadow: 0px 0px 0px #000 !important;
                }

                .chommie-btn-submit:disabled {
                    background-color: #e2e8f0 !important;
                    border-color: #cbd5e1 !important;
                    box-shadow: none !important;
                    cursor: not-allowed;
                }
            `}</style>
        </div>
    );
};

export default ReviewModal;





