/**
 * Naranjo Causality Assessment Algorithm
 *
 * Weights (as specified):
 *   Q1 - Did the adverse reaction appear after taking the drug?
 *        Yes = +2, No = -1, Unknown = 0
 *   Q2 - Did the adverse reaction improve when the drug was stopped?
 *        Yes = +1, No =  0, Unknown = 0
 *   Q3 - Did the adverse reaction reappear when the drug was readministered?
 *        Yes = +2, No = -1, Unknown = 0
 *   Q4 - Did the adverse reaction severity change with dose change?
 *        Yes = +1, No =  0, Unknown = 0
 *
 * Categories:
 *   Score >= 5   → Probable
 *   Score  1–4   → Possible
 *   Score <= 0   → Doubtful
 */

const WEIGHTS = {
  q1: { yes: 2, no: -1, unknown: 0 },
  q2: { yes: 1, no: 0, unknown: 0 },
  q3: { yes: 2, no: -1, unknown: 0 },
  q4: { yes: 1, no: 0, unknown: 0 },
};

/**
 * Calculate Naranjo score from four answers.
 *
 * @param {{ q1: string, q2: string, q3: string, q4: string }} answers
 *   Each answer must be 'yes', 'no', or 'unknown'
 * @returns {{ causalityScore: number, causalityCategory: string }}
 */
function calculateNaranjoScore(answers) {
  let score = 0;

  for (const [question, answer] of Object.entries(answers)) {
    const questionWeights = WEIGHTS[question];
    if (!questionWeights) continue; // skip unknown question keys

    const normalised = (answer || 'unknown').toLowerCase().trim();
    const weight = questionWeights[normalised] ?? 0;
    score += weight;
  }

  let causalityCategory;
  if (score >= 5) {
    causalityCategory = 'Probable';
  } else if (score >= 1) {
    causalityCategory = 'Possible';
  } else {
    causalityCategory = 'Doubtful';
  }

  return { causalityScore: score, causalityCategory };
}

module.exports = { calculateNaranjoScore };
