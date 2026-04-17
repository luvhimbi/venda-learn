import React, { useEffect, useState } from 'react';
import { db, auth } from '../../services/firebaseConfig';
import { doc, updateDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { Bell, Flame, Globe, Monitor, Sun, Moon, Laptop, Clock, ArrowLeft } from 'lucide-react';
import { useNavigate } from "react-router-dom";
import { useTheme } from '../../app/providers/contexts/ThemeContext';
import type { ThemeMode } from '../../app/providers/contexts/ThemeContext';
import { fetchUserData, fetchLanguages, invalidateCache } from '../../services/dataCache';

import Swal from 'sweetalert2';
import { requestNotificationPermission, updateReminderSettings } from '../../features/notifications/services/reminderService';

interface UserProfile {
    username: string;
    email: string;
    points: number;
    level: number;
    streak: number;
    preferredLanguageId?: string;
    reminderEnabled?: boolean;
    reminderTime?: string;
    soundEnabled?: boolean;
    hapticEnabled?: boolean;
}

const Settings: React.FC = () => {
    const [userData, setUserData] = useState<UserProfile | null>(null);
    const [languages, setLanguages] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [reminderEnabled, setReminderEnabled] = useState(false);
    const [reminderTime, setReminderTime] = useState('09:00');
    const [soundEnabled, setSoundEnabled] = useState(true);
    const [hapticEnabled, setHapticEnabled] = useState(true);
    const { mode, setMode } = useTheme();
    const navigate = useNavigate();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                const [data, langsData] = await Promise.all([
                    fetchUserData(),
                    fetchLanguages()
                ]);

                if (langsData) setLanguages(langsData);

                if (data) {
                    const profile = data as UserProfile;
                    setUserData(profile);
                    setReminderEnabled(profile.reminderEnabled ?? false);
                    setReminderTime(profile.reminderTime || '18:00');
                    setSoundEnabled(profile.soundEnabled ?? true);
                    setHapticEnabled(profile.hapticEnabled ?? true);
                }
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const handleLanguageChange = async (langId: string) => {
        if (!auth.currentUser) return;
        try {
            const userRef = doc(db, "users", auth.currentUser.uid);
            await updateDoc(userRef, { preferredLanguageId: langId });
            setUserData((prev: any) => ({ ...prev, preferredLanguageId: langId }));
            invalidateCache(`user_${auth.currentUser.uid}`);
            Swal.fire({
                title: 'Language Updated!',
                text: `Target language changed.`,
                icon: 'success',
                toast: true,
                position: 'top-end',
                timer: 3000,
                showConfirmButton: false
            });
        } catch (e) {
            Swal.fire('Error', 'Failed to update language.', 'error');
        }
    };

    if (loading) return (
        <div className="min-vh-100 bg-theme-base d-flex justify-content-center align-items-center">
            <div className="spinner-border" style={{ color: '#FACC15' }}></div>
        </div>
    );

    return (
        <div className="bg-theme-base min-vh-100 py-5" style={{ background: 'url("data:image/svg+xml,%3Csvg width=\'20\' height=\'20\' viewBox=\'0 0 20 20\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'%23888888\' fill-opacity=\'0.03\' fill-rule=\'evenodd\'%3E%3Ccircle cx=\'3\' cy=\'3\' r=\'1\'/%3E%3C/g%3E%3C/svg%3E")' }}>
            <div className="container" style={{ maxWidth: '800px' }}>

                <div className="d-flex align-items-center gap-3 mb-5">
                    <button
                        onClick={() => navigate('/profile')}
                        className="btn btn-game-white brutalist-card--sm rounded-circle d-flex align-items-center justify-content-center"
                        style={{ width: '45px', height: '45px' }}
                    >
                        <ArrowLeft size={20} className="text-dark" />
                    </button>
                    <div>
                        <h1 className="fw-black text-theme-main mb-0 ls-tight uppercase" style={{ fontSize: '2.5rem' }}>Settings</h1>
                        <p className="small fw-bold text-theme-muted mb-0 uppercase ls-1">Manage your account and preferences</p>
                    </div>
                </div>

                {/* LANGUAGE PREFERENCES */}
                <section className="mb-5">
                    <div className="brutalist-card p-4 shadow-action bg-theme-card">
                        <div className="d-flex align-items-center gap-3 mb-4">
                            <div className="bg-warning p-2 brutalist-card--sm rounded-3">
                                <Globe size={24} className="text-dark" />
                            </div>
                            <h3 className="fw-black mb-0 text-theme-main uppercase ls-tight" style={{ fontSize: '1.25rem' }}>Target Language</h3>
                        </div>
                        <div className="row g-3">
                            {languages.map((lang) => (
                                <div key={lang.id} className="col-6 col-md-4">
                                    <div
                                        onClick={() => handleLanguageChange(lang.id)}
                                        className={`p-3 brutalist-card--sm text-center cursor-pointer transition-all h-100 d-flex flex-column align-items-center justify-content-center hover-lift ${userData?.preferredLanguageId === lang.id
                                            ? 'bg-warning shadow-action-sm border-theme-main'
                                            : 'bg-theme-base shadow-none'
                                            }`}
                                        style={{ minHeight: '100px' }}
                                    >
                                        <span className="smallest-print fw-black text-theme-muted mb-1 ls-2 uppercase opacity-75">{lang.code}</span>
                                        <h6 className="fw-black mb-0 ls-tight uppercase text-theme-main" style={{ fontSize: '1rem' }}>{lang.name}</h6>

                                        {userData?.preferredLanguageId === lang.id && (
                                            <div className="mt-2">
                                                <span className="badge bg-theme-main text-theme-inv rounded-pill px-3 py-1 smallest-print fw-black ls-1 uppercase shadow-sm">
                                                    ACTIVE
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* THEME / APPEARANCE SETTINGS */}
                <section className="mb-5">
                    <div className="p-4 brutalist-card shadow-action bg-theme-card mb-4">
                        <div className="d-flex align-items-center gap-3 mb-4">
                            <div className="bg-info p-2 brutalist-card--sm rounded-3 text-dark">
                                <Monitor size={24} />
                            </div>
                            <h3 className="fw-black mb-0 text-theme-main uppercase ls-tight" style={{ fontSize: '1.25rem' }}>Appearance</h3>
                        </div>
                        <div className="d-flex flex-wrap gap-3">
                            {[
                                { mode: 'light', icon: Sun, label: 'Light' },
                                { mode: 'dark', icon: Moon, label: 'Dark' },
                                { mode: 'system', icon: Laptop, label: 'System' }
                            ].map((item) => (
                                <button
                                    key={item.mode}
                                    onClick={() => setMode(item.mode as ThemeMode)}
                                    className={`theme-pill-btn d-flex align-items-center gap-3 px-4 py-3 rounded-3 border-3 transition-all flex-grow-1 ${mode === item.mode ? 'bg-theme-main text-theme-inv border-theme-main shadow-action-sm' : 'bg-theme-base text-theme-main border-theme-soft'}`}
                                >
                                    <item.icon size={20} />
                                    <span className="fw-black uppercase ls-1">{item.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </section>

                {/* NOTIFICATION PREFERENCES */}
                <section className="mb-5">
                    <div className="brutalist-card p-4 shadow-action bg-theme-card">
                        <div className="d-flex align-items-center gap-3 mb-4">
                            <div className="bg-danger p-2 brutalist-card--sm rounded-3 text-white">
                                <Bell size={24} />
                            </div>
                            <h3 className="fw-black mb-0 text-theme-main uppercase ls-tight" style={{ fontSize: '1.25rem' }}>Learning Reminders</h3>
                        </div>

                        <div className="row align-items-center g-4">
                            <div className="col-md-7">
                                <p className="small fw-bold text-theme-muted mb-3 uppercase ls-1">
                                    Don't break your streak! Set a reminder to keep your daily learning habit strong.
                                </p>

                            </div>
                            <div className="col-md-5">
                                <div className="d-flex flex-column gap-3">
                                    <div className="form-check form-switch d-flex align-items-center gap-3 ps-0 mb-0">
                                        <input
                                            className="form-check-input ms-0 border border-theme-main border-2"
                                            type="checkbox"
                                            role="switch"
                                            id="reminderSwitch"
                                            checked={reminderEnabled}
                                            onChange={async (e) => {
                                                const enabled = e.target.checked;
                                                if (enabled) {
                                                    const granted = await requestNotificationPermission();
                                                    if (!granted) {
                                                        Swal.fire({
                                                            title: 'Permission Required',
                                                            text: 'Please enable notifications in your browser to receive reminders.',
                                                            icon: 'info',
                                                            confirmButtonColor: '#111827'
                                                        });
                                                        return;
                                                    }
                                                }
                                                setReminderEnabled(enabled);
                                                await updateReminderSettings({
                                                    reminderEnabled: enabled,
                                                    reminderTime
                                                });
                                            }}
                                            style={{ width: '45px', height: '24px', cursor: 'pointer', backgroundColor: reminderEnabled ? '#FACC15' : '#eee' }}
                                        />
                                        <label className="form-check-label small fw-black text-theme-main cursor-pointer uppercase ls-1" htmlFor="reminderSwitch">
                                            {reminderEnabled ? 'Reminders Active' : 'Reminders Disabled'}
                                        </label>
                                    </div>

                                    {reminderEnabled && (
                                        <div className="d-flex align-items-center gap-2 animate__animated animate__fadeIn">
                                            <div className="bg-theme-surface p-2 rounded-3 text-theme-muted">
                                                <Clock size={16} />
                                            </div>
                                            <input
                                                type="time"
                                                className="brutalist-card--sm border-theme-main bg-theme-surface p-2 h-auto fw-black uppercase text-theme-main"
                                                style={{ width: '130px' }}
                                                value={reminderTime}
                                                onChange={async (e) => {
                                                    const time = e.target.value;
                                                    setReminderTime(time);
                                                    await updateReminderSettings({
                                                        reminderEnabled,
                                                        reminderTime: time
                                                    });
                                                }}
                                            />
                                            <span className="smallest fw-black text-theme-main text-uppercase ls-1">Daily</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* AUDIO & TACTILE PREFERENCES */}
                <section className="mb-5">
                    <div className="brutalist-card p-4 shadow-action bg-theme-card">
                        <div className="d-flex align-items-center gap-3 mb-4">
                            <div className="bg-success p-2 brutalist-card--sm rounded-3 text-white">
                                <Flame size={24} />
                            </div>
                            <h3 className="fw-black mb-0 text-theme-main uppercase ls-tight" style={{ fontSize: '1.25rem' }}>Game Feedback</h3>
                        </div>

                        <div className="row g-4">
                            <div className="col-md-6">
                                <div className="form-check form-switch d-flex align-items-center gap-3 ps-0 mb-3">
                                    <input
                                        className="form-check-input ms-0 border border-theme-main border-2"
                                        type="checkbox"
                                        role="switch"
                                        id="soundSwitch"
                                        checked={soundEnabled}
                                        onChange={async (e) => {
                                            const enabled = e.target.checked;
                                            setSoundEnabled(enabled);
                                            const userRef = doc(db, "users", auth.currentUser!.uid);
                                            await updateDoc(userRef, { soundEnabled: enabled });
                                            invalidateCache(`user_${auth.currentUser!.uid}`);
                                        }}
                                        style={{ width: '45px', height: '24px', cursor: 'pointer', backgroundColor: soundEnabled ? '#f59e0b' : '#eee' }}
                                    />
                                    <label className="form-check-label small fw-black text-theme-main cursor-pointer uppercase ls-1" htmlFor="soundSwitch">
                                        SFX {soundEnabled ? 'Enabled' : 'Muted'}
                                    </label>
                                </div>
                                <p className="smallest text-theme-muted mb-0 ps-5 ms-3 uppercase fw-bold ls-1">Play subtle sounds during navigation and games.</p>
                            </div>

                            <div className="col-md-6">
                                <div className="form-check form-switch d-flex align-items-center gap-3 ps-0 mb-3">
                                    <input
                                        className="form-check-input ms-0 border border-theme-main border-2"
                                        type="checkbox"
                                        role="switch"
                                        id="hapticSwitch"
                                        checked={hapticEnabled}
                                        onChange={async (e) => {
                                            const enabled = e.target.checked;
                                            setHapticEnabled(enabled);
                                            const userRef = doc(db, "users", auth.currentUser!.uid);
                                            await updateDoc(userRef, { hapticEnabled: enabled });
                                            invalidateCache(`user_${auth.currentUser!.uid}`);
                                        }}
                                        style={{ width: '45px', height: '24px', cursor: 'pointer', backgroundColor: hapticEnabled ? '#f59e0b' : '#eee' }}
                                    />
                                    <label className="form-check-label small fw-black text-theme-main cursor-pointer uppercase ls-1" htmlFor="hapticSwitch">
                                        Haptics {hapticEnabled ? 'On' : 'Off'}
                                    </label>
                                </div>
                                <p className="smallest text-theme-muted mb-0 ps-5 ms-3 uppercase fw-bold ls-1">Vibrate device for important game events.</p>
                            </div>
                        </div>
                    </div>
                </section>

            </div>
        </div>
    );
};

export default Settings;







