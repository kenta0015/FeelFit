import { Exercise } from '@/types';

export const MENTAL_EXERCISES: Exercise[] = [
  {
    id: 'breathing-calm',
    name: 'Deep Breathing',
    duration: 5,
    intensity: 1.0,
    category: 'mindfulness',
    emotions: ['anxious', 'stressed', 'overwhelmed'],
    physicalPurposes: [],
    instructions: [
      'Sit comfortably with your back straight',
      'Inhale slowly through your nose for 4 counts',
      'Hold your breath for 4 counts',
      'Exhale slowly through your mouth for 6 counts',
      'Repeat this cycle'
    ],
    effectivenessScore: {
      anxious: 9,
      stressed: 8,
      overwhelmed: 8,
      angry: 6,
      sad: 5,
      tired: 3,
      'low energy': 4,
      frustrated: 6,
      restless: 7,
      unmotivated: 4
    },
    physicalEffectivenessScore: {},
    audioType: 'healing'
  },
  {
    id: 'meditation-focus',
    name: 'Mindful Meditation',
    duration: 15,
    intensity: 1.0,
    category: 'mindfulness',
    emotions: ['anxious', 'overwhelmed', 'restless'],
    physicalPurposes: [],
    instructions: [
      'Sit in comfortable position, close your eyes',
      'Focus on your natural breathing',
      'When thoughts arise, gently return focus to breath',
      'Notice sensations in your body without judgment',
      'End with 3 deep, intentional breaths'
    ],
    effectivenessScore: {
      anxious: 9,
      overwhelmed: 9,
      restless: 8,
      stressed: 8,
      angry: 7,
      frustrated: 7,
      sad: 6,
      tired: 5,
      'low energy': 4,
      unmotivated: 5
    },
    physicalEffectivenessScore: {},
    audioType: 'healing'
  },
  {
    id: 'gentle-stretching',
    name: 'Gentle Stretching',
    duration: 10,
    intensity: 2.5,
    category: 'flexibility',
    emotions: ['tired', 'stressed', 'overwhelmed'],
    physicalPurposes: [],
    instructions: [
      'Start with neck rolls - 5 each direction',
      'Shoulder shrugs - hold for 5 seconds',
      'Arm circles - 10 forward, 10 backward',
      'Side bends - reach over your head',
      'Gentle spinal twist while seated'
    ],
    effectivenessScore: {
      tired: 8,
      stressed: 9,
      overwhelmed: 8,
      anxious: 7,
      sad: 6,
      angry: 5,
      frustrated: 6,
      'low energy': 5,
      restless: 6,
      unmotivated: 4
    },
    physicalEffectivenessScore: {},
    audioType: 'healing'
  }
];

export const PHYSICAL_EXERCISES: Exercise[] = [
  {
    id: 'hiit-cardio',
    name: 'HIIT Cardio Blast',
    duration: 15,
    intensity: 8.5,
    category: 'cardio',
    emotions: [],
    physicalPurposes: ['metabolism', 'lose weight', 'basic stamina'],
    instructions: [
      '30 seconds high knees',
      '30 seconds rest',
      '30 seconds burpees',
      '30 seconds rest',
      'Repeat cycle for duration'
    ],
    effectivenessScore: {},
    physicalEffectivenessScore: {
      'metabolism': 9,
      'lose weight': 9,
      'basic stamina': 8,
      'stay fit': 7,
      'tone body': 6,
      'immune system': 7
    },
    audioType: 'motivational'
  },
  {
    id: 'strength-circuit',
    name: 'Strength Circuit',
    duration: 20,
    intensity: 6.0,
    category: 'strength',
    emotions: [],
    physicalPurposes: ['tone body', 'basic stamina', 'stay fit'],
    instructions: [
      '10 push-ups',
      '15 squats',
      '30-second plank',
      '10 lunges each leg',
      'Rest 1 minute, repeat'
    ],
    effectivenessScore: {},
    physicalEffectivenessScore: {
      'tone body': 9,
      'basic stamina': 8,
      'stay fit': 8,
      'metabolism': 6,
      'lose weight': 7,
      'immune system': 6
    },
    audioType: 'motivational'
  },
  {
    id: 'endurance-walk',
    name: 'Endurance Walking',
    duration: 25,
    intensity: 3.5,
    category: 'endurance',
    emotions: [],
    physicalPurposes: ['stay fit', 'immune system', 'basic stamina'],
    instructions: [
      'Start with 5-minute warm-up walk',
      'Increase pace to brisk walking',
      'Maintain steady rhythm',
      'Focus on deep breathing',
      'Cool down with slow walk'
    ],
    effectivenessScore: {},
    physicalEffectivenessScore: {
      'stay fit': 9,
      'immune system': 8,
      'basic stamina': 7,
      'metabolism': 6,
      'lose weight': 5,
      'tone body': 4
    },
    audioType: 'motivational'
  },
  {
    id: 'metabolism-boost',
    name: 'Metabolism Booster',
    duration: 12,
    intensity: 7.0,
    category: 'cardio',
    emotions: [],
    physicalPurposes: ['metabolism', 'lose weight'],
    instructions: [
      '1 minute jumping jacks',
      '1 minute mountain climbers',
      '1 minute rest',
      'Repeat for duration'
    ],
    effectivenessScore: {},
    physicalEffectivenessScore: {
      'metabolism': 10,
      'lose weight': 9,
      'basic stamina': 7,
      'stay fit': 6,
      'tone body': 5,
      'immune system': 6
    },
    audioType: 'motivational'
  },
  {
    id: 'immune-yoga',
    name: 'Immune System Yoga',
    duration: 20,
    intensity: 2.5,
    category: 'flexibility',
    emotions: [],
    physicalPurposes: ['immune system', 'stay fit'],
    instructions: [
      'Child\'s pose - 2 minutes',
      'Cat-cow stretches - 2 minutes',
      'Downward dog - 1 minute',
      'Warrior poses - 3 minutes each side',
      'Savasana - 5 minutes'
    ],
    effectivenessScore: {},
    physicalEffectivenessScore: {
      'immune system': 9,
      'stay fit': 8,
      'basic stamina': 5,
      'metabolism': 4,
      'lose weight': 3,
      'tone body': 6
    },
    audioType: 'healing'
  },
  {
    id: 'tone-sculpt',
    name: 'Body Sculpting',
    duration: 18,
    intensity: 6.5,
    category: 'strength',
    emotions: [],
    physicalPurposes: ['tone body', 'basic stamina'],
    instructions: [
      '12 tricep dips',
      '15 wall sits',
      '10 bicycle crunches each side',
      '12 calf raises',
      'Rest 90 seconds, repeat'
    ],
    effectivenessScore: {},
    physicalEffectivenessScore: {
      'tone body': 10,
      'basic stamina': 7,
      'stay fit': 7,
      'metabolism': 6,
      'lose weight': 6,
      'immune system': 5
    },
    audioType: 'motivational'
  }
];

export const BALANCED_EXERCISES: Exercise[] = [
  {
    id: 'mindful-cardio',
    name: 'Mindful Cardio',
    duration: 15,
    intensity: 5.0,
    category: 'cardio',
    emotions: ['stressed', 'anxious', 'low energy'],
    physicalPurposes: ['metabolism', 'stay fit', 'basic stamina'],
    instructions: [
      'Start with 3 deep breaths',
      'Light jogging in place - focus on breathing',
      'Add arm movements mindfully',
      'Maintain awareness of body sensations',
      'End with gratitude breathing'
    ],
    effectivenessScore: {
      stressed: 7,
      anxious: 6,
      'low energy': 8,
      overwhelmed: 5,
      tired: 6,
      unmotivated: 7,
      frustrated: 6,
      angry: 5,
      sad: 5,
      restless: 7
    },
    physicalEffectivenessScore: {
      'metabolism': 7,
      'stay fit': 8,
      'basic stamina': 7,
      'lose weight': 6,
      'tone body': 5,
      'immune system': 6
    },
    audioType: 'healing'
  },
  {
    id: 'strength-meditation',
    name: 'Strength & Mindfulness',
    duration: 20,
    intensity: 4.0,
    category: 'strength',
    emotions: ['angry', 'frustrated', 'unmotivated'],
    physicalPurposes: ['tone body', 'basic stamina', 'stay fit'],
    instructions: [
      'Begin with centering breath',
      'Slow, controlled push-ups with breath awareness',
      'Mindful squats - focus on muscle engagement',
      'Plank with meditation breathing',
      'End with appreciation for your body'
    ],
    effectivenessScore: {
      angry: 8,
      frustrated: 8,
      unmotivated: 7,
      stressed: 6,
      'low energy': 6,
      overwhelmed: 5,
      anxious: 5,
      tired: 4,
      sad: 6,
      restless: 6
    },
    physicalEffectivenessScore: {
      'tone body': 8,
      'basic stamina': 7,
      'stay fit': 7,
      'metabolism': 5,
      'lose weight': 5,
      'immune system': 6
    },
    audioType: 'healing'
  },
  {
    id: 'energizing-flow',
    name: 'Energizing Flow',
    duration: 12,
    intensity: 6.0,
    category: 'endurance',
    emotions: ['tired', 'low energy', 'unmotivated', 'sad'],
    physicalPurposes: ['stay fit', 'immune system', 'basic stamina'],
    instructions: [
      'Dynamic warm-up movements',
      'Flowing between exercises',
      'Jumping jacks with positive affirmations',
      'Bodyweight exercises in rhythm',
      'Cool down with energizing breaths'
    ],
    effectivenessScore: {
      tired: 8,
      'low energy': 9,
      unmotivated: 8,
      sad: 7,
      frustrated: 6,
      stressed: 6,
      anxious: 5,
      angry: 5,
      overwhelmed: 4,
      restless: 7
    },
    physicalEffectivenessScore: {
      'stay fit': 8,
      'immune system': 8,
      'basic stamina': 8,
      'metabolism': 6,
      'lose weight': 5,
      'tone body': 5
    },
    audioType: 'motivational'
  }
];

export const EXERCISES = [...MENTAL_EXERCISES, ...PHYSICAL_EXERCISES, ...BALANCED_EXERCISES];