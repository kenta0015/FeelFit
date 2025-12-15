// logic/rules.ts
import type { Metrics } from '@/state/appStore';

export type RuleResult = { id: string; text: string };

export function rulesCoach(m: Metrics): RuleResult {
  // Priority order – first that matches wins
  if (m.stamina <= 35) {
    return {
      id: 'low-stamina-recover',
      text:
        'Energy looks low—do 10–15 min of easy mobility and get 500–700 ml water. Short walk if you feel up to it.',
    };
  }

  if ((m.sleepHours ?? 7) < 6) {
    return {
      id: 'poor-sleep-easy-day',
      text:
        'Sleep was short. Keep intensity easy today: brisk 20–30 min walk or light upper-body circuit.',
    };
  }

  if ((m.daysSinceWorkout ?? 2) >= 3) {
    return {
      id: 'return-from-gap',
      text:
        'It’s been a few days—start with a 5-minute warmup then 2×10 min steady pace. Stop while it still feels good.',
    };
  }

  if ((m.rpeAvg ?? 5) >= 8) {
    return {
      id: 'high-rpe-deload',
      text:
        'Recent sessions were hard. Take a deload: cut volume by ~30% and keep RPE ≤ 6.',
    };
  }

  if ((m.hydration ?? 60) < 40) {
    return {
      id: 'hydrate-nudge',
      text:
        'Hydrate first: aim for ~250–300 ml now. Re-check in 30 minutes before training.',
    };
  }

  // Default “go” plan
  return {
    id: 'green-light',
    text:
      'You’re good to go—try 3×8 min at a conversational pace with 2 min easy between. Finish with 5 min core.',
  };
}
