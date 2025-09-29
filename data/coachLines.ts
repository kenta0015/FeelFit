// data/coachLines.ts
// Central catalog of coach lines.
// Dimension keys:
//   - phase: "start" | "middle" | "nearEnd" | "completion"
//   - content: "healing" | "motivational"
//   - gender: "female" | "male"  (voice delivery can still use any TTS voice)

export type Phase = "start" | "middle" | "nearEnd" | "completion";
export type ContentKind = "healing" | "motivational";
export type Gender = "female" | "male";

export type CoachLine = {
  id: string;
  text: string;
  tags?: string[];     // optional metadata for future filtering
};

export type CoachLinesCatalog = {
  [K in ContentKind]: {
    [P in Phase]: {
      female: CoachLine[];
      male: CoachLine[];
    };
  };
};

// Minimal, clean copy-safe lines.
// Keep short, positive, and instruction-light to fit over music.
export const COACH_LINES: CoachLinesCatalog = {
  healing: {
    start: {
      female: [
        { id: "h_s_f_01", text: "Let’s begin easy. Keep your breath soft and steady." },
        { id: "h_s_f_02", text: "Settle in. Light shoulders, long spine." },
        { id: "h_s_f_03", text: "We start calm. Find a relaxed rhythm." },
      ],
      male: [
        { id: "h_s_m_01", text: "Ease into it. Breathe low and relaxed." },
        { id: "h_s_m_02", text: "Set your pace. Keep the shoulders loose." },
        { id: "h_s_m_03", text: "We begin smooth. No rush, just form." },
      ],
    },
    middle: {
      female: [
        { id: "h_m_f_01", text: "Halfway. Stay gentle—smooth in, smooth out." },
        { id: "h_m_f_02", text: "Nice and easy. Keep your jaw and hands relaxed." },
        { id: "h_m_f_03", text: "Good rhythm. Let the breath guide the tempo." },
      ],
      male: [
        { id: "h_m_m_01", text: "Halfway there. Keep the effort light and steady." },
        { id: "h_m_m_02", text: "Looks good. Relax your grip and face." },
        { id: "h_m_m_03", text: "Hold that easy groove. Breath sets the pace." },
      ],
    },
    nearEnd: {
      female: [
        { id: "h_n_f_01", text: "Final stretch. Stay calm through the finish." },
        { id: "h_n_f_02", text: "Almost done. Keep your breath smooth and even." },
        { id: "h_n_f_03", text: "Close with control. Soft shoulders, steady core." },
      ],
      male: [
        { id: "h_n_m_01", text: "Closing in. Keep it relaxed to the line." },
        { id: "h_n_m_02", text: "Nearly there. Smooth breath to the end." },
        { id: "h_n_m_03", text: "Finish in control. Easy shoulders, steady core." },
      ],
    },
    completion: {
      female: [
        { id: "h_c_f_01", text: "Done. Inhale deep, and let everything soften." },
        { id: "h_c_f_02", text: "Nice work. Take a slow breath and reset." },
        { id: "h_c_f_03", text: "Session complete. Notice how your body feels." },
      ],
      male: [
        { id: "h_c_m_01", text: "That’s it. Deep breath in, soften the body." },
        { id: "h_c_m_02", text: "Well done. Slow inhale, gentle release." },
        { id: "h_c_m_03", text: "Complete. Take a moment to notice the change." },
      ],
    },
  },

  motivational: {
    start: {
      female: [
        { id: "m_s_f_01", text: "Let’s lock in. Strong posture, clear focus." },
        { id: "m_s_f_02", text: "We go now. Smooth power, steady breathing." },
        { id: "m_s_f_03", text: "Set your pace. Drive tall and confident." },
      ],
      male: [
        { id: "m_s_m_01", text: "Dial in. Chest up, eyes forward." },
        { id: "m_s_m_02", text: "We start strong. Control and intent." },
        { id: "m_s_m_03", text: "Find your gear. Smooth power on." },
      ],
    },
    middle: {
      female: [
        { id: "m_m_f_01", text: "Halfway. Hold form—strong and steady." },
        { id: "m_m_f_02", text: "Good work. Keep the drive consistent." },
        { id: "m_m_f_03", text: "Stay sharp. Every rep with purpose." },
      ],
      male: [
        { id: "m_m_m_01", text: "Half done. Keep the engine humming." },
        { id: "m_m_m_02", text: "Nice pace. Lock the core and push." },
        { id: "m_m_m_03", text: "Stay on it. Focus and flow." },
      ],
    },
    nearEnd: {
      female: [
        { id: "m_n_f_01", text: "Final push. Strong finish—clean mechanics." },
        { id: "m_n_f_02", text: "Almost there. Keep the power tidy." },
        { id: "m_n_f_03", text: "Close hard. Form first, then speed." },
      ],
      male: [
        { id: "m_n_m_01", text: "Bring it home. Hold your shape." },
        { id: "m_n_m_02", text: "Nearly there. Stay powerful and precise." },
        { id: "m_n_m_03", text: "Finish strong. Quality reps to the line." },
      ],
    },
    completion: {
      female: [
        { id: "m_c_f_01", text: "Done. That was a strong session." },
        { id: "m_c_f_02", text: "Great finish. Breathe in, head high." },
        { id: "m_c_f_03", text: "Session complete. Bank the win." },
      ],
      male: [
        { id: "m_c_m_01", text: "Finished. Solid work today." },
        { id: "m_c_m_02", text: "Great job. Deep breath—own that effort." },
        { id: "m_c_m_03", text: "Complete. Another step forward." },
      ],
    },
  },
};
