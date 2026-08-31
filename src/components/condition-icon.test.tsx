import { describe, expect, it } from 'vitest'
import { ConditionIcon } from './condition-icon'

// ConditionIcon is a plain function component (no hooks), so it can be
// invoked directly and its returned element tree inspected without
// rendering to a real DOM — keeps this test dependency-free.

describe('ConditionIcon', () => {
  it('exposes the title as an aria-label so it is announced without hover', () => {
    const element = ConditionIcon({ condition: 'clear-sky', title: 'Clear sky · 40%' })
    expect(element.props.title).toBe('Clear sky · 40%')
    expect(element.props['aria-label']).toBe('Clear sky · 40%')
    expect(element.props['aria-hidden']).toBeUndefined()
  })

  it('marks the icon as decorative (aria-hidden) when no title is given', () => {
    const element = ConditionIcon({ condition: 'clear-sky' })
    expect(element.props.title).toBeUndefined()
    expect(element.props['aria-label']).toBeUndefined()
    expect(element.props['aria-hidden']).toBe(true)
  })
})
