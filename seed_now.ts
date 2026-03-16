import { seedSyllables } from './src/services/seedSyllables';
import { seedSentences } from './src/services/seedSentences';

async function run() {
    console.log("Starting DB Seeds...");
    await seedSyllables();
    await seedSentences();
    console.log("Finished!");
    process.exit(0);
}

run();
