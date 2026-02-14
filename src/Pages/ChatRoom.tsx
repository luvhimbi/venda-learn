import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db, auth } from '../services/firebaseConfig';
import { doc, collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, updateDoc, increment, arrayRemove } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { fetchChatMetadata, fetchUserData } from '../services/dataCache';
import Swal from 'sweetalert2';

interface Message {
    id: string;
    senderId: string;
    text: string;
    timestamp: any;
}

const ChatRoom: React.FC = () => {
    const { chatId } = useParams();
    const navigate = useNavigate();
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [chatData, setChatData] = useState<any>(null);
    const [user, setUser] = useState<any>(null);
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [isExpired, setIsExpired] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (u) => {
            setUser(u);
            if (!u) navigate('/login');
        });
        return () => unsubscribe();
    }, [navigate]);

    useEffect(() => {
        if (!chatId || !user) return;

        const loadChat = async () => {
            try {
                const data = await fetchChatMetadata(chatId);
                if (data) {
                    setChatData(data);

                    // Check for expiry (1 hour)
                    const HOUR_MS = 60 * 60 * 1000;
                    const createdAt = data.createdAt?.toDate ? data.createdAt.toDate().getTime() : Date.now();
                    const checkExpiry = () => {
                        const expired = (Date.now() - createdAt) > HOUR_MS;
                        setIsExpired(expired);
                    };
                    checkExpiry();
                    checkExpiry();
                    const interval = setInterval(checkExpiry, 30000); // Check every 30s

                    // Reset unread count for current user
                    try {
                        await updateDoc(doc(db, "chats", chatId), {
                            [`unreadCount.${user.uid}`]: 0
                        });
                    } catch (err) {
                        console.error("Error resetting unread count:", err);
                    }

                    return () => clearInterval(interval);
                }
            } catch (err) {
                console.error("Error loading chat:", err);
            } finally {
                setLoading(false);
            }
        };
        loadChat();

        const q = query(
            collection(db, "chats", chatId, "messages"),
            orderBy("timestamp", "asc")
        );
        const unsubscribe = onSnapshot(q, (snap) => {
            const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as Message));
            setMessages(list);
            scrollToBottom();
        });
        return () => unsubscribe();
    }, [chatId, user]);

    useEffect(() => {
        const loadSuggestions = async () => {
            const userData = await fetchUserData();
            const completedLessons = userData?.completedLessons || [];
            let bases = ["U nga nndumedisa nga Tshivenda?", "Dzina ḽanga ndi...", "Ndi khou guda Tshivenda."];
            if (completedLessons.some((id: string) => id.toLowerCase().includes('greet'))) {
                bases.push("Ndi masiari", "Ndi maphina", "Vho vuwa hani?");
            }
            if (completedLessons.some((id: string) => id.toLowerCase().includes('food'))) {
                bases.push("Vho ḽa mini?", "Ndi a funa vhuswa.");
            }
            setSuggestions(bases);
        };
        loadSuggestions();
    }, []);

    const scrollToBottom = () => {
        setTimeout(() => {
            scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    };

    const handleSendMessage = async (e?: React.FormEvent, textOverride?: string) => {
        if (e) e.preventDefault();
        const textToSend = textOverride || newMessage;
        if (!textToSend.trim() || !chatId || !user || isExpired) return;

        try {
            if (!textOverride) setNewMessage('');
            await addDoc(collection(db, "chats", chatId, "messages"), {
                senderId: user.uid,
                text: textToSend,
                timestamp: serverTimestamp()
            });

            // Calculate unread count update
            const recipientId = chatData?.participants?.find((id: string) => id !== user.uid);
            const updatePayload: any = {
                lastMessage: textToSend,
                lastTimestamp: serverTimestamp()
            };

            if (recipientId) {
                updatePayload[`unreadCount.${recipientId}`] = increment(1);
                // Also ensure the chat is visible to the recipient (remove from deletedBy if present)
                updatePayload.deletedBy = arrayRemove(recipientId);
            }

            await updateDoc(doc(db, "chats", chatId), updatePayload);
            scrollToBottom();
        } catch (err) {
            console.error("Error sending message:", err);
        }
    };

    const handleReport = async () => {
        if (!user || !chatId || !chatData) return;

        const partnerId = chatData.participants.find((id: string) => id !== user.uid);

        const { value: reason } = await Swal.fire({
            title: 'Report Speaker',
            input: 'textarea',
            inputLabel: 'Why are you reporting this user?',
            inputPlaceholder: 'e.g. Inappropriate language, off-topic, etc.',
            inputAttributes: {
                'aria-label': 'Type your reason here'
            },
            showCancelButton: true,
            confirmButtonColor: '#d33',
            confirmButtonText: 'Submit Report',
            inputValidator: (value) => {
                if (!value) return 'You need to provide a reason!';
            }
        });

        if (reason) {
            try {
                await addDoc(collection(db, "reports"), {
                    chatId,
                    reporterId: user.uid,
                    reportedId: partnerId,
                    reason,
                    timestamp: serverTimestamp()
                });
                Swal.fire('Submitted', 'Thank you for following the rules. Our team will review this.', 'success');
            } catch (err) {
                console.error("Error reporting user:", err);
                Swal.fire('Error', 'Failed to submit report. Please try again.', 'error');
            }
        }
    };

    const getPartnerName = () => {
        if (!chatData || !user || !chatData.participants) return 'Chat';
        const partnerId = chatData.participants.find((id: string) => id !== user.uid);
        return chatData.participantNames?.[partnerId || ''] || 'Partner';
    };

    if (loading) {
        return (
            <div className="min-vh-100 d-flex justify-content-center align-items-center bg-white">
                <div className="spinner-border text-warning" style={{ color: '#FACC15' }}></div>
            </div>
        );
    }

    const partnerName = getPartnerName();

    return (
        <div className="bg-light chat-layout d-flex flex-column overflow-hidden">
            <header className="chat-header bg-white border-bottom p-3 d-flex align-items-center justify-content-between shadow-sm">
                <div className="d-flex align-items-center gap-3">
                    <button onClick={() => navigate('/practice')} className="btn btn-light rounded-circle p-2 d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                        <i className="bi bi-chevron-left fs-5"></i>
                    </button>
                    <div className="d-flex align-items-center gap-3">
                        <div className="rounded-circle d-flex align-items-center justify-content-center fw-bold text-dark shadow-sm bg-warning"
                            style={{ width: '45px', height: '45px', fontSize: '1.2rem', border: '2px solid white' }}>
                            {partnerName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <h6 className="fw-bold mb-0 text-dark">{partnerName}</h6>
                            <div className="d-flex align-items-center gap-1">
                                <span className="online-indicator"></span>
                                <span className="smallest text-muted fw-bold ls-1 uppercase">Practice Online</span>
                            </div>
                        </div>
                    </div>
                </div>
                <button onClick={handleReport} className="btn btn-outline-danger btn-sm rounded-pill px-3 fw-bold decoration-none border-0 ls-1 smallest uppercase">
                    <i className="bi bi-flag-fill me-1"></i> Report
                </button>
            </header>

            <main className="chat-messages flex-grow-1 overflow-auto p-3 p-md-4">
                <div className="container" style={{ maxWidth: '800px' }}>
                    <div className="text-center my-5">
                        {messages.length === 0 && (
                            <span className="badge bg-white text-muted border smallest fw-bold ls-1 rounded-pill px-4 py-2 shadow-sm animate__animated animate__fadeIn">
                                READY FOR PRACTICE
                            </span>
                        )}
                        {isExpired && (
                            <div className="mt-2 text-danger fw-bold smallest ls-1 uppercase animate__animated animate__shakeX bg-white d-inline-block px-4 py-2 rounded-pill border shadow-sm">
                                <i className="bi bi-exclamation-triangle-fill me-1"></i> SESSION EXPIRED (1 HOUR)
                            </div>
                        )}
                    </div>

                    {messages.map((msg, idx) => {
                        const isMe = msg.senderId === user?.uid;
                        const timeString = msg.timestamp && typeof msg.timestamp.toDate === 'function'
                            ? msg.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                            : '...';

                        return (
                            <div key={msg.id || idx} className={`d-flex mb-4 ${isMe ? 'justify-content-end' : 'justify-content-start'} animate__animated ${isMe ? 'animate__fadeInRight' : 'animate__fadeInLeft'}`}>
                                <div className={`message-bubble p-3 shadow-sm ${isMe ? 'me-bubble text-white' : 'partner-bubble text-dark'}`}
                                    style={{ animationDelay: `${idx * 0.05}s` }}>
                                    <p className="small mb-1 text-break" style={{ whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>{msg.text}</p>
                                    <div className={`smallest d-flex align-items-center gap-1 justify-content-end opacity-75 ${isMe ? 'text-light' : 'text-muted'}`}>
                                        {timeString}
                                        {isMe && <i className="bi bi-check2-all"></i>}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    <div ref={scrollRef}></div>
                </div>
            </main>

            <footer className="chat-footer bg-white border-top p-3 p-md-4">
                <div className="container" style={{ maxWidth: '800px' }}>
                    {isExpired ? (
                        <div className="text-center bg-light p-4 rounded-4 border">
                            <h6 className="fw-bold mb-1">Session Closed</h6>
                            <p className="text-muted small mb-3">This practice session has reached its 1-hour limit. Please start a new session from the Practice Hub.</p>
                            <button onClick={() => navigate('/practice')} className="btn btn-dark rounded-pill px-4 py-2 fw-bold smallest ls-1">GO TO PRACTICE HUB</button>
                        </div>
                    ) : (
                        <>
                            {suggestions.length > 0 && (
                                <div className="suggestions-bar d-flex gap-2 overflow-auto pb-3 mb-2" style={{ scrollbarWidth: 'none' }}>
                                    <span className="smallest fw-bold text-muted align-self-center me-2 flex-shrink-0">STARTERS:</span>
                                    {suggestions.map((s, i) => (
                                        <button
                                            key={i}
                                            onClick={() => handleSendMessage(undefined, s)}
                                            className="btn btn-outline-warning btn-sm rounded-pill py-1 px-3 border-0 transition-all suggestion-btn"
                                        >
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            )}

                            <form onSubmit={handleSendMessage} className="d-flex gap-2 align-items-center">
                                <div className="flex-grow-1 position-relative">
                                    <input
                                        type="text"
                                        className="form-control border-0 bg-light rounded-pill py-3 px-4 shadow-none fs-6"
                                        placeholder="Practice Tshivenda..."
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                    />
                                </div>
                                <button type="submit" className="btn btn-warning rounded-pill px-4 py-3 d-flex align-items-center justify-content-center shadow-lg border-0 transition-all send-btn"
                                    disabled={!newMessage.trim()}
                                    style={{ backgroundColor: '#FACC15' }}>
                                    <i className="bi bi-send-fill fs-5 text-dark"></i>
                                </button>
                            </form>
                        </>
                    )}
                </div>
            </footer>

            <style>{`
                .chat-layout { height: calc(100vh - 72px); }
                .chat-messages::-webkit-scrollbar { display: none; }
                .message-bubble { max-width: 85%; position: relative; }
                .me-bubble { background: linear-gradient(135deg, #2D3748, #1A202C); border-radius: 20px 20px 4px 20px; color: white; }
                .partner-bubble { background-color: white; border: 1px solid #edf2f7; border-radius: 20px 20px 20px 4px; color: #2d3748; }
                .online-indicator { width: 7px; height: 7px; background-color: #10b981; border-radius: 50%; box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.2); }
                .suggestion-btn { background-color: #FFFBEB; color: #92400E !important; font-size: 11px; font-weight: 700; white-space: nowrap; border: 1px solid #FEF3C7 !important; }
                .suggestion-btn:hover { background-color: #FDE68A !important; transform: translateY(-2px); }
                .send-btn:hover:not(:disabled) { transform: scale(1.05); box-shadow: 0 8px 20px rgba(250, 204, 21, 0.3) !important; }
                .send-btn:active { transform: scale(0.95); }
                .smallest { font-size: 10px; }
                .ls-1 { letter-spacing: 1px; }
                .uppercase { text-transform: uppercase; }
                @media (max-width: 768px) { .chat-layout { height: 100vh; } .message-bubble { max-width: 90%; } }
                .transition-all { transition: all 0.2s ease; }
            `}</style>
        </div>
    );
};

export default ChatRoom;
