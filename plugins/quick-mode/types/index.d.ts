export type Live = { effort: string | null }

declare module 'claude-code' {
  interface PluginState {
    'quick-mode': {
      live: Shaped<Live>
      hidden: boolean
      disabled: boolean
    }
  }
}
