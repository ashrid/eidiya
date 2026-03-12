/**
 * State selector functions for aggregating contributor data
 * @module selectors
 */

/**
 * Calculate total bank notes needed across all contributors
 * @param {Array} contributors - Array of contributor objects
 * @returns {Object} Aggregated note counts by denomination
 */
export function calculateBankNotes(contributors) {
  if (!Array.isArray(contributors)) {
    return {
      five: 0,
      ten: 0,
      twenty: 0,
      fifty: 0,
      hundred: 0,
      twoHundred: 0,
      fiveHundred: 0,
      thousand: 0,
    };
  }

  return contributors.reduce(
    (totals, contributor) => {
      const bd = contributor.breakdown || {};
      return {
        five: totals.five + (bd.five || 0),
        ten: totals.ten + (bd.ten || 0),
        twenty: totals.twenty + (bd.twenty || 0),
        fifty: totals.fifty + (bd.fifty || 0),
        hundred: totals.hundred + (bd.hundred || 0),
        twoHundred: totals.twoHundred + (bd.twoHundred || 0),
        fiveHundred: totals.fiveHundred + (bd.fiveHundred || 0),
        thousand: totals.thousand + (bd.thousand || 0),
      };
    },
    {
      five: 0,
      ten: 0,
      twenty: 0,
      fifty: 0,
      hundred: 0,
      twoHundred: 0,
      fiveHundred: 0,
      thousand: 0,
    }
  );
}

/**
 * Calculate complete summary statistics
 * @param {Array} contributors - Array of contributor objects
 * @returns {Object} Summary with grandTotalFils, contributorCount, totalNotes, notes
 */
export function calculateSummary(contributors) {
  if (!Array.isArray(contributors)) {
    return {
      grandTotalFils: 0,
      contributorCount: 0,
      totalNotes: 0,
      notes: {
        five: 0,
        ten: 0,
        twenty: 0,
        fifty: 0,
        hundred: 0,
        twoHundred: 0,
        fiveHundred: 0,
        thousand: 0,
      },
    };
  }

  const notes = calculateBankNotes(contributors);

  // Calculate total number of physical notes
  const totalNotes =
    notes.five +
    notes.ten +
    notes.twenty +
    notes.fifty +
    notes.hundred +
    notes.twoHundred +
    notes.fiveHundred +
    notes.thousand;

  // Calculate grand total in fils
  const grandTotalFils = contributors.reduce(
    (sum, contributor) => sum + (contributor.amountInFils || 0),
    0
  );

  return {
    grandTotalFils,
    contributorCount: contributors.length,
    totalNotes,
    notes,
  };
}

/**
 * Calculate remaining notes to distribute (only unreceived contributors)
 * @param {Array} contributors - Array of contributor objects
 * @returns {Object} Aggregated note counts for unreceived contributors
 */
export function calculateRemainingNotes(contributors) {
  if (!Array.isArray(contributors)) {
    return {
      five: 0,
      ten: 0,
      twenty: 0,
      fifty: 0,
      hundred: 0,
      twoHundred: 0,
      fiveHundred: 0,
      thousand: 0,
    };
  }

  return contributors
    .filter(c => !c.received)
    .reduce(
      (totals, contributor) => {
        const bd = contributor.breakdown || {};
        return {
          five: totals.five + (bd.five || 0),
          ten: totals.ten + (bd.ten || 0),
          twenty: totals.twenty + (bd.twenty || 0),
          fifty: totals.fifty + (bd.fifty || 0),
          hundred: totals.hundred + (bd.hundred || 0),
          twoHundred: totals.twoHundred + (bd.twoHundred || 0),
          fiveHundred: totals.fiveHundred + (bd.fiveHundred || 0),
          thousand: totals.thousand + (bd.thousand || 0),
        };
      },
      {
        five: 0,
        ten: 0,
        twenty: 0,
        fifty: 0,
        hundred: 0,
        twoHundred: 0,
        fiveHundred: 0,
        thousand: 0,
      }
    );
}

/**
 * Calculate distribution progress statistics
 * @param {Array} contributors - Array of contributor objects
 * @returns {Object} Progress stats: { total, received, remaining, percentComplete }
 */
export function calculateDistributionProgress(contributors) {
  if (!Array.isArray(contributors) || contributors.length === 0) {
    return {
      total: 0,
      received: 0,
      remaining: 0,
      percentComplete: 0,
    };
  }

  const total = contributors.length;
  const received = contributors.filter(c => c.received === true).length;
  const remaining = total - received;
  const percentComplete = total > 0 ? Math.round((received / total) * 100) : 0;

  return {
    total,
    received,
    remaining,
    percentComplete,
  };
}
