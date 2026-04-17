import React, { useState, useEffect } from 'react';
import AdminNavbar from '../../components/shared/navigation/AdminNavbar';
import { fetchReviews, deleteReview } from '../../services/dataCache';
import { Star, Trash2, User, Clock, MessageSquare, Loader2 } from 'lucide-react';
import { popupService } from '../../services/popupService';

const AdminReviews: React.FC = () => {
    const [reviews, setReviews] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const loadReviews = async () => {
        setLoading(true);
        try {
            const data = await fetchReviews();
            setReviews(data);
        } catch (error) {
            console.error("Error loading reviews:", error);
            popupService.error('Fetch Failed', 'Could not load reviews.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadReviews();
    }, []);

    const handleDelete = async (id: string) => {
        const confirm = await popupService.confirm(
            'Delete Review?',
            'This action cannot be undone. The user can still submit a new review later.',
            'Delete',
            'Keep'
        );

        if (confirm.isConfirmed) {
            try {
                await deleteReview(id);
                setReviews(prev => prev.filter(r => r.id !== id));
                popupService.innerSuccess('Deleted', 'Review has been removed.');
            } catch (error) {
                popupService.error('Delete Failed', 'Could not delete the review.');
            }
        }
    };

    const formatDate = (timestamp: any) => {
        if (!timestamp) return 'Just now';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const renderStars = (rating: number) => {
        return [...Array(5)].map((_, i) => (
            <Star 
                key={i} 
                size={14} 
                fill={i < rating ? "#FACC15" : "none"} 
                color={i < rating ? "#FACC15" : "#CBD5E1"} 
            />
        ));
    };

    return (
        <div className="min-vh-100 pb-5 bg-light">
            <AdminNavbar />

            {/* HEADER */}
            <div className="py-5 bg-white border-bottom shadow-sm">
                <div className="container" style={{ maxWidth: '1100px' }}>
                    <div className="px-3">
                        <span className="shumela-venda-pulse fw-bold ls-2 text-uppercase smallest d-block mb-2 text-warning">
                            User Feedback
                        </span>
                        <h1 className="fw-bold ls-tight mb-0 text-dark" style={{ fontSize: '2.5rem' }}>
                            User <span style={{ color: '#FACC15' }}>Reviews</span>
                        </h1>
                    </div>
                </div>
            </div>

            <div className="container py-5" style={{ maxWidth: '1100px' }}>
                {loading ? (
                    <div className="text-center py-5">
                        <Loader2 className="animate-spin text-warning mx-auto mb-3" size={48} />
                        <p className="ls-1 smallest fw-bold text-muted">COLLECTING FEEDBACK...</p>
                    </div>
                ) : (
                    <div className="row g-4 px-2">
                        {reviews.length > 0 ? reviews.map((review) => (
                            <div key={review.id} className="col-12 col-md-6 col-lg-4">
                                <div className="bg-white p-4 rounded-4 border shadow-sm h-100 d-flex flex-column transition-all hover-shadow">
                                    <div className="d-flex justify-content-between align-items-start mb-3">
                                        <div className="d-flex align-items-center gap-2">
                                            <div className="bg-light p-2 rounded-circle">
                                                <User size={18} className="text-muted" />
                                            </div>
                                            <div>
                                                <h6 className="fw-bold mb-0 text-dark small text-truncate" style={{ maxWidth: '120px' }}>
                                                    {review.username || 'Anonymous'}
                                                </h6>
                                                <div className="d-flex gap-1 mt-1">
                                                    {renderStars(review.rating)}
                                                </div>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => handleDelete(review.id)}
                                            className="btn btn-link text-danger p-1 shadow-none"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>

                                    <div className="flex-grow-1 mb-3">
                                        <div className="bg-light p-3 rounded-3 position-relative">
                                            <MessageSquare size={14} className="text-warning position-absolute top-0 start-0 translate-middle-y ms-3 bg-light" />
                                            <p className="small text-muted mb-0 italic" style={{ fontSize: '13px' }}>
                                                {review.comment ? `"${review.comment}"` : "No comment provided."}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="border-top pt-3 d-flex align-items-center gap-1 text-muted smallest fw-bold ls-1 text-uppercase">
                                        <Clock size={12} />
                                        {formatDate(review.timestamp)}
                                    </div>
                                </div>
                            </div>
                        )) : (
                            <div className="col-12 text-center py-5 bg-white rounded-4 border">
                                <MessageSquare size={48} className="text-muted mb-3 opacity-20" />
                                <p className="text-muted ls-1 fw-bold">No reviews found yet. Encourage your users to share their thoughts!</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <style>{`
                .ls-tight { letter-spacing: -1px; }
                .ls-1 { letter-spacing: 1px; }
                .ls-2 { letter-spacing: 2px; }
                .smallest { font-size: 10px; }
                .hover-shadow:hover { 
                    transform: translateY(-5px);
                    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1) !important;
                }
                .shumela-venda-pulse { animation: pulseAdmin 3s infinite ease-in-out; }
                @keyframes pulseAdmin { 0% { opacity: 0.7; } 50% { opacity: 1; } 100% { opacity: 0.7; } }
            `}</style>
        </div>
    );
};

export default AdminReviews;








