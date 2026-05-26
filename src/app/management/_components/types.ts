export interface Organization { id: string; name: string; short_name: string }
export interface Squad { id: string; org_id: string; name: string; age_group: string }
export interface DbPlayer {
  id: string
  squad_id: string | null
  org_id: string | null
  number: string
  name: string
  birthday: string | null
}
export interface Cup { id: string; name: string; region: string; type: string; is_active: boolean }
export interface Season {
  id: string
  cup_id: string
  name: string
  year: number | null
  is_homepage: boolean
}
export interface SquadPlayerLink { squad_id: string; player_id: string; jersey_number: string }
export interface SeasonSquadLink { season_id: string; squad_id: string }
export interface SeasonRosterEntry {
  season_id: string
  squad_id: string
  player_id: string
  jersey_number: string
}
export interface GameRecord {
  id: string
  home_squad_id: string
  away_squad_id: string
  home_squad_name: string
  away_squad_name: string
  home_score: number
  away_score: number
  game_date: string
  game_time: string | null
  location: string
  status: string
  season_id: string | null
}

export interface ManagementData {
  orgs: Organization[]
  squads: Squad[]
  players: DbPlayer[]
  cups: Cup[]
  seasons: Season[]
  squadPlayerLinks: SquadPlayerLink[]
  seasonSquadLinks: SeasonSquadLink[]
  seasonRosters: SeasonRosterEntry[]
  games: GameRecord[]
}

export const INPUT_CLASS = 'bg-bn-snow border border-bn-border rounded-[8px] px-4 py-2.5 text-bn-ink text-sm placeholder:text-bn-slate focus:outline-none focus:border-bn-ink transition-colors'
