import { describe, expect, test } from 'bun:test';
import { refractOffset, rimProfile, roundedRect, smoothMin, boxDistance } from '../src/core/optics';
import { VARIANTS, resolveParams } from '../src/core/params';

describe('refraction', () => {
  test('no bend on the flat top', () => {
    expect(refractOffset(1, 20, 20, 1.5)).toBe(0);
  });
  test('bend is strongest at the rim and shrinks inward', () => {
    const at = (t: number) => refractOffset(t, 20, 20, 1.5);
    expect(at(0.02)).toBeGreaterThan(at(0.3));
    expect(at(0.3)).toBeGreaterThan(at(0.8));
  });
  test('no bend without refraction (ior 1)', () => {
    expect(refractOffset(0.1, 20, 20, 1)).toBeCloseTo(0, 6);
  });
  test('thicker glass bends more', () => {
    expect(refractOffset(0.1, 20, 30, 1.5)).toBeGreaterThan(refractOffset(0.1, 20, 10, 1.5));
  });
  test('profile lookup matches the direct formula', () => {
    const p = rimProfile(20, 20, 1.5, 256);
    expect(p.at(10)).toBeCloseTo(refractOffset(0.5, 20, 20, 1.5), 2);
    expect(p.at(-3)).toBe(0);
  });
});

describe('shapes', () => {
  test('rounded rect distance is negative inside, zero on the edge, positive outside', () => {
    expect(roundedRect(0, 0, 50, 20, 20).d).toBeLessThan(0);
    expect(roundedRect(50, 0, 50, 20, 20).d).toBeCloseTo(0, 6);
    expect(roundedRect(60, 0, 50, 20, 20).d).toBeGreaterThan(0);
  });
  test('normals point outward', () => {
    const r = roundedRect(0, 19, 50, 20, 20);
    expect(r.ny).toBe(1);
    expect(roundedRect(-49, 0, 50, 20, 20).nx).toBe(-1);
  });
  test('corners are circular, matching CSS border-radius', () => {
    // A circle: every point at distance r from the centre is on the outline.
    for (const a of [0.1, 0.5, Math.PI / 4, 1.2]) {
      const s = roundedRect(Math.cos(a) * 50, Math.sin(a) * 50, 50, 50, 50);
      expect(Math.abs(s.d)).toBeLessThan(1e-9);
      expect(s.nx).toBeCloseTo(Math.cos(a), 9);
      expect(s.ny).toBeCloseTo(Math.sin(a), 9);
    }
  });
  test('smooth minimum melts shapes together', () => {
    const a = boxDistance(50, 0, { x: 0, y: 0, w: 60, h: 60, r: 30 });
    const b = boxDistance(50, 0, { x: 100, y: 0, w: 60, h: 60, r: 30 });
    expect(smoothMin(a, b, 30)).toBeLessThan(Math.min(a, b));
    expect(smoothMin(a, a + 100, 30)).toBe(a);
  });
});

describe('presets', () => {
  test('every variant has every parameter', () => {
    const keys = Object.keys(VARIANTS.regular).sort();
    for (const v of Object.values(VARIANTS)) expect(Object.keys(v).sort()).toEqual(keys);
  });
  test('overrides win without mutating the preset', () => {
    const p = resolveParams('clear', { blur: 2 });
    expect(p.blur).toBe(2);
    expect(VARIANTS.clear.blur).not.toBe(2);
  });
});
