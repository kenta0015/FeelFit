import * as Speech from 'expo-speech';

export interface MotivationalMessage {
  start: string[];
  middle: string[];
  nearEnd: string[];
  completion: string[];
}

const HEALING_MESSAGES: MotivationalMessage = {
  start: [
    "Take a deep breath and let yourself settle into this moment.",
    "You're creating space for healing and peace within yourself.",
    "Allow your body to relax as we begin this gentle journey.",
    "This is your time to nurture your mind and spirit.",
    "Breathe deeply and let go of any tension you're holding."
  ],
  middle: [
    "You're doing beautifully. Let each breath bring you deeper peace.",
    "Feel the calm spreading through your body with each movement.",
    "You're exactly where you need to be right now.",
    "Notice how your body is responding to this gentle care.",
    "Continue to breathe deeply and stay present with yourself."
  ],
  nearEnd: [
    "Almost complete. Take these final moments to appreciate yourself.",
    "You're nearly finished. Feel the peace you've created.",
    "Just a little more time to nurture your wellbeing.",
    "Stay with this feeling of calm as we finish.",
    "You're doing something wonderful for yourself right now."
  ],
  completion: [
    "Beautiful work. You've given yourself the gift of peace.",
    "You've completed this healing practice. Notice how you feel now.",
    "Wonderful. You've taken time to care for your mental wellbeing.",
    "You've created space for calm in your day. Well done.",
    "This practice is complete. Carry this peace with you."
  ]
};

const MOTIVATIONAL_MESSAGES: MotivationalMessage = {
  start: [
    "Let's do this! You've got the strength to push through.",
    "Time to unleash your power! Every rep counts.",
    "You're taking control of your fitness journey. Amazing!",
    "Every movement is building your strength and stamina.",
    "You showed up today - that's already a victory!"
  ],
  middle: [
    "You're crushing it! Keep that energy flowing.",
    "Halfway there! Feel that strength building inside you.",
    "Your body is getting stronger with every rep.",
    "Push through - you're more powerful than you think!",
    "Feel your stamina increasing with every movement."
  ],
  nearEnd: [
    "Almost there! Finish strong!",
    "Final push! Give it everything you've got!",
    "You're so close! Don't give up now!",
    "Dig deep - the finish line is right there!",
    "Ten seconds left - show your strength!"
  ],
  completion: [
    "Incredible work! You just leveled up your fitness.",
    "You did it! Feel that sense of accomplishment.",
    "Amazing! You've built both strength and stamina today.",
    "Workout complete! You should be proud of yourself.",
    "Fantastic! You just proved your dedication to fitness."
  ]
};

export const playWorkoutAudio = (
  phase: keyof MotivationalMessage,
  audioType: 'healing' | 'motivational',
  voicePreference: 'male' | 'female' = 'female'
) => {
  const messages = audioType === 'healing' ? HEALING_MESSAGES[phase] : MOTIVATIONAL_MESSAGES[phase];
  const randomMessage = messages[Math.floor(Math.random() * messages.length)];
  
  Speech.speak(randomMessage, {
    voice: voicePreference === 'male' ? 'com.apple.ttsbundle.Daniel-compact' : 'com.apple.ttsbundle.Samantha-compact',
    rate: audioType === 'healing' ? 0.8 : 0.9,
    pitch: audioType === 'healing' ? 0.9 : 1.0,
  });
};

export const stopAudio = () => {
  Speech.stop();
};