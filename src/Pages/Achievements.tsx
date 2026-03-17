import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ALL_TROPHIES } from '../services/achievementService';
import { fetchUserData } from '../services/dataCache';
import AchievementCard from '../components/AchievementCard';
import SharePreviewModal from '../components/SharePreviewModal';
import { ArrowLeft, Info, Trophy as TrophyIconLucide } from 'lucide-react';
import SEO from '../components/SEO';

const Achievements: React.FC = () => {
    const [userData, setUserData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [selectedTrophy, setSelectedTrophy] = useState<any>(null);
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const loadData = async () => {
            const data = await fetchUserData();
            setUserData(data);
            setLoading(false);
        };
        loadData();
    }, []);

    const calculateProgress = (trophy: any) => {
        if (!userData) return 0;
        const { type, value } = trophy.requirement;
        let current = 0;

        switch (type) {
            case 'login': current = 1; break;
            case 'level': current = userData.level || 1; break;
            case 'points': current = userData.points || 0; break;
            case 'streak': current = userData.streak || 0; break;
            case 'lessons': current = userData.completedLessons?.length || 0; break;
            default: current = 0;
        }

        const percentage = Math.min(Math.round((current / value) * 100), 100);
        return percentage;
    };

    const handleShare = (trophyId: string) => {
        const trophy = ALL_TROPHIES.find(t => t.id === trophyId);
        if (trophy) {
            setSelectedTrophy(trophy);
            setIsShareModalOpen(true);
        }
    };

    if (loading) return (
        <div className="min-vh-100 bg-white d-flex justify-content-center align-items-center">
            <div className="spinner-border text-venda"></div>
        </div>
    );

    const earnedCount = userData?.trophies?.length || 0;
    const totalCount = ALL_TROPHIES.length;

    return (
        <div className="achievements-page bg-light min-vh-100 pb-5">
            <SEO 
                title="Trophies & Achievements" 
                description="View your VendaLearn collection and track your progress to mastery."
            />

            {/* TIGHTER HEADER */}
            <div className="bg-white border-bottom py-3 sticky-top shadow-sm">
                <div className="container" style={{ maxWidth: '1000px' }}>
                    <div className="d-flex align-items-center justify-content-between">
                        <button 
                            onClick={() => navigate(-1)} 
                            className="btn btn-back-round d-flex align-items-center justify-content-center"
                        >
                            <ArrowLeft size={18} />
                        </button>
                        <div className="text-center">
                            <h5 className="fw-bold mb-0 text-dark ls-tight">Venda Collection</h5>
                            <p className="smallest fw-bold text-muted text-uppercase ls-1 mb-0">Trophies & Achievements</p>
                        </div>
                        <div className="px-3 py-1 bg-warning bg-opacity-10 rounded-pill border border-warning border-opacity-20 d-flex align-items-center gap-2">
                            <TrophyIconLucide size={14} className="text-warning" />
                            <span className="small fw-bold text-dark">{earnedCount}/{totalCount}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mt-4" style={{ maxWidth: '1000px' }}>
                {/* COMPACT HERO */}
                <div className="row mb-4 g-4">
                    <div className="col-12">
                        <div className="card border-0 shadow-sm rounded-4 overflow-hidden bg-dark text-white p-4 position-relative">
                            <div className="position-relative z-2">
                                <h1 className="h2 fw-bold mb-1">Hall of Fame</h1>
                                <p className="small opacity-75 mb-0">
                                    Your journey of dedication to Venda heritage.
                                </p>
                            </div>
                            <div className="position-absolute end-0 top-0 h-100 p-4 opacity-10">
                                <TrophyIconLucide size={100} strokeWidth={1} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* GRID WITH BETTER DENSITY */}
                <div className="row g-3 mb-5">
                    {ALL_TROPHIES.map(trophy => {
                        const isEarned = (userData?.trophies || []).includes(trophy.id);
                        const progress = calculateProgress(trophy);
                        
                        return (
                            <div key={trophy.id} className="col-12 col-md-4">
                                <AchievementCard 
                                    id={trophy.id}
                                    title={trophy.title}
                                    description={trophy.description}
                                    color={trophy.color}
                                    isEarned={isEarned}
                                    progress={progress}
                                    rarity={trophy.rarity as any}
                                    onShare={handleShare}
                                />
                            </div>
                        );
                    })}
                </div>

                <div className="text-center pb-5">
                    <p className="small text-muted d-flex align-items-center justify-content-center gap-2">
                        <Info size={14} /> New trophies are added regularly as your journey expands.
                    </p>
                </div>
            </div>

            {/* SHARED MODAL */}
            <SharePreviewModal 
                isOpen={isShareModalOpen}
                onClose={() => setIsShareModalOpen(false)}
                title={selectedTrophy?.title}
                category="ACHIEVEMENT EARNED"
                trophy={selectedTrophy ? {
                    rarity: selectedTrophy.rarity,
                    color: selectedTrophy.color
                } : null}
            />

            <style>{`
                .ls-tight { letter-spacing: -1px; }
                .ls-1 { letter-spacing: 1px; }
                .smallest { font-size: 11px; }
                .uppercase { text-transform: uppercase; }
                .btn-back-round {
                    width: 44px;
                    height: 44px;
                    border-radius: 12px;
                    background-color: #f8fafc;
                    border: 1px solid #e2e8f0;
                    color: #64748b;
                    transition: all 0.2s;
                }
                .btn-back-round:hover {
                    background-color: #f1f5f9;
                    color: #1e293b;
                    transform: translateX(-3px);
                }
            `}</style>
        </div>
    );
};

export default Achievements;
