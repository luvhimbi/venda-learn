import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ALL_TROPHIES } from '../services/achievementService';
import { fetchUserData } from '../services/dataCache';
import AchievementCard from '../features/gamification/components/AchievementCard';
import SharePreviewModal from '../components/feedback/modals/SharePreviewModal';
import { ArrowLeft,  Trophy as TrophyIconLucide } from 'lucide-react';
import SEO from '../components/shared/SEO/SEO';

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
        <div className="min-vh-100 bg-theme-base d-flex justify-content-center align-items-center">
            <div className="spinner-border text-venda"></div>
        </div>
    );

    const earnedCount = userData?.trophies?.length || 0;
    const totalCount = ALL_TROPHIES.length;

    return (
        <div className="achievements-page bg-theme-base min-vh-100 pb-5" style={{ background: 'url("data:image/svg+xml,%3Csvg width=\'20\' height=\'20\' viewBox=\'0 0 20 20\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'currentColor\' fill-opacity=\'0.03\' fill-rule=\'evenodd\'%3E%3Ccircle cx=\'3\' cy=\'3\' r=\'1\'/%3E%3C/g%3E%3C/svg%3E")' }}>
            <SEO
                title="Trophies & Achievements"
                description="View your achievements and track your progress to mastery."
            />

            {/* BRUTALIST HEADER */}
            <div className="bg-theme-card border-bottom border-theme-main border-4 py-3 sticky-top shadow-sm z-3">
                <div className="container" style={{ maxWidth: '800px' }}>
                    <div className="d-flex align-items-center justify-content-between">
                        <button
                            onClick={() => navigate(-1)}
                            className="btn btn-game-white rounded-circle d-flex align-items-center justify-content-center p-0 border border-theme-main border-3 shadow-action-sm"
                            style={{ width: 44, height: 44 }}
                        >
                            <ArrowLeft size={20} className="text-theme-main" strokeWidth={3} />
                        </button>
                        <div className="text-center">
                            <h5 className="fw-black mb-0 text-theme-main uppercase ls-tight" style={{ fontSize: '1.25rem' }}>COLLECTION</h5>
                        </div>
                        <div className="px-3 py-1.5 bg-warning border border-theme-main border-3 shadow-action-sm d-flex align-items-center gap-2">
                            <TrophyIconLucide size={16} className="text-dark" strokeWidth={3} />
                            <span className="small fw-black text-dark uppercase ls-1">{earnedCount}/{totalCount}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mt-5" style={{ maxWidth: '800px' }}>
                <div className="mb-5 text-center text-md-start">
                    <h2 className="fw-black text-theme-main uppercase ls-tight mb-2">My Journey</h2>
                    <p className="smallest fw-bold text-theme-muted uppercase ls-2 mb-0">Track your progress and collections</p>
                </div>

                {/* GRID WITH BETTER DENSITY */}
                <div className="row g-4 mb-5">
                    {[...ALL_TROPHIES]
                        .sort((a, b) => {
                            const aEarned = (userData?.trophies || []).includes(a.id);
                            const bEarned = (userData?.trophies || []).includes(b.id);
                            if (aEarned && !bEarned) return -1;
                            if (!aEarned && bEarned) return 1;
                            return 0;
                        })
                        .map(trophy => {
                            const isEarned = (userData?.trophies || []).includes(trophy.id);
                            const progress = calculateProgress(trophy);

                            return (
                                <div key={trophy.id} className="col-12 col-md-4">
                                    <AchievementCard
                                        id={trophy.id}
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
                    <div className="p-4 brutalist-card bg-theme-surface border-dashed border-theme-main border-3 shadow-none">
                        <p className="smallest fw-black text-theme-muted uppercase ls-1 mb-0 d-flex align-items-center justify-content-center gap-2">
                             New trophies are added regularly. Keep learning!
                        </p>
                    </div>
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
                userData={userData}
            />

            <style>{`
                .ls-tight { letter-spacing: -1.5px; }
                .ls-1 { letter-spacing: 1px; }
                .ls-2 { letter-spacing: 2px; }
                .smallest { font-size: 11px; }
                .uppercase { text-transform: uppercase; }
                .fw-black { font-weight: 900; }
            `}</style>
        </div>
    );
};

export default Achievements;








