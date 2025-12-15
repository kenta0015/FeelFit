// logic/selectors.ts
import { usePlanStore, PlanState } from '@/store/usePlanStore';

export type PlanInputs = Pick<PlanState, 'focus' | 'emotion' | 'timeAvailable'>;

export const usePlanInputs = (): PlanInputs => {
  const focus = usePlanStore((s) => s.focus);
  const emotion = usePlanStore((s) => s.emotion);
  const timeAvailable = usePlanStore((s) => s.timeAvailable);
  return { focus, emotion, timeAvailable };
};

export const useSignals = () => usePlanStore((s) => s.signals);

function readinessScore(signals: PlanState['signals']) {
  const base = 50;
  const add =
    (Number(signals.sessions7d) || 0) * 2 +
    (Number(signals.minutes7d) || 0) * 0.1 +
    (Number(signals.recentIntensityAvg) || 0) * 5;
  const sub =
    (Number(signals.acuteLoad3d) || 0) * 0.5 +
    (Number(signals.monotony7d) || 0) * 2 +
    (Number(signals.earlyStopRate) || 0) * 10 +
    ((Number(signals.lastHighGap) || 0) > 7 ? 0 : 5);
  let score = Math.max(0, Math.min(100, base + add - sub));
  return Math.round(score);
}

export const useReadinessScore = () => {
  const s = useSignals();
  return readinessScore(s);
};
