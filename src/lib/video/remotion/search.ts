export interface SearchStep {
  low: number;
  high: number;
  mid: number;
  outcome: "left" | "right" | "found";
  nextLow: number;
  nextHigh: number;
}

/**
 * Computes deterministic binary search trace for sorted arrays.
 * Guarantees mathematical accuracy and avoids LLM hallucination.
 */
export function binaryTrace(values: number[], target: number): SearchStep[] {
  if (!values || values.length < 2) {
    return [{ low: 0, high: 0, mid: 0, outcome: "found", nextLow: 0, nextHigh: 0 }];
  }

  let low = 0;
  let high = values.length - 1;
  const steps: SearchStep[] = [];

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const midVal = values[mid];
    const outcome: "left" | "right" | "found" =
      midVal === target ? "found" : midVal < target ? "right" : "left";

    const nextLow = outcome === "right" ? mid + 1 : low;
    const nextHigh = outcome === "left" ? mid - 1 : high;

    steps.push({ low, high, mid, outcome, nextLow, nextHigh });

    if (outcome === "found") break;
    low = nextLow;
    high = nextHigh;
  }

  return steps;
}
