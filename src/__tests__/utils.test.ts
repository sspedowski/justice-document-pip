import { describe, it, expect } from 'vitest'
import { cn } from '../lib/utils'

describe('Utils', () => {
  describe('cn function', () => {
    it('merges class names correctly', () => {
      const result = cn('base-class', 'additional-class')
      expect(result).toContain('base-class')
      expect(result).toContain('additional-class')
    })

    it('handles conditional class names', () => {
      const result = cn('base-class', false && 'conditional-class', 'always-class')
      expect(result).toContain('base-class')
      expect(result).toContain('always-class')
      expect(result).not.toContain('conditional-class')
    })

    it('handles undefined and null values', () => {
      const result = cn('base-class', undefined, null, 'valid-class')
      expect(result).toContain('base-class')
      expect(result).toContain('valid-class')
    })

    it('merges Tailwind classes correctly', () => {
      const result = cn('bg-red-500', 'bg-blue-500')
      // Should resolve conflicting Tailwind classes
      expect(result).toContain('bg-blue-500')
      expect(result).not.toContain('bg-red-500')
    })

    it('handles empty input', () => {
      const result = cn()
      expect(result).toBe('')
    })

    it('handles array of classes', () => {
      const result = cn(['class1', 'class2'], 'class3')
      expect(result).toContain('class1')
      expect(result).toContain('class2')
      expect(result).toContain('class3')
    })

    it('handles object with boolean values', () => {
      const result = cn({
        'always-on': true,
        'never-on': false,
        'conditional': 1 > 0
      })
      expect(result).toContain('always-on')
      expect(result).toContain('conditional')
      expect(result).not.toContain('never-on')
    })

    it('combines all input types', () => {
      const result = cn(
        'base',
        ['array1', 'array2'],
        {
          'object-true': true,
          'object-false': false
        },
        true && 'conditional-true',
        false && 'conditional-false',
        'final'
      )
      
      expect(result).toContain('base')
      expect(result).toContain('array1')
      expect(result).toContain('array2')
      expect(result).toContain('object-true')
      expect(result).toContain('conditional-true')
      expect(result).toContain('final')
      expect(result).not.toContain('object-false')
      expect(result).not.toContain('conditional-false')
    })
  })
})