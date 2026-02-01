import React, { useEffect, useState } from 'react';
import { db, auth } from '../services/firebaseConfig';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';

interface HistoryStory {
    id: string;
    title: string;
    vendaTitle: string;
    category: 'History' | 'Food' | 'Dance' | 'Attire';
    era?: string;
    readTime: string;
    thumbnailEmoji: string;
    imageUrl?: string;
}

const HistoryList: React.FC = () => {
    const navigate = useNavigate();
    const [stories, setStories] = useState<HistoryStory[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState<string>('All');
    const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

    const categories = ['All', 'History', 'Food', 'Dance', 'Attire'];

    useEffect(() => {
        // Check Auth State
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setIsLoggedIn(!!user);
        });

        const fetchHistory = async () => {
            try {
                const q = query(collection(db, "history"), orderBy("order", "asc"));
                const querySnapshot = await getDocs(q);
                const data = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })) as HistoryStory[];
                setStories(data);
            } catch (error) {
                console.error("Error fetching cultural data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();
        return () => unsubscribe();
    }, []);

    const filteredStories = activeFilter === 'All'
        ? stories
        : stories.filter(s => s.category === activeFilter);

    if (loading) return (
        <div className="min-vh-100 bg-white d-flex justify-content-center align-items-center">
            <div className="spinner-border" style={{ color: '#FACC15' }}></div>
        </div>
    );

    // --- LOGGED OUT UI ---
    if (isLoggedIn === false) {
        return (
            <div className="bg-white min-vh-100 py-5 d-flex align-items-center">
                <div className="container" style={{ maxWidth: '600px' }}>
                    <div className="text-center p-5 rounded-5 shadow-sm border border-light">
                        <div className="mb-4 display-4">🏺</div>
                        <h2 className="fw-bold ls-tight mb-3">Venda Heritage</h2>
                        <p className="text-muted mb-4 small ls-1">
                            Explore the sacred history, traditional food, and dances of the Vhavenda people.
                            Please log in to access the full cultural archives.
                        </p>
                        <div className="d-grid gap-3">
                            <button
                                onClick={() => navigate('/login')}
                                className="btn game-btn-primary py-3 fw-bold smallest-print ls-2"
                            >
                                LOG IN TO EXPLORE
                            </button>
                            <button
                                onClick={() => navigate('/register')}
                                className="btn btn-outline-dark border-2 py-3 fw-bold smallest-print ls-2 rounded-3"
                            >
                                CREATE ACCOUNT
                            </button>
                        </div>
                        <button
                            onClick={() => navigate('/')}
                            className="btn btn-link mt-4 text-muted smallest-print fw-bold ls-1 text-decoration-none"
                        >
                            <i className="bi bi-arrow-left"></i> BACK TO HOME
                        </button>
                    </div>
                </div>
                <style>{`
                    .game-btn-primary { 
                        background-color: #FACC15 !important; 
                        color: #111827 !important; 
                        border: none !important; 
                        border-radius: 12px; 
                        box-shadow: 0 4px 0 #EAB308 !important; 
                    }
                    .game-btn-primary:active { transform: translateY(2px); box-shadow: 0 2px 0 #EAB308 !important; }
                    .ls-tight { letter-spacing: -1.5px; }
                    .ls-1 { letter-spacing: 1px; }
                    .ls-2 { letter-spacing: 2px; }
                    .smallest-print { font-size: 11px; font-family: 'Poppins', sans-serif; text-transform: uppercase; }
                `}</style>
            </div>
        );
    }

    // --- LOGGED IN UI ---
    return (
        <div className="bg-white min-vh-100 py-5">
            <div className="container" style={{ maxWidth: '900px' }}>

                {/* NAVIGATION */}
                <button
                    className="btn btn-link text-decoration-none p-0 mb-5 d-flex align-items-center gap-2 text-dark fw-bold smallest-print ls-2 uppercase"
                    onClick={() => navigate('/')}
                >
                    <i className="bi bi-arrow-left"></i> Murahu
                </button>

                {/* HEADER */}
                <header className="mb-4">
                    <p className="smallest-print fw-bold text-muted mb-1 ls-2 uppercase">Ḓivhazwakale na Mvelele</p>
                    <h2 className="fw-bold mb-0 ls-tight">CULTURE & HERITAGE</h2>
                    <p className="text-muted small mt-2">Explore the rich traditions, flavors, and stories of the Vhavenda.</p>
                </header>

                {/* CATEGORY FILTER PILLS */}
                <div className="d-flex gap-2 mb-5 overflow-auto pb-2 no-scrollbar">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setActiveFilter(cat)}
                            className={`btn rounded-pill px-3 py-1 fw-bold smallest-print ls-1 uppercase transition-all ${activeFilter === cat ? 'bg-dark text-white' : 'bg-light text-muted'}`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                {/* CONTENT LIST */}
                <div className="row g-4">
                    {filteredStories.length > 0 ? (
                        filteredStories.map((story) => (
                            <div key={story.id} className="col-12">
                                <div
                                    className="story-hover transition-all border rounded-4 overflow-hidden d-flex flex-column flex-md-row"
                                    style={{ cursor: 'pointer', minHeight: '140px' }}
                                    onClick={() => navigate(`/history/${story.id}`)}
                                >
                                    {/* IMAGE BUCKET */}
                                    <div className="bg-light d-flex align-items-center justify-content-center position-relative"
                                         style={{ width: '100%', maxWidth: '200px', minHeight: '140px' }}>
                                        {story.imageUrl ? (
                                            <img src={story.imageUrl} alt={story.title} className="w-100 h-100 object-fit-cover" />
                                        ) : (
                                            <span className="display-4 opacity-50">{story.thumbnailEmoji || '🏺'}</span>
                                        )}
                                        <div className="position-absolute top-0 start-0 m-2">
                                            <span className="badge bg-white text-dark smallest-print border fw-bold">{story.category}</span>
                                        </div>
                                    </div>

                                    {/* TEXT CONTENT */}
                                    <div className="p-4 flex-grow-1 d-flex flex-column justify-content-center text-start">
                                        <div className="d-flex align-items-center gap-2 mb-1">
                                            <span className="smallest-print fw-bold ls-1 text-warning uppercase">{story.era || 'Tradition'}</span>
                                            <span className="smallest-print text-muted">• {story.readTime}</span>
                                        </div>
                                        <h5 className="fw-bold mb-1 text-dark">{story.title}</h5>
                                        <p className="text-muted smallest-print fw-bold uppercase ls-1 mb-0">{story.vendaTitle}</p>
                                    </div>

                                    <div className="d-flex align-items-center pe-4 d-none d-md-flex">
                                        <i className="bi bi-arrow-right-short fs-3 text-muted"></i>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-5">
                            <p className="text-muted small">No items found in this category.</p>
                        </div>
                    )}
                </div>

                {/* CALL TO ACTION */}
                <div className="mt-5 p-4 bg-light rounded-4 text-center border-0">
                    <p className="smallest-print fw-bold text-muted ls-1 uppercase mb-2">Did you know?</p>
                    <p className="small mb-0 italic" style={{ fontSize: '13px' }}>
                        "The Domba dance is often referred to as the 'Python Dance' and is a significant part of Vhavenda initiation ceremonies."
                    </p>
                </div>
            </div>

            <style>{`
                .ls-tight { letter-spacing: -1.5px; }
                .ls-1 { letter-spacing: 1px; }
                .ls-2 { letter-spacing: 2px; }
                .smallest-print { font-size: 10px; font-family: 'Poppins', sans-serif; }
                .uppercase { text-transform: uppercase; }
                .no-scrollbar::-webkit-scrollbar { display: none; }
                
                .story-hover {
                    border: 1px solid #eee !important;
                    background: #fff;
                }

                .story-hover:hover {
                    border-color: #FACC15 !important;
                    transform: translateX(5px);
                    box-shadow: 0 10px 20px rgba(0,0,0,0.05);
                }
                
                .object-fit-cover { object-fit: cover; }
                .transition-all { transition: all 0.25s ease-in-out; }

                .game-btn-primary { 
                    background-color: #FACC15 !important; 
                    color: #111827 !important; 
                    border: none !important; 
                    border-radius: 8px; 
                    box-shadow: 0 3px 0 #EAB308 !important; 
                }
                .game-btn-primary:active { transform: translateY(2px); box-shadow: 0 1px 0 #EAB308 !important; }
            `}</style>
        </div>
    );
};

export default HistoryList;