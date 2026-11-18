window.__ModuleLoader__.load({
  id: 'dsh-global-search',
  factory(require) {
    const React = require('react')
    const h = React.createElement

    /** Locale namespace registered with the Client locale service. */
    const NS = 'globalSearch'
    /** Sidebar entry id; the same id keys the `main` panel. */
    const PANEL_ID = 'global-search'
    /** Host route mounted by `index.js`. */
    const ENDPOINT = 'dsh-global-search/search'
    /** Sessions requested per search. */
    const RESULT_LIMIT = 40
    /** Shortest trimmed query sent to the Host. */
    const MIN_QUERY = 2
    /** Debounce between a keystroke and the request. */
    const DEBOUNCE_MS = 260

    const DICT = {
      en: {
        'panel.label': 'Global search',
        'panel.title': 'Global session search',
        'panel.subtitle': 'Every workspace, every past session.',
        placeholder: 'Search all sessions\u2026',
        'hint.title': 'Find anything you discussed anywhere',
        'hint.body':
          'Type a word or phrase. Prompts, answers, and tool output from every workspace are searched.',
        'hint.short': 'Type at least two characters.',
        'hint.waiting': 'Results appear here as you type.',
        searching: 'Searching\u2026',
        'results.count': '{n} sessions',
        'results.hasMore': 'Showing the first {n} sessions. Narrow the search for more relevant hits.',
        'results.empty': 'No session matched \u201c{query}\u201d.',
        'results.failed': 'Search failed: {message}',
        'results.untitled': 'Untitled session',
        'results.noWorkspace': 'No workspace',
        'row.open': 'Open session',
        'kind.user': 'You',
        'kind.assistant': 'Assistant',
        'kind.tool': 'Tool output',
        'time.now': 'just now',
        'time.minutes': '{n} min ago',
        'time.hours': '{n} h ago',
        'time.days': '{n} d ago',
      },
      zh: {
        'panel.label': '\u5168\u5c40\u641c\u7d22',
        'panel.title': '\u5168\u5c40\u4f1a\u8bdd\u641c\u7d22',
        'panel.subtitle': '\u6240\u6709\u5de5\u4f5c\u533a\u3001\u6240\u6709\u5386\u53f2\u4f1a\u8bdd\u3002',
        placeholder: '\u641c\u7d22\u6240\u6709\u4f1a\u8bdd\u2026',
        'hint.title': '\u5728\u4efb\u4f55\u5730\u65b9\u627e\u56de\u4f60\u8bf4\u8fc7\u7684\u5185\u5bb9',
        'hint.body':
          '\u8f93\u5165\u8bcd\u6216\u77ed\u8bed\uff0c\u5c06\u641c\u7d22\u6bcf\u4e2a\u5de5\u4f5c\u533a\u7684\u63d0\u95ee\u3001\u56de\u7b54\u548c\u5de5\u5177\u8f93\u51fa\u3002',
        'hint.short': '\u81f3\u5c11\u8f93\u5165\u4e24\u4e2a\u5b57\u7b26\u3002',
        'hint.waiting': '\u7ed3\u679c\u4f1a\u5728\u8f93\u5165\u65f6\u51fa\u73b0\u3002',
        searching: '\u641c\u7d22\u4e2d\u2026',
        'results.count': '{n} \u4e2a\u4f1a\u8bdd',
        'results.hasMore':
          '\u4ec5\u663e\u793a\u524d {n} \u4e2a\u4f1a\u8bdd\uff0c\u7f29\u5c0f\u641c\u7d22\u8303\u56f4\u53ef\u5f97\u5230\u66f4\u76f8\u5173\u7684\u7ed3\u679c\u3002',
        'results.empty': '\u6ca1\u6709\u4f1a\u8bdd\u5339\u914d\u201c{query}\u201d\u3002',
        'results.failed': '\u641c\u7d22\u5931\u8d25\uff1a{message}',
        'results.untitled': '\u672a\u547d\u540d\u4f1a\u8bdd',
        'results.noWorkspace': '\u65e0\u5de5\u4f5c\u533a',
        'row.open': '\u6253\u5f00\u4f1a\u8bdd',
        'kind.user': '\u4f60',
        'kind.assistant': '\u52a9\u624b',
        'kind.tool': '\u5de5\u5177\u8f93\u51fa',
        'time.now': '\u521a\u521a',
        'time.minutes': '{n} \u5206\u949f\u524d',
        'time.hours': '{n} \u5c0f\u65f6\u524d',
        'time.days': '{n} \u5929\u524d',
      },
    }

    const CSS = `
.gs-panel{flex:1;min-height:0;display:flex;flex-direction:column;background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary)}
.gs-head{flex:none;padding:22px 28px 14px;border-bottom:1px solid var(--dsw-alias-border-l1)}
.gs-headInner{max-width:860px;margin:0 auto}
.gs-title{margin:0;font-size:19px;font-weight:600;line-height:1.3;letter-spacing:-0.01em}
.gs-subtitle{margin:4px 0 0;font-size:13px;color:var(--dsw-alias-label-secondary)}
.gs-field{position:relative;margin-top:14px}
.gs-input{box-sizing:border-box;width:100%;height:38px;padding:0 34px 0 12px;font:inherit;font-size:14px;
  color:var(--dsw-alias-label-primary);background:var(--dsw-alias-bg-layer-1);
  border:1px solid var(--dsw-alias-border-l2);border-radius:8px;outline:none}
.gs-input::placeholder{color:var(--dsw-alias-label-secondary)}
.gs-input:focus{border-color:var(--dsw-alias-brand-primary);box-shadow:0 0 0 1px var(--dsw-alias-brand-primary)}
.gs-glyph{position:absolute;right:10px;top:50%;transform:translateY(-50%);display:flex;
  color:var(--dsw-alias-label-secondary);pointer-events:none}
.gs-body{flex:1;min-height:0;overflow-y:auto;padding:6px 28px 28px}
.gs-bodyInner{max-width:860px;margin:0 auto}
.gs-status{display:flex;align-items:center;gap:9px;padding:12px 2px;font-size:12.5px;color:var(--dsw-alias-label-secondary)}
.gs-spinner{width:12px;height:12px;border-radius:50%;border:2px solid var(--dsw-alias-border-l2);
  border-top-color:var(--dsw-alias-brand-primary);animation:gs-spin .8s linear infinite}
@keyframes gs-spin{to{transform:rotate(360deg)}}
@media (prefers-reduced-motion:reduce){.gs-spinner{animation:none}}
.gs-note{margin:26px auto 0;max-width:520px;padding:22px;border:1px dashed var(--dsw-alias-border-l2);
  border-radius:10px;background:var(--dsw-alias-bg-layer-1);text-align:center}
.gs-noteTitle{margin:0 0 6px;font-size:14px;font-weight:600}
.gs-noteBody{margin:0;font-size:13px;line-height:1.55;color:var(--dsw-alias-label-secondary)}
.gs-error{margin:14px 0;padding:12px 14px;border-radius:8px;font-size:13px;line-height:1.5;
  color:var(--dsw-alias-state-error-primary);background:var(--dsw-alias-bg-layer-1);
  border:1px solid var(--dsw-alias-state-error-primary)}
.gs-list{display:flex;flex-direction:column;gap:2px;padding-top:8px}
.gs-row{display:flex;gap:14px;align-items:flex-start;width:100%;text-align:left;padding:11px 12px;
  border:1px solid transparent;border-radius:8px;background:transparent;cursor:pointer;font:inherit;
  color:inherit}
.gs-row:hover{background:var(--dsw-alias-interactive-bg-hover)}
.gs-row:focus-visible{outline:none;border-color:var(--dsw-alias-brand-primary);
  background:var(--dsw-alias-interactive-bg-active)}
.gs-rowMain{flex:1;min-width:0}
.gs-rowTitle{display:flex;align-items:center;gap:8px;min-width:0}
.gs-titleText{font-size:14px;font-weight:600;line-height:1.35;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.gs-kind{flex:none;font-size:11px;line-height:1;padding:3px 6px;border-radius:999px;
  color:var(--dsw-alias-label-secondary);border:1px solid var(--dsw-alias-border-l2)}
.gs-snippet{margin-top:3px;font-size:12.5px;line-height:1.5;color:var(--dsw-alias-label-secondary);
  display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;word-break:break-word}
.gs-snippet mark{color:inherit;background:var(--dsw-static-amber-100);border-radius:3px;padding:0 1px}
.gs-meta{flex:none;display:flex;flex-direction:column;align-items:flex-end;gap:3px;
  font-size:11.5px;color:var(--dsw-alias-label-secondary);max-width:190px}
.gs-workspace{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:190px}
.gs-foot{flex:none;padding:0 28px 10px;font-size:12px;color:var(--dsw-alias-label-secondary)}
.gs-footInner{max-width:860px;margin:0 auto;padding-top:8px;border-top:1px solid var(--dsw-alias-border-l1)}
`

    /**
     * Translate one key for the active locale, falling back to English.
     * @param locale - active locale id.
     * @param key - dictionary key.
     * @param params - `{name}` interpolation values.
     * @returns display text.
     */
    function translate(locale, key, params) {
      const language = String(locale).split(/[-_]/)[0]
      const table = DICT[language] ?? DICT.en
      let text = table[key] ?? DICT.en[key] ?? key
      if (params !== undefined) {
        for (const [name, value] of Object.entries(params)) {
          text = text.split(`{${name}}`).join(String(value))
        }
      }
      return text
    }

    /**
     * Folder name of a Host path, used when the workspace title is unknown.
     * @param path - absolute path in Host spelling.
     * @returns last path segment.
     */
    function folderName(path) {
      if (typeof path !== 'string') return ''
      const parts = path.split(/[\\/]+/).filter((part) => part !== '')
      return parts.length === 0 ? path : parts[parts.length - 1]
    }

    /**
     * Human coarse relative time, localized by key.
     * @param time - epoch milliseconds.
     * @param t - translator.
     * @returns label.
     */
    function relativeTime(time, t) {
      if (!Number.isFinite(time) || time <= 0) return ''
      const delta = Date.now() - time
      if (delta < 60_000) return t('time.now')
      if (delta < 3_600_000) return t('time.minutes', { n: Math.max(1, Math.round(delta / 60_000)) })
      if (delta < 86_400_000) return t('time.hours', { n: Math.max(1, Math.round(delta / 3_600_000)) })
      if (delta < 7 * 86_400_000) return t('time.days', { n: Math.max(1, Math.round(delta / 86_400_000)) })
      return new Date(time).toLocaleDateString()
    }

    /**
     * Split text around case-insensitive matches of the query.
     * @param text - snippet text.
     * @param query - literal query.
     * @returns React children.
     */
    function highlight(text, query) {
      const needle = query.toLowerCase()
      if (needle === '') return [text]
      const haystack = text.toLowerCase()
      const parts = []
      let from = 0
      let mark = 0
      for (;;) {
        const at = haystack.indexOf(needle, from)
        if (at < 0) break
        if (at > from) parts.push(text.slice(from, at))
        parts.push(h('mark', { key: `m${mark}` }, text.slice(at, at + needle.length)))
        mark += 1
        from = at + needle.length
      }
      if (parts.length === 0) return [text]
      if (from < text.length) parts.push(text.slice(from))
      return parts
    }

    /** Sidebar glyph: a magnifier over a list of session lines. */
    function SearchIcon(props) {
      const size = typeof props.size === 'number' ? props.size : 18
      const width = props.active === true ? 2 : 1.7
      return h(
        'svg',
        {
          width: size,
          height: size,
          viewBox: '0 0 24 24',
          fill: 'none',
          'aria-hidden': true,
          focusable: false,
          stroke: 'currentColor',
          strokeWidth: width,
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
        },
        h('path', { d: 'M4 5.5h10M4 10h8' }),
        h('circle', { cx: 15, cy: 15, r: 5 }),
        h('path', { d: 'M18.6 18.6L21.5 21.5' }),
      )
    }

    /** One result row. */
    function ResultRow(props) {
      const { item, title, query, t, open } = props
      const kind = item.kind === 'user/message'
        ? t('kind.user')
        : item.kind === 'assistant/message'
          ? t('kind.assistant')
          : t('kind.tool')
      const workspace = item.workspace ?? folderName(item.cwd) ?? ''
      return h(
        'button',
        {
          type: 'button',
          className: 'gs-row',
          title: t('row.open'),
          onClick: () => open(item.sessionId),
          'aria-label': `${title} \u2014 ${t('row.open')}`,
        },
        h(
          'span',
          { className: 'gs-rowMain' },
          h(
            'span',
            { className: 'gs-rowTitle' },
            h('span', { className: 'gs-titleText' }, title),
            h('span', { className: 'gs-kind' }, kind),
          ),
          h('span', { className: 'gs-snippet' }, highlight(item.snippet, query)),
        ),
        h(
          'span',
          { className: 'gs-meta' },
          workspace === '' ? null : h('span', { className: 'gs-workspace' }, workspace),
          h('span', null, relativeTime(item.time, t)),
        ),
      )
    }

    let requestSeq = 0

    /**
     * Fetch one search page; the Host answers JSON.
     * @param query - trimmed literal phrase.
     * @param signal - cancellation for a superseded search.
     * @returns response payload.
     */
    async function requestSearch(query, signal) {
      const url = new URL(ENDPOINT, document.baseURI)
      url.searchParams.set('q', query)
      url.searchParams.set('limit', String(RESULT_LIMIT))
      const response = await fetch(url, {
        signal,
        cache: 'no-store',
        headers: { accept: 'application/json' },
      })
      let body = null
      try {
        body = await response.json()
      } catch {
        body = null
      }
      if (!response.ok) {
        throw new Error(body !== null && typeof body.error === 'string' ? body.error : `HTTP ${response.status}`)
      }
      if (body === null || !Array.isArray(body.items)) throw new Error('malformed response')
      return body
    }

    /** Full-height panel: header, search field, result list. */
    function SearchPanel(props) {
      const t = props.t
      const open = props.open
      const subscribeLocale = props.subscribeLocale
      const [, bumpLocale] = React.useState(0)
      const [query, setQuery] = React.useState('')
      const [state, setState] = React.useState({
        status: 'idle',
        items: [],
        hasMore: false,
        error: '',
        tookMs: 0,
      })
      const inputRef = React.useRef(null)

      React.useEffect(() => {
        inputRef.current?.focus({ preventScroll: true })
      }, [])

      React.useEffect(() => subscribeLocale(() => bumpLocale((value) => value + 1)), [subscribeLocale])

      const useSessions = props.useSessions
      const summaries = typeof useSessions === 'function' ? useSessions((snapshot) => snapshot.byId) : undefined
      const trimmed = query.trim()

      React.useEffect(() => {
        const text = query.trim()
        if (text.length < MIN_QUERY) {
          setState({ status: 'idle', items: [], hasMore: false, error: '', tookMs: 0 })
          return
        }
        const controller = new AbortController()
        const seq = ++requestSeq
        setState((previous) => ({ ...previous, status: 'loading', error: '' }))
        const timer = setTimeout(() => {
          requestSearch(text, controller.signal)
            .then((payload) => {
              if (controller.signal.aborted || seq !== requestSeq) return
              setState({
                status: 'ready',
                items: payload.items,
                hasMore: payload.hasMore === true,
                error: '',
                tookMs: Number(payload.tookMs) || 0,
              })
            })
            .catch((error) => {
              if (controller.signal.aborted || seq !== requestSeq) return
              setState({
                status: 'error',
                items: [],
                hasMore: false,
                error: error instanceof Error ? error.message : String(error),
                tookMs: 0,
              })
            })
        }, DEBOUNCE_MS)
        return () => {
          clearTimeout(timer)
          controller.abort()
        }
      }, [query])

      const titleOf = (item) => {
        const summary = summaries?.[item.sessionId]
        const title = typeof summary?.title === 'string' ? summary.title.trim() : ''
        return title === '' ? t('results.untitled') : title
      }

      const body = []
      if (trimmed.length === 0) {
        body.push(
          h(
            'div',
            { className: 'gs-note', key: 'hint' },
            h('p', { className: 'gs-noteTitle' }, t('hint.title')),
            h('p', { className: 'gs-noteBody' }, t('hint.body')),
          ),
        )
      } else if (trimmed.length < MIN_QUERY) {
        body.push(h('div', { className: 'gs-status', key: 'short' }, t('hint.short')))
      } else if (state.status === 'error') {
        body.push(h('div', { className: 'gs-error', key: 'error' }, t('results.failed', { message: state.error })))
      } else if (state.items.length === 0 && state.status === 'loading') {
        body.push(
          h(
            'div',
            { className: 'gs-status', key: 'loading' },
            h('span', { className: 'gs-spinner', 'aria-hidden': true }),
            h('span', null, t('searching')),
          ),
        )
      } else if (state.items.length === 0) {
        body.push(h('div', { className: 'gs-note', key: 'empty' }, h('p', { className: 'gs-noteBody' }, t('results.empty', { query: trimmed }))))
      } else {
        body.push(
          h(
            'div',
            { className: 'gs-list', key: 'list', role: 'list' },
            state.items.map((item) =>
              h(ResultRow, {
                key: item.sessionId,
                item,
                title: titleOf(item),
                query: trimmed,
                t,
                open,
              }),
            ),
          ),
        )
        if (state.status === 'loading') {
          body.push(
            h(
              'div',
              { className: 'gs-status', key: 'refreshing' },
              h('span', { className: 'gs-spinner', 'aria-hidden': true }),
              h('span', null, t('searching')),
            ),
          )
        }
        if (state.hasMore) {
          body.push(
            h('div', { className: 'gs-status', key: 'more' }, t('results.hasMore', { n: state.items.length })),
          )
        }
      }

      return h(
        'div',
        { className: 'gs-panel' },
        h('style', null, CSS),
        h(
          'div',
          { className: 'gs-head' },
          h(
            'div',
            { className: 'gs-headInner' },
            h('h1', { className: 'gs-title' }, t('panel.title')),
            h('p', { className: 'gs-subtitle' }, t('panel.subtitle')),
            h(
              'div',
              { className: 'gs-field', role: 'search' },
              h('input', {
                ref: inputRef,
                className: 'gs-input',
                type: 'search',
                value: query,
                placeholder: t('placeholder'),
                'aria-label': t('placeholder'),
                spellCheck: false,
                autoComplete: 'off',
                onChange: (event) => setQuery(event.target.value),
                onKeyDown: (event) => {
                  if (event.key === 'Escape') {
                    setQuery('')
                  }
                },
              }),
              h(
                'span',
                { className: 'gs-glyph' },
                h(SearchIcon, { size: 16, active: false }),
              ),
            ),
          ),
        ),
        h('div', { className: 'gs-body' }, h('div', { className: 'gs-bodyInner' }, body)),
        state.status === 'ready' && state.items.length > 0
          ? h(
              'div',
              { className: 'gs-foot' },
              h(
                'div',
                { className: 'gs-footInner' },
                `${t('results.count', { n: state.items.length })}${state.tookMs > 0 ? ` \u00b7 ${state.tookMs} ms` : ''}`,
              ),
            )
          : null,
      )
    }

    /**
     * Client half: register the sidebar entry, the main panel, and the locale.
     * @param ctx - Client root context.
     */
    function apply(ctx) {
      const t = (key, params) => translate(ctx.locale.getSnapshot().active, key, params)
      const subscribeLocale = (listener) => ctx.locale.subscribe(listener)
      const open = (sessionId) => {
        const workspace = ctx.get('uiWorkspace')
        if (workspace === undefined || typeof workspace.openSession !== 'function') {
          console.warn('[dsh-global-search] uiWorkspace is unavailable; cannot open', sessionId)
          return
        }
        workspace.openSession(sessionId)
      }

      ctx.effect(() => ctx.locale.register(NS, DICT), 'dsh-global-search: dictionaries')

      ctx.slots.inject('sidebar.panellist', () =>
        ctx.slots.register(
          {
            name: 'sidebar.panellist',
            id: PANEL_ID,
            order: 20,
            label: () => t('panel.label'),
          },
          SearchIcon,
        ),
      )

      ctx.slots.inject('main', () =>
        ctx.slots.register(
          {
            name: 'main',
            key: PANEL_ID,
            inject: () => ({ t, open, subscribeLocale }),
          },
          SearchPanel,
        ),
      )
    }

    return { inject: ['slots', 'locale'], apply }
  },
})
