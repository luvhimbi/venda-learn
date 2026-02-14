import React, { useState, useEffect } from 'react';
import { db } from '../services/firebaseConfig';
import { collection, doc, deleteDoc, addDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import AdminNavbar from '../components/AdminNavbar';
import { fetchAllUsers, invalidateCache } from '../services/dataCache';
import Swal from 'sweetalert2';

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
                    <label class="form-label smallest fw-bold text-uppercase ls-1">Learning Points (XP)</label>
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
                invalidateCache('auditLogs');
                loadUsers();
            } catch (error) {
                console.error("Delete error:", error);
                Swal.fire('Error', 'Failed to delete user.', 'error');
            }
        }
    };

    return (
        <div className="min-vh-100 pb-5 bg-light">
            <AdminNavbar />

            {/* HEADER SECTION */}
            <div className="py-5 bg-white border-bottom shadow-sm">
                <div className="container" style={{ maxWidth: '1100px' }}>
                    <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-end px-3">
                        <div>
                            <span className="shumela-venda-pulse fw-bold ls-2 text-uppercase smallest d-block mb-2 text-warning">
                                Student Management
                            </span>
                            <h1 className="fw-bold ls-tight mb-0 text-dark" style={{ fontSize: '2.5rem' }}>
                                Active <span style={{ color: '#FACC15' }}>Students</span>
                            </h1>
                        </div>
                        <div className="mt-4 mt-md-0">
                            <input
                                type="text"
                                className="form-control light-bordered-input shadow-none"
                                placeholder="Search by name or email..."
                                value={searchTerm}
                                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                                style={{ minWidth: '320px' }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="container py-5" style={{ maxWidth: '1100px' }}>
                {loading ? (
                    <div className="text-center py-5">
                        <div className="spinner-border text-warning" role="status"></div>
                        <p className="mt-3 ls-1 smallest fw-bold text-muted">SYNCHRONIZING RECORDS...</p>
                    </div>
                ) : (
                    <>
                        <div className="row g-4 px-2">
                            {currentUsers.length > 0 ? currentUsers.map((user) => (
                                <div key={user.id} className="col-12">
                                    <div className="user-card-light p-4 rounded-4 bg-white border shadow-sm position-relative">
                                        <div className="row align-items-center">
                                            {/* Avatar Column */}
                                            <div className="col-md-1 text-center d-none d-md-block">
                                                <div className="avatar-placeholder rounded-circle bg-warning d-flex align-items-center justify-content-center fw-bold text-dark mx-auto" style={{ width: '50px', height: '50px', fontSize: '1.2rem' }}>
                                                    {user.username?.charAt(0).toUpperCase() || 'U'}
                                                </div>
                                            </div>

                                            {/* Info Column */}
                                            <div className="col-md-7">
                                                <div className="d-flex align-items-center gap-2 mb-1">
                                                    <h5 className="fw-bold mb-0 text-dark">{user.username || 'Anonymous'}</h5>
                                                    {user.points > 1000 && <i className="bi bi-patch-check-fill text-primary" title="Top Student"></i>}
                                                </div>
                                                <p className="text-muted smallest fw-bold ls-1 mb-3">{user.email}</p>

                                                <div className="d-flex flex-wrap gap-3">
                                                    <div className="bg-light px-3 py-1 rounded-pill border">
                                                        <span className="smallest fw-bold text-uppercase text-secondary">
                                                            Score: <span className="text-dark">{user.points || 0} XP</span>
                                                        </span>
                                                    </div>
                                                    <div className="bg-light px-3 py-1 rounded-pill border">
                                                        <span className="smallest fw-bold text-uppercase text-secondary">
                                                            Lessons: <span className="text-dark">{user.completedLessons?.length || 0} Completed</span>
                                                        </span>
                                                    </div>
                                                    {user.nativeVerificationStatus === 'pending' && (
                                                        <div className="bg-warning-subtle px-3 py-1 rounded-pill border border-warning">
                                                            <span className="smallest fw-bold text-uppercase text-warning-emphasis">
                                                                <i className="bi bi-shield-fill-exclamation me-1"></i> Pending Vetting
                                                            </span>
                                                        </div>
                                                    )}
                                                    {user.isNativeSpeaker && (
                                                        <div className="bg-success-subtle px-3 py-1 rounded-pill border border-success">
                                                            <span className="smallest fw-bold text-uppercase text-success">
                                                                <i className="bi bi-patch-check-fill me-1"></i> Verified Native
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                                {user.nativeVerificationStatus === 'pending' && user.nativeSpeakerBio && (
                                                    <div className="mt-3 p-2 bg-light rounded border border-dashed small text-muted">
                                                        <span className="smallest fw-bold text-uppercase text-muted d-block mb-1">Vetting Bio:</span>
                                                        "{user.nativeSpeakerBio}"
                                                    </div>
                                                )}
                                            </div>

                                            {/* Actions Column */}
                                            <div className="col-md-4 text-md-end mt-4 mt-md-0 d-flex gap-2 justify-content-md-end">
                                                <button
                                                    onClick={() => handleEditUser(user)}
                                                    className="btn btn-warning fw-bold smallest ls-1 px-3 shadow-none border-dark"
                                                    style={{ border: '2px solid #000' }}
                                                >
                                                    EDIT
                                                </button>
                                                <button className="btn btn-outline-dark fw-bold smallest ls-1 px-3">
                                                    HISTORY
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteUser(user.id, user.username)}
                                                    className="btn btn-outline-danger fw-bold smallest ls-1 px-3"
                                                >
                                                    <i className="bi bi-person-x-fill"></i>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )) : (
                                <div className="text-center py-5 bg-white rounded-4 border shadow-sm">
                                    <i className="bi bi-search text-muted" style={{ fontSize: '2rem' }}></i>
                                    <p className="text-muted ls-1 fw-bold mt-3 mb-0">No students found matching your search.</p>
                                </div>
                            )}
                        </div>

                        {/* PAGINATION CONTROLS */}
                        {totalPages > 1 && (
                            <div className="d-flex justify-content-center mt-5 gap-2">
                                <button
                                    className="btn btn-white border shadow-sm btn-sm px-3 fw-bold ls-1 smallest"
                                    disabled={currentPage === 1}
                                    onClick={() => setCurrentPage(currentPage - 1)}
                                >
                                    PREV
                                </button>
                                {[...Array(totalPages)].map((_, i) => (
                                    <button
                                        key={i}
                                        className={`btn btn-sm px-3 fw-bold smallest ${currentPage === i + 1 ? 'btn-warning text-dark' : 'btn-white border'}`}
                                        onClick={() => setCurrentPage(i + 1)}
                                    >
                                        {i + 1}
                                    </button>
                                ))}
                                <button
                                    className="btn btn-white border shadow-sm btn-sm px-3 fw-bold ls-1 smallest"
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
                .ls-tight { letter-spacing: -1px; }
                .ls-1 { letter-spacing: 1px; }
                .ls-2 { letter-spacing: 2px; }
                .smallest { font-size: 11px; }
                
                .light-bordered-input { 
                    background-color: #ffffff; 
                    border: 1px solid #ced4da; 
                    border-radius: 8px; 
                    padding: 10px 15px; 
                }
                .light-bordered-input:focus {
                    border-color: #FACC15;
                    box-shadow: 0 0 0 0.2rem rgba(250, 204, 21, 0.1);
                }

                .user-card-light { transition: all 0.2s ease; border-left: 5px solid transparent !important; }
                .user-card-light:hover { 
                    transform: translateX(4px); 
                    border-left: 5px solid #FACC15 !important;
                    border-color: #FACC15 !important;
                }

                .shumela-venda-pulse { animation: pulseAdmin 3s infinite ease-in-out; }
                @keyframes pulseAdmin { 0% { opacity: 0.7; } 50% { opacity: 1; } 100% { opacity: 0.7; } }
            `}</style>
        </div>
    );
};

export default AdminUsers;