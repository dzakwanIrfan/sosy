export interface Question {
  id: string;
  section: string;
  question: string;
  options: {
    value: string;
    label: string;
    trait?: string;
  }[];
}

export const DAYLIGHT_QUESTIONS: Question[] = [
  // Section 1 - Core Personality & Social Energy
  {
    id: 'q1',
    section: 'Core Personality',
    question: 'When meeting new people, you usually...',
    options: [
      { value: 'A', label: 'Feel excited to talk and engage', trait: 'Extrovert' },
      { value: 'B', label: 'Observe quietly before joining in', trait: 'Introvert' },
    ],
  },
  {
    id: 'q2',
    section: 'Core Personality',
    question: 'After a long week, what helps you recharge?',
    options: [
      { value: 'A', label: 'Going out or being around others', trait: 'Extrovert' },
      { value: 'B', label: 'Alone time, reflection, or creative work', trait: 'Introvert' },
    ],
  },
  {
    id: 'q3',
    section: 'Core Personality',
    question: 'What type of conversation do you enjoy most?',
    options: [
      { value: 'A', label: 'Light and funny', trait: 'Social' },
      { value: 'B', label: 'Deep and meaningful', trait: 'Abstract' },
    ],
  },
  {
    id: 'q4',
    section: 'Core Personality',
    question: 'When plans change last-minute, how do you feel?',
    options: [
      { value: 'A', label: 'Love it — I enjoy surprises', trait: 'Flexible' },
      { value: 'B', label: 'Prefer structure and clarity', trait: 'Structured' },
    ],
  },
  {
    id: 'q5',
    section: 'Core Personality',
    question: 'When friends share a problem, you tend to...',
    options: [
      { value: 'A', label: 'Empathize and comfort them', trait: 'Feeling' },
      { value: 'B', label: 'Help them think logically and find solutions', trait: 'Thinking' },
    ],
  },

  // Section 2 - Relationship & Life Context
  {
    id: 'q6',
    section: 'Life Context',
    question: "What's your current relationship status?",
    options: [
      { value: 'A', label: 'Single' },
      { value: 'B', label: 'Married / In a relationship' },
      { value: 'C', label: 'Prefer not to say' },
    ],
  },
  {
    id: 'q7',
    section: 'Life Context',
    question: 'What are you looking for on DayLight?',
    options: [
      { value: 'A', label: 'New friends' },
      { value: 'B', label: 'Networking or professional connection' },
      { value: 'C', label: 'Shared hobbies & activities' },
      { value: 'D', label: "I'm open to any positive experience" },
    ],
  },
  {
    id: 'q8',
    section: 'Life Context',
    question: 'How comfortable are you in mixed-gender groups?',
    options: [
      { value: 'A', label: 'Totally fine' },
      { value: 'B', label: 'Prefer same-gender table' },
      { value: 'C', label: 'Depends on the vibe' },
    ],
  },

  // Section 3 - Lifestyle & Social Comfort
  {
    id: 'q9',
    section: 'Lifestyle',
    question: 'What type of café/restaurant do you usually go to?',
    options: [
      { value: 'A', label: 'Cozy local spots (IDR 50K-150K per meal)' },
      { value: 'B', label: 'Trendy mid-range cafés (IDR 150K-300K)' },
      { value: 'C', label: 'Fine dining or premium spots (IDR 300K+)' },
    ],
  },
  {
    id: 'q10',
    section: 'Lifestyle',
    question: "What's your ideal weekend activity?",
    options: [
      { value: 'A', label: 'Reading or journaling' },
      { value: 'B', label: 'Outdoor adventures' },
      { value: 'C', label: 'Café hopping or art events' },
      { value: 'D', label: 'Workout or yoga session' },
    ],
  },
  {
    id: 'q11',
    section: 'Lifestyle',
    question: 'Which music vibe feels most like you?',
    options: [
      { value: 'A', label: 'Jazz / Lo-Fi' },
      { value: 'B', label: 'Pop / R&B' },
      { value: 'C', label: 'Indie / Alternative' },
      { value: 'D', label: 'EDM / Dance' },
    ],
  },
  {
    id: 'q12',
    section: 'Lifestyle',
    question: 'What movie genre do you love most?',
    options: [
      { value: 'A', label: 'Romance / Drama' },
      { value: 'B', label: 'Comedy' },
      { value: 'C', label: 'Thriller / Mystery' },
      { value: 'D', label: 'Documentary / Biopic' },
    ],
  },

  // Section 4 - Openness & Social Behavior
  {
    id: 'q13',
    section: 'Social Behavior',
    question: 'How do you feel about meeting complete strangers?',
    options: [
      { value: 'A', label: 'Excited — I love new people' },
      { value: 'B', label: "Nervous, but I'll try" },
      { value: 'C', label: 'I prefer smaller, safer groups' },
    ],
  },
  {
    id: 'q14',
    section: 'Social Behavior',
    question: 'What best describes your communication style?',
    options: [
      { value: 'A', label: 'Talkative and expressive' },
      { value: 'B', label: 'Balanced — I talk and listen equally' },
      { value: 'C', label: 'Reserved but thoughtful' },
    ],
  },
  {
    id: 'q15',
    section: 'Social Behavior',
    question: 'How would you describe your ideal connection?',
    options: [
      { value: 'A', label: 'Playful and fun' },
      { value: 'B', label: 'Deep and meaningful' },
      { value: 'C', label: 'Inspiring and intellectual' },
      { value: 'D', label: 'Calm and comfortable' },
    ],
  },
];

export const ARCHETYPE_DETAILS: Record<string, { description: string; traits: string[] }> = {
  'Bright Morning': {
    description: 'You bring fresh energy wherever you go. The kind of person who starts the conversation — and the laughter.',
    traits: ['Optimistic', 'Energetic', 'Outgoing'],
  },
  'Calm Dawn': {
    description: 'You move at your own rhythm. People feel comfortable around you — grounded, kind, quietly confident.',
    traits: ['Gentle', 'Thoughtful', 'Warm'],
  },
  'Bold Noon': {
    description: 'The go-getter of every table. You lead naturally, keep things on track, and turn ideas into plans.',
    traits: ['Driven', 'Focused', 'Inspiring'],
  },
  'Golden Hour': {
    description: 'You light up rooms with your stories and laughter. Effortlessly social, you make everyone feel seen.',
    traits: ['Charismatic', 'Expressive', 'Radiant'],
  },
  'Quiet Dusk': {
    description: "You're the thinker who listens before you speak — insightful, calm, and full of perspective.",
    traits: ['Deep', 'Analytical', 'Reflective'],
  },
  'Cloudy Day': {
    description: 'You see beauty in small moments. Often reserved, but when you open up, your words hit deep.',
    traits: ['Creative', 'Empathetic', 'Dreamy'],
  },
  'Serene Drizzle': {
    description: "You don't chase attention — you create peace. You're the steady soul who listens and understands.",
    traits: ['Loyal', 'Calm', 'Supportive'],
  },
  'Blazing Noon': {
    description: 'You bring heat and direction. When others hesitate, you move — pure action and confidence.',
    traits: ['Passionate', 'Decisive', 'Fearless'],
  },
  'Starry Night': {
    description: 'You live in ideas and imagination. You connect through stories, purpose, and shared curiosity.',
    traits: ['Visionary', 'Independent', 'Intuitive'],
  },
  'Perfect Day': {
    description: "You flow between energies with grace — social when needed, quiet when it counts. You're harmony itself.",
    traits: ['Balanced', 'Adaptable', 'Easygoing'],
  },
};