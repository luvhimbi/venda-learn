import { db } from './firebaseConfig';
import { doc, setDoc, Firestore } from 'firebase/firestore';
import { clearCollection } from './dataAdmin';

// Imports for Language Data
import vendaData from '../data/venda.json';
import zuluData from '../data/isiZulu.json';
import xhosaData from '../data/xhosa.json';
import sothoData from '../data/sotho.json';
import tswanaData from '../data/tswana.json';
import xitsongaData from '../data/xitsonga.json';
import ndebeleData from '../data/ndebele.json';
import sepediData from '../data/sepedi.json';
import afrikaansData from '../data/afrikaans.json';
import swatiData from '../data/seswati.json';

const langDataMap: Record<string, any> = {
    venda: { name: 'Tshivenda', data: vendaData },
    zulu: { name: 'isiZulu', data: zuluData },
    xhosa: { name: 'isiXhosa', data: xhosaData },
    sotho: { name: 'Sesotho', data: sothoData },
    tswana: { name: 'Setswana', data: tswanaData },
    tsonga: { name: 'Xitsonga', data: xitsongaData },
    ndebele: { name: 'isiNdebele', data: ndebeleData },
    sepedi: { name: 'Sepedi', data: sepediData },
    afrikaans: { name: 'Afrikaans', data: afrikaansData },
    swati: { name: 'Seswati', data: swatiData }
};

/**
 * The "Nuclear" Overhaul Mechanism.
 * Wipes old data and re-seeds it into 10-item levels per mode.
 */
export const runSystemOverhaul = async () => {
    try {
        console.log("Starting System Overhaul...");

        // 1. Wipe old game collections
        const collectionsToClear = [
            "syllablePuzzles", 
            "sentencePuzzles", 
            "picturePuzzles"
        ];
        
        for (const coll of collectionsToClear) {
            await clearCollection(coll);
        }

        // 2. Iterate through each language
        for (const [langId, config] of Object.entries(langDataMap)) {
            const data = config.data;
            console.log(`Processing ${config.name}...`);

            // Handle categorized JSON (Zulu, Xhosa, etc.)
            if (data.syllablePuzzles || data.sentencePuzzles || data.picturePuzzles) {
                await seedCategorizedData(langId, data);
            } 
            // Handle flat JSON (Venda)
            else if (Array.isArray(data)) {
                await seedFlatData(langId, data);
            }
        }

        console.log("System Overhaul Complete!");
    } catch (error) {
        console.error("Overhaul failed:", error);
        throw error;
    }
};

/**
 * Seeds data already categorized by mode. 
 * Uses separate collections for clarity and performance.
 */
async function seedCategorizedData(langId: string, data: any) {
    const config = [
        { key: 'syllablePuzzles', collection: 'syllablePuzzles', type: 'syllable' },
        { key: 'sentencePuzzles', collection: 'sentencePuzzles', type: 'sentence' },
        { key: 'picturePuzzles', collection: 'picturePuzzles', type: 'picture' }
    ];

    for (const cat of config) {
        const items = data[cat.key];
        if (!items || !Array.isArray(items)) continue;

        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            const level = Math.floor(i / 10) + 1;
            const docId = `${langId}_${cat.type}_${i}`;

            await setDoc(doc(db as Firestore, cat.collection, docId), {
                ...item,
                id: docId,
                languageId: langId,
                gameType: cat.type,
                level: level,
                nativeWord: item.word || item.native || item.translation || item.nativeWord,
                translation: item.english || item.meaning || item.translation
            });
        }
    }
}

/**
 * Seeds flat data by distributing it across all game modes.
 * Ensures Level 1 exists for all games (Puzzle, Bomb, Syllable).
 */
async function seedFlatData(langId: string, data: any[]) {
    // Round-robin distribution
    const modes = [
        { collection: 'syllablePuzzles', type: 'syllable' }
    ];

    const counters = { syllable: 0 };

    for (let i = 0; i < data.length; i++) {
        const item = data[i];
        const modeIdx = i % modes.length;
        const mode = modes[modeIdx];
        
        // Calculate level based on per-game counter
        const gameType = mode.type as keyof typeof counters;
        const count = counters[gameType];
        const level = Math.floor(count / 10) + 1;
        
        const docId = `${langId}_${mode.type}_${count}`;

        await setDoc(doc(db as Firestore, mode.collection, docId), {
            ...item,
            id: docId,
            languageId: langId,
            gameType: mode.type,
            level: level,
            nativeWord: item.word || item.nativeWord,
            translation: item.meaning || item.english || item.translation,
            // Add required syllables if missing for SyllableBuilder
            syllables: item.syllables || (item.word ? item.word.match(/.{1,2}/g) : []) 
        });

        counters[gameType]++;
    }
}






