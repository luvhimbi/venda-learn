import { db } from './firebaseConfig';
import { doc, setDoc } from 'firebase/firestore';

const lessonsData = [
    {
        id: 'greetings',
        title: 'Greetings',
        vendaTitle: 'Ndumeliso',
        difficulty: 'Easy',
        // NEW: Teaching content for the "Learn" phase
        slides: [
            {
                venda: "Ndaa",
                english: "Hello (Male)",
                context: "Used by men and boys. It is polite to bow slightly or lower your eyes."
            },
            {
                venda: "Aa",
                english: "Hello (Female)",
                context: "Used by women and girls. Usually accompanied by a soft hand clap."
            },
            {
                venda: "Ndi matsheloni",
                english: "Good morning",
                context: "Used from sunrise until about 11:00 AM."
            },
            {
                venda: "Ndi masiari",
                english: "Good afternoon",
                context: "used during the day from 13h00 pm"
            },
            {
                venda: "Ndi madekwana",
                english: "Good night",
                context: "Used from 17h00 pm to show its night."
            }

        ],
        questions: [
            {
                id: 1,
                question: "How do you say 'Hello' as man?",
                options: ["Ndaa", "Aa", "Matsheloni"],
                correctAnswer: "Ndaa",
                explanation: "'Ndaa' is specifically for men. 'Aa' is used by women, and 'Matsheloni' means morning.",
                type: "multiple-choice"
            },
            {
                id: 2,
                question: "How do you say 'Hello'  as woman?",
                options: ["Ndaa", "Aa", "Vhusiku"],
                correctAnswer: "Aa",
                explanation: "'Ndaa' is specifically for men. 'Aa' is used by women, and 'Matsheloni' means morning.",
                type: "multiple-choice"
            }
        ]
    },
    {
        id: 'numbers',
        title: 'Numbers',
        vendaTitle: 'Nomboro',
        difficulty: 'Easy',
        slides: [
            { venda: "Nthihi", english: "One", context: "1 - The starting point." },
            { venda: "Vhuvhili", english: "Two", context: "2" },
            { venda: "Raru", english: "Three", context: "3" },
            { venda: "Ina", english: "Four", context: "4" },
            { venda: "Ṱhanu", english: "Five", context: "5" },
            { venda: "Ṱhanu na nthihi", english: "Six", context: "6 (Five and one)" },
            { venda: "Ṱhanu na vhuvhili", english: "Seven", context: "7 (Five and two)" },
            { venda: "Ṱhanu na raru", english: "Eight", context: "8 (Five and three)" },
            { venda: "Ṱhanu na ina", english: "Nine", context: "9 (Five and four)" },
            { venda: "Fumi", english: "Ten", context: "10" },
            { venda: "Fumi na nthihi", english: "Eleven", context: "11 (Ten and one)" },
            { venda: "Fumi na vhuvhili", english: "Twelve", context: "12" },
            { venda: "Fahuvhili", english: "Twenty", context: "20 (Two tens)" },
            { venda: "Fahuraru", english: "Thirty", context: "30 (Three tens)" },
            { venda: "Ḓana", english: "One Hundred", context: "100" }
        ],
        questions: [
            {
                id: 1,
                question: "How do you say 'One' in Tshivenda?",
                options: ["Nthihi", "Vhuvhili", "Raru"],
                correctAnswer: "Nthihi",
                explanation: "Nthihi is 1. Vhuvhili is 2, and Raru is 3.",
                type: "multiple-choice"
            },
            {
                id: 2,
                question: "What is 'Fumi' in English?",
                options: ["5", "10", "20"],
                correctAnswer: "10",
                explanation: "Fumi is the standard word for 10. For 20, we use Fahuvhili.",
                type: "multiple-choice"
            },
            {
                id: 3,
                question: "How do you say 'Four'?",
                options: ["Ina", "Ṱhanu", "Raru"],
                correctAnswer: "Ina",
                explanation: "Ina is 4. Ṱhanu is 5, and Raru is 3.",
                type: "multiple-choice"
            },
            {
                id: 4,
                question: "What does 'Fahuraru' represent?",
                options: ["13", "30", "300"],
                correctAnswer: "30",
                explanation: "Fahuraru comes from 'Fumi' (ten) and 'Raru' (three), meaning three tens: 30.",
                type: "multiple-choice"
            },
            {
                id: 5,
                question: "How do you say 'Seven'?",
                options: ["Ṱhanu na nthihi", "Ṱhanu na vhuvhili", "Fumi na vhuvhili"],
                correctAnswer: "Ṱhanu na vhuvhili",
                explanation: "7 is composed of 5 (Ṱhanu) and 2 (Vhuvhili).",
                type: "multiple-choice"
            }
        ]
    },
    {
        id: 'identity',
        title: 'Identity',
        vendaTitle: 'Vhuthu na mbeu',
        difficulty: 'Easy',
        slides: [
            {
                venda: "Mutukana",
                english: "Boy",
                context: "Refers to a young male child."
            },
            {
                venda: "Musidzana",
                english: "Girl",
                context: "Refers to a young female child."
            },
            {
                venda: "Murathu",
                english: "Younger  sibling",
                context: "Used to refer to a sibling younger than you, regardless of gender."
            },
            {
                venda: "khaladzi",
                english: "Sister",
                context: "Used to refer to  your blood sister "
            },
            {
                venda: "Muzwala",
                english: "cousin",
                context: "used to refer to your uncle kids."
            },
            {
                venda: "lutshetshe",
                english: "new born baby",
                context: "A general term for a very young child or toddler."
            },
            {
                venda: "nwana",
                english: "a young child",
                context: "A general term for a very young child or toddler."
            },
            {
                venda: "Munna",
                english: "Man",
                context: "An adult male."
            },
            {
                venda: "Musadzi",
                english: "Woman",
                context: "An adult female."
            }
        ],
        questions: [
            {
                id: 1,
                question: "How do you say 'Boy' in Tshivenda?",
                options: ["Mutukana", "Musidzana", "Munna"],
                correctAnswer: "Mutukana",
                explanation: "Mutukana is a boy. Musidzana is a girl, and Munna is a man.",
                type: "multiple-choice"
            },
            {
                id: 2,
                question: "What does 'Musadzi' mean?",
                options: ["Man", "Woman", "Child"],
                correctAnswer: "Woman",
                explanation: "Musadzi is the Tshivenda word for an adult female (Woman).",
                type: "multiple-choice"
            },
            {
                id: 3,
                question: "If you are talking about a 'Girl', which word do you use?",
                options: ["Mutukana", "Muanana", "Musidzana"],
                correctAnswer: "Musidzana",
                explanation: "Musidzana specifically refers to a young girl.",
                type: "multiple-choice"
            },
            {
                id: 4,
                question: "What is a 'Muanana'?",
                options: ["An old man", "A small child/infant", "A leader"],
                correctAnswer: "A small child/infant",
                explanation: "Muanana is a tender term for a baby or a very small toddler.",
                type: "multiple-choice"
            }
        ]
    },
    {
        id: 'objects',
        title: 'Objects',
        vendaTitle: 'Zwithu',
        difficulty: 'Easy',
        slides: [
            {
                venda: "Ndilo",
                english: "Plate",
                context: "A traditional wooden plate or a modern eating plate.",
                imageUrl: "https://cdn-icons-png.flaticon.com/512/662/662731.png"
            },
            {
                venda: "Vhaisene",
                english: "Television",
                context: "The screen used for watching news and shows.",
                imageUrl: "https://cdn-icons-png.flaticon.com/512/716/716429.png"
            },
            {
                venda: "Vothi",
                english: "Door",
                context: "The entrance to a room or house.",
                imageUrl: "https://cdn-icons-png.flaticon.com/512/59/59802.png"
            },
            {
                venda: "Tshitepulu",
                english: "Table",
                context: "Where you eat or work.",
                imageUrl: "https://cdn-icons-png.flaticon.com/512/2256/2256920.png"
            }
        ],
        questions: [
            {
                id: 1,
                question: "How do you say 'Plate' in Tshivenda?",
                options: ["Ndilo", "Vothi", "Vhaisene"],
                correctAnswer: "Ndilo",
                explanation: "Ndilo is a plate. Vothi is a door and Vhaisene is a TV.",
                type: "multiple-choice"
            },
            {
                id: 2,
                question: "What is a 'Vothi'?",
                options: ["Table", "Television", "Door"],
                correctAnswer: "Door",
                explanation: "Vothi means door. Think of it as the 'vote' to enter a room!",
                type: "multiple-choice"
            }
]
},
    {
        id: 'days-of-the-week',
        title: 'Days of the Week',
        vendaTitle: 'Maduvha a vhege',
        difficulty: 'Easy',
        slides: [
            {
                venda: "Musumbuluwo",
                english: "Monday",
                context: "The first day of the work week.",
                imageUrl: "https://cdn-icons-png.flaticon.com/512/3652/3652191.png"
            },
            {
                venda: "Ḽavhuvhili",
                english: "Tuesday",
                context: "The second day. 'Vhu-vhili' comes from the number two (mbili).",
                imageUrl: "https://cdn-icons-png.flaticon.com/512/3652/3652213.png"
            },
            {
                venda: "Ḽavhuraru",
                english: "Wednesday",
                context: "Midweek. 'Vhu-raru' comes from the number three (raru).",
                imageUrl: "https://cdn-icons-png.flaticon.com/512/3652/3652243.png"
            },
            {
                venda: "Ḽavhuṋa",
                english: "Thursday",
                context: "The fourth day. 'Vhu-ṋa' comes from the number four (iṋa).",
                imageUrl: "https://cdn-icons-png.flaticon.com/512/3652/3652267.png"
            },
            {
                venda: "Ḽavhuṱanu",
                english: "Friday",
                context: "The last work day. 'Vhu-ṱanu' comes from the number five (ṱanu).",
                imageUrl: "https://cdn-icons-png.flaticon.com/512/3652/3652295.png"
            },
            {
                venda: "Mugivhibi",
                english: "Saturday",
                context: "The first day of the weekend.",
                imageUrl: "https://cdn-icons-png.flaticon.com/512/3652/3652320.png"
            },
            {
                venda: "Swondaha",
                english: "Sunday",
                context: "A day for rest or church.",
                imageUrl: "https://cdn-icons-png.flaticon.com/512/3652/3652347.png"
            }
        ],
        questions: [
            {
                id: 1,
                question: "Which day is 'Ḽavhuvhili'?",
                options: ["Monday", "Tuesday", "Friday"],
                correctAnswer: "Tuesday",
                explanation: "Ḽavhuvhili is Tuesday. Remember 'vhili' sounds like 'mbili' (two).",
                type: "multiple-choice"
            },
            {
                id: 2,
                question: "How do you say Friday in Tshivenda?",
                options: ["Mugivhibi", "Ḽavhuṋa", "Ḽavhuṱanu"],
                correctAnswer: "Ḽavhuṱanu",
                explanation: "Ḽavhuṱanu is Friday (Day 5). Ṱanu means five.",
                type: "multiple-choice"
            },
            {
                id: 3,
                question: "What is 'Swondaha'?",
                options: ["Saturday", "Sunday", "Wednesday"],
                correctAnswer: "Sunday",
                explanation: "Swondaha is Sunday. It sounds very similar to the English word!",
                type: "multiple-choice"
            }
        ]
    },
    {
        id: 'months-of-the-year-full',
        title: 'All 12 Months',
        vendaTitle: 'Miṅwedzi ya ṅwaha',
        difficulty: 'Medium',
        slides: [
            { venda: "Phando", english: "January", context: "Opening the year.", imageUrl: "https://cdn-icons-png.flaticon.com/512/3652/3652191.png" },
            { venda: "Luhuhi", english: "February", context: "Month of wind.", imageUrl: "https://cdn-icons-png.flaticon.com/512/1154/1154562.png" },
            { venda: "Ṱhafamuhala", english: "March", context: "Harvest starts.", imageUrl: "https://cdn-icons-png.flaticon.com/512/862/862856.png" },
            { venda: "Lambamai", english: "April", context: "Abundance of fruit.", imageUrl: "https://cdn-icons-png.flaticon.com/512/3069/3069172.png" },
            { venda: "Shundunthule", english: "May", context: "Winnowing corn.", imageUrl: "https://cdn-icons-png.flaticon.com/512/2322/2322701.png" },
            { venda: "Fulwi", english: "June", context: "Deep winter.", imageUrl: "https://cdn-icons-png.flaticon.com/512/642/642000.png" },
            { venda: "Fulwana", english: "July", context: "Little winter.", imageUrl: "https://cdn-icons-png.flaticon.com/512/4814/4814268.png" },
            { venda: "Thangule", english: "August", context: "Stripping leaves.", imageUrl: "https://cdn-icons-png.flaticon.com/512/959/959711.png" },
            { venda: "Khubvumedzi", english: "September", context: "Spring growth.", imageUrl: "https://cdn-icons-png.flaticon.com/512/2917/2917575.png" },
            { venda: "Tshimedzi", english: "October", context: "Planting season.", imageUrl: "https://cdn-icons-png.flaticon.com/512/3126/3126354.png" },
            { venda: "Ḽara", english: "November", context: "Summer rains.", imageUrl: "https://cdn-icons-png.flaticon.com/512/2675/2675848.png" },
            { venda: "Nyendavhusiku", english: "December", context: "Festive travel.", imageUrl: "https://cdn-icons-png.flaticon.com/512/3967/3967657.png" }
        ],
        questions: [
            {
                id: 1,
                question: "Which month is 'Phando'?",
                options: ["January", "June", "December"],
                correctAnswer: "January",
                explanation: "Phando is the first month of the year.",
                type: "multiple-choice"
            },
            {
                id: 2,
                question: "In which month do strong winds strip leaves (Thangule)?",
                options: ["August", "April", "October"],
                correctAnswer: "August",
                explanation: "Thangule (August) is known for its strong winds.",
                type: "multiple-choice"
            },
            {
                id: 3,
                question: "What does 'Khubvumedzi' (September) represent?",
                options: ["Snow", "The end of harvest", "New spring growth"],
                correctAnswer: "New spring growth",
                explanation: "Khubvumedzi represents the covering of the earth with new life.",
                type: "multiple-choice"
            }
        ]
    }
];

export const seedLessons = async () => {
    try {
        console.log("Starting seed with teaching content...");
        for (const lesson of lessonsData) {
            const lessonRef = doc(db, "lessons", lesson.id);
            await setDoc(lessonRef, {
                title: lesson.title,
                vendaTitle: lesson.vendaTitle,
                difficulty: lesson.difficulty,
                slides: lesson.slides, // Added slides
                questions: lesson.questions
            }, { merge: true });
        }
        alert("Zwi khou bvelela! Database seeded with teaching content.");
    } catch (error) {
        console.error("Error seeding database: ", error);
        alert("Failed to seed database.");
    }
};