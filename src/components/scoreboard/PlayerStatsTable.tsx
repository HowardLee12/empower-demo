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

  let rowClass = 'border-b border-white/5 cursor-pointer transition-colors '
  if (isSubTarget) {
    rowClass += 'bg-cyan-500/20 text-white ring-1 ring-cyan-400/40'
  } else if (isSelected) {
    rowClass += 'bg-gold/20 text-white'
  } else if (!isOnCourt) {
    rowClass += 'text-white/40 hover:bg-white/5'
  } else {
    rowClass += 'text-white/80 hover:bg-white/5'
  }

  return (
    <tr onClick={onSelect} className={rowClass}>
      <td className="py-2 px-2 font-mono font-bold sticky left-0 bg-inherit z-10">
        {player.number}
      </td>
      <td className="py-2 px-2 font-medium sticky left-8 bg-inherit z-10 whitespace-nowrap">
        {player.name}
      </td>
      <td className="py-2 px-2 text-center tabular-nums text-white/50 text-xs">
        {formatPlayingTime(player.stats.playingSeconds)}
      </td>
      <td className="py-2 px-2 text-center font-bold text-gold tabular-nums">
        {player.stats.points}
      </td>
      <td className="py-2 px-2 text-center tabular-nums whitespace-nowrap">
        {player.stats.fgMade}/{player.stats.fgAttempted}
        <span className="text-white/30 ml-1">{fgPercent(player.stats)}</span>
      </td>
      <td className="py-2 px-2 text-center tabular-nums whitespace-nowrap">
        {player.stats.threeMade}/{player.stats.threeAttempted}
        <span className="text-white/30 ml-1">{threePercent(player.stats)}</span>
      </td>
      <td className="py-2 px-2 text-center tabular-nums whitespace-nowrap">
        {player.stats.ftMade}/{player.stats.ftAttempted}
        <span className="text-white/30 ml-1">{ftPercent(player.stats)}</span>
      </td>
      <td className="py-2 px-2 text-center tabular-nums">
        {totalRebounds(player.stats)}
      </td>
      <td className="py-2 px-2 text-center tabular-nums">{player.stats.assists}</td>
      <td className="py-2 px-2 text-center tabular-nums">{player.stats.steals}</td>
      <td className="py-2 px-2 text-center tabular-nums">{player.stats.blocks}</td>
      <td className="py-2 px-2 text-center tabular-nums">{player.stats.turnovers}</td>
      <td className={`py-2 px-2 text-center tabular-nums font-bold ${hasFoulTrouble ? 'text-red-400' : ''}`}>
        {player.stats.fouls}
      </td>
      <td className={`py-2 px-2 text-center tabular-nums font-bold ${pm > 0 ? 'text-green-400' : pm < 0 ? 'text-red-400' : 'text-white/30'}`}>
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

  const headerCells = (
    <tr className="text-white/40 border-b border-white/5">
      <th className="py-2 px-2 text-left font-medium sticky left-0 bg-navy-light z-10">#</th>
      <th className="py-2 px-2 text-left font-medium sticky left-8 bg-navy-light z-10">球員</th>
      <th className="py-2 px-2 font-medium text-white/30">時間</th>
      <th className="py-2 px-2 font-medium text-gold">得分</th>
      <th className="py-2 px-2 font-medium">二分</th>
      <th className="py-2 px-2 font-medium">三分</th>
      <th className="py-2 px-2 font-medium">罰球</th>
      <th className="py-2 px-2 font-medium">籃板</th>
      <th className="py-2 px-2 font-medium">助攻</th>
      <th className="py-2 px-2 font-medium">抄截</th>
      <th className="py-2 px-2 font-medium">阻攻</th>
      <th className="py-2 px-2 font-medium">失誤</th>
      <th className="py-2 px-2 font-medium">犯規</th>
      <th className="py-2 px-2 font-medium">+/-</th>
    </tr>
  )

  return (
    <div className="bg-navy-light border border-white/10 rounded-xl overflow-hidden">
      <div className={`px-4 py-3 border-b border-white/10 flex items-center justify-between ${isHome ? 'bg-gold/10' : 'bg-white/5'}`}>
        <h3 className={`font-bold text-sm ${isHome ? 'text-gold' : 'text-white'}`}>
          {teamName || (isHome ? '主隊' : '客隊')}
        </h3>
        {substitutingPlayerId && (
          <span className="text-cyan-400 text-xs font-medium animate-pulse">
            請點選板凳球員完成換人
          </span>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs sm:text-sm">
          <thead>{headerCells}</thead>
          <tbody>
            {/* On Court section label */}
            <tr className="bg-green-900/20">
              <td colSpan={14} className="py-1 px-2 text-green-400/70 text-xs font-medium">
                場上 ({onCourt.length})
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
            {/* Bench section label */}
            {bench.length > 0 && (
              <>
                <tr className="bg-white/5">
                  <td colSpan={14} className="py-1 px-2 text-white/30 text-xs font-medium">
                    板凳 ({bench.length})
                    {substitutingPlayerId && (
                      <span className="text-cyan-400 ml-2">← 點選替補上場</span>
                    )}
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
            <tr className="text-white font-bold border-t border-white/20 bg-white/5">
              <td className="py-2 px-2 sticky left-0 bg-inherit z-10" colSpan={3}>合計</td>
              <td className="py-2 px-2 text-center text-gold tabular-nums">{teamTotals.points}</td>
              <td className="py-2 px-2 text-center tabular-nums">
                {teamTotals.fgMade}/{teamTotals.fgAttempted}
              </td>
              <td className="py-2 px-2 text-center tabular-nums">
                {teamTotals.threeMade}/{teamTotals.threeAttempted}
              </td>
              <td className="py-2 px-2 text-center tabular-nums">
                {teamTotals.ftMade}/{teamTotals.ftAttempted}
              </td>
              <td className="py-2 px-2 text-center tabular-nums">
                {teamTotals.offRebounds + teamTotals.defRebounds}
              </td>
              <td className="py-2 px-2 text-center tabular-nums">{teamTotals.assists}</td>
              <td className="py-2 px-2 text-center tabular-nums">{teamTotals.steals}</td>
              <td className="py-2 px-2 text-center tabular-nums">{teamTotals.blocks}</td>
              <td className="py-2 px-2 text-center tabular-nums">{teamTotals.turnovers}</td>
              <td className="py-2 px-2 text-center tabular-nums">{teamTotals.fouls}</td>
              <td className="py-2 px-2"></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}
