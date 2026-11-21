import { expect, mock, test } from 'claude-code/testing'

const PANE = {
  plugin: 'quick-mode',
  component: 'AbovePrompt',
  props: {
    hasSurvey: false,
    isCollapsed: false,
    isWorking: false,
    maxRows: 6,
    bodyColumns: 80,
    scroll: { offset: 0, bodyRows: 6 },
    view: {},
  },
} as const

// The engine's answers: `/model <id>` changes the model `session.model` reports.
type Body = Extract<Parameters<typeof test>[1], (...args: any) => any>
function engine(on: Parameters<Body>[1], refuse = false) {
  const runs: string[] = []
  let current = 'claude-haiku-5-5'
  on('session.start', (_, e) => ({ cwd: e.cwd }))
  on('session.model', () => ({ value: current }))
  on('command.register', () => ({ value: { command: 'quick-mode' } }))
  on('ui.log', () => ({ value: undefined }))
  on('ui.close', () => ({ value: undefined }))
  const store = new Map<string, unknown>()
  on('store.get', (_, e) => ({ value: store.get(e.key) }))
  on('store.set', (_, e) => {
    store.set(e.key, e.value)
    return { value: undefined }
  })
  on('command.run', (_, e) => {
    runs.push(`${e.command} ${e.args}`)
    if (refuse) throw new Error('refused')
    if (e.command === 'model') current = `claude-${e.args}-5-5`
    return { text: 'ok' }
  })
  return { runs, store, session: mock.session(on) }
}

// A command as the person submits it from the prompt box.
const typed = (command: string, args: string) => ({
  command,
  args,
  origin: { kind: 'composer' as const },
  presentation: { isFullscreen: false, columns: 80 },
})

test('a model button runs /model and is highlighted', async ($, on) => {
  const { runs } = engine(on)
  await $.session.start({ cwd: '/', surface: 'terminal', isInteractive: true })
  const ui = await $.ui.mount({ ...PANE, surface: 'terminal' })
  await ui.press({ key: 'claude-fable-5-2' })

  expect(runs).toEqual(['model fable'])
  expect((await ui.find({ key: 'claude-fable-5-2' }))?.props.variant).toBe('primary')
  await ui.unmount()
})

test('an effort button runs /effort and is highlighted', async ($, on) => {
  const { runs } = engine(on)
  await $.session.start({ cwd: '/', surface: 'terminal', isInteractive: true })
  const ui = await $.ui.mount({ ...PANE, surface: 'terminal' })
  await ui.press({ key: 'max' })

  expect(runs).toEqual(['effort max'])
  expect((await ui.find({ key: 'max' }))?.props.variant).toBe('primary')
  await ui.unmount()
})

test('a submitted /model moves the highlight', async ($, on) => {
  engine(on)
  await $.session.start({ cwd: '/', surface: 'terminal', isInteractive: true })
  const ui = await $.ui.mount({ ...PANE, surface: 'terminal' })
  await $.command.run(typed('model', 'claude-fable-5-2'))

  expect((await ui.find({ key: 'claude-fable-5-2' }))?.text).toBe('✓ 🧠🧠🧠🧠')
  expect((await ui.find({ key: 'claude-haiku-5-5' }))?.props.variant).toBeUndefined()
  await ui.unmount()
})

test('a submitted /effort moves the highlight', async ($, on) => {
  engine(on)
  await $.session.start({ cwd: '/', surface: 'terminal', isInteractive: true })
  const ui = await $.ui.mount({ ...PANE, surface: 'terminal' })
  await $.command.run(typed('effort', 'low'))
  expect((await ui.find({ key: 'low' }))?.props.variant).toBe('primary')
  await $.command.run(typed('effort', 'max'))

  expect((await ui.find({ key: 'max' }))?.text).toBe('✓ 🔥🔥🔥🔥🔥')
  expect((await ui.find({ key: 'low' }))?.props.variant).toBeUndefined()
  await ui.unmount()
})

test('/quick-mode off removes the row and survives a new session, on restores it', async ($, on) => {
  engine(on)
  await $.session.start({ cwd: '/', surface: 'terminal', isInteractive: true })
  const ui = await $.ui.mount({ ...PANE, surface: 'terminal' })
  await $.command.run(typed('quick-mode', 'off'))
  expect(await ui.find({ key: 'max' })).toBeUndefined()
  
  await $.session.start({ cwd: '/', surface: 'terminal', isInteractive: true })
  expect(await ui.find({ key: 'max' })).toBeUndefined()

  await $.command.run(typed('quick-mode', 'on'))
  expect(await ui.find({ key: 'max' })).toBeDefined()
  await ui.unmount()
})
