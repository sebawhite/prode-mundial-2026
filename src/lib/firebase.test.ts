import { describe, it, expect } from 'vitest';
import { calculateMatchPoints } from './firebase';

describe('Argentine PRODE Scoring Logic - calculateMatchPoints', () => {
  it('should return 5 points for an exact score match (e.g. 2-1 predicted, 2-1 actual)', () => {
    const points = calculateMatchPoints(2, 1, 2, 1, false);
    expect(points).toBe(5);
  });

  it('should return 3 points for exact goal difference match (e.g. 2-1 predicted, 3-2 actual)', () => {
    const points = calculateMatchPoints(2, 1, 3, 2, false);
    expect(points).toBe(3);
  });

  it('should return 3 points for exact goal difference match on a different tie (e.g. 0-0 predicted, 1-1 actual)', () => {
    const points = calculateMatchPoints(0, 0, 1, 1, false);
    expect(points).toBe(3);
  });

  it('should return 1 point for predicting the correct outcome sign with a different difference (e.g. 2-1 predicted, 4-1 actual)', () => {
    const points = calculateMatchPoints(2, 1, 4, 1, false);
    expect(points).toBe(1);
  });

  it('should return 0 points when predicting a tie but one team wins (e.g. 0-0 predicted, 0-1 actual - empate vs no-empate)', () => {
    // Documenting real behavior: predicting a tie (sign 0) when a team wins (sign -1 or 1)
    // does not match the sign, therefore earning 0 points.
    const points = calculateMatchPoints(0, 0, 0, 1, false);
    expect(points).toBe(0);
  });

  it('should return 0 points for completely wrong prediction (e.g. 2-1 predicted, 0-3 actual)', () => {
    const points = calculateMatchPoints(2, 1, 0, 3, false);
    expect(points).toBe(0);
  });

  it('should return 0 points if match is not finished yet (actual scores are null)', () => {
    const points = calculateMatchPoints(2, 1, null, null, false);
    expect(points).toBe(0);
  });

  it('should return 5 points for exact score match of a tie (e.g. 0-0 predicted, 0-0 actual)', () => {
    const points = calculateMatchPoints(0, 0, 0, 0, false);
    expect(points).toBe(5);
  });

  it('should return 3 points for exact goal difference match on an away win (e.g. 0-2 predicted, 1-3 actual)', () => {
    const points = calculateMatchPoints(0, 2, 1, 3, false);
    expect(points).toBe(3);
  });

  it('should return 1 point for predicting the correct outcome sign with a different difference on an away win (e.g. 0-2 predicted, 0-3 actual)', () => {
    const points = calculateMatchPoints(0, 2, 0, 3, false);
    expect(points).toBe(1);
  });

  it('should return 0 points for predicting the wrong sign on a home win (e.g. 1-2 predicted, 2-1 actual)', () => {
    const points = calculateMatchPoints(1, 2, 2, 1, false);
    expect(points).toBe(0);
  });

  it('should return 1 point for a correct outcome sign with different difference on a home win (e.g. 3-2 predicted, 2-0 actual)', () => {
    const points = calculateMatchPoints(3, 2, 2, 0, false);
    expect(points).toBe(1);
  });
});
