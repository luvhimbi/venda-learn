import React, { useState, useEffect } from 'react';
import { db } from '../../services/firebaseConfig';
import { collection, doc, deleteDoc, addDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import AdminNavbar from '../../components/AdminNavbar';
import { fetchAllUsers, invalidateCache } from '../../services/dataCache';
import Swal from 'sweetalert2';
import { BadgeCheck, ShieldAlert, UserMinus, Search, Loader2 } from 'lucide-react';

const AdminUsers: React.FC = () => {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const usersPerPage = 4;

    const loadUsers = async () => {
        setLoading(true);
        try {
            const list = await fetchAllUsers();
            setUsers(list);
        } catch (error) {
            console.error("Error fetching users:", error);
            Swal.fire('Error', 'Could not load users.', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadUsers();
    }, []);

    // Filter Logic: Check username or email
    const filteredUsers = users.filter(user =>
        user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Pagination Calculation
    const indexOfLastUser = currentPage * usersPerPage;
    const indexOfFirstUser = indexOfLastUser - usersPerPage;
    const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
    const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

    const handleEditUser = async (user: any) => {
        const { value: formValues } = await Swal.fire({
            title: `Edit ${user.username || 'User'}`,
            html:
                `<div class="text-start">
                    <label class="form-label smallest fw-bold text-uppercase ls-1">XP Points</label>
                    <input id="swal-input1" class="form-control mb-3" type="number" value="${user.points || 0}">
                    
                    <div class="form-check form-switch mb-3">
                        <input class="form-check-input" type="checkbox" id="swal-input2" ${user.isNativeSpeaker ? 'checked' : ''}>
                        <label class="form-check-label small fw-bold" for="swal-input2">Is Native Speaker (Manually Set)</label>
                    </div>

                    <label class="form-label smallest fw-bold text-uppercase ls-1">Verification Status</label>
                    <select id="swal-input3" class="form-select mb-3">
                        <option value="none" ${user.nativeVerificationStatus === 'none' ? 'selected' : ''}>None</option>
                        <option value="pending" ${user.nativeVerificationStatus === 'pending' ? 'selected' : ''}>Pending</option>
                        <option value="verified" ${user.nativeVerificationStatus === 'verified' ? 'selected' : ''}>Verified</option>
                        <option value="rejected" ${user.nativeVerificationStatus === 'rejected' ? 'selected' : ''}>Rejected</option>
                    </select>

                    ${user.nativeSpeakerBio ? `
                        <label class="form-label smallest fw-bold text-uppercase ls-1">Verification Bio</label>
                        <div class="p-2 bg-light border rounded smallest text-muted">${user.nativeSpeakerBio}</div>
                    ` : ''}
                </div>`,
            focusConfirm: false,
            showCancelButton: true,
            confirmButtonText: 'UPDATE',
            confirmButtonColor: '#FACC15',
            preConfirm: () => {
                return {
                    points: (document.getElementById('swal-input1') as HTMLInputElement).value,
                    isNativeSpeaker: (document.getElementById('swal-input2') as HTMLInputElement).checked,
                    nativeVerificationStatus: (document.getElementById('swal-input3') as HTMLSelectElement).value
                }
            }
        });

        if (formValues) {
            try {
                const userRef = doc(db, "users", user.id);
                // If moving to 'verified', automatically set isNativeSpeaker to true
                // If moving to 'rejected' or 'none', set isNativeSpeaker to false
                const newIsNative = formValues.nativeVerificationStatus === 'verified';

                await setDoc(userRef, {
                    points: Number(formValues.points),
                    isNativeSpeaker: newIsNative,
                    nativeVerificationStatus: formValues.nativeVerificationStatus
                }, { merge: true });

                // --- ADD AUDIT LOG TRIGGER ---
                await addDoc(collection(db, "logs"), {
                    action: "UPDATE",
                    details: `Updated user: ${user.username}. Points: ${formValues.points}, NativeSpeaker: ${newIsNative}`,
                    adminEmail: "Admin",
                    targetId: user.id,
                    timestamp: serverTimestamp()
                });

                Swal.fire('Updated!', 'User records successfully updated.', 'success');
                invalidateCache('allUsers');
                invalidateCache('topLearners*'); // Invalidate leaderboard
                invalidateCache(`user_${user.id}`); // Invalidate this specific user
                loadUsers();
            } catch (error) {
                console.error("Update error:", error);
                Swal.fire('Error', 'Failed to update user.', 'error');
            }
        }
    };

    const handleDeleteUser = async (userId: string, userName: string) => {
        const result = await Swal.fire({
            title: 'Are you sure?',
            text: `This will permanently delete ${userName || 'this user'} and their progress.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#DC2626',
            cancelButtonColor: '#6B7280',
            confirmButtonText: 'Yes, Delete User',
        });

        if (result.isConfirmed) {
            try {
                await deleteDoc(doc(db, "users", userId));

                // --- ADD AUDIT LOG TRIGGER ---
                await addDoc(collection(db, "logs"), {
                    action: "DELETE",
                    details: `Deleted user account: ${userName} (${userId})`,
                    adminEmail: "Admin", // Replace with auth context email if available
                    targetId: userId,
                    timestamp: serverTimestamp()
                });

                Swal.fire('Deleted!', 'User record removed.', 'success');

                // Adjust pagination if deleting the last user on a page
                if (currentUsers.length === 1 && currentPage > 1) {
                    setCurrentPage(currentPage - 1);
                }

                invalidateCache('allUsers');
                invalidateCache('topLearners*'); // Invalidate leaderboard
                invalidateCache(`user_${userId}`); // Invalidate this specific user
                invalidateCache('auditLogs');
                loadUsers();
            } catch (error) {
                console.error("Delete error:", error);
                Swal.fire('Error', 'Failed to delete user.', 'error');
            }
        }
    };

    return (
        <div className="min-vh-100 pb-5 bg-theme-base">
            <AdminNavbar />

            {/* HEADER SECTION */}
            <div className="py-5 bg-theme-surface border-bottom shadow-sm">
                <div className="container" style={{ maxWidth: '1100px' }}>
                    <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-end px-3">
                        <div>
                            <span className="shumela-venda-pulse fw-bold ls-1 text-uppercase smallest d-block mb-2 text-warning-custom">
                                Student Management
                            </span>
                            <h1 className="fw-bold ls-tight mb-0 text-theme-main" style={{ fontSize: '2.5rem' }}>
                                Active <span className="text-warning-custom">Students</span>
                            </h1>
                        </div>
                        <div className="mt-4 mt-md-0 position-relative">
                            <div className="search-container">
                                <Search size={18} className="search-icon text-theme-muted" />
                                <input
                                    type="text"
                                    className="form-control premium-search shadow-none"
                                    placeholder="Search by name or email..."
                                    value={searchTerm}
                                    onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                                    style={{ minWidth: '320px', paddingLeft: '45px' }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container py-5" style={{ maxWidth: '1100px' }}>
                {loading ? (
                    <div className="text-center py-5">
                        <Loader2 className="animate-spin text-warning mx-auto mb-3" size={48} />
                        <p className="ls-1 smallest fw-bold text-theme-muted">SYNCHRONIZING RECORDS...</p>
                    </div>
                ) : (
                    <>
                        <div className="row g-4 px-2">
                            {currentUsers.length > 0 ? currentUsers.map((user) => (
                                <div key={user.id} className="col-12">
                                    <div className="card-premium p-4">
                                        <div className="row align-items-center">
                                            {/* Avatar Column */}
                                            <div className="col-md-1 text-center d-none d-md-block">
                                                <div className="avatar-premium">
                                                    {user.username?.charAt(0).toUpperCase() || 'U'}
                                                </div>
                                            </div>

                                            {/* Info Column */}
                                            <div className="col-md-7">
                                                <div className="d-flex align-items-center gap-2 mb-1">
                                                    <h5 className="fw-bold mb-0 text-theme-main">{user.username || 'Anonymous'}</h5>
                                                    {user.points > 1000 && <BadgeCheck className="text-primary" size={18} />}
                                                </div>
                                                <p className="text-theme-muted smallest fw-bold ls-1 mb-3">{user.email}</p>

                                                <div className="d-flex flex-wrap gap-2">
                                                    <div className="badge-pill-premium">
                                                        <span className="smallest fw-bold text-uppercase">
                                                            Score: <span className="text-theme-main">{user.points || 0} XP</span>
                                                        </span>
                                                    </div>
                                                    <div className="badge-pill-premium">
                                                        <span className="smallest fw-bold text-uppercase">
                                                            Lessons: <span className="text-theme-main">{user.completedLessons?.length || 0}</span>
                                                        </span>
                                                    </div>
                                                    {user.nativeVerificationStatus === 'pending' && (
                                                        <div className="badge-pill-warning">
                                                            <span className="smallest fw-bold text-uppercase d-flex align-items-center gap-1">
                                                                <ShieldAlert size={14} /> Pending Vetting
                                                            </span>
                                                        </div>
                                                    )}
                                                    {user.isNativeSpeaker && (
                                                        <div className="badge-pill-success">
                                                            <span className="smallest fw-bold text-uppercase d-flex align-items-center gap-1">
                                                                <BadgeCheck size={14} /> Verified Native
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                                {user.nativeVerificationStatus === 'pending' && user.nativeSpeakerBio && (
                                                    <div className="mt-3 p-3 bg-theme-surface border border-dashed rounded-3 small text-theme-muted">
                                                        <span className="smallest fw-bold text-uppercase text-theme-muted d-block mb-1">Vetting Bio:</span>
                                                        "{user.nativeSpeakerBio}"
                                                    </div>
                                                )}
                                            </div>

                                            {/* Actions Column */}
                                            <div className="col-md-4 text-md-end mt-4 mt-md-0 d-flex gap-2 justify-content-md-end">
                                                <button
                                                    onClick={() => handleEditUser(user)}
                                                    className="btn-premium-action warning"
                                                >
                                                    EDIT RECORDS
                                                </button>
                                                <button className="btn-premium-action secondary">
                                                    HISTORY
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteUser(user.id, user.username)}
                                                    className="btn-premium-action danger"
                                                >
                                                    <UserMinus size={18} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )) : (
                                <div className="text-center py-5 bg-theme-surface rounded-4 border shadow-sm">
                                    <Search className="text-theme-muted mx-auto mb-3" size={48} />
                                    <p className="text-theme-muted ls-1 fw-bold mt-3 mb-0">No students found matching your search.</p>
                                </div>
                            )}
                        </div>

                        {/* PAGINATION CONTROLS */}
                        {totalPages > 1 && (
                            <div className="d-flex justify-content-center mt-5 gap-2">
                                <button
                                    className="btn-pagination"
                                    disabled={currentPage === 1}
                                    onClick={() => setCurrentPage(currentPage - 1)}
                                >
                                    PREV
                                </button>
                                {[...Array(totalPages)].map((_, i) => (
                                    <button
                                        key={i}
                                        className={`btn-pagination ${currentPage === i + 1 ? 'active' : ''}`}
                                        onClick={() => setCurrentPage(i + 1)}
                                    >
                                        {i + 1}
                                    </button>
                                ))}
                                <button
                                    className="btn-pagination"
                                    disabled={currentPage === totalPages}
                                    onClick={() => setCurrentPage(currentPage + 1)}
                                >
                                    NEXT
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>

            <style>{`
                .text-warning-custom { color: var(--venda-yellow-dark) !important; }
                .card-premium {
                    background-color: var(--color-surface);
                    border: 1px solid var(--color-border);
                    border-radius: 20px;
                    box-shadow: var(--shadow-premium);
                    transition: all 0.3s ease;
                }
                .card-premium:hover {
                    border-color: var(--venda-yellow-dark);
                }
                .avatar-premium {
                    width: 50px;
                    height: 50px;
                    background-color: var(--venda-yellow);
                    color: #000;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: 800;
                    font-size: 1.2rem;
                    margin: 0 auto;
                }
                .badge-pill-premium {
                    background-color: var(--color-surface-soft);
                    color: var(--color-text-muted);
                    padding: 4px 12px;
                    border-radius: 50px;
                    border: 1px solid var(--color-border);
                }
                .badge-pill-warning {
                    background-color: #fef3c7;
                    color: #92400e;
                    padding: 4px 12px;
                    border-radius: 50px;
                    border: 1px solid #fde68a;
                }
                [data-theme='dark'] .badge-pill-warning {
                    background-color: #451a03;
                    color: #fcd34d;
                    border-color: #78350f;
                }
                .badge-pill-success {
                    background-color: #dcfce7;
                    color: #166534;
                    padding: 4px 12px;
                    border-radius: 50px;
                    border: 1px solid #bbf7d0;
                }
                [data-theme='dark'] .badge-pill-success {
                    background-color: #064e3b;
                    color: #6ee7b7;
                    border-color: #065f46;
                }
                .btn-premium-action {
                    font-weight: 700;
                    font-size: 0.75rem;
                    letter-spacing: 1px;
                    padding: 10px 16px;
                    border-radius: 12px;
                    transition: all 0.2s;
                    border: 1px solid transparent;
                }
                .btn-premium-action.warning {
                    background-color: var(--venda-yellow);
                    color: #000;
                }
                .btn-premium-action.warning:hover {
                    background-color: var(--venda-yellow-dark);
                }
                .btn-premium-action.secondary {
                    background-color: var(--color-surface-soft);
                    color: var(--color-text);
                    border-color: var(--color-border);
                }
                .btn-premium-action.secondary:hover {
                    background-color: var(--color-border);
                }
                .btn-premium-action.danger {
                    background-color: #fee2e2;
                    color: #ef4444;
                }
                .btn-premium-action.danger:hover {
                    background-color: #fecaca;
                }
                [data-theme='dark'] .btn-premium-action.danger {
                    background-color: #450a0a;
                    color: #f87171;
                }
                [data-theme='dark'] .btn-premium-action.danger:hover {
                    background-color: #7f1d1d;
                }
                .premium-search {
                    background-color: var(--color-surface-soft) !important;
                    border: 1px solid var(--color-border) !important;
                    border-radius: 12px !important;
                    padding: 12px 15px !important;
                    color: var(--color-text) !important;
                }
                .search-container {
                    position: relative;
                    display: flex;
                    align-items: center;
                }
                .search-icon {
                    position: absolute;
                    left: 15px;
                    z-index: 10;
                }
                .btn-pagination {
                    background-color: var(--color-surface);
                    color: var(--color-text-muted);
                    border: 1px solid var(--color-border);
                    padding: 8px 16px;
                    font-weight: 700;
                    font-size: 0.75rem;
                    border-radius: 10px;
                    transition: all 0.2s;
                }
                .btn-pagination.active {
                    background-color: var(--venda-yellow);
                    color: #000;
                    border-color: var(--venda-yellow);
                }
                .btn-pagination:hover:not(:disabled) {
                    background-color: var(--color-surface-soft);
                    color: var(--color-text);
                }
                .shumela-venda-pulse { animation: pulseAdmin 3s infinite ease-in-out; }
                @keyframes pulseAdmin { 0% { opacity: 0.7; } 50% { opacity: 1; color: var(--venda-yellow-dark); } 100% { opacity: 0.7; } }
            `}</style>
        </div>
    );
};

export default AdminUsers;


