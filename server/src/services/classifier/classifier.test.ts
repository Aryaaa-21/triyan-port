import { describe, expect, it } from 'vitest';
import { CONFIDENCE_REVIEW_THRESHOLD } from '@triyan/shared';
import { classifySafely, detectLanguage, rulesClassifier, type Classifier } from './index.js';

describe('detectLanguage', () => {
  it('detects English', () => {
    expect(detectLanguage('the night was long and I kept the window open').language).toBe(
      'ENGLISH',
    );
  });
  it('detects Hindi in Devanagari', () => {
    expect(detectLanguage('तन्हाई में तेरी यादें रहती हैं').language).toBe('HINDI');
  });
  it('detects romanised Hindi as Hinglish', () => {
    expect(detectLanguage('dil mein dard hai aur tum nahi ho').language).toBe('HINGLISH');
  });
  it('detects mixed scripts as Hinglish', () => {
    expect(detectLanguage('यादें stay longer than people ever do here').language).toBe('HINGLISH');
  });
  it('returns UNKNOWN for empty or symbol-only text', () => {
    expect(detectLanguage('').language).toBe('UNKNOWN');
    expect(detectLanguage('🖤 ... ✨').language).toBe('UNKNOWN');
  });
});

describe('rulesClassifier', () => {
  it('classifies love and longing', () => {
    const r = rulesClassifier.classify({ text: 'I miss you. Longing for my beloved, waiting.' });
    expect(r.primaryCategory).toBe('LOVE_LONGING');
    expect(r.themes).toEqual(expect.arrayContaining(['longing', 'love']));
    expect(r.emotions).toContain('longing');
  });

  it('classifies grief', () => {
    const r = rulesClassifier.classify({ text: 'grief, mourning, I grieve in tears' });
    expect(r.primaryCategory).toBe('GRIEF_MELANCHOLY');
    expect(r.emotions).toContain('grief');
  });

  it('classifies existential writing', () => {
    expect(
      rulesClassifier.classify({ text: 'existence without meaning, the absurd, the void' })
        .primaryCategory,
    ).toBe('EXISTENTIALISM');
  });

  it('classifies Devanagari text', () => {
    const r = rulesClassifier.classify({ text: 'मौत और मृत्यु का सवाल' });
    expect(r.primaryCategory).toBe('MORTALITY_NOTHINGNESS');
    expect(r.language).toBe('HINDI');
  });

  it('reads hashtags as words', () => {
    expect(rulesClassifier.classify({ text: '#grief #mourning' }).themes).toContain('grief');
  });

  it('respects word boundaries', () => {
    // "glove" must not match "love"
    expect(rulesClassifier.classify({ text: 'a glove on the table' }).themes).not.toContain('love');
  });

  it('flags empty captions for review with zero confidence', () => {
    const r = rulesClassifier.classify({ text: '' });
    expect(r.primaryCategory).toBeNull();
    expect(r.confidence).toBe(0);
    expect(r.needsReview).toBe(true);
  });

  it('flags weak evidence for review', () => {
    const r = rulesClassifier.classify({ text: 'heart' });
    expect(r.confidence).toBeLessThan(CONFIDENCE_REVIEW_THRESHOLD);
    expect(r.needsReview).toBe(true);
  });

  it('is confident on strong, unambiguous evidence', () => {
    const r = rulesClassifier.classify({
      text: 'grief. mourning. I grieve, I mourn, grieving still. शोक',
    });
    expect(r.confidence).toBeGreaterThanOrEqual(CONFIDENCE_REVIEW_THRESHOLD);
    expect(r.needsReview).toBe(false);
  });

  it('keeps confidence in 0..1 and at most 2 secondary categories', () => {
    const r = rulesClassifier.classify({
      text: 'love grief death existence hope time human memory faith lonely',
    });
    expect(r.confidence).toBeGreaterThanOrEqual(0);
    expect(r.confidence).toBeLessThanOrEqual(1);
    expect(r.secondaryCategories.length).toBeLessThanOrEqual(2);
    expect(r.secondaryCategories).not.toContain(r.primaryCategory);
  });

  it('is deterministic', () => {
    const text = 'yaadein aur dard, tanhai';
    expect(rulesClassifier.classify({ text })).toEqual(rulesClassifier.classify({ text }));
  });
});

describe('classifySafely', () => {
  it('never throws when a classifier fails', () => {
    const broken: Classifier = {
      method: 'LLM',
      version: 'x',
      classify: () => {
        throw new Error('boom');
      },
    };
    const r = classifySafely('anything', broken);
    expect(r.needsReview).toBe(true);
    expect(r.classifierVersion).toBe('x+failed');
  });

  it('tolerates malformed input', () => {
    expect(() => classifySafely(undefined as unknown as string)).not.toThrow();
  });
});
