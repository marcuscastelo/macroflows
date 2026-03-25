import { describe, expect, it } from 'vitest'

import { isWeightChartType } from '~/modules/weight/application/chart/weightChartSettings'

describe('isWeightChartType', () => {
  describe('valid weight chart types', () => {
    it('should return true for "7d"', () => {
      expect(isWeightChartType('7d')).toBe(true)
    })

    it('should return true for "14d"', () => {
      expect(isWeightChartType('14d')).toBe(true)
    })

    it('should return true for "30d"', () => {
      expect(isWeightChartType('30d')).toBe(true)
    })

    it('should return true for "3m"', () => {
      expect(isWeightChartType('3m')).toBe(true)
    })

    it('should return true for "6m"', () => {
      expect(isWeightChartType('6m')).toBe(true)
    })

    it('should return true for "1y"', () => {
      expect(isWeightChartType('1y')).toBe(true)
    })

    it('should return true for "all"', () => {
      expect(isWeightChartType('all')).toBe(true)
    })
  })

  describe('invalid weight chart types', () => {
    it('should return false for empty string', () => {
      expect(isWeightChartType('')).toBe(false)
    })

    it('should return false for invalid string', () => {
      expect(isWeightChartType('invalid')).toBe(false)
    })

    it('should return false for "2y"', () => {
      expect(isWeightChartType('2y')).toBe(false)
    })

    it('should return false for case variations', () => {
      expect(isWeightChartType('7D')).toBe(false)
      expect(isWeightChartType('ALL')).toBe(false)
    })

    it('should return false for whitespace variations', () => {
      expect(isWeightChartType(' 7d')).toBe(false)
      expect(isWeightChartType('7d ')).toBe(false)
    })
  })

  describe('type narrowing', () => {
    it('should narrow type when used in conditional', () => {
      const unknownValue: string = '7d'

      if (isWeightChartType(unknownValue)) {
        // TypeScript should recognize this as WeightChartType
        const chartType: '7d' | '14d' | '30d' | '3m' | '6m' | '1y' | 'all' =
          unknownValue
        expect(chartType).toBe('7d')
      } else {
        // This branch should not be executed
        expect(true).toBe(false)
      }
    })
  })
})
