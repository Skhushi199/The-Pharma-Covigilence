const Complaint = require('../models/Complaint.model');

/**
 * Proportional Reporting Ratio (PRR) Signal Detection
 *
 * Uses a 2×2 contingency matrix:
 *
 *                  | Target Drug  | All Other Drugs |
 *   Target Event   |      a       |        b        |
 *   All Other Evts |      c       |        d        |
 *
 * PRR = (a / (a+c)) / (b / (b+d))
 * Chi-Square = N * (ad - bc)² / [(a+b)(c+d)(a+c)(b+d)]
 *
 * Signal thresholds: PRR >= 2 AND Chi² >= 4
 *
 * @param {string} targetDrug   - Medicine name to investigate
 * @param {string} targetEvent  - MedDRA term to investigate
 * @returns {object} PRR results with contingency matrix, signal flag
 */
async function calculatePRR(targetDrug, targetEvent) {
  const drugNorm = new RegExp(`^${targetDrug.trim()}$`, 'i');
  const eventNorm = new RegExp(`^${targetEvent.trim()}$`, 'i');

  // a: target drug WITH target event
  const a = await Complaint.countDocuments({
    medicineName: drugNorm,
    meddraTerm: eventNorm,
    status: { $ne: 'Incomplete' },
  });

  // a + c: all reports for target drug (any event)
  const aPlusC = await Complaint.countDocuments({
    medicineName: drugNorm,
    status: { $ne: 'Incomplete' },
  });

  // a + b: all reports with target event (any drug)
  const aPlusB = await Complaint.countDocuments({
    meddraTerm: eventNorm,
    status: { $ne: 'Incomplete' },
  });

  // N: total all completed reports
  const N = await Complaint.countDocuments({
    status: { $ne: 'Incomplete' },
  });

  // Derive contingency cells
  const c = aPlusC - a; // target drug, other events
  const b = aPlusB - a; // other drugs, target event
  const d = N - a - b - c; // other drugs, other events

  // Guard against division by zero
  if (aPlusC === 0 || b + d === 0) {
    return {
      targetDrug,
      targetEvent,
      matrix: { a, b, c, d },
      N,
      prr: null,
      chiSquare: null,
      isSignal: false,
      message: 'Insufficient data to calculate PRR (no reports for this drug or event)',
    };
  }

  const prr = (a / aPlusC) / (b / (b + d));

  let chiSquare = null;
  const denominator = (a + b) * (c + d) * (a + c) * (b + d);
  if (denominator > 0 && N > 0) {
    chiSquare = (N * Math.pow(a * d - b * c, 2)) / denominator;
  }

  const isSignal = prr >= 2 && chiSquare !== null && chiSquare >= 4;

  return {
    targetDrug,
    targetEvent,
    matrix: { a, b, c, d },
    N,
    prr: parseFloat(prr.toFixed(4)),
    chiSquare: chiSquare !== null ? parseFloat(chiSquare.toFixed(4)) : null,
    isSignal,
    thresholds: { prrThreshold: 2, chiSquareThreshold: 4 },
    interpretation: isSignal
      ? `⚠️ SIGNAL DETECTED: PRR=${prr.toFixed(2)} and χ²=${chiSquare?.toFixed(2)} both exceed thresholds.`
      : `No significant signal. PRR=${prr.toFixed(2)}, χ²=${chiSquare?.toFixed(2) ?? 'N/A'}.`,
  };
}

module.exports = { calculatePRR };
