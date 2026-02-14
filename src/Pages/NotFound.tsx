import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../services/firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

const NotFound: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [redirectPath, setRedirectPath] = useState('/');
    const [userRole, setUserRole] = useState<'guest' | 'user' | 'admin'>('guest');

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                // User is logged in, check if admin
                try {
                    const userDoc = await getDoc(doc(db, 'users', user.uid));
                    if (userDoc.exists()) {
                        const userData = userDoc.data();
                        if (userData.role === 'admin') {
                            setUserRole('admin');
                            setRedirectPath('/admin/dashboard');
                        } else {
                            setUserRole('user');
                            setRedirectPath('/'); // Learner home
                        }
                    } else {
                        // Fallback if user doc missing
                        setUserRole('user');
                        setRedirectPath('/');
                    }
                } catch (error) {
                    console.error("Error checking user role:", error);
                    setRedirectPath('/');
                }
            } else {
                // Guest
                setUserRole('guest');
                setRedirectPath('/'); // Landing page logic is handled in Home.tsx generally, or we could redirect to login? 
                // Creating a specific landing behavior might be better, but Home handles both.
                // If Home handles guest view, then '/' is correct.
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
                <div className="spinner-border text-warning" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="min-vh-100 d-flex flex-column justify-content-center align-items-center text-center px-4" style={{ background: '#F9FAFB' }}>

            <div className="mb-4 position-relative">
                <i className="bi bi-geo-alt-fill text-muted opacity-25" style={{ fontSize: '120px' }}></i>
                <i className="bi bi-question-circle-fill text-warning position-absolute top-0 end-0" style={{ fontSize: '60px', transform: 'translate(20%, -20%)' }}></i>
            </div>

            <h1 className="display-1 fw-bold text-dark mb-0 ls-tight">404</h1>
            <h2 className="fw-bold text-muted text-uppercase ls-2 mb-4">Ndi Ngeo?</h2>

            <p className="lead text-muted mb-5" style={{ maxWidth: '500px' }}>
                (Is it there?) <br />
                The page you are looking for seems to have wandered off into the bush.
                Let's get you back on the right path.
            </p>

            <button onClick={handleGoBack} className="btn btn-dark px-5 py-3 rounded-pill fw-bold ls-1 text-uppercase shadow-lg transition-all hover-scale">
                <i className="bi bi-arrow-left me-2"></i>
                {userRole === 'admin' ? 'Back to Dashboard' :
                    userRole === 'user' ? 'Back to Learning' :
                        'Go Home'}
            </button>

            <style>{`
                .hover-scale:hover { transform: scale(1.05); }
                .ls-tight { letter-spacing: -2px; }
                .ls-2 { letter-spacing: 2px; }
            `}</style>
        </div>
    );
};

export default NotFound;
