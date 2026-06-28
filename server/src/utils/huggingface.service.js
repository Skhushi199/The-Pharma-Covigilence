const axios = require('axios');

/**
 * Calls the Hugging Face FastAPI endpoint to map a symptom description
 * to a MedDRA term and get a severity score.
 *
 * Actual API response shape:
 * {
 *   "original_text": "...",
 *   "top_matches": [
 *     {
 *       "term": "Headache",
 *       "confidence_score": 0.653,
 *       "severity_score": 2,
 *       "is_ime": false,
 *       "recommended_action": "Routine Log"
 *     }
 *   ]
 * }
 *
 * @param {string} userText - The raw symptom description from the patient
 * @returns {{ meddraTerm: string, severityScore: number }}
 */
async function mapSymptomToMedDRA(userText) {
  const apiUrl = process.env.HF_API_URL;

  if (!apiUrl) {
    throw new Error('HF_API_URL is not configured in environment variables');
  }

  const headers = { 'Content-Type': 'application/json' };

  // Include bearer token if the HF Space is private
  if (process.env.HF_API_TOKEN) {
    headers['Authorization'] = `Bearer ${process.env.HF_API_TOKEN}`;
  }

  let responseData;

  try {
    const response = await axios.post(
      apiUrl,
      { user_text: userText },
      { headers, timeout: 30000 } // 30 s — HF Spaces can cold-start slowly
    );

    responseData = response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(
        `HF API error ${error.response.status}: ${JSON.stringify(error.response.data)}`
      );
    } else if (error.code === 'ECONNABORTED') {
      throw new Error(
        'HF API request timed out after 30 seconds. The Space may be cold-starting.'
      );
    } else {
      throw new Error(`HF API request failed: ${error.message}`);
    }
  }

  // ── Parse response ───────────────────────────────────────────────────────────
  if (!responseData) {
    throw new Error('Empty response body from HF API');
  }

  // Log raw structure once in dev so we can verify parsing is correct
  if (process.env.NODE_ENV === 'development') {
    console.log('[HF API] raw response:', JSON.stringify(responseData));
  }

  // ── top_matches[] array  (primary format) ────────────────────────────────────
  if (
    Array.isArray(responseData.top_matches) &&
    responseData.top_matches.length > 0
  ) {
    const best = responseData.top_matches[0];

    const meddraTerm =
      (typeof best.term === 'string' && best.term.trim()) ||
      (typeof best.meddra_term === 'string' && best.meddra_term.trim()) ||
      (typeof best.name === 'string' && best.name.trim()) ||
      'Adverse Event (Unclassified)';

    // severity_score from the API is already on a 1-10 scale
    const rawScore = best.severity_score ?? best.severityScore ?? best.score ?? 5;
    const severityScore = Math.min(10, Math.max(1, Math.round(Number(rawScore))));

    return { meddraTerm, severityScore };
  }

  // ── Flat field fallback (legacy / alternative API shapes) ────────────────────
  if (responseData.meddra_term || responseData.term || responseData.mapped_term) {
    const meddraTerm =
      responseData.meddra_term ||
      responseData.term ||
      responseData.mapped_term ||
      'Adverse Event (Unclassified)';

    const rawScore =
      responseData.severity_score ??
      responseData.severityScore ??
      responseData.score ??
      5;

    const severityScore = Math.min(10, Math.max(1, Math.round(Number(rawScore))));
    return { meddraTerm, severityScore };
  }

  // ── Nothing matched — warn and fall back gracefully ───────────────────────────
  console.warn(
    '[HF API] Could not parse response — unrecognised shape. Raw:',
    JSON.stringify(responseData)
  );
  return { meddraTerm: 'Adverse Event (Unclassified)', severityScore: 5 };
}

module.exports = { mapSymptomToMedDRA };
