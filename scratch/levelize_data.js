import fs from 'fs';
import path from 'path';

const dataDir = 'c:/Users/Perfect Elect/Desktop/MY_IDFA_FOLDER/imaginators/src/data';
const files = [
    'afrikaans.json',
    'isiZulu.json',
    'ndebele.json',
    'sepedi.json',
    'seswati.json',
    'sotho.json',
    'tswana.json',
    'xhosa.json',
    'xitsonga.json'
];

const collections = ['picturePuzzles', 'wordBombWords', 'puzzleWords', 'syllablePuzzles', 'sentencePuzzles'];

files.forEach(fileName => {
    const filePath = path.join(dataDir, fileName);
    if (!fs.existsSync(filePath)) {
        console.log(`File not found: ${fileName}`);
        return;
    }

    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    collections.forEach(key => {
        if (data[key] && Array.isArray(data[key])) {
            data[key] = data[key].map((item, index) => {
                // Remove difficulty
                delete item.difficulty;
                // Add level (10 items per level)
                item.level = Math.floor(index / 10) + 1;
                return item;
            });
        }
    });

    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    console.log(`Updated ${fileName}`);
});
