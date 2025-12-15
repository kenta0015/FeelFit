// data/exerciseStyles.ts
// Style metadata for exercise templates (indoor/outdoor, joint impact level).
// This is used by Coach actions like `replaceStyle: 'indoor'` or `replaceStyle: 'low-impact'`
// to decide how to tweak the generated Plan.
//
// NOTE:
// - Keys are template IDs from `data/exerciseTemplates.json` (e.g. "card_brisk_walk_15").
// - All fields are optional at call sites; unknown IDs fall back to a safe default.

export type Environment = 'indoor' | 'outdoor' | 'either';
export type ImpactLevel = 'low' | 'normal' | 'high';

export type ExerciseStyle = {
  environment: Environment;
  impact: ImpactLevel;
};

// Style metadata per exercise template.
// This is used by Coach-driven constraints such as
// "Indoor only" and "Be gentle on joints".
const EXERCISE_STYLES: Record<string, ExerciseStyle> = {
  // Mobility (all gentle, done indoors)
  mob_cat_cow_5: {
    environment: 'indoor',
    impact: 'low',
  },
  mob_worlds_greatest_5: {
    environment: 'indoor',
    impact: 'low',
  },
  mob_hip_opener_5: {
    environment: 'indoor',
    impact: 'low',
  },

  // Mindfulness
  mind_box_breath_5: {
    environment: 'indoor',
    impact: 'low',
  },
  mind_body_scan_5: {
    environment: 'indoor',
    impact: 'low',
  },
  mind_breath_walk_5: {
    // Can be done inside a room or outside
    environment: 'either',
    impact: 'low',
  },

  // Recovery / yoga
  rec_yoga_flow_15: {
    environment: 'indoor',
    impact: 'low',
  },

  // Cardio
  card_walk_liss_10: {
    // Walking can be indoor treadmill or outdoor
    environment: 'outdoor',
    impact: 'low',
  },
  card_brisk_walk_15: {
    environment: 'outdoor',
    impact: 'low',
  },
  card_march_in_place_10: {
    // Explicitly indoor-friendly
    environment: 'indoor',
    impact: 'low',
  },
  card_jump_rope_10: {
    // Can be indoors but higher impact on joints
    environment: 'indoor',
    impact: 'high',
  },

  // Core
  core_dead_bug_10: {
    environment: 'indoor',
    impact: 'low',
  },
  core_plank_10: {
    environment: 'indoor',
    impact: 'normal',
  },

  // Strength
  str_db_goblet_squat_10: {
    environment: 'either',
    impact: 'normal',
  },
  str_band_pullapart_10: {
    environment: 'indoor',
    impact: 'low',
  },
  str_pushup_variations_10: {
    environment: 'either',
    impact: 'normal',
  },
};

/**
 * Return style metadata for a given exercise id.
 * If an id is unknown, default to a neutral style.
 */
export function getExerciseStyle(exerciseId: string): ExerciseStyle {
  const style = EXERCISE_STYLES[exerciseId];
  if (style) return style;
  return {
    environment: 'either',
    impact: 'normal',
  };
}

/**
 * Helper: true if the exercise is marked as outdoor-only.
 * (environment === 'outdoor')
 */
export function isOutdoorOnly(exerciseId: string): boolean {
  const style = getExerciseStyle(exerciseId);
  return style.environment === 'outdoor';
}

/**
 * Helper: true if the exercise is explicitly low impact.
 */
export function isLowImpact(exerciseId: string): boolean {
  const style = getExerciseStyle(exerciseId);
  return style.impact === 'low';
}

/**
 * Helper: true if the exercise is explicitly high impact.
 */
export function isHighImpact(exerciseId: string): boolean {
  const style = getExerciseStyle(exerciseId);
  return style.impact === 'high';
}
