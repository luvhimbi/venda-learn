export interface Word {
  id: string;
  native: string;
  english: string;
  image: string;
  phonetic?: string;
}

export interface WordCategory {
  id: string;
  title: string;
  image: string;
  color: string;
  words: Word[];
}

export const WORD_CATEGORIES: WordCategory[] = [
  {
    id: 'animals',
    title: 'Animal',
    image: 'https://placehold.co/600x400/1e293b/FFFFFF?text=Animal',
    color: '#FFBE0B',
    words: [
      { id: 'a1', native: 'Gole', english: 'Owl', image: 'https://placehold.co/600x800/1e293b/FFFFFF?text=Owl' },
      { id: 'a2', native: 'Ndau', english: 'Lion', image: 'https://placehold.co/600x800/1e293b/FFFFFF?text=Lion' },
      { id: 'a3', native: 'Ndou', english: 'Elephant', image: 'https://placehold.co/600x800/1e293b/FFFFFF?text=Elephant' },
      { id: 'a4', native: 'Mbidzo', english: 'Zebra', image: 'https://placehold.co/600x800/1e293b/FFFFFF?text=Zebra' },
    ]
  },
  {
    id: 'fruits',
    title: 'Fruit',
    image: 'https://placehold.co/600x400/1e293b/FFFFFF?text=Fruit',
    color: '#FB5607',
    words: [
      { id: 'f1', native: 'Tshianana', english: 'Pineapple', image: 'https://placehold.co/600x800/1e293b/FFFFFF?text=Pineapple' },
      { id: 'f2', native: 'Apuila', english: 'Apple', image: 'https://placehold.co/600x800/1e293b/FFFFFF?text=Apple' },
      { id: 'f3', native: 'Banana', english: 'Banana', image: 'https://placehold.co/600x800/1e293b/FFFFFF?text=Banana' },
      { id: 'f4', native: 'Swiri', english: 'Orange', image: 'https://placehold.co/600x800/1e293b/FFFFFF?text=Orange' },
    ]
  },
  {
    id: 'numbers',
    title: 'Number',
    image: 'https://placehold.co/600x400/1e293b/FFFFFF?text=Number',
    color: '#3A86FF',
    words: [
      { id: 'n1', native: 'Tharu', english: 'Three', image: 'https://placehold.co/600x800/1e293b/FFFFFF?text=Number+3' },
      { id: 'n2', native: 'Inwe', english: 'One', image: 'https://placehold.co/600x800/1e293b/FFFFFF?text=Number+1' },
      { id: 'n3', native: 'Mbili', english: 'Two', image: 'https://placehold.co/600x800/1e293b/FFFFFF?text=Number+2' },
    ]
  },
  {
    id: 'insects',
    title: 'Insect',
    image: 'https://placehold.co/600x400/1e293b/FFFFFF?text=Insect',
    color: '#EF233C',
    words: [
      { id: 'i1', native: 'Tshidambazau', english: 'Ladybug', image: 'https://placehold.co/600x800/1e293b/FFFFFF?text=Ladybug' },
      { id: 'i2', native: 'Tshisusu', english: 'Fly', image: 'https://placehold.co/600x800/1e293b/FFFFFF?text=Fly' },
      { id: 'i3', native: 'Nyunyu', english: 'Mosquito', image: 'https://placehold.co/600x800/1e293b/FFFFFF?text=Mosquito' },
    ]
  },
  {
    id: 'food',
    title: 'Food',
    image: 'https://placehold.co/600x400/1e293b/FFFFFF?text=Food',
    color: '#8338EC',
    words: [
      { id: 'fd1', native: 'Tako', english: 'Taco', image: 'https://placehold.co/600x800/1e293b/FFFFFF?text=Taco' },
      { id: 'fd2', native: 'Vhuswa', english: 'Pap', image: 'https://placehold.co/600x800/1e293b/FFFFFF?text=Pap' },
      { id: 'fd3', native: 'Nama', english: 'Meat', image: 'https://placehold.co/600x800/1e293b/FFFFFF?text=Meat' },
    ]
  },
  {
    id: 'vegetables',
    title: 'Vegetable',
    image: 'https://placehold.co/600x400/1e293b/FFFFFF?text=Vegetable',
    color: '#06D6A0',
    words: [
      { id: 'v1', native: 'Luradishi', english: 'Radish', image: 'https://placehold.co/600x800/1e293b/FFFFFF?text=Radish' },
      { id: 'v2', native: 'Khabishi', english: 'Cabbage', image: 'https://placehold.co/600x800/1e293b/FFFFFF?text=Cabbage' },
      { id: 'v3', native: 'Khonofela', english: 'Cauliflower', image: 'https://placehold.co/600x800/1e293b/FFFFFF?text=Cauliflower' },
    ]
  }
];






