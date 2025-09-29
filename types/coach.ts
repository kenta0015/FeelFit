// types/coach.ts
// Types for Coach Mini Q&A (MVP)

export type CoachRole = 'user' | 'coach';

export type CoachAction =
  | { type: 'applyTime'; minutes: number }
  | { type: 'swapBlock'; from: string; to: string }
  | { type: 'replaceStyle'; style: string };

export type CoachMessage = {
  id: string;
  role: CoachRole;
  text: string;
  ts: number;
  actions?: CoachAction[];
};

export type CoachAnswer = {
  text: string;
  actions?: CoachAction[];
  cache?: any;
};

export type ThreadKey = {
  date: string;    // YYYY-MM-DD
  planSig: string; // hash of plan content
};

export type CoachQAPrompt =
  | { kind: 'preset'; label: string }
  | { kind: 'text'; text: string };
