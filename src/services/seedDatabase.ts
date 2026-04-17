import { db } from './firebaseConfig';
import type { Firestore } from 'firebase/firestore';
import { doc, setDoc } from 'firebase/firestore';

const lessonsData = [
    {
        id: 'greetings',
        title: 'Greetings',
        nativeTitle: 'Ndumeliso',
        difficulty: 'Beginner',
        microLessons: [
            {
                id: 'greetings__ml_0',
                title: 'Basic Hello',
                slides: [
                    { nativeWord: "Ndaa", english: "Hello (Male)" },
                    { nativeWord: "Aa", english: "Hello (Female)" }
                ],
                questions: [
                    { id: 1, question: "How do you say 'Hello' as man?", options: ["Ndaa", "Aa", "Matsheloni"], correctAnswer: "Ndaa", explanation: "'Ndaa' is specifically for men. 'Aa' is used by women, and 'Matsheloni' means morning.", type: "multiple-choice" },
                    { id: 2, question: "'Aa' is the greeting used by men.", correctAnswer: false, explanation: "'Aa' is the greeting used by women. Men use 'Ndaa'.", type: "true-false" }
                ]
            },
            {
                id: 'greetings__ml_1',
                title: 'Time of Day',
                slides: [
                    { nativeWord: "Ndi matsheloni", english: "Good morning" },
                    { nativeWord: "Ndi masiari", english: "Good afternoon" },
                    { nativeWord: "Ndi madekwana", english: "Good night" }
                ],
                questions: [
                    { id: 1, question: "Ndi ___ (Good morning)", correctAnswer: "matsheloni", hint: "matsh...", explanation: "'Ndi matsheloni' means Good morning in Tshivenda.", type: "fill-in-the-blank" },
                    { id: 2, question: "Match the Venda greetings to their English meanings", pairs: [{ nativeWord: "Ndaa", english: "Hello (Male)" }, { nativeWord: "Aa", english: "Hello (Female)" }, { nativeWord: "Ndi matsheloni", english: "Good morning" }], explanation: "Ndaa (male hello), Aa (female hello), Ndi matsheloni (good morning).", type: "match-pairs" },
                    { id: 3, nativeWord: "Ndi madekwana", question: "What did you hear?", options: ["Good morning", "Good afternoon", "Good night"], correctAnswer: "Good night", explanation: "'Ndi madekwana' means Good night, used from around 5 PM.", type: "listen-and-choose" }
                ]
            }
        ]
    },
    {
        id: 'numbers',
        title: 'Numbers',
        nativeTitle: 'Nomboro',
        difficulty: 'Beginner',
        microLessons: [
            {
                id: 'numbers__ml_0',
                title: 'Numbers 1-5',
                slides: [
                    { nativeWord: "Nthihi", english: "One" },
                    { nativeWord: "Vhuvhili", english: "Two" },
                    { nativeWord: "Raru", english: "Three" },
                    { nativeWord: "Ina", english: "Four" },
                    { nativeWord: "Ṱhanu", english: "Five" }
                ],
                questions: [
                    { id: 1, question: "How do you say 'One' in Tshivenda?", options: ["Nthihi", "Vhuvhili", "Raru"], correctAnswer: "Nthihi", explanation: "Nthihi is 1. Vhuvhili is 2, and Raru is 3.", type: "multiple-choice" },
                    { id: 2, question: "'Fumi' means Five in Tshivenda.", correctAnswer: false, explanation: "Fumi means Ten (10), not Five. Five is 'Ṱhanu'.", type: "true-false" }
                ]
            },
            {
                id: 'numbers__ml_1',
                title: 'Numbers 6-10',
                slides: [
                    { nativeWord: "Ṱhanu na nthihi", english: "Six" },
                    { nativeWord: "Ṱhanu na vhuvhili", english: "Seven" },
                    { nativeWord: "Ṱhanu na raru", english: "Eight" },
                    { nativeWord: "Ṱhanu na ina", english: "Nine" },
                    { nativeWord: "Fumi", english: "Ten" }
                ],
                questions: [
                    { id: 1, question: "Ṱhanu na ___ = Seven (Ṱhanu + ?)", correctAnswer: "vhuvhili", hint: "vhuv...", explanation: "Seven is 'Ṱhanu na vhuvhili' (Five and Two).", type: "fill-in-the-blank" },
                    { id: 2, question: "Match the Venda numbers to their English values", pairs: [{ nativeWord: "Nthihi", english: "One" }, { nativeWord: "Raru", english: "Three" }, { nativeWord: "Fumi", english: "Ten" }], explanation: "Nthihi=1, Raru=3, Fumi=10.", type: "match-pairs" }
                ]
            },
            {
                id: 'numbers__ml_2',
                title: 'Big Numbers',
                slides: [
                    { nativeWord: "Fumi na nthihi", english: "Eleven" },
                    { nativeWord: "Fumi na vhuvhili", english: "Twelve" },
                    { nativeWord: "Fahuvhili", english: "Twenty" },
                    { nativeWord: "Fahuraru", english: "Thirty" },
                    { nativeWord: "Ḓana", english: "One Hundred" }
                ],
                questions: [
                    { id: 1, nativeWord: "Ṱhanu", question: "What number did you hear?", options: ["Three", "Five", "Ten"], correctAnswer: "Five", explanation: "'Ṱhanu' means Five (5) in Tshivenda.", type: "listen-and-choose" },
                    { id: 2, question: "Match the Venda numbers to their English values", pairs: [{ nativeWord: "Fahuvhili", english: "Twenty" }, { nativeWord: "Fahuraru", english: "Thirty" }, { nativeWord: "Ḓana", english: "One Hundred" }], explanation: "Fahuvhili=20, Fahuraru=30, Ḓana=100.", type: "match-pairs" }
                ]
            }
        ]
    },
    {
        id: 'identity',
        title: 'Identity',
        nativeTitle: 'Vhuthu na mbeu',
        difficulty: 'Beginner',
        microLessons: [
            {
                id: 'identity__ml_0',
                title: 'Children & Siblings',
                slides: [
                    { nativeWord: "Mutukana", english: "Boy" },
                    { nativeWord: "Musidzana", english: "Girl" },
                    { nativeWord: "Murathu", english: "Younger sibling" },
                    { nativeWord: "khaladzi", english: "Sister" },
                    { nativeWord: "Muzwala", english: "cousin" }
                ],
                questions: [
                    { id: 1, question: "How do you say 'Boy' in Tshivenda?", options: ["Mutukana", "Musidzana", "Munna"], correctAnswer: "Mutukana", explanation: "Mutukana is a boy. Musidzana is a girl, and Munna is a man.", type: "multiple-choice" },
                    { id: 2, question: "'Musadzi' means Man in Tshivenda.", correctAnswer: false, explanation: "Musadzi means Woman. Man is 'Munna' in Tshivenda.", type: "true-false" }
                ]
            },
            {
                id: 'identity__ml_1',
                title: 'Adults & Babies',
                slides: [
                    { nativeWord: "lutshetshe", english: "new born baby" },
                    { nativeWord: "nwana", english: "a young child" },
                    { nativeWord: "Munna", english: "Man" },
                    { nativeWord: "Musadzi", english: "Woman" }
                ],
                questions: [
                    { id: 1, question: "A young girl is called a ___ in Tshivenda.", correctAnswer: "musidzana", hint: "musid...", explanation: "Musidzana specifically refers to a young girl.", type: "fill-in-the-blank" },
                    { id: 2, question: "Match the Venda identity words to English", pairs: [{ nativeWord: "Mutukana", english: "Boy" }, { nativeWord: "Musidzana", english: "Girl" }, { nativeWord: "Munna", english: "Man" }, { nativeWord: "Musadzi", english: "Woman" }], explanation: "Mutukana=Boy, Musidzana=Girl, Munna=Man, Musadzi=Woman.", type: "match-pairs" },
                    { id: 3, nativeWord: "Musadzi", question: "What did you hear?", options: ["Boy", "Woman", "Man"], correctAnswer: "Woman", explanation: "'Musadzi' means Woman in Tshivenda.", type: "listen-and-choose" }
                ]
            }
        ]
    },
    {
        id: 'objects',
        title: 'Objects',
        nativeTitle: 'Zwithu',
        difficulty: 'Beginner',
        microLessons: [
            {
                id: 'objects__ml_0',
                title: 'Household Items',
                slides: [
                    { nativeWord: "Ndilo", english: "Plate", imageUrl: "https://cdn-icons-png.flaticon.com/512/662/662731.png" },
                    { nativeWord: "Vhaisene", english: "Television", imageUrl: "https://cdn-icons-png.flaticon.com/512/716/716429.png" },
                    { nativeWord: "Vothi", english: "Door", imageUrl: "https://cdn-icons-png.flaticon.com/512/59/59802.png" },
                    { nativeWord: "Tshitepulu", english: "Table", imageUrl: "https://cdn-icons-png.flaticon.com/512/2256/2256920.png" }
                ],
                questions: [
                    { id: 1, question: "How do you say 'Plate' in Tshivenda?", options: ["Ndilo", "Vothi", "Vhaisene"], correctAnswer: "Ndilo", explanation: "Ndilo is a plate. Vothi is a door and Vhaisene is a TV.", type: "multiple-choice" },
                    { id: 2, question: "What is a 'Vothi'?", options: ["Table", "Television", "Door"], correctAnswer: "Door", explanation: "Vothi means door. Think of it as the 'vote' to enter a room!", type: "multiple-choice" }
                ]
            }
        ]
    },
    {
        id: 'days-of-the-week',
        title: 'Days of the Week',
        nativeTitle: 'Maduvha a vhege',
        difficulty: 'Beginner',
        microLessons: [
            {
                id: 'days-of-the-week__ml_0',
                title: 'Weekdays',
                slides: [
                    { nativeWord: "Musumbuluwo", english: "Monday", imageUrl: "https://cdn-icons-png.flaticon.com/512/3652/3652191.png" },
                    { nativeWord: "Ḽavhuvhili", english: "Tuesday", imageUrl: "https://cdn-icons-png.flaticon.com/512/3652/3652213.png" },
                    { nativeWord: "Ḽavhuraru", english: "Wednesday", imageUrl: "https://cdn-icons-png.flaticon.com/512/3652/3652243.png" },
                    { nativeWord: "Ḽavhuṋa", english: "Thursday", imageUrl: "https://cdn-icons-png.flaticon.com/512/3652/3652267.png" },
                    { nativeWord: "Ḽavhuṱanu", english: "Friday", imageUrl: "https://cdn-icons-png.flaticon.com/512/3652/3652295.png" }
                ],
                questions: [
                    { id: 1, question: "Which day is 'Ḽavhuvhili'?", options: ["Monday", "Tuesday", "Friday"], correctAnswer: "Tuesday", explanation: "Ḽavhuvhili is Tuesday. Remember 'vhili' sounds like 'mbili' (two).", type: "multiple-choice" },
                    { id: 2, question: "How do you say Friday in Tshivenda?", options: ["Mugivhibi", "Ḽavhuṋa", "Ḽavhuṱanu"], correctAnswer: "Ḽavhuṱanu", explanation: "Ḽavhuṱanu is Friday (Day 5). Ṱanu means five.", type: "multiple-choice" }
                ]
            },
            {
                id: 'days-of-the-week__ml_1',
                title: 'Weekend',
                slides: [
                    { nativeWord: "Mugivhibi", english: "Saturday", imageUrl: "https://cdn-icons-png.flaticon.com/512/3652/3652320.png" },
                    { nativeWord: "Swondaha", english: "Sunday", imageUrl: "https://cdn-icons-png.flaticon.com/512/3652/3652347.png" }
                ],
                questions: [
                    { id: 1, question: "What is 'Swondaha'?", options: ["Saturday", "Sunday", "Wednesday"], correctAnswer: "Sunday", explanation: "Swondaha is Sunday. It sounds very similar to the English word!", type: "multiple-choice" }
                ]
            }
        ]
    },
    {
        id: 'months-of-the-year-full',
        title: 'All 12 Months',
        nativeTitle: 'Miṅwedzi ya ṅwaha',
        difficulty: 'Intermediate',
        microLessons: [
            {
                id: 'months-of-the-year-full__ml_0',
                title: 'January - June',
                slides: [
                    { nativeWord: "Phando", english: "January", imageUrl: "https://cdn-icons-png.flaticon.com/512/3652/3652191.png" },
                    { nativeWord: "Luhuhi", english: "February", imageUrl: "https://cdn-icons-png.flaticon.com/512/1154/1154562.png" },
                    { nativeWord: "Ṱhafamuhala", english: "March", imageUrl: "https://cdn-icons-png.flaticon.com/512/862/862856.png" },
                    { nativeWord: "Lambamai", english: "April", imageUrl: "https://cdn-icons-png.flaticon.com/512/3069/3069172.png" },
                    { nativeWord: "Shundunthule", english: "May", imageUrl: "https://cdn-icons-png.flaticon.com/512/2322/2322701.png" },
                    { nativeWord: "Fulwi", english: "June", imageUrl: "https://cdn-icons-png.flaticon.com/512/642/642000.png" }
                ],
                questions: [
                    { id: 1, question: "Which month is 'Phando'?", options: ["January", "June", "December"], correctAnswer: "January", explanation: "Phando is the first month of the year.", type: "multiple-choice" }
                ]
            },
            {
                id: 'months-of-the-year-full__ml_1',
                title: 'July - December',
                slides: [
                    { nativeWord: "Fulwana", english: "July", imageUrl: "https://cdn-icons-png.flaticon.com/512/4814/4814268.png" },
                    { nativeWord: "Thangule", english: "August", imageUrl: "https://cdn-icons-png.flaticon.com/512/959/959711.png" },
                    { nativeWord: "Khubvumedzi", english: "September", imageUrl: "https://cdn-icons-png.flaticon.com/512/2917/2917575.png" },
                    { nativeWord: "Tshimedzi", english: "October", imageUrl: "https://cdn-icons-png.flaticon.com/512/3126/3126354.png" },
                    { nativeWord: "Ḽara", english: "November", imageUrl: "https://cdn-icons-png.flaticon.com/512/2675/2675848.png" },
                    { nativeWord: "Nyendavhusiku", english: "December", imageUrl: "https://cdn-icons-png.flaticon.com/512/3967/3967657.png" }
                ],
                questions: [
                    { id: 1, question: "In which month do strong winds strip leaves (Thangule)?", options: ["August", "April", "October"], correctAnswer: "August", explanation: "Thangule (August) is known for its strong winds.", type: "multiple-choice" },
                    { id: 2, question: "What does 'Khubvumedzi' (September) represent?", options: ["Snow", "The end of harvest", "New spring growth"], correctAnswer: "New spring growth", explanation: "Khubvumedzi represents the covering of the earth with new life.", type: "multiple-choice" }
                ]
            }
        ]
    }
];

export const seedLessons = async () => {
    try {
        console.log("Starting seed with micro lessons structure...");
        for (const lesson of lessonsData) {
            const lessonRef = doc(db as Firestore, "lessons", lesson.id);
            await setDoc(lessonRef, {
                title: lesson.title,
                nativeTitle: lesson.nativeTitle,
                difficulty: lesson.difficulty,
                languageId: 'venda',
                microLessons: lesson.microLessons
            }, { merge: true });
        }
        alert("Zwi khou bvelela! Database seeded with micro lessons.");
    } catch (error) {
        console.error("Error seeding database: ", error);
        alert("Failed to seed database.");
    }
};








