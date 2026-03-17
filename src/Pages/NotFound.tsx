import React, { useEffect, useState } from 'react';
import type { Firestore } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../services/firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import Mascot404 from "../components/Mascot404.tsx";

const NotFound: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [redirectPath, setRedirectPath] = useState('/');
    const [userRole, setUserRole] = useState<'guest' | 'user' | 'admin'>('guest');

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                try {
                    const userDoc = await getDoc(doc(db as Firestore, 'users', user.uid));
                    if (userDoc.exists()) {
                        const userData = userDoc.data();
                        if (userData.role === 'admin') {
                            setUserRole('admin');
                            setRedirectPath('/admin/dashboard');
                        } else {
                            setUserRole('user');
                            setRedirectPath('/');
                        }
                    } else {
                        setUserRole('user');
                        setRedirectPath('/');
                    }
                } catch (error) {
                    console.error("Error checking user role:", error);
                    setRedirectPath('/');
                }
            } else {
                setUserRole('guest');
                setRedirectPath('/');
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const handleGoBack = () => {
        navigate(redirectPath);
    };

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center min-vh-100 bg-white">
                <div className="spinner-border text-venda" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="min-vh-100 d-flex flex-column justify-content-center align-items-center text-center px-4 bg-white">
            
            {/* INVESTIGATIVE MASCOT */}
            <div className="mb-4">
                <Mascot404 width="250px" height="250px" />
            </div>

            <h6 className="fw-bold text-muted text-uppercase ls-2 mb-2">404 Error</h6>
            <h1 className="display-4 fw-bold text-dark mb-3 ls-tight">The Lost Lesson</h1>

            <p className="lead text-muted mb-5" style={{ maxWidth: '500px', fontSize: '1.2rem', lineHeight: '1.6' }}>
                Even with my microscope, I couldn't find the page you're looking for. It seems to have wandered off the path!
            </p>

            <button 
                onClick={handleGoBack} 
                className="btn btn-warning px-5 py-3 rounded-pill fw-bold ls-1 text-uppercase shadow-lg transition-all hover-scale"
            >
                <i className="bi bi-compass-fill me-2"></i>
                {userRole === 'admin' ? 'Back to Dashboard' :
                    userRole === 'user' ? 'Back to Learning' :
                        'Return Home'}
            </button>

            <style>{`
                .hover-scale:hover { transform: scale(1.05); }
                .ls-tight { letter-spacing: -1.5px; }
                .ls-2 { letter-spacing: 2px; }
                .ls-1 { letter-spacing: 1px; }
            `}</style>
        </div>
    );
};

export default NotFound;

