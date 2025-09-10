/**
 * Basic functionality tests to demonstrate CI gates
 */

import { describe, it, expect } from 'vitest'

describe('Basic Functionality Tests', () => {
  it('should pass basic test', () => {
    expect(1 + 1).toBe(2)
  })

  it('should handle string operations', () => {
    const greeting = 'Hello World'
    expect(greeting.toLowerCase()).toBe('hello world')
    expect(greeting.length).toBe(11)
  })

  it('should handle array operations', () => {
    const numbers = [1, 2, 3, 4, 5]
    expect(numbers.length).toBe(5)
    expect(numbers.includes(3)).toBe(true)
    expect(numbers.filter(n => n > 3)).toEqual([4, 5])
  })

  it('should handle object operations', () => {
    const user = {
      name: 'Test User',
      email: 'test@example.com',
      age: 30
    }
    
    expect(user.name).toBe('Test User')
    expect(user.email).toContain('@example.com')
    expect(user.age).toBeGreaterThan(18)
  })
})

// Example utility function to test coverage
export function calculatePercentage(value: number, total: number): number {
  /* c8 ignore start */
  if (total === 0) {
    throw new Error('Total cannot be zero')
  }
  /* c8 ignore stop */
  
  return Math.round((value / total) * 100)
}

describe('Utility Functions', () => {
  it('should calculate percentage correctly', () => {
    expect(calculatePercentage(25, 100)).toBe(25)
    expect(calculatePercentage(1, 3)).toBe(33)
    expect(calculatePercentage(0, 100)).toBe(0)
  })

  it('should handle edge cases', () => {
    expect(() => calculatePercentage(50, 0)).toThrow('Total cannot be zero')
  })
})