import React, { useEffect, useState } from 'react';
import { db, auth } from '../services/firebaseConfig';
import { collection, query, where, getDocs, addDoc, serverTimestamp, orderBy, onSnapshot } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import Swal from 'sweetalert2';

interface Speaker {
    id: string;
    username: string;
    nativeSpeakerBio?: string;
    level: number;
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

        try {
            const q = query(collection(db, "chats"), where("participants", "array-contains", user.uid));
            const snap = await getDocs(q);
            const HOUR_MS = 60 * 60 * 1000;
            const existingChat = snap.docs.find(d => {
                const data = d.data();
                if (!data.participants.includes(speakerId)) return false;

                // Check if it's expired (1 hour). Default to current time if nil (just created)
                const createdAt = data.createdAt?.toDate ? data.createdAt.toDate().getTime() : Date.now();
                const isNotExpired = (Date.now() - createdAt) < HOUR_MS;

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
            <div className="min-vh-100 d-flex flex-column align-items-center justify-content-center text-center p-4">
                <div className="display-1 mb-4">🏠</div>
                <h3 className="fw-bold fs-2 ls-tight mb-3">Join the Hub</h3>
                <p className="text-muted mb-4">Please log in to discover speakers and manage your practice sessions.</p>
                <button onClick={() => navigate('/login')} className="btn btn-dark px-5 py-3 rounded-pill fw-bold ls-1 shadow">DZHENA (LOGIN)</button>
            </div>
        );
    }

    return (
        <div className="bg-white min-vh-100 py-5">
            <div className="container" style={{ maxWidth: '900px' }}>

                {/* HUB HEADER */}
                <header className="mb-5 px-3">
                    <p className="smallest-print fw-bold text-muted mb-1 ls-2 uppercase">Practice Hub</p>
                    <h2 className="fw-bold mb-0 ls-tight">VENDA CONNECTION</h2>
                </header>

                {/* TABS */}
                <div className="px-3 mb-5">
                    <div className="d-flex gap-2 p-1 bg-light rounded-pill" style={{ maxWidth: '400px' }}>
                        <button
                            onClick={() => setActiveTab('discovery')}
                            className={`btn flex-grow-1 rounded-pill fw-bold ls-1 smallest py-2 transition-all ${activeTab === 'discovery' ? 'btn-white shadow-sm' : 'text-muted border-0 bg-transparent'}`}
                        >
                            FIND EXPERTS
                        </button>
                        <button
                            onClick={() => setActiveTab('inbox')}
                            className={`btn flex-grow-1 rounded-pill fw-bold ls-1 smallest py-2 transition-all position-relative ${activeTab === 'inbox' ? 'btn-white shadow-sm' : 'text-muted border-0 bg-transparent'}`}
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
                                <div className="spinner-border text-yellow" style={{ color: '#FACC15' }}></div>
                            </div>
                        ) : speakers.length > 0 ? (
                            speakers.map((speaker, idx) => (
                                <div key={speaker.id} className="col-md-6 animate__animated animate__fadeInUp" style={{ animationDelay: `${idx * 0.1}s` }}>
                                    <div className="card border-0 shadow-sm rounded-4 p-4 h-100 speaker-card transition-all">
                                        <div className="d-flex align-items-center gap-3 mb-3">
                                            <div className="rounded-circle d-flex align-items-center justify-content-center fw-bold shadow-sm"
                                                style={{ width: '60px', height: '60px', fontSize: '1.5rem', backgroundColor: '#FACC15', border: '2px solid #111827' }}>
                                                {speaker.username.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <h5 className="fw-bold mb-0">{speaker.username}</h5>
                                                <span className="badge bg-light text-muted border smallest fw-bold ls-1 uppercase">LEVEL {speaker.level || 1}</span>
                                            </div>
                                        </div>
                                        <p className="text-muted small mb-4 flex-grow-1" style={{ lineHeight: '1.6' }}>
                                            {speaker.nativeSpeakerBio || "Native Tshivenda speaker available for practice."}
                                        </p>
                                        <button
                                            onClick={() => startChat(speaker.id, speaker.username)}
                                            className="btn btn-dark w-100 fw-bold py-2 rounded-pill ls-1 smallest"
                                        >
                                            START PRACTICE <i className="bi bi-chat-fill ms-2"></i>
                                        </button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-5 col-12">
                                <div className="mb-3 display-4 opacity-25">💬</div>
                                <p className="text-muted small">No other native speakers available currently. Invite a friend!</p>
                            </div>
                        )}

                        {/* BECOME A SPEAKER CTA */}
                        <div className="col-12 mt-5">
                            <div className="p-5 rounded-4 bg-light border-0 text-center animate__animated animate__fadeInUp">
                                <div className="mb-3 display-6">🤝</div>
                                <h4 className="fw-bold mb-2">Are you a Native Speaker?</h4>
                                <p className="text-muted small mb-4 mx-auto" style={{ maxWidth: '500px' }}>
                                    Help others learn by appearing in this list. You can toggle your status in your profile settings.
                                </p>
                                <button onClick={() => navigate('/profile')} className="btn game-btn-primary px-4 py-2 fw-bold ls-1">UPDATE MY STATUS</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* INBOX TAB */}
                {activeTab === 'inbox' && (
                    <div className="d-flex flex-column gap-3 px-3 animate__animated animate__fadeIn">
                        {loadingInbox ? (
                            <div className="text-center py-5">
                                <div className="spinner-border text-yellow" style={{ color: '#FACC15' }}></div>
                            </div>
                        ) : chats.length > 0 ? (
                            chats.map((chat, idx) => (
                                <div
                                    key={chat.id}
                                    onClick={() => navigate(`/chat/${chat.id}`)}
                                    className="chat-item p-4 rounded-4 border transition-all animate__animated animate__fadeInUp bg-white cursor-pointer d-flex align-items-center gap-4 shadow-sm"
                                    style={{ animationDelay: `${idx * 0.05}s` }}
                                >
                                    <div className="rounded-circle d-flex align-items-center justify-content-center fw-bold text-dark shadow-sm bg-warning"
                                        style={{ width: '55px', height: '55px', fontSize: '1.2rem', minWidth: '55px' }}>
                                        {getPartnerName(chat).charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex-grow-1 overflow-hidden">
                                        <div className="d-flex justify-content-between align-items-center mb-1">
                                            <div className="d-flex align-items-center gap-2">
                                                <h6 className="fw-bold mb-0 text-dark">{getPartnerName(chat)}</h6>

                                                {/* Unread Badge */}
                                                {(chat.unreadCount?.[user?.uid] || 0) > 0 && (
                                                    <span className="badge bg-danger rounded-pill border border-light shadow-sm smallest">
                                                        {chat.unreadCount![user!.uid] > 9 ? '9+' : chat.unreadCount![user!.uid]}
                                                    </span>
                                                )}

                                                {(() => {
                                                    const HOUR_MS = 60 * 60 * 1000;
                                                    // Default to current time if createdAt is missing (means it's brand new)
                                                    const createdAt = chat.createdAt?.toDate ? chat.createdAt.toDate().getTime() : Date.now();
                                                    const expired = (Date.now() - createdAt) > HOUR_MS;
                                                    return expired && <span className="badge bg-danger border-0 smallest fw-bold ls-1 uppercase py-1 px-2">EXPIRED</span>;
                                                })()}
                                            </div>
                                            <span className="smallest text-muted fw-bold">
                                                {chat.lastTimestamp?.toDate ? chat.lastTimestamp.toDate().toLocaleDateString([], { month: 'short', day: 'numeric' }) : ''}
                                            </span>
                                        </div>
                                        <p className="text-muted small mb-0 text-truncate" style={{ maxWidth: '90%' }}>
                                            {chat.lastMessage || 'Start a conversation...'}
                                        </p>
                                    </div>
                                    <div className="text-muted d-flex align-items-center gap-3">
                                        <button
                                            onClick={(e) => deleteChat(e, chat.id)}
                                            className="btn btn-light rounded-circle p-2 border-0 delete-btn opacity-0 transition-all text-danger"
                                            title="Delete Session"
                                        >
                                            <i className="bi bi-trash3 fs-5"></i>
                                        </button>
                                        <i className="bi bi-chevron-right fs-4 d-none d-md-block opacity-50"></i>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-5">
                                <div className="mb-4 display-4 opacity-25">📮</div>
                                <h5 className="fw-bold">No active chats</h5>
                                <p className="text-muted small mb-4">Start a conversation with a native speaker in the "Find Experts" tab!</p>
                                <button onClick={() => setActiveTab('discovery')} className="btn btn-dark px-4 py-2 rounded-pill fw-bold smallest ls-1">GO TO FIND EXPERTS</button>
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
                    .btn-white { background-color: #fff !important; color: #111827 !important; }
                    
                    .speaker-card, .chat-item {
                        border: 1px solid #f3f4f6 !important;
                    }
                    .speaker-card:hover, .chat-item:hover {
                        transform: translateY(-5px);
                        border-color: #FACC15 !important;
                        box-shadow: 0 15px 30px rgba(0,0,0,0.05) !important;
                    }

                    .game-btn-primary { 
                        background-color: #FACC15 !important; 
                        color: #111827 !important; 
                        border: none !important; 
                        border-radius: 8px; 
                        box-shadow: 0 3px 0 #EAB308 !important; 
                        transition: all 0.2s; 
                    }
                    .game-btn-primary:active { transform: translateY(1px); box-shadow: 0 1px 0 #EAB308 !important; }

                    .chat-item:hover .delete-btn {
                        opacity: 1 !important;
                    }

                    .delete-btn:hover {
                        background-color: #fee2e2 !important;
                        transform: scale(1.1);
                    }

                    .transition-all { transition: all 0.3s ease; }
                `}</style>
            </div>
        </div >
    );
};

export default PracticeHub;
