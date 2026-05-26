// Game status helpers.
// The DB stores status as one of: pending / scheduled / live / completed.
// "live" alone is not enough to confidently show a LIVE indicator — a game flagged live
// without any scoring activity is misleading. These helpers gate UI on actual activity.

interface GameStatusInput {
  readonly status: string
  readonly home_score: number
  readonly away_score: number
}

export function isActuallyLive(g: GameStatusInput): boolean {
  return g.status === 'live' && (g.home_score > 0 || g.away_score > 0)
}

// Returns the status the UI should reflect: demotes "live without activity" to "pending"
// so badges, counts, and filters all agree.
export function displayStatus(g: GameStatusInput): string {
  if (g.status === 'live' && g.home_score === 0 && g.away_score === 0) return 'pending'
  return g.status
}
