import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../services/firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';

interface StoryData {
    title: string;
    vendaTitle: string;
    category: string;
    era: string;
    readTime: string;
    content: string;
    imageUrl?: string;
    thumbnailEmoji: string;
}

const HistoryDetail: React.FC = () => {
    const { storyId } = useParams();
    const navigate = useNavigate();
    const [story, setStory] = useState<StoryData | null>(null);
    const [loading, setLoading] = useState(true);
    const [imgError, setImgError] = useState(false);

    useEffect(() => {
        const fetchStory = async () => {
            if (!storyId) return;
            try {
                const docSnap = await getDoc(doc(db, "history", storyId));
                if (docSnap.exists()) {
                    setStory(docSnap.data() as StoryData);
                } else {
                    navigate('/history');
                }
            } catch (error) {
                console.error("Error fetching story:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchStory();
    }, [storyId, navigate]);

    if (loading) return (
        <div className="min-vh-100 bg-white d-flex justify-content-center align-items-center">
            <div className="spinner-border text-warning" role="status"></div>
        </div>
    );

    if (!story) return null;

    return (
        <div className="bg-white min-vh-100 pb-5">
            {/* ENHANCED IMAGE SECTION */}
            <div className="image-hero-container position-relative w-100 overflow-hidden shadow-sm">
                {!imgError && story.imageUrl ? (
                    <>
                        <img
                            src={story.imageUrl}
                            alt="Background Blur"
                            className="img-blur-layer"
                        />
                        <img
                            src={story.imageUrl}
                            alt={story.title}
                            className="img-main-focus"
                            onError={() => setImgError(true)}
                        />
                        {/* COPYRIGHT SHORT NOTICE */}
                        <div className="position-absolute bottom-0 end-0 m-2 z-3">
                            <span className="copyright-tag">Image source: External</span>
                        </div>
                    </>
                ) : (
                    <div className="w-100 h-100 bg-light d-flex flex-column align-items-center justify-content-center">
                        <span style={{ fontSize: '80px' }}>{story.thumbnailEmoji}</span>
                        <p className="smallest-print text-muted mt-2 fw-bold ls-1">NO IMAGE AVAILABLE</p>
                    </div>
                )}

                <button
                    onClick={() => navigate('/history')}
                    className="btn btn-back-blur position-absolute top-0 start-0 m-4"
                >
                    <i className="bi bi-arrow-left"></i>
                </button>

                <div className="position-absolute bottom-0 start-0 w-100 p-4 img-gradient-overlay">
                    <span className="badge-venda">{story.category}</span>
                </div>
            </div>

            <div className="container mt-5" style={{ maxWidth: '750px' }}>
                <header className="mb-5">
                    <div className="d-flex align-items-center gap-3 mb-3">
                        <span className="meta-tag">{story.era}</span>
                        <div className="dot-separator"></div>
                        <span className="meta-tag">{story.readTime} MINUTES READ</span>
                    </div>
                    <h1 className="display-5 fw-bold ls-tight mb-2 text-dark">{story.title}</h1>
                    <p className="venda-subtitle">{story.vendaTitle}</p>
                </header>

                <article className="article-content">
                    {story.content.split('\n').map((paragraph, idx) => (
                        paragraph && <p key={idx} className="content-paragraph">{paragraph}</p>
                    ))}
                </article>

                {/* COPYRIGHT & TAKEDOWN DISCLAIMER */}
                <div className="mt-5 p-4 rounded-4 bg-light border-0">
                    <div className="d-flex gap-3">
                        <i className="bi bi-info-circle-fill text-muted fs-4"></i>
                        <div>
                            <h6 className="fw-bold smallest-print ls-1 uppercase mb-1">Copyright Notice</h6>
                            <p className="text-muted mb-0" style={{ fontSize: '12px', lineHeight: '1.5' }}>
                                We do not own the copyrights to the images used in this section. All visual content is used for educational purposes to preserve Venda culture.
                                <strong> If you are the owner of this image and would like it removed, please contact us immediately and we will take it down.</strong>
                            </p>
                        </div>
                    </div>
                </div>

                <div className="footer-nav mt-5 pt-5 border-top d-flex justify-content-between align-items-center">
                    <div className="d-flex align-items-center gap-3">
                        <div className="cat-icon-small">{story.thumbnailEmoji}</div>
                        <div>
                            <p className="smallest-print text-muted mb-0 uppercase ls-1">Culture Type</p>
                            <h6 className="fw-bold mb-0">{story.category}</h6>
                        </div>
                    </div>
                    <button
                        onClick={() => navigate(`/history/edit/${storyId}`)}
                        className="btn btn-edit-venda"
                    >
                        EDIT CONTENT
                    </button>
                </div>
            </div>

            <style>{`
                .image-hero-container {
                    height: 45vh;
                    min-height: 350px;
                    background-color: #111827;
                }
                .img-blur-layer {
                    position: absolute;
                    width: 110%;
                    height: 110%;
                    object-fit: cover;
                    filter: blur(20px) brightness(0.6);
                    left: -5%;
                    top: -5%;
                }
                .img-main-focus {
                    position: relative;
                    width: 100%;
                    height: 100%;
                    object-fit: contain;
                    z-index: 1;
                }
                .img-gradient-overlay {
                    background: linear-gradient(transparent, rgba(0,0,0,0.7));
                    z-index: 2;
                }
                .copyright-tag {
                    font-size: 9px;
                    color: rgba(255,255,255,0.6);
                    background: rgba(0,0,0,0.4);
                    padding: 2px 8px;
                    border-radius: 4px;
                    font-family: 'Poppins', sans-serif;
                }

                .btn-back-blur {
                    background: rgba(255, 255, 255, 0.2);
                    backdrop-filter: blur(10px);
                    border: 1px solid rgba(255, 255, 255, 0.3);
                    color: white;
                    width: 45px;
                    height: 45px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 3;
                }
                .badge-venda {
                    background: #FACC15;
                    color: #111827;
                    padding: 6px 16px;
                    border-radius: 8px;
                    font-size: 11px;
                    font-weight: 800;
                    letter-spacing: 1.5px;
                    text-transform: uppercase;
                }

                .ls-tight { letter-spacing: -2px; }
                .ls-1 { letter-spacing: 1px; }
                .smallest-print { font-size: 11px; font-family: 'Poppins', sans-serif; }
                .uppercase { text-transform: uppercase; }
                
                .venda-subtitle { font-size: 1.25rem; color: #EAB308; font-weight: 600; }
                .content-paragraph {
                    font-size: 1.15rem;
                    line-height: 1.8;
                    color: #374151;
                    margin-bottom: 1.5rem;
                }
                
                .btn-edit-venda {
                    border: 2px solid #E5E7EB;
                    border-radius: 12px;
                    padding: 8px 20px;
                    font-size: 11px;
                    font-weight: 700;
                    letter-spacing: 1px;
                }
            `}</style>
        </div>
    );
};

export default HistoryDetail;