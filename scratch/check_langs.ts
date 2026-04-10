
import { db } from './src/services/firebaseConfig';
import { collection, getDocs } from 'firebase/firestore';

async function checkLangs() {
    try {
        const snap = await getDocs(collection(db, 'languages'));
        const langs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        console.log("LANGUAGES IN DB:");
        console.log(JSON.stringify(langs, null, 2));
    } catch (e) {
        console.error(e);
    }
}

checkLangs();
