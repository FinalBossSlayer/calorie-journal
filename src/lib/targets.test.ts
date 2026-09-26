import {
  ACTIVITY_FACTORS,
  ageOn,
  bmr,
  computeTargets,
  goalAdjustment,
  MIN_KCAL,
  OVERRIDE_LIMITS,
  removeOverride,
  type TargetInput,
} from './targets';

const TODAY = '2026-09-25';

// 30 years old on TODAY.
const man: TargetInput = {
  sex: 'male',
  birthDate: '1996-01-15',
  heightCm: 180,
  weightKg: 80,
  activityLevel: 'moderate',
  goal: 'lose',
  goalRateKgPerWeek: 0.5,
};

const woman: TargetInput = {
  sex: 'female',
  birthDate: '1996-01-15',
  heightCm: 165,
  weightKg: 60,
  activityLevel: 'sedentary',
  goal: 'maintain',
  goalRateKgPerWeek: 0,
};

describe('ageOn', () => {
  it('counts full years', () => {
    expect(ageOn('1996-01-15', TODAY)).toBe(30);
  });

  it('does not count a birthday that has not happened yet this year', () => {
    expect(ageOn('1996-09-26', TODAY)).toBe(29);
    expect(ageOn('1996-12-01', TODAY)).toBe(29);
  });

  it('counts the birthday itself', () => {
    expect(ageOn('1996-09-25', TODAY)).toBe(30);
  });

  it('rejects malformed dates', () => {
    expect(() => ageOn('25.09.1996', TODAY)).toThrow();
  });
});

describe('bmr (Mifflin-St Jeor)', () => {
  it('male: 10·kg + 6.25·cm − 5·age + 5', () => {
    // 800 + 1125 − 150 + 5
    expect(bmr('male', 80, 180, 30)).toBeCloseTo(1780);
  });

  it('female: 10·kg + 6.25·cm − 5·age − 161', () => {
    // 600 + 1031.25 − 150 − 161
    expect(bmr('female', 60, 165, 30)).toBeCloseTo(1320.25);
  });
});

describe('goalAdjustment', () => {
  it('is 7700 kcal per kg spread over 7 days', () => {
    expect(goalAdjustment('lose', 0.5)).toBeCloseTo(-550);
    expect(goalAdjustment('gain', 0.25)).toBeCloseTo(275);
  });

  it('is zero for maintain, whatever the stored rate', () => {
    expect(goalAdjustment('maintain', 0.75)).toBe(0);
  });

  it('caps the rate at 1 kg/week', () => {
    expect(goalAdjustment('lose', 2)).toBeCloseTo(-1100);
  });

  it('ignores the sign of the rate (goal decides the direction)', () => {
    expect(goalAdjustment('lose', -0.5)).toBeCloseTo(-550);
  });
});

describe('computeTargets', () => {
  it.each(Object.entries(ACTIVITY_FACTORS))('applies the %s activity factor', (level, factor) => {
    const r = computeTargets({ ...man, activityLevel: level as TargetInput['activityLevel'] }, TODAY);
    expect(r.tdee).toBeCloseTo(1780 * factor);
  });

  it('computes a full set of targets for a typical profile', () => {
    const r = computeTargets(man, TODAY);
    // TDEE 1780 × 1.55 = 2759, − 550 = 2209
    expect(r.age).toBe(30);
    expect(r.unclampedKcal).toBeCloseTo(2209);
    expect(r.clamped).toBe(false);
    expect(r.targets).toEqual({
      kcal: 2209,
      protein: 128, // 80 × 1.6
      fat: 74, // 2209 × 0.3 / 9 = 73.6
      carbs: 259, // (2209 − 128·4 − 73.6·9) / 4 = 258.6
      fiber: 31, // 14 × 2.209 = 30.9
      sugar: 55, // 2209 × 0.1 / 4 = 55.2
      salt: 5,
    });
    expect(r.targets).toEqual(r.calculated);
    expect(r.overridden).toEqual([]);
  });

  describe('safety floor', () => {
    it('clamps women to 1200 kcal and reports it', () => {
      const r = computeTargets({ ...woman, goal: 'lose', goalRateKgPerWeek: 1 }, TODAY);
      // 1320.25 × 1.2 − 1100 = 484
      expect(r.unclampedKcal).toBeCloseTo(484.3);
      expect(r.clamped).toBe(true);
      expect(r.minKcal).toBe(MIN_KCAL.female);
      expect(r.targets.kcal).toBe(1200);
    });

    it('clamps men to 1500 kcal', () => {
      const r = computeTargets(
        { ...man, activityLevel: 'sedentary', goalRateKgPerWeek: 1 },
        TODAY,
      );
      // 1780 × 1.2 − 1100 = 1036
      expect(r.clamped).toBe(true);
      expect(r.targets.kcal).toBe(1500);
    });

    it('clamps even without a weight-loss goal when TDEE itself is too low', () => {
      const r = computeTargets(
        { ...woman, weightKg: 42, heightCm: 150, birthDate: '1946-01-01' },
        TODAY,
      );
      expect(r.unclampedKcal).toBeLessThan(1200);
      expect(r.targets.kcal).toBe(1200);
    });

    it('derives macros from the clamped kcal', () => {
      const r = computeTargets({ ...woman, goal: 'lose', goalRateKgPerWeek: 1 }, TODAY);
      expect(r.targets.fat).toBe(40); // 1200 × 0.3 / 9
      expect(r.targets.sugar).toBe(30);
    });

    it('does not clamp a result just above the floor', () => {
      // Pick a rate so the result lands just above 1500.
      const r = computeTargets({ ...man, activityLevel: 'sedentary', goalRateKgPerWeek: 0.5 }, TODAY);
      // 2136 − 550 = 1586
      expect(r.clamped).toBe(false);
      expect(r.targets.kcal).toBe(1586);
    });
  });

  it('never lets carbs go negative', () => {
    // Heavy person, clamped low kcal: protein (1.6 g/kg) + fat eat the whole budget.
    const r = computeTargets(
      { ...woman, weightKg: 150, heightCm: 150, birthDate: '1936-01-01', goal: 'lose', goalRateKgPerWeek: 1 },
      TODAY,
      { kcal: 900 },
    );
    expect(r.targets.carbs).toBe(0);
  });

  describe('overrides', () => {
    it('take precedence and are reported', () => {
      const r = computeTargets(man, TODAY, { protein: 160, salt: 4 });
      expect(r.targets.protein).toBe(160);
      expect(r.targets.salt).toBe(4);
      expect(r.overridden).toEqual(['protein', 'salt']);
      expect(r.calculated.protein).toBe(128);
    });

    it('recompute derived targets from an overridden kcal', () => {
      const r = computeTargets(man, TODAY, { kcal: 2000 });
      expect(r.targets.kcal).toBe(2000);
      expect(r.targets.fat).toBe(67); // 2000 × 0.3 / 9
      expect(r.targets.fiber).toBe(28);
      expect(r.targets.sugar).toBe(50);
      expect(r.targets.protein).toBe(128); // weight-based, unaffected
      expect(r.calculated.kcal).toBe(2209);
    });

    it('feed overridden protein and fat into the carb remainder', () => {
      const r = computeTargets(man, TODAY, { kcal: 2000, protein: 150, fat: 60 });
      expect(r.targets.carbs).toBe(215); // (2000 − 600 − 540) / 4
    });

    it('keep an overridden derived value even when kcal is overridden too', () => {
      const r = computeTargets(man, TODAY, { kcal: 2000, fiber: 40 });
      expect(r.targets.fiber).toBe(40);
    });

    it('may go below the safety floor, flagged as belowFloor', () => {
      const r = computeTargets(man, TODAY, { kcal: 1300 });
      expect(r.targets.kcal).toBe(1300);
      expect(r.belowFloor).toBe(true);
      expect(r.clamped).toBe(false);
    });

    it('ignore invalid stored values', () => {
      const bad = { kcal: -5, protein: Number.NaN, fat: 'x' } as unknown as Record<string, number>;
      const r = computeTargets(man, TODAY, bad);
      expect(r.targets).toEqual(r.calculated);
      expect(r.overridden).toEqual([]);
    });

    it('accept null', () => {
      expect(computeTargets(man, TODAY, null).targets).toEqual(computeTargets(man, TODAY).targets);
    });
  });
});

describe('removeOverride', () => {
  it('removes one nutrient and keeps the rest', () => {
    expect(removeOverride({ kcal: 2000, fat: 60 }, 'fat')).toEqual({ kcal: 2000 });
  });

  it('returns null when nothing is left', () => {
    expect(removeOverride({ kcal: 2000 }, 'kcal')).toBeNull();
    expect(removeOverride(null, 'kcal')).toBeNull();
  });

  it('does not mutate the input', () => {
    const o = { kcal: 2000, fat: 60 };
    removeOverride(o, 'fat');
    expect(o).toEqual({ kcal: 2000, fat: 60 });
  });

  it('gives back the value calculated without that override', () => {
    // Editing fat while kcal is overridden: "calculated" fat follows the overridden kcal.
    const overrides = { kcal: 2000, fat: 90 };
    const r = computeTargets(man, TODAY, removeOverride(overrides, 'fat'));
    expect(r.targets.fat).toBe(67);
  });
});

describe('OVERRIDE_LIMITS', () => {
  it('lets kcal go below both safety floors (allowed, with a warning)', () => {
    expect(OVERRIDE_LIMITS.kcal.min).toBeLessThan(MIN_KCAL.female);
  });
});
