/**
 * Google Analytics 4 (gtag) 連携
 *
 * - `VITE_GA_MEASUREMENT_ID` が未設定の場合は全てサイレント no-op になります
 * - 初期化は `initAnalytics()` を 1 度だけ呼び出す（App 起動時）
 * - SPA のページビューは `trackPageView()` をルート変更で都度呼び出す
 * - 任意のカスタムイベントは `trackEvent(name, params)` で送信
 */

declare global {
  interface Window {
    dataLayer: unknown[]
    gtag: (...args: unknown[]) => void
  }
}

const MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID as string | undefined
export const isAnalyticsConfigured = Boolean(MEASUREMENT_ID)

let initialized = false

export function initAnalytics(): void {
  if (initialized || !MEASUREMENT_ID || typeof window === 'undefined') return
  initialized = true

  // gtag.js 読み込み
  const script = document.createElement('script')
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`
  document.head.appendChild(script)

  window.dataLayer = window.dataLayer || []
  window.gtag = function gtag(...args: unknown[]) {
    window.dataLayer.push(args)
  }
  window.gtag('js', new Date())
  // HashRouter なので自動 page_view は無効化し、手動送信に統一
  window.gtag('config', MEASUREMENT_ID, {
    send_page_view: false,
    anonymize_ip: true,
  })
}

export function trackPageView(path: string, title?: string): void {
  if (!MEASUREMENT_ID || typeof window === 'undefined' || !window.gtag) return
  window.gtag('event', 'page_view', {
    page_path: path,
    page_title: title ?? document.title,
    page_location: window.location.href,
  })
}

export function trackEvent(
  name: string,
  params?: Record<string, unknown>
): void {
  if (!MEASUREMENT_ID || typeof window === 'undefined' || !window.gtag) return
  window.gtag('event', name, params ?? {})
}

/** 操作画面・表示画面での主要操作を計測する型付きヘルパー */
export const track = {
  signIn: () => trackEvent('sign_in', { method: 'google' }),
  signOut: () => trackEvent('sign_out'),
  eventSave: (template?: string) =>
    trackEvent('event_save', { template: template ?? 'unknown' }),
  publishToggle: (published: boolean) =>
    trackEvent('publish_toggle', { published }),
  programAdd: (mode: 'single' | 'csv', count: number) =>
    trackEvent('program_add', { mode, count }),
  programAdvance: (direction: 'next' | 'prev') =>
    trackEvent('program_advance', { direction }),
  programJump: () => trackEvent('program_jump'),
  programDelete: () => trackEvent('program_delete'),
  templateChange: (template: string) =>
    trackEvent('template_change', { template }),
  viewSettingChange: (key: string, value: boolean) =>
    trackEvent('view_setting_change', { key, value }),
  displayView: (template: string) =>
    trackEvent('display_view', { template }),
  shareLinkCopy: () => trackEvent('share_link_copy'),
}
