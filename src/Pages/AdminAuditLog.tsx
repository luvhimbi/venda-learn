import React, { useState, useEffect } from 'react';
import AdminNavbar from '../components/AdminNavbar';
import { fetchAuditLogs } from '../services/dataCache';

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
        <div className="min-vh-100 pb-5 bg-light">
            <AdminNavbar />

            {/* HEADER */}
            <div className="py-5 bg-white border-bottom shadow-sm">
                <div className="container" style={{ maxWidth: '1100px' }}>
                    <div className="px-3">
                        <span className="shumela-venda-pulse fw-bold ls-2 text-uppercase smallest d-block mb-2 text-warning">
                            Security & History
                        </span>
                        <h1 className="fw-bold ls-tight mb-0 text-dark" style={{ fontSize: '2.5rem' }}>
                            Audit <span style={{ color: '#FACC15' }}>Logs</span>
                        </h1>
                    </div>
                </div>
            </div>

            <div className="container py-5" style={{ maxWidth: '1100px' }}>
                {loading ? (
                    <div className="text-center py-5">
                        <div className="spinner-border text-warning" role="status"></div>
                        <p className="mt-3 ls-1 smallest fw-bold text-muted">RETRIEVING ACTIVITY HISTORY...</p>
                    </div>
                ) : (
                    <>
                        <div className="row g-3 px-2">
                            {currentLogs.length > 0 ? currentLogs.map((log) => (
                                <div key={log.id} className="col-12">
                                    <div className="bg-white p-4 rounded-4 border shadow-sm position-relative overflow-hidden">
                                        <div className="row align-items-center">
                                            <div className="col-md-2">
                                                <span
                                                    className="badge w-100 py-2 fw-bold ls-1 smallest text-uppercase"
                                                    style={{ backgroundColor: getActionColor(log.action), color: log.action === 'sync' ? '#000' : '#fff' }}
                                                >
                                                    {log.action}
                                                </span>
                                            </div>
                                            <div className="col-md-7 mt-3 mt-md-0">
                                                <h6 className="fw-bold mb-1 text-dark">{log.details || 'No additional details provided.'}</h6>
                                                <p className="text-muted smallest fw-bold ls-1 mb-0 text-uppercase">
                                                    Admin: <span className="text-dark">{log.adminEmail || 'System'}</span> • ID: {log.targetId || 'N/A'}
                                                </p>
                                            </div>
                                            <div className="col-md-3 text-md-end mt-2 mt-md-0">
                                                <span className="smallest fw-bold text-muted ls-1">
                                                    <i className="bi bi-clock-history me-1"></i>
                                                    {log.formattedDate}
                                                </span>
                                            </div>
                                        </div>
                                        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px', backgroundColor: getActionColor(log.action) }}></div>
                                    </div>
                                </div>
                            )) : (
                                <div className="text-center py-5 bg-white rounded-4 border">
                                    <p className="text-muted ls-1 fw-bold">No activity logs found in the database.</p>
                                </div>
                            )}
                        </div>

                        {/* PAGINATION */}
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
                .smallest { font-size: 10px; }
                
                .shumela-venda-pulse { animation: pulseAdmin 3s infinite ease-in-out; }
                @keyframes pulseAdmin { 0% { opacity: 0.7; } 50% { opacity: 1; } 100% { opacity: 0.7; } }
            `}</style>
        </div>
    );
};

export default AdminAuditLog;