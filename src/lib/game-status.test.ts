import { describe, it, expect } from 'vitest'
import { isActuallyLive, displayStatus } from './game-status'

const base = { home_score: 0, away_score: 0, status: 'pending' }

describe('isActuallyLive', () => {
  it('returns false when status is not live', () => {
    expect(isActuallyLive({ ...base, status: 'pending' })).toBe(false)
    expect(isActuallyLive({ ...base, status: 'completed' })).toBe(false)
    expect(isActuallyLive({ ...base, status: 'scheduled' })).toBe(false)
  })

  it('returns false when status=live but score is 0-0', () => {
    expect(isActuallyLive({ ...base, status: 'live' })).toBe(false)
  })

  it('returns true when status=live and home_score > 0', () => {
    expect(isActuallyLive({ ...base, status: 'live', home_score: 2 })).toBe(true)
  })

  it('returns true when status=live and away_score > 0', () => {
    expect(isActuallyLive({ ...base, status: 'live', away_score: 3 })).toBe(true)
  })

  it('returns true when status=live and both scores > 0', () => {
    expect(isActuallyLive({ ...base, status: 'live', home_score: 10, away_score: 8 })).toBe(true)
  })
})

describe('displayStatus', () => {
  it('demotes status=live without activity to pending', () => {
    expect(displayStatus({ ...base, status: 'live' })).toBe('pending')
  })

  it('keeps status=live with activity as live', () => {
    expect(displayStatus({ ...base, status: 'live', home_score: 5 })).toBe('live')
  })

  it('passes through other statuses unchanged', () => {
    expect(displayStatus({ ...base, status: 'pending' })).toBe('pending')
    expect(displayStatus({ ...base, status: 'completed', home_score: 50, away_score: 30 })).toBe('completed')
    expect(displayStatus({ ...base, status: 'scheduled' })).toBe('scheduled')
  })
})
