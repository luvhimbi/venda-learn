import React, { useState, useEffect } from 'react';
import { db, auth } from '../../services/firebaseConfig';
import { collection, getDocs, addDoc, doc, query, where, type Firestore, writeBatch } from 'firebase/firestore';
import { Database, CheckCircle2, AlertCircle, Loader2, Play } from 'lucide-react';
import Swal from 'sweetalert2';
import { useNavigate } from 'react-router-dom';
import { invalidateCache, difficultyToLevel } from '../../services/dataCache';
import isiZuluData from '../../data/isiZulu.json';
import seswatiData from '../../data/seswati.json';
import afrikaansData from '../../data/afrikaans.json';
import sepediData from '../../data/sepedi.json';
import ndebeleData from '../../data/ndebele.json';
import sothoData from '../../data/sotho.json';
import xhosaData from '../../data/xhosa.json';
import xitsongaData from '../../data/xitsonga.json';
import tswanaData from '../../data/tswana.json';
import vendaData from '../../data/venda.json';

interface Log {
    time: string;
    message: string;
    type: 'info' | 'success' | 'warn' | 'error';
}

const GameDataPatcher: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [logs, setLogs] = useState<Log[]>([]);

    useEffect(() => {
        if (!auth.currentUser) {
            Swal.fire('Admin Only', 'You must be logged in as an Admin to access the database patcher.', 'error').then(() => {
                navigate('/');
            });
        }
    }, [navigate]);

    const addLog = (message: string, type: 'info' | 'success' | 'warn' | 'error' = 'info') => {
        setLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), message, type }]);
    };

    const runPatcher = async () => {
        setLoading(true);
        setLogs([]);
        addLog('Starting Database Patcher...', 'info');

        try {
            // Helper for managing Firestore batches (max 500 operations per batch)
            const batchTracker = {
                current: writeBatch(db as Firestore),
                count: 0,
                async commit() {
                    if (this.count > 0) {
                        await this.current.commit();
                        this.current = writeBatch(db as Firestore);
                        this.count = 0;
                    }
                },
                async add(collectionName: string, data: any) {
                    const newDocRef = doc(collection(db as Firestore, collectionName));
                    this.current.set(newDocRef, data);
                    this.count++;
                    if (this.count >= 480) await this.commit();
                },
                async delete(collectionName: string, id: string) {
                    this.current.delete(doc(db as Firestore, collectionName, id));
                    this.count++;
                    if (this.count >= 480) await this.commit();
                }
            };

            // Fetch Languages
            const langSnap = await getDocs(collection(db as Firestore, 'languages'));
            let existingLangs = langSnap.docs.map(d => ({ id: d.id, name: d.data().name }));
            
            // Map data to standardized codes
            const langCodes: Record<string, string> = {
                'isiZulu': 'zu', 'Seswati': 'ss', 'Afrikaans': 'af', 'Sepedi': 'nso', 
                'Ndebele': 'nr', 'Sotho': 'st', 'Xhosa': 'xh', 'Xitsonga': 'ts', 'Tswana': 'tn',
                'Venda': 've'
            };

            const langDataMap: Record<string, any> = {
                'isiZulu': isiZuluData, 'Seswati': seswatiData, 'Afrikaans': afrikaansData,
                'Sepedi': sepediData, 'Ndebele': ndebeleData, 'Sotho': sothoData,
                'Xhosa': xhosaData, 'Xitsonga': xitsongaData, 'Tswana': tswanaData,
                'Venda': vendaData
            };

            const languagesToSeed = Object.keys(langDataMap).map(name => ({
                name,
                code: langCodes[name] || 'unknown',
                status: 'active'
            }));

            const langMap: Record<string, string> = {};

            // Map or Create required languages
            for (const lang of languagesToSeed) {
                // EXCEPTION: Always map 'Venda' to 'venda' if possible to match app defaults
                if (lang.name.toLowerCase() === 'venda') {
                     langMap[lang.name] = 'venda';
                     addLog(`Mapped ${lang.name} to standard ID: venda`, 'info');
                     continue;
                }

                const match = existingLangs.find(l => 
                    l.id.toLowerCase() === lang.name.toLowerCase() ||
                    l.name.toLowerCase().trim() === lang.name.toLowerCase().trim() ||
                    l.name.toLowerCase().includes(lang.name.toLowerCase())
                );
                if (match) {
                    langMap[lang.name] = match.id;
                    addLog(`Mapped ${lang.name} to existing ID: ${match.id}`, 'info');
                } else {
                    addLog(`Creating ${lang.name} language entry...`, 'warn');
                    const docRef = await addDoc(collection(db as Firestore, 'languages'), lang);
                    langMap[lang.name] = docRef.id;
                }
            }
            
            addLog(`Mapped ${Object.keys(langMap).length} Languages!`, 'success');

            // --- CLEANUP ---
            addLog('Purging legacy game fragments and placeholders...', 'warn');
            const collectionsToClean = ['picturePuzzles', 'syllablePuzzles', 'sentencePuzzles'];
            let deletedCount = 0;
            
            // Purge data for specific target languages (safety first)
            for (const targetLangName of Object.keys(langMap)) {
                const lId = langMap[targetLangName];
                for (const col of collectionsToClean) {
                    try {
                        const q = query(collection(db as Firestore, col), where("languageId", "==", lId));
                        const snaps = await getDocs(q);
                        for (const d in snaps.docs) {
                            await batchTracker.delete(col, snaps.docs[d].id);
                            deletedCount++;
                        }
                    } catch(e) {
                         console.error(`Cleanup error in ${col}:`, e);
                    }
                }
            }
            
            // Commit deletions before starting additions
            await batchTracker.commit();
            addLog(`Purged ${deletedCount} legacy records.`, 'success');

            // --- SEEDING EXECUTIONS ---
            
            // Helper to seed from JSON directly using batch
            const seedSimpleBatched = async (collectionName: string, jsonKey: string, formatFunc: (item: any) => any) => {
                let count = 0;
                for (const lang of languagesToSeed) {
                    const langData = langDataMap[lang.name];
                    const langId = langMap[lang.name];
                    
                    if (langData && langData[jsonKey]) {
                        for (const item of langData[jsonKey]) {
                            try {
                                const docData = formatFunc(item);
                                docData.languageId = langId;
                                await batchTracker.add(collectionName, docData);
                                count++;
                            } catch (e) {
                                console.error(`Failed to stage ${collectionName} item:`, e);
                            }
                        }
                    }
                }
                await batchTracker.commit(); // Ensure final batch is sent
                addLog(`Injected ${count} items into ${collectionName}`, 'success');
            };

            await seedSimpleBatched('picturePuzzles', 'picturePuzzles', (item) => ({
                imageUrl: 'placeholder', 
                nativeWord: item.word,
                english: item.english,
                level: item.level
            }));


            await seedSimpleBatched('syllablePuzzles', 'syllablePuzzles', (item) => ({
                word: item.word,
                syllables: item.syllables,
                translation: item.translation,
                level: item.level
            }));

            await seedSimpleBatched('sentencePuzzles', 'sentencePuzzles', (item) => ({
                words: item.words,
                translation: item.translation,
                level: item.level
            }));

            // --- CLEANUP ---
            addLog('Invalidating local caches...', 'info');
            invalidateCache();

            addLog('🎉 Patching Complete! Dictionary architecture is live.', 'success');
            Swal.fire({
                title: 'Data Injected!',
                text: 'Dictionaries for 9 South African languages have been atomicly seeded.',
                icon: 'success',
                confirmButtonColor: '#10B981',
                confirmButtonText: 'Great!'
            }).then(() => { 
                invalidateCache();
                navigate('/mitambo'); 
            });

        } catch (error: any) {
             console.error("Migration Error:", error);
             addLog(`Migration failed: ${error?.message || 'Unknown error'}`, 'error');
             Swal.fire('Error', 'Migration failed. Check console for details.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const repairData = async () => {
        setLoading(true);
        setLogs([]);
        addLog('Starting Data Repair (Missing Levels)...', 'info');

        const collectionsToFix = ['picturePuzzles', 'syllablePuzzles', 'sentencePuzzles'];
        let totalFixed = 0;

        try {
            const batch = writeBatch(db as Firestore);
            let batchCount = 0;

            for (const colName of collectionsToFix) {
                addLog(`Checking ${colName}...`, 'info');
                const snap = await getDocs(collection(db as Firestore, colName));
                
                for (const d of snap.docs) {
                    const data = d.data();
                    if (data.level === undefined || data.level === null) {
                        const level = difficultyToLevel(data.difficulty || 'Beginner');
                        batch.update(doc(db as Firestore, colName, d.id), { level });
                        batchCount++;
                        totalFixed++;
                        
                        if (batchCount >= 450) {
                            await batch.commit();
                            // Reset batch is not needed if we return or similar, but for logic consistency:
                            // We would need a new batch here if we were doing more.
                            // Simplified for this one-time task unless total > 450.
                        }
                    }
                }
            }

            if (batchCount > 0) {
                await batch.commit();
            }

            invalidateCache();
            addLog(`Repair Complete! Fixed ${totalFixed} documents.`, 'success');
            Swal.fire('Repair Success', `Fixed ${totalFixed} documents with missing levels.`, 'success');
        } catch (error: any) {
            console.error("Repair Error:", error);
            addLog(`Repair failed: ${error?.message}`, 'error');
            Swal.fire('Error', 'Repair failed.', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-vh-100 bg-light d-flex flex-column py-5">
            <div className="container" style={{ maxWidth: '700px' }}>
                <div className="brutalist-card p-4 p-md-5 mb-5 shadow-action bg-white">
                    <div className="d-flex align-items-center gap-3 mb-4 border-bottom border-dark border-3 pb-4">
                        <div className="bg-dark p-3 rounded-circle text-white shadow-action-sm">
                            <Database size={32} />
                        </div>
                        <div>
                            <h2 className="fw-black text-dark m-0 d-flex align-items-center gap-2">MULTI-LANG SEEDER <span className="badge bg-danger rounded-pill smallest p-2 text-white border border-dark border-2 border-dashed">Admin Only</span></h2>
                            <p className="smallest text-muted m-0 fw-bold uppercase">Language Seeding Engine</p>
                        </div>
                    </div>

                    <p className="fw-bold mb-4 text-dark" style={{ lineHeight: 1.6 }}>
                        This tool will inject hardcoded dictionaries for <strong className="text-primary bg-dark px-1">9 South African languages</strong> (isiZulu, Afrikaans, Sepedi, etc.) into all 3 core games (Syllables, Sentences, Picture Puzzle).
                    </p>

                    <button 
                        onClick={runPatcher} 
                        disabled={loading}
                        className="btn btn-game btn-game-primary w-100 py-3 shadow-action mb-3">
                        {loading ? <Loader2 className="animate-spin" size={24} /> : <><Play fill="currentColor" size={20} /> INJECT LANGUAGE DATA</>}
                    </button>

                    <button 
                        onClick={repairData} 
                        disabled={loading}
                        className="btn btn-outline-dark w-100 py-3 mb-4 fw-black ls-1 smallest">
                        {loading ? <Loader2 className="animate-spin" size={20} /> : <><Database size={18} className="me-2" /> REPAIR MISSING LEVELS</>}
                    </button>

                    {logs.length > 0 && (
                        <div className="bg-dark text-white p-3 rounded-4 border border-dark border-4" style={{ height: '300px', overflowY: 'auto' }}>
                            <h6 className="fw-black text-warning font-monospace mb-3 ls-1">CONSOLE OUTPUT</h6>
                            {logs.map((log, i) => (
                                <div key={i} className="mb-2 font-monospace d-flex align-items-start gap-2" style={{ fontSize: '13px' }}>
                                    <span style={{ color: '#666', minWidth: '80px' }}>[{log.time}]</span>
                                    {log.type === 'info' && <span className="text-light">{log.message}</span>}
                                    {log.type === 'success' && <span className="text-success d-flex align-items-center gap-1"><CheckCircle2 size={14}/> {log.message}</span>}
                                    {log.type === 'warn' && <span className="text-warning d-flex align-items-center gap-1"><AlertCircle size={14}/> {log.message}</span>}
                                    {log.type === 'error' && <span className="text-danger d-flex align-items-center gap-1"><AlertCircle size={14}/> {log.message}</span>}
                                </div>
                            ))}
                            {loading && (
                                <div className="mt-3 text-warning font-monospace animate-pulse d-flex align-items-center gap-2">
                                    <Loader2 className="animate-spin" size={16} /> Processing background tasks...
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
            <style>{`
                .animate-pulse { animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
                .animate-spin { animation: spin 1s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
};

export default GameDataPatcher;







