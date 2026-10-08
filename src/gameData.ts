export type Age = '1–3' | '4–5';
export type Item = { name: string; emoji: string; age: Age; image?: string; prompt?: string };
export type Topic = { name: string; emoji: string; description: string; color: string; image?: string; items: Item[] };
const item = (name: string, emoji: string, age: Age = '1–3', image?: string): Item => ({ name, emoji, age, image });
export const topics: Topic[] = [
  { name: 'All Topics', emoji: '🌈', description: 'Surprise me!', color: 'pink', items: [] },
  { name: 'Animals', emoji: '🐶', description: 'Cute fluffy pals', color: 'purple', image: '/assets/22216.png', items: [item('Cat', '🐱', '1–3', '/assets/07c37.png'), item('Dog', '🐶', '1–3', '/assets/22216.png'), item('Rabbit', '🐰'), item('Cow', '🐮'), item('Bear', '🐻', '1–3', '/assets/6cc17.png'), item('Elephant', '🐘', '4–5'), item('Lion', '🦁', '4–5')] },
  { name: 'Fruits', emoji: '🍎', description: 'Sweet and juicy', color: 'pink', image: '/assets/556cb.png', items: [item('Apple', '🍎', '1–3', '/assets/556cb.png'), item('Banana', '🍌'), item('Orange', '🍊'), item('Strawberry', '🍓'), item('Grapes', '🍇'), item('Pineapple', '🍍', '4–5')] },
  { name: 'Vegetables', emoji: '🥕', description: 'Healthy garden', color: 'yellow', items: [item('Carrot', '🥕'), item('Corn', '🌽'), item('Tomato', '🍅'), item('Potato', '🥔'), item('Broccoli', '🥦'), item('Eggplant', '🍆', '4–5')] },
  { name: 'Vehicles', emoji: '🚗', description: 'Zoom on the road', color: 'purple', items: [item('Car', '🚗'), item('Bus', '🚌'), item('Train', '🚂'), item('Boat', '⛵'), item('Airplane', '✈️'), item('Helicopter', '🚁', '4–5')] },
  { name: 'Colors', emoji: '🎨', description: 'Rainbow shades', color: 'pink', items: [item('Red', '🔴'), item('Blue', '🔵'), item('Yellow', '🟡'), item('Green', '🟢'), item('Pink', '🩷'), item('Purple', '🟣', '4–5')] },
  { name: 'Shapes', emoji: '🔺', description: 'Circles & stars', color: 'blue', items: [item('Circle', '🔵'), item('Square', '🟧'), item('Triangle', '🔺'), item('Star', '⭐'), item('Heart', '💗'), item('Diamond', '🔷', '4–5')] },
  { name: 'Numbers & Math', emoji: '🔢', description: 'Counting little wonders', color: 'purple', items: [item('One', '1️⃣'), item('Two', '2️⃣'), item('Three', '3️⃣'), item('Four', '4️⃣'), item('Five', '5️⃣'), { ...item('Three', '🍎 + 🍎🍎', '4–5'), prompt: 'One plus two makes how many?' }, { ...item('Four', '⭐⭐ + ⭐⭐', '4–5'), prompt: 'Two plus two makes how many?' }] },
  { name: 'Toys', emoji: '🧸', description: 'Playtime buddies', color: 'pink', items: [item('Teddy', '🧸'), item('Ball', '⚽'), item('Kite', '🪁'), item('Puzzle', '🧩'), item('Drum', '🥁'), item('Rocket', '🚀', '4–5')] },
  { name: 'Sea Animals', emoji: '🐠', description: 'Splish splash ocean', color: 'blue', items: [item('Fish', '🐠'), item('Whale', '🐳'), item('Crab', '🦀'), item('Dolphin', '🐬'), item('Octopus', '🐙'), item('Seal', '🦭', '4–5')] },
  { name: 'Alphabet', emoji: '🔤', description: 'Meet your ABCs', color: 'yellow', items: [item('A', 'A'), item('B', 'B'), item('C', 'C'), item('D', 'D'), item('E', 'E'), item('F', 'F', '4–5')] },
  { name: 'Clothes', emoji: '👕', description: 'Dress-up discoveries', color: 'pink', items: [item('Shirt', '👕'), item('Dress', '👗'), item('Shoe', '👟'), item('Hat', '🧢'), item('Socks', '🧦'), item('Coat', '🧥', '4–5')] },
  { name: 'Home', emoji: '🏠', description: 'Familiar little things', color: 'purple', items: [item('Bed', '🛏️'), item('Chair', '🪑'), item('Door', '🚪'), item('Bath', '🛁'), item('Lamp', '💡'), item('Clock', '🕰️', '4–5')] },
  { name: 'Body Parts', emoji: '👀', description: 'Wonderful little you', color: 'blue', items: [item('Eyes', '👀'), item('Ear', '👂'), item('Nose', '👃'), item('Hand', '✋'), item('Foot', '🦶'), item('Teeth', '🦷', '4–5')] },
  { name: 'Nature', emoji: '🌳', description: 'Explore the outdoors', color: 'yellow', items: [item('Tree', '🌳'), item('Flower', '🌸'), item('Leaf', '🍃'), item('Butterfly', '🦋'), item('Mushroom', '🍄'), item('Cactus', '🌵', '4–5')] },
  { name: 'Weather', emoji: '☀️', description: 'Look up at the sky', color: 'blue', items: [item('Sun', '☀️'), item('Cloud', '☁️'), item('Rain', '🌧️'), item('Snow', '❄️'), item('Rainbow', '🌈'), item('Wind', '🌬️', '4–5')] },
  { name: 'Farm Animals', emoji: '🐮', description: 'Friends on the farm', color: 'yellow', items: [item('Cow', '🐮'), item('Pig', '🐷'), item('Sheep', '🐑'), item('Horse', '🐴'), item('Chicken', '🐔'), item('Goat', '🐐', '4–5')] },
  { name: 'Music', emoji: '🎵', description: 'Make a happy sound', color: 'purple', items: [item('Drum', '🥁'), item('Guitar', '🎸'), item('Piano', '🎹'), item('Bell', '🔔'), item('Microphone', '🎤'), item('Violin', '🎻', '4–5')] },
  { name: 'Food', emoji: '🍔', description: 'Yummy little bites', color: 'pink', items: [item('Bread', '🍞'), item('Egg', '🥚'), item('Cheese', '🧀'), item('Milk', '🥛'), item('Pizza', '🍕'), item('Pancakes', '🥞', '4–5')] },
  { name: 'Daily Activities', emoji: '🧼', description: 'Happy everyday habits', color: 'blue', items: [item('Wash hands', '🧼'), item('Brush teeth', '🪥'), item('Sleep', '😴'), item('Eat', '🍽️'), item('Take a bath', '🛁'), item('Read', '📖', '4–5')] },
];
export type Question = { answer: Item; options: Item[]; topic: Topic; text: string; id: string };
export function shuffle<T>(values: T[]): T[] {
  const result = [...values];
  for (let index = result.length - 1; index > 0; index--) { const random = Math.floor(Math.random() * (index + 1)); [result[index], result[random]] = [result[random], result[index]]; }
  return result;
}
export function generateQuestions(age: Age, chosen: Topic): Question[] {
  const eligible = (topic: Topic) => topic.items.filter(entry => age === '4–5' || entry.age === '1–3');
  const sources = chosen.name === 'All Topics' ? shuffle(topics.slice(1)).slice(0, 5) : Array(5).fill(chosen) as Topic[];
  const normalAnswers = shuffle(eligible(chosen)).slice(0, 5);
  return sources.map((topic, index) => {
    const pool = eligible(topic);
    const answer = chosen.name === 'All Topics' ? shuffle(pool)[0] : normalAnswers[index];
    const unique = [...new Map(pool.filter(entry => entry.name !== answer.name).map(entry => [entry.name, entry])).values()];
    return { answer, options: shuffle([answer, ...shuffle(unique).slice(0, 3)]), topic, text: answer.prompt || (topic.name === 'Colors' ? 'What color is this?' : topic.name === 'Alphabet' ? 'Which letter is this?' : topic.name === 'Numbers & Math' ? 'What number is this?' : 'What is this?'), id: `${Date.now()}-${index}-${answer.name}` };
  });
}
export function questionImage(item: Item) {
  if (item.image) return item.image;
  const markup = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><text x="300" y="230" text-anchor="middle" dominant-baseline="middle" font-family="Arial, sans-serif" font-weight="bold" font-size="${item.emoji.length > 8 ? 90 : 170}" fill="#6b38d4">${item.emoji}</text></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(markup)}`;
}
