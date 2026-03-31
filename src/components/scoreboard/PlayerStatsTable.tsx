'use client'

import {
  Player,
  totalRebounds,
  fgPercent,
  threePercent,
  ftPercent,
  formatPlayingTime,
} from '@/lib/scoreboard-types'

interface PlayerStatsTableProps {
  players: readonly Player[]
  onCourtIds: readonly string[]
  teamName: string
  isHome: boolean
  selectedPlayerId: string | null
  substitutingPlayerId: string | null
  onSelectPlayer: (playerId: string) => void
}

function sumStats(players: readonly Player[]) {
  return players.reduce(
    (acc, p) => ({
      points: acc.points + p.stats.points,
      fgMade: acc.fgMade + p.stats.fgMade,
      fgAttempted: acc.fgAttempted + p.stats.fgAttempted,
      threeMade: acc.threeMade + p.stats.threeMade,
      threeAttempted: acc.threeAttempted + p.stats.threeAttempted,
      ftMade: acc.ftMade + p.stats.ftMade,
      ftAttempted: acc.ftAttempted + p.stats.ftAttempted,
      offRebounds: acc.offRebounds + p.stats.offRebounds,
      defRebounds: acc.defRebounds + p.stats.defRebounds,
      assists: acc.assists + p.stats.assists,
      steals: acc.steals + p.stats.steals,
      blocks: acc.blocks + p.stats.blocks,
      turnovers: acc.turnovers + p.stats.turnovers,
      fouls: acc.fouls + p.stats.fouls,
    }),
    {
      points: 0, fgMade: 0, fgAttempted: 0, threeMade: 0, threeAttempted: 0,
      ftMade: 0, ftAttempted: 0, offRebounds: 0, defRebounds: 0,
      assists: 0, steals: 0, blocks: 0, turnovers: 0, fouls: 0,
    }
  )
}

function PlayerRow({
  player,
  isSelected,
  isSubTarget,
  isOnCourt,
  onSelect,
}: {
  player: Player
  isSelected: boolean
  isSubTarget: boolean
  isOnCourt: boolean
  onSelect: () => void
}) {
  const hasFoulTrouble = player.stats.fouls >= 4
  const pm = player.stats.plusMinus

  let rowClass = 'border-b border-white/[0.04] cursor-pointer transition-all duration-150 '
  if (isSubTarget) {
    rowClass += 'bg-cyan-500/15 text-white ring-1 ring-inset ring-cyan-400/30'
  } else if (isSelected) {
    rowClass += 'bg-gold/15 text-white'
  } else if (isOnCourt) {
    rowClass += 'text-white/80 hover:bg-white/[0.04]'
  } else {
    rowClass += 'text-white/30 hover:bg-white/[0.03] hover:text-white/50'
  }

  return (
    <tr onClick={onSelect} className={rowClass}>
      <td className="py-2.5 px-3 font-mono font-black text-xs sticky left-0 bg-inherit z-10">
        {player.number}
      </td>
      <td className="py-2.5 px-3 font-semibold sticky left-10 bg-inherit z-10 whitespace-nowrap text-xs">
        {player.name}
      </td>
      <td className="py-2.5 px-3 text-center tabular-nums text-white/30 text-[11px]">
        {formatPlayingTime(player.stats.playingSeconds)}
      </td>
      <td className="py-2.5 px-3 text-center font-black text-gold tabular-nums">
        {player.stats.points}
      </td>
      <td className="py-2.5 px-3 text-center tabular-nums whitespace-nowrap text-[11px]">
        {player.stats.fgMade}/{player.stats.fgAttempted}
        <span className="text-white/20 ml-1">{fgPercent(player.stats)}</span>
      </td>
      <td className="py-2.5 px-3 text-center tabular-nums whitespace-nowrap text-[11px]">
        {player.stats.threeMade}/{player.stats.threeAttempted}
        <span className="text-white/20 ml-1">{threePercent(player.stats)}</span>
      </td>
      <td className="py-2.5 px-3 text-center tabular-nums whitespace-nowrap text-[11px]">
        {player.stats.ftMade}/{player.stats.ftAttempted}
        <span className="text-white/20 ml-1">{ftPercent(player.stats)}</span>
      </td>
      <td className="py-2.5 px-3 text-center tabular-nums">{totalRebounds(player.stats)}</td>
      <td className="py-2.5 px-3 text-center tabular-nums">{player.stats.assists}</td>
      <td className="py-2.5 px-3 text-center tabular-nums">{player.stats.steals}</td>
      <td className="py-2.5 px-3 text-center tabular-nums">{player.stats.blocks}</td>
      <td className="py-2.5 px-3 text-center tabular-nums">{player.stats.turnovers}</td>
      <td className={`py-2.5 px-3 text-center tabular-nums font-bold ${hasFoulTrouble ? 'text-red-400' : ''}`}>
        {player.stats.fouls}
      </td>
      <td className={`py-2.5 px-3 text-center tabular-nums font-bold text-xs ${pm > 0 ? 'text-emerald-400' : pm < 0 ? 'text-red-400' : 'text-white/15'}`}>
        {pm > 0 ? `+${pm}` : pm}
      </td>
    </tr>
  )
}

export function PlayerStatsTable({
  players,
  onCourtIds,
  teamName,
  isHome,
  selectedPlayerId,
  substitutingPlayerId,
  onSelectPlayer,
}: PlayerStatsTableProps) {
  const onCourt = players.filter((p) => onCourtIds.includes(p.id))
  const bench = players.filter((p) => !onCourtIds.includes(p.id))
  const teamTotals = sumStats(players)

  const thClass = 'py-2 px-3 font-semibold text-[10px] tracking-wider uppercase'

  return (
    <div className="rounded-2xl bg-gradient-to-b from-[#0d2847] to-navy-light border border-white/[0.08] shadow-[0_4px_24px_rgba(0,0,0,0.3)] overflow-hidden">
      {/* Header */}
      <div className={`px-5 py-3 flex items-center justify-between ${isHome ? 'bg-gold/[0.06]' : 'bg-white/[0.02]'}`}>
        <div className="flex items-center gap-2.5">
          <div className={`w-1 h-5 rounded-full ${isHome ? 'bg-gold' : 'bg-white/20'}`} />
          <h3 className={`font-bold text-sm tracking-wide ${isHome ? 'text-gold' : 'text-white/90'}`}>
            {teamName || (isHome ? '主隊' : '客隊')}
          </h3>
        </div>
        {substitutingPlayerId && (
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-medium animate-pulse">
            <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            點選板凳球員完成換人
          </div>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-white/25 border-b border-white/[0.06]">
              <th className={`${thClass} text-left sticky left-0 bg-[#0d2847] z-10`}>#</th>
              <th className={`${thClass} text-left sticky left-10 bg-[#0d2847] z-10`}>球員</th>
              <th className={`${thClass} text-white/20`}>MIN</th>
              <th className={`${thClass} text-gold/60`}>PTS</th>
              <th className={thClass}>2PT</th>
              <th className={thClass}>3PT</th>
              <th className={thClass}>FT</th>
              <th className={thClass}>REB</th>
              <th className={thClass}>AST</th>
              <th className={thClass}>STL</th>
              <th className={thClass}>BLK</th>
              <th className={thClass}>TO</th>
              <th className={thClass}>PF</th>
              <th className={thClass}>+/-</th>
            </tr>
          </thead>
          <tbody>
            {/* On Court */}
            <tr className="bg-emerald-500/[0.06]">
              <td colSpan={14} className="py-1 px-3">
                <div className="flex items-center gap-1.5">
                  <div className="w-1 h-1 rounded-full bg-emerald-400" />
                  <span className="text-emerald-400/60 text-[10px] font-semibold tracking-widest uppercase">
                    On Court ({onCourt.length})
                  </span>
                </div>
              </td>
            </tr>
            {onCourt.map((player) => (
              <PlayerRow
                key={player.id}
                player={player}
                isSelected={player.id === selectedPlayerId}
                isSubTarget={player.id === substitutingPlayerId}
                isOnCourt={true}
                onSelect={() => onSelectPlayer(player.id)}
              />
            ))}
            {/* Bench */}
            {bench.length > 0 && (
              <>
                <tr className="bg-white/[0.02]">
                  <td colSpan={14} className="py-1 px-3">
                    <div className="flex items-center gap-1.5">
                      <div className="w-1 h-1 rounded-full bg-white/20" />
                      <span className="text-white/20 text-[10px] font-semibold tracking-widest uppercase">
                        Bench ({bench.length})
                      </span>
                      {substitutingPlayerId && (
                        <span className="text-cyan-400/60 text-[10px] ml-1">- tap to sub in</span>
                      )}
                    </div>
                  </td>
                </tr>
                {bench.map((player) => (
                  <PlayerRow
                    key={player.id}
                    player={player}
                    isSelected={player.id === selectedPlayerId}
                    isSubTarget={false}
                    isOnCourt={false}
                    onSelect={() => onSelectPlayer(player.id)}
                  />
                ))}
              </>
            )}
          </tbody>
          <tfoot>
            <tr className="text-white/80 font-bold border-t border-white/[0.08] bg-white/[0.03]">
              <td className="py-2.5 px-3 sticky left-0 bg-inherit z-10 text-[10px] tracking-widest uppercase text-white/30" colSpan={3}>
                Total
              </td>
              <td className="py-2.5 px-3 text-center text-gold tabular-nums">{teamTotals.points}</td>
              <td className="py-2.5 px-3 text-center tabular-nums text-[11px]">
                {teamTotals.fgMade}/{teamTotals.fgAttempted}
              </td>
              <td className="py-2.5 px-3 text-center tabular-nums text-[11px]">
                {teamTotals.threeMade}/{teamTotals.threeAttempted}
              </td>
              <td className="py-2.5 px-3 text-center tabular-nums text-[11px]">
                {teamTotals.ftMade}/{teamTotals.ftAttempted}
              </td>
              <td className="py-2.5 px-3 text-center tabular-nums">
                {teamTotals.offRebounds + teamTotals.defRebounds}
              </td>
              <td className="py-2.5 px-3 text-center tabular-nums">{teamTotals.assists}</td>
              <td className="py-2.5 px-3 text-center tabular-nums">{teamTotals.steals}</td>
              <td className="py-2.5 px-3 text-center tabular-nums">{teamTotals.blocks}</td>
              <td className="py-2.5 px-3 text-center tabular-nums">{teamTotals.turnovers}</td>
              <td className="py-2.5 px-3 text-center tabular-nums">{teamTotals.fouls}</td>
              <td className="py-2.5 px-3"></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}
