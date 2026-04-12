import React, { useEffect, useState } from 'react';
import { db, auth } from '../../services/firebaseConfig';
import { collection, query, where, getDocs, addDoc, serverTimestamp, orderBy, onSnapshot } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import Swal from 'sweetalert2';
import { Home, MessageSquare, Users, Inbox, Trash2, ChevronRight } from 'lucide-react';

interface Speaker {
    id: string;
    username: string;
    nativeSpeakerBio?: string;
}

interface Chat {
    id: string;
    participants: string[];
    participantNames: { [key: string]: string };
    lastMessage: string;
    lastTimestamp: any;
    createdAt?: any;
    deletedBy?: string[];
    unreadCount?: { [uid: string]: number };
}

const PracticeHub: React.FC = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'discovery' | 'inbox'>('discovery');
    const [user, setUser] = useState<any>(null);

    // Discovery State
    const [speakers, setSpeakers] = useState<Speaker[]>([]);
    const [loadingDiscovery, setLoadingDiscovery] = useState(true);

    // Inbox State
    const [chats, setChats] = useState<Chat[]>([]);
    const [loadingInbox, setLoadingInbox] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (u) => {
            setUser(u);
            if (u) {
                fetchSpeakers(u.uid);
                const unsubInbox = listenToInbox(u.uid);
                return () => unsubInbox();
            } else {
                setLoadingDiscovery(false);
                setLoadingInbox(false);
            }
        });
        return () => unsubscribe();
    }, []);

    const fetchSpeakers = async (currentUid: string) => {
        try {
            const q = query(collection(db, "users"), where("isNativeSpeaker", "==", true));
            const snap = await getDocs(q);
            const list = snap.docs
                .map(d => ({ id: d.id, ...d.data() } as Speaker))
                .filter(s => s.id !== currentUid);
            setSpeakers(list);
        } catch (err) {
            console.error("Error fetching speakers:", err);
        } finally {
            setLoadingDiscovery(false);
        }
    };

    const listenToInbox = (currentUid: string) => {
        const q = query(
            collection(db, "chats"),
            where("participants", "array-contains", currentUid),
            orderBy("lastTimestamp", "desc")
        );

        return onSnapshot(q, (snap) => {
            const list = snap.docs
                .map(d => ({ id: d.id, ...d.data() } as Chat))
                .filter(chat => !chat.deletedBy?.includes(currentUid));
            setChats(list);
            setLoadingInbox(false);
        }, (err) => {
            console.error("Inbox listener error:", err);
            setLoadingInbox(false);
        });
    };

    const startChat = async (speakerId: string, speakerName: string) => {
        if (!user) {
            Swal.fire('Wait!', 'Please log in to start a chat.', 'warning');
            return;
        }

        // Restrict Guest Users
        if (user.isAnonymous) {
            const { isConfirmed } = await Swal.fire({
                title: 'Sign Up to Practice',
                text: "Guest users get a taste of the app, but to chat with speakers and save your progress, you need a full account. It's free!",
                icon: 'info',
                showCancelButton: true,
                confirmButtonColor: 'var(--venda-yellow)',
                cancelButtonColor: 'var(--color-surface)',
                confirmButtonText: 'Create Account',
                cancelButtonText: 'Stay as Guest',
                color: 'var(--color-text)',
                background: 'var(--color-bg)'
            });

            if (isConfirmed) {
                navigate('/register');
            }
            return;
        }

        try {
            const q = query(collection(db, "chats"), where("participants", "array-contains", user.uid));
            const snap = await getDocs(q);
            const SESSION_DURATION_MS = 2 * 60 * 60 * 1000; // 2 hours
            const existingChat = snap.docs.find(d => {
                const data = d.data();
                if (!data.participants.includes(speakerId)) return false;

                // Check if it's expired (1 hour). Default to current time if nil (just created)
                const createdAt = data.createdAt?.toDate ? data.createdAt.toDate().getTime() : Date.now();
                const isNotExpired = (Date.now() - createdAt) < SESSION_DURATION_MS;

                // If it's not expired but user soft-deleted it, we'll revive it later
                return isNotExpired;
            });

            if (existingChat) {
                // Revive if soft-deleted
                const data = existingChat.data();
                if (data.deletedBy?.includes(user.uid)) {
                    const { doc, updateDoc, arrayRemove } = await import('firebase/firestore');
                    await updateDoc(doc(db, "chats", existingChat.id), {
                        deletedBy: arrayRemove(user.uid)
                    });
                }
                navigate(`/chat/${existingChat.id}`);
                return;
            }

            const docRef = await addDoc(collection(db, "chats"), {
                participants: [user.uid, speakerId],
                participantNames: {
                    [user.uid]: user.displayName || 'Learner',
                    [speakerId]: speakerName
                },
                lastMessage: "Session Started",
                lastTimestamp: serverTimestamp(),
                createdAt: serverTimestamp()
            });

            navigate(`/chat/${docRef.id}`);
        } catch (err) {
            console.error("Error starting chat:", err);
            Swal.fire('Error', 'Failed to start chat.', 'error');
        }
    };

    const getPartnerName = (chat: Chat) => {
        const partnerId = chat.participants.find(id => id !== user?.uid);
        return chat.participantNames?.[partnerId || ''] || 'Partner';
    };

    const deleteChat = async (e: React.MouseEvent, chatId: string) => {
        e.stopPropagation();

        const result = await Swal.fire({
            title: 'Delete Chat?',
            text: "This practice session will be permanently removed.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc3545',
            cancelButtonColor: '#6c757d',
            confirmButtonText: 'Yes, Delete',
            customClass: {
                popup: 'rounded-4 border-0'
            }
        });

        if (result.isConfirmed) {
            try {
                const { doc, updateDoc, arrayUnion } = await import('firebase/firestore');
                await updateDoc(doc(db, "chats", chatId), {
                    deletedBy: arrayUnion(user.uid)
                });
                Swal.fire('Removed', 'This session has been hidden from your inbox.', 'success');
            } catch (err) {
                console.error("Error deleting chat:", err);
                Swal.fire('Error', 'Failed to remove session.', 'error');
            }
        }
    };

    if (!user && !loadingDiscovery) {
        return (
            <div className="min-vh-100 d-flex flex-column align-items-center justify-content-center text-center p-4 bg-theme-base">
                <div className="mb-4 text-theme-muted">
                    <Home size={64} strokeWidth={1} />
                </div>
                <h3 className="fw-bold fs-2 ls-tight mb-3 text-theme-main uppercase">JOIN THE HUB</h3>
                <p className="text-theme-muted mb-4 fw-bold">Please log in to discover speakers and manage your practice sessions.</p>
                <button onClick={() => navigate('/login')} className="btn-game btn-game-primary px-5 py-3">LOG IN</button>
            </div>
        );
    }

    return (
        <div className="bg-theme-base min-vh-100 py-5">
            <div className="container" style={{ maxWidth: '900px' }}>

                {/* HUB HEADER */}
                <header className="mb-5 px-3">
                    <p className="smallest-print fw-bold text-theme-muted mb-1 ls-2 uppercase">Practice Hub</p>
                    <h2 className="fw-bold mb-0 ls-tight text-theme-main uppercase ls-tight">VENDA CONNECTION</h2>
                </header>

                {/* TABS */}
                <div className="px-3 mb-5">
                    <div className="d-flex gap-2 p-1 bg-theme-card rounded-pill border border-theme-main border-2" style={{ maxWidth: '400px' }}>
                        <button
                            onClick={() => setActiveTab('discovery')}
                            className={`btn flex-grow-1 rounded-pill fw-bold ls-1 smallest py-2 transition-all ${activeTab === 'discovery' ? 'bg-theme-accent text-black shadow-sm' : 'text-theme-muted border-0 bg-transparent'}`}
                        >
                            FIND EXPERTS
                        </button>
                        <button
                            onClick={() => setActiveTab('inbox')}
                            className={`btn flex-grow-1 rounded-pill fw-bold ls-1 smallest py-2 transition-all position-relative ${activeTab === 'inbox' ? 'bg-theme-accent text-black shadow-sm' : 'text-theme-muted border-0 bg-transparent'}`}
                        >
                            MY CHATS
                            {chats.length > 0 && activeTab !== 'inbox' && (
                                <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger border border-light" style={{ fontSize: '10px', padding: '0.35em 0.65em' }}>
                                    {chats.length}
                                </span>
                            )}
                            {/* If we have unread messages in any chat, show a dot */}
                            {chats.some(c => (c.unreadCount?.[user?.uid] || 0) > 0) && activeTab !== 'inbox' && (
                                <span className="position-absolute top-0 start-100 translate-middle p-1 bg-danger border border-light rounded-circle">
                                    <span className="visually-hidden">New alerts</span>
                                </span>
                            )}
                        </button>
                    </div>
                </div>

                {/* DISCOVERY TAB */}
                {activeTab === 'discovery' && (
                    <div className="row g-4 px-3 animate__animated animate__fadeIn">
                        {loadingDiscovery ? (
                            <div className="col-12 text-center py-5">
                                <div className="spinner-border text-warning"></div>
                            </div>
                        ) : speakers.length > 0 ? (
                            speakers.map((speaker, idx) => (
                                <div key={speaker.id} className="col-md-6 animate__animated animate__fadeInUp" style={{ animationDelay: `${idx * 0.1}s` }}>
                                    <div className="brutalist-card bg-theme-card p-4 h-100 speaker-card transition-all border-theme-main shadow-action-sm">
                                        <div className="d-flex align-items-center gap-3 mb-3">
                                            <div className="rounded-circle d-flex align-items-center justify-content-center fw-bold shadow-sm"
                                                style={{ width: '60px', height: '60px', fontSize: '1.5rem', backgroundColor: 'var(--venda-yellow)', border: '2px solid var(--color-border)' }}>
                                                {speaker.username.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <h5 className="fw-black mb-0 text-theme-main uppercase">{speaker.username}</h5>
                                                <span className="badge bg-theme-base text-theme-muted border border-theme-soft smallest fw-bold ls-1 uppercase">Native Speaker</span>
                                            </div>
                                        </div>
                                        <p className="text-theme-muted fw-bold small mb-4 flex-grow-1" style={{ lineHeight: '1.6' }}>
                                            {speaker.nativeSpeakerBio || "Native language speaker available for practice."}
                                        </p>
                                        <button
                                            onClick={() => startChat(speaker.id, speaker.username)}
                                            className="btn-game btn-game-primary w-100 py-2"
                                        >
                                            START PRACTICE <i className="bi bi-chat-fill ms-2"></i>
                                        </button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-5 col-12">
                                <div className="mb-3 text-theme-muted opacity-25">
                                    <MessageSquare size={64} strokeWidth={1} />
                                </div>
                                <p className="text-theme-muted fw-bold small">No other native speakers available currently. Invite a friend!</p>
                            </div>
                        )}

                        {/* BECOME A SPEAKER CTA */}
                        <div className="col-12 mt-5">
                            <div className="brutalist-card p-5 bg-theme-card border-theme-main text-center animate__animated animate__fadeInUp shadow-action-sm">
                                <div className="mb-3 text-warning">
                                    <Users size={48} strokeWidth={1.5} className="mx-auto" />
                                </div>
                                <h4 className="fw-black mb-2 text-theme-main uppercase">Are you a Native Speaker?</h4>
                                <p className="text-theme-muted fw-bold small mb-4 mx-auto" style={{ maxWidth: '500px' }}>
                                    Help others learn by appearing in this list. You can toggle your status in your profile settings.
                                </p>
                                <button onClick={() => navigate('/profile')} className="btn-game btn-game-primary px-4 py-2">UPDATE MY STATUS</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* INBOX TAB */}
                {activeTab === 'inbox' && (
                    <div className="d-flex flex-column gap-3 px-3 animate__animated animate__fadeIn">
                        {loadingInbox ? (
                            <div className="text-center py-5">
                                <div className="spinner-border text-warning"></div>
                            </div>
                        ) : chats.length > 0 ? (
                            chats.map((chat, idx) => (
                                <div
                                    key={chat.id}
                                    onClick={() => navigate(`/chat/${chat.id}`)}
                                    className="chat-item p-4 brutalist-card transition-all animate__animated animate__fadeInUp bg-theme-card cursor-pointer d-flex align-items-center gap-4 shadow-action-sm border-theme-main"
                                    style={{ animationDelay: `${idx * 0.05}s` }}
                                >
                                    <div className="rounded-circle d-flex align-items-center justify-content-center fw-bold text-black shadow-sm bg-theme-accent"
                                        style={{ width: '55px', height: '55px', fontSize: '1.2rem', minWidth: '55px', border: '2px solid var(--color-border)' }}>
                                        {getPartnerName(chat).charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex-grow-1 overflow-hidden">
                                        <div className="d-flex justify-content-between align-items-center mb-1">
                                            <div className="d-flex align-items-center gap-2">
                                                <h6 className="fw-black mb-0 text-theme-main uppercase">{getPartnerName(chat)}</h6>

                                                {/* Unread Badge */}
                                                {(chat.unreadCount?.[user?.uid] || 0) > 0 && (
                                                    <span className="badge bg-danger rounded-pill border border-light shadow-sm smallest">
                                                        {chat.unreadCount![user!.uid] > 9 ? '9+' : chat.unreadCount![user!.uid]}
                                                    </span>
                                                )}

                                                {(() => {
                                                    // Default to current time if createdAt is missing (means it's brand new)
                                                    const SESSION_DURATION_MS = 2 * 60 * 60 * 1000; // 2 hours
                                                    const createdAt = chat.createdAt?.toDate ? chat.createdAt.toDate().getTime() : Date.now();
                                                    const expired = (Date.now() - createdAt) > SESSION_DURATION_MS;
                                                    return expired && <span className="badge bg-danger border-0 smallest fw-bold ls-1 uppercase py-1 px-2">EXPIRED</span>;
                                                })()}
                                            </div>
                                            <span className="smallest text-theme-muted fw-bold">
                                                {chat.lastTimestamp?.toDate ? chat.lastTimestamp.toDate().toLocaleDateString([], { month: 'short', day: 'numeric' }) : ''}
                                            </span>
                                        </div>
                                        <p className="text-theme-muted fw-bold small mb-0 text-truncate" style={{ maxWidth: '90%' }}>
                                            {chat.lastMessage || 'Start a conversation...'}
                                        </p>
                                    </div>
                                    <div className="text-muted d-flex align-items-center gap-3">
                                        <button
                                            onClick={(e) => deleteChat(e, chat.id)}
                                            className="btn btn-light rounded-circle p-2 border-0 delete-btn opacity-0 transition-all text-danger"
                                            title="Delete Session"
                                        >
                                            <Trash2 size={20} />
                                        </button>
                                        <ChevronRight size={24} className="d-none d-md-block opacity-50" />
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-5">
                                <div className="mb-4 text-theme-muted opacity-25">
                                    <Inbox size={64} strokeWidth={1} />
                                </div>
                                <h5 className="fw-black text-theme-main uppercase ls-tight">NO ACTIVE CHATS</h5>
                                <p className="text-theme-muted fw-bold small mb-4">Start a conversation with a native speaker in the "Find Experts" tab!</p>
                                <button onClick={() => setActiveTab('discovery')} className="btn-game btn-game-primary px-4 py-2">GO TO FIND EXPERTS</button>
                            </div>
                        )}
                    </div>
                )}

                <style>{`
                    .ls-tight { letter-spacing: -1.5px; }
                    .ls-1 { letter-spacing: 1px; }
                    .ls-2 { letter-spacing: 2px; }
                    .smallest-print { font-size: 11px; font-family: 'Poppins', sans-serif; }
                    .smallest { font-size: 11px; }
                    .uppercase { text-transform: uppercase; }
                    .cursor-pointer { cursor: pointer; }
                    .btn-white { background-color: var(--color-bg) !important; color: var(--color-text) !important; }
                    
                    .speaker-card, .chat-item {
                        border: 1px solid var(--color-border-soft) !important;
                    }
                    .speaker-card:hover, .chat-item:hover {
                        transform: translateY(-5px);
                        border-color: var(--venda-yellow) !important;
                        box-shadow: 0 15px 30px rgba(0,0,0,0.2) !important;
                    }

                    .game-btn-primary { 
                        background-color: var(--venda-yellow) !important; 
                        color: #000 !important; 
                        border: none !important; 
                        border-radius: 8px; 
                        box-shadow: 0 3px 0 var(--venda-yellow-dark) !important; 
                        transition: all 0.2s; 
                    }
                    .game-btn-primary:active { transform: translateY(1px); box-shadow: 0 1px 0 var(--venda-yellow-dark) !important; }

                    .chat-item:hover .delete-btn {
                        opacity: 1 !important;
                    }

                    .delete-btn:hover {
                        background-color: rgba(239, 68, 68, 0.1) !important;
                        transform: scale(1.1);
                    }

                    .transition-all { transition: all 0.3s ease; }
                    .bg-theme-accent { background-color: var(--venda-yellow) !important; }
                `}</style>
            </div>
        </div >
    );
};

export default PracticeHub;


