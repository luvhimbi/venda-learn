import React, { useState } from 'react';
import { Star, X, MessageSquare, Send } from 'lucide-react';
import { db, auth } from '../services/firebaseConfig';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import Mascot from './Mascot';
import { popupService } from '../services/popupService';
import JuicyButton from './JuicyButton';

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
            popupService.error('Missing Rating', 'Please select at least one star!');
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
                'Ndi khwine!', 
                'Thank you for your feedback! Your review helps us make the platform better for everyone.',
                'Awesome'
            );
            onClose();
        } catch (error) {
            console.error("Error submitting review:", error);
            popupService.error('Submission Failed', 'Could not save your review. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center bg-black bg-opacity-50" style={{ zIndex: 2000, backdropFilter: 'blur(4px)' }}>
            <div className="bg-white rounded-5 shadow-2xl overflow-hidden animate__animated animate__zoomIn" style={{ maxWidth: '500px', width: '95%' }}>
                
                {/* Header with Gradient */}
                <div className="bg-warning bg-opacity-10 p-4 border-bottom border-warning border-opacity-20 d-flex justify-content-between align-items-center">
                    <div className="d-flex align-items-center gap-2">
                        <MessageSquare size={20} className="text-warning" />
                        <h5 className="fw-bold mb-0 text-dark ls-tight">Share Your Experience</h5>
                    </div>
                    <button onClick={onClose} className="btn btn-link text-muted p-0 shadow-none">
                        <X size={24} />
                    </button>
                </div>

                <div className="p-4 p-md-5 text-center">
                    <div className="mb-4">
                        <Mascot mood={rating >= 4 ? 'excited' : rating >= 2 ? 'happy' : 'happy'} width="120px" height="120px" />
                    </div>

                    <p className="text-muted small mb-4">
                        How are you enjoying your Tshivenḓa journey so far, <span className="fw-bold text-dark">{username}</span>?
                    </p>

                    <form onSubmit={handleSubmit}>
                        {/* Star Rating */}
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
                                        size={42}
                                        fill={(hover || rating) >= star ? "#FACC15" : "none"}
                                        color={(hover || rating) >= star ? "#FACC15" : "#E2E8F0"}
                                        strokeWidth={2}
                                        className="transition-all"
                                        style={{ transform: (hover || rating) >= star ? 'scale(1.1)' : 'scale(1)' }}
                                    />
                                </button>
                            ))}
                        </div>

                        <div className="mb-4">
                            <textarea
                                className="form-control rounded-4 border-2 bg-light p-3 small"
                                style={{ minHeight: '120px', resize: 'none', borderColor: '#F3F4F6' }}
                                placeholder="What's working well? What can we improve? (Optional)"
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                            />
                        </div>

                        <div className="d-flex gap-3">
                            <button 
                                type="button" 
                                className="btn btn-light rounded-pill px-4 py-3 fw-bold flex-grow-1 text-muted border"
                                onClick={onClose}
                            >
                                CANCEL
                            </button>
                            <JuicyButton
                                type="submit"
                                className="btn btn-warning rounded-pill px-4 py-3 fw-bold flex-grow-1 text-dark shadow-sm d-flex align-items-center justify-content-center gap-2"
                                disabled={submitting || rating === 0}
                            >
                                {submitting ? (
                                    <span className="spinner-border spinner-border-sm"></span>
                                ) : (
                                    <><Send size={18} /> SUBMIT</>
                                )}
                            </JuicyButton>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ReviewModal;
