import React, { useState, useEffect } from 'react';
import AdminNavbar from '../../components/shared/navigation/AdminNavbar';
import { fetchAuditLogs } from '../../services/dataCache';
import { Clock, Loader2 } from 'lucide-react';

const AdminAuditLog: React.FC = () => {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const logsPerPage = 4;

    const loadLogs = async () => {
        setLoading(true);
        try {
            const list = await fetchAuditLogs();
            // Convert Firestore timestamp to readable date
            const enriched = list.map((l: any) => ({
                ...l,
                formattedDate: l.timestamp?.toDate?.() ? l.timestamp.toDate().toLocaleString() : 'Recent'
            }));
            setLogs(enriched);
        } catch (error) {
            console.error("Error fetching logs:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadLogs();
    }, []);

    // Pagination Logic
    const indexOfLastLog = currentPage * logsPerPage;
    const indexOfFirstLog = indexOfLastLog - logsPerPage;
    const currentLogs = logs.slice(indexOfFirstLog, indexOfLastLog);
    const totalPages = Math.ceil(logs.length / logsPerPage);

    const getActionColor = (action: string) => {
        switch (action?.toLowerCase()) {
            case 'delete': return '#DC2626'; // Red
            case 'create': return '#10B981'; // Green
            case 'update': return '#3B82F6'; // Blue
            case 'sync': return '#FACC15';   // Yellow
            default: return '#6B7280';       // Gray
        }
    };

    return (
        <div className="min-vh-100 pb-5 bg-theme-base">
            <AdminNavbar />

            {/* HEADER */}
            <div className="py-5 bg-theme-surface border-bottom shadow-sm">
                <div className="container" style={{ maxWidth: '1100px' }}>
                    <div className="px-3">
                        <span className="shumela-venda-pulse fw-bold ls-1 text-uppercase smallest d-block mb-2 text-warning-custom">
                            Security & History
                        </span>
                        <h1 className="fw-bold ls-tight mb-0 text-theme-main" style={{ fontSize: '2.5rem' }}>
                            Audit <span className="text-warning-custom">Logs</span>
                        </h1>
                    </div>
                </div>
            </div>

            <div className="container py-5" style={{ maxWidth: '1100px' }}>
                {loading ? (
                    <div className="text-center py-5">
                        <Loader2 className="animate-spin text-warning mx-auto mb-3" size={48} />
                        <p className="ls-1 smallest fw-bold text-theme-muted">RETRIEVING ACTIVITY HISTORY...</p>
                    </div>
                ) : (
                    <>
                        <div className="row g-3 px-2">
                            {currentLogs.length > 0 ? currentLogs.map((log) => (
                                <div key={log.id} className="col-12">
                                    <div className="card-premium p-4 position-relative overflow-hidden lesson-card-admin">
                                        <div className="row align-items-center">
                                            <div className="col-md-2">
                                                <span
                                                    className="badge w-100 py-2 fw-bold ls-1 smallest text-uppercase shadow-sm"
                                                    style={{ 
                                                        backgroundColor: getActionColor(log.action), 
                                                        color: log.action === 'sync' || log.action === 'update' ? '#000' : '#fff',
                                                        borderRadius: '8px'
                                                    }}
                                                >
                                                    {log.action}
                                                </span>
                                            </div>
                                            <div className="col-md-7 mt-3 mt-md-0">
                                                <h6 className="fw-bold mb-1 text-theme-main">{log.details || 'No additional details provided.'}</h6>
                                                <p className="text-theme-muted smallest fw-bold ls-1 mb-0 text-uppercase">
                                                    Admin: <span className="text-theme-main">{log.adminEmail || 'System'}</span> • ID: {log.targetId || 'N/A'}
                                                </p>
                                            </div>
                                            <div className="col-md-3 text-md-end mt-2 mt-md-0">
                                                <span className="smallest fw-bold text-theme-muted ls-1 d-flex align-items-center justify-content-md-end gap-1">
                                                    <Clock size={12} />
                                                    {log.formattedDate}
                                                </span>
                                            </div>
                                        </div>
                                        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px', backgroundColor: getActionColor(log.action) }}></div>
                                    </div>
                                </div>
                            )) : (
                                <div className="text-center py-5 bg-theme-surface rounded-4 border shadow-sm">
                                    <p className="text-theme-muted ls-1 fw-bold">No activity logs found in the database.</p>
                                </div>
                            )}
                        </div>

                        {/* PAGINATION */}
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
                .lesson-card-admin:hover {
                    transform: translateX(8px);
                    border-color: var(--venda-yellow-dark);
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

export default AdminAuditLog;










