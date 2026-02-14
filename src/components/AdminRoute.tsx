import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';

import { doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import {db,auth} from "../services/firebaseConfig.ts";


const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                const userDoc = await getDoc(doc(db, 'users', user.uid));
                setIsAdmin(userDoc.data()?.role === 'admin');
            } else {
                setIsAdmin(false);
            }
        });
        return () => unsubscribe();
    }, []);

    if (isAdmin === null) return <div>Loading...</div>; // Or a spinner
    return isAdmin ? <>{children}</> : <Navigate to="/login" />;
};

export default AdminRoute;