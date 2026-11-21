import { atom, read, update } from 'claude-code'
import type { EngineInterface, ModelEffort, Register } from 'claude-code'


const MODELS = [
  { id: 'claude-haiku-5-5', family: 'haiku', label: 'Haiku 5.5', icon: '🧠' },
  { id: 'claude-sonnet-5-5', family: 'sonnet', label: 'Sonnet 5.5', icon: '🧠🧠' },
  { id: 'claude-opus-5-5', family: 'opus', label: 'Opus 5.5', icon: '🧠🧠🧠' },
  { id: 'claude-fable-5-2', family: 'fable', label: 'Fable 5.2', icon: '🧠🧠🧠🧠' },
]
const EFFORTS: { level: ModelEffort; icon: string }[] = [
  { level: 'low', icon: '🔥' },
  { level: 'medium', icon: '🔥🔥' },
  { level: 'high', icon: '🔥🔥🔥' },
  { level: 'xhigh', icon: '🔥🔥🔥🔥' },
  { level: 'max', icon: '🔥🔥🔥🔥🔥' },
]
const CHECK = '✓'

const hidden = atom({ plugin: 'quick-mode', key: 'hidden' } as const, false)
const disabled = atom({ plugin: 'quick-mode', key: 'disabled' } as const, false)
const DISABLED_KEY = 'disabled'
const live = atom({ plugin: 'quick-mode', key: 'live' } as const, { effort: null }, { shape: 'live-2' })

async function run($: EngineInterface, command: string, args: string) {
  try {
    await $.command.run({ command, args })
    // A plugin's own $.command.run does not pass through its own command.run hooks.
    if (command === 'effort') await update($, live, () => ({ effort: args }))
  } catch (err) {
    void $.ui.log(`quick-mode: /${command} ${args} failed: ${String(err)}`, { to: 'debug' })
  }
  void $.ui.invalidate('ui.render')
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'quick-mode',
      description: '모델·Effort 전환 줄 숨기기/보이기 (on|off: 플러그인 켜기/끄기)',
    })
    const stored = (await $.store.get(DISABLED_KEY)) === true
    await update($, disabled, () => stored)
    // An earlier version showed this as a pane; a pane outlives a reload.
    void $.ui.close({ id: 'quick-mode' }).catch(() => {})
    return next(e)
  })

  on('turn.step', async function* ($, e, next) {
    if (e.agentId === undefined && !(await read($, disabled))) {
      await update($, live, () => ({ effort: e.effort === undefined ? null : String(e.effort) }))
      void $.ui.invalidate('ui.render')
    }
    return yield* next(e)
  })

  on('command.run', { command: 'effort' }, async ($, e, next) => {
    const ran = await next(e)
    if (await read($, disabled)) return ran
    const level = e.args.trim()
    if (EFFORTS.some(effort => effort.level === level)) await update($, live, () => ({ effort: level }))
    void $.ui.invalidate('ui.render')
    return ran
  })

  on('command.run', { command: 'model' }, async ($, e, next) => {
    const ran = await next(e)
    void $.ui.invalidate('ui.render')
    return ran
  })

  on('command.run', { command: 'quick-mode' }, async ($, e) => {
    const arg = e.args.trim()
    if (arg === 'on' || arg === 'off') {
      const isOff = arg === 'off'
      await $.store.set(DISABLED_KEY, isOff)
      await update($, disabled, () => isOff)
      void $.ui.invalidate('ui.render')
      return { text: isOff ? 'Quick Mode를 껐습니다. /quick-mode on 으로 다시 켭니다.' : 'Quick Mode를 켰습니다.' }
    }
    if (await read($, disabled)) return { text: 'Quick Mode가 꺼져 있습니다. /quick-mode on 으로 켭니다.' }
    const isHidden = await update($, hidden, h => !h)
    return { text: isHidden ? 'Quick Mode를 숨겼습니다.' : 'Quick Mode를 표시합니다.' }
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    if (e.props.hasSurvey || (await read($, hidden)) || (await read($, disabled))) return next(e)
    const { Box, Button } = $.ui.resolve(e)
    const session = await $.session.model()
    const curModel = MODELS.find(m => session.includes(m.family))?.id ?? null
    const curEffort = (await read($, live)).effort
    const group = (items: { key: string; icon: string; on: boolean; press: () => void }[]) => (
      <Box flexDirection="row" alignItems="center" gap={0.25}>
        {items.map(item => (
          <Button key={item.key} variant={item.on ? 'primary' : undefined} onPress={item.press}>
            {item.on ? `${CHECK} ` : ''}
            {item.icon}
          </Button>
        ))}
      </Box>
    )
    return (
      <Box flexDirection="row" alignItems="center" width="100%" justifyContent="space-between" paddingY={0.2}>
        {group(MODELS.map(m => ({ key: m.id, icon: m.icon, on: curModel === m.id, press: () => run($, 'model', m.family) })))}
        {group(EFFORTS.map(({ level, icon }) => ({ key: level, icon, on: curEffort === level, press: () => run($, 'effort', level) })))}
      </Box>
    )
  })
}
