/**
 * Host half of the global session search panel.
 *
 * The panel asks one read-only HTTP route; the route runs the actual full-text
 * query through the group-local `sessionQuery` provider mounted beside this row
 * in `cordis.patch.yml`. That provider owns a private index, so full-text search
 * becomes available to this feature without changing the deployment-wide
 * `session-query-sqlite` row (whose shipped `openAt: never` setting keeps the
 * built-in sidebar search on titles only).
 */

export const name = 'dsh-global-search'

/** Route the browser panel calls. */
const ROUTE = '/dsh-global-search/search'
/** Longest accepted literal query, in UTF-16 code units. */
const MAX_QUERY_CHARS = 200
/** Most sessions one answer may carry. */
const MAX_RESULTS = 60
/** Sessions requested per provider page. */
const PAGE_SIZE = 20
/** Provider page calls one search may spend. */
const PAGE_CALL_LIMIT = 8
/** Wall-clock budget for one search, including a cold index build. */
const SEARCH_BUDGET_MS = 30000
/** Event kinds searched: prompts, answers, and tool output. */
const EVENT_TYPES = ['user/message', 'assistant/message', 'tool/result']

/**
 * Register the route; both services are required for the panel to be reachable.
 * @param ctx - owning Cordis context.
 */
export function apply(ctx) {
  ctx.inject(['sessionQuery', 'webServer'], (scope) => {
    const provider = scope.sessionQuery
    scope.effect(
      () =>
        scope.webServer.register({
          kind: 'exact',
          path: ROUTE,
          resource: (request) => handleSearch(scope, provider, request),
        }),
      'dsh-global-search: search route',
    )
  })
}

/**
 * Answer one panel search.
 * @param scope - injected context holding optional collaborators.
 * @param provider - the group-local session query service.
 * @param request - Fetch request the server built for the route.
 * @returns a JSON response.
 */
async function handleSearch(scope, provider, request) {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return sendJson({ error: 'method not allowed' }, 405)
  }
  if (!isSameOrigin(request)) {
    return sendJson({ error: 'cross-origin request refused' }, 403)
  }

  const url = new URL(request.url)
  const query = (url.searchParams.get('q') ?? '').trim()
  if (query === '') return sendJson({ error: 'query is required' }, 400)
  if (query.length > MAX_QUERY_CHARS) {
    return sendJson({ error: `query must be at most ${MAX_QUERY_CHARS} characters` }, 400)
  }
  if (query.includes('\u0000')) return sendJson({ error: 'query must not contain NUL' }, 400)

  const requestedLimit = Number(url.searchParams.get('limit'))
  const limit = Number.isFinite(requestedLimit) && requestedLimit >= 1
    ? Math.min(Math.floor(requestedLimit), MAX_RESULTS)
    : 30

  const started = Date.now()
  const budget = AbortSignal.timeout(SEARCH_BUDGET_MS)
  const signal = request.signal === undefined ? budget : AbortSignal.any([request.signal, budget])

  try {
    const page = await collectSessions(provider, query, limit, signal)
    const items = withWorkspaceNames(scope, page.items)
    return sendJson({
      query,
      items,
      hasMore: page.hasMore,
      tookMs: Date.now() - started,
    })
  } catch (error) {
    if (signal.aborted) return sendJson({ error: 'search timed out' }, 504)
    const message = error instanceof Error ? error.message : String(error)
    scope.logger?.warn?.(`[dsh-global-search] search failed: ${message}`)
    return sendJson({ error: `search failed: ${message}` }, 500)
  }
}

/**
 * Page through the corpus until the session budget is spent.
 * @param provider - session query service.
 * @param query - literal phrase.
 * @param limit - maximum sessions to return.
 * @param signal - cancellation and deadline.
 * @returns collected session hits and whether more sessions exist.
 */
async function collectSessions(provider, query, limit, signal) {
  const eventFilters = [
    { kind: 'type', values: EVENT_TYPES },
    { kind: 'surface', values: ['current'] },
  ]
  const sessions = new Map()
  let cursor
  let calls = 0
  let restarted = false
  // A provider cursor is bound to the exact request that produced it, page size
  // included, so every page of one search keeps the same limit.
  let pageLimit = Math.max(1, Math.min(PAGE_SIZE, limit))
  let hasMore = false

  while (sessions.size < limit && calls < PAGE_CALL_LIMIT) {
    if (signal.aborted) throw signal.reason ?? new Error('search aborted')
    calls += 1

    let page
    try {
      page = await provider.searchSessions({
        query,
        eventFilters,
        limit: pageLimit,
        ...(cursor === undefined ? {} : { cursor }),
      }, { signal })
    } catch (error) {
      if (cursor === undefined && pageLimit > 1 && error?.code === 'SESSION_QUERY_INVALID_LIMIT') {
        pageLimit = Math.max(1, Math.floor(pageLimit / 2))
        calls -= 1
        continue
      }
      if (cursor !== undefined && error?.code === 'SESSION_QUERY_STALE_CURSOR' && !restarted) {
        restarted = true
        sessions.clear()
        cursor = undefined
        calls = 0
        continue
      }
      throw error
    }

    for (const hit of page.items) {
      if (sessions.size >= limit) break
      const sessionId = String(hit.header.id)
      if (sessions.has(sessionId)) continue
      sessions.set(sessionId, projectHit(hit))
    }

    cursor = page.nextCursor
    if (cursor === undefined || page.items.length === 0) {
      hasMore = false
      break
    }
    hasMore = true
  }

  return { items: [...sessions.values()], hasMore }
}

/**
 * Project one provider hit into the panel's row shape.
 * @param hit - session search hit.
 * @returns row payload.
 */
function projectHit(hit) {
  const match = hit.bestMatch
  return {
    sessionId: String(hit.header.id),
    cwd: typeof hit.header.cwd === 'string' ? hit.header.cwd : null,
    snippet: normalizeSnippet(match.snippet),
    kind: match.type,
    seq: Number(match.seq),
    time: Number(match.time),
  }
}

/**
 * Collapse whitespace so a snippet renders on one line.
 * @param value - provider snippet.
 * @returns normalized text.
 */
function normalizeSnippet(value) {
  if (typeof value !== 'string') return ''
  return value.replace(/\s+/g, ' ').trim()
}

/**
 * Attach the owning Workspace title when the registry knows the path.
 * @param scope - injected context.
 * @param items - projected rows.
 * @returns rows with an optional `workspace` label.
 */
function withWorkspaceNames(scope, items) {
  let workspaces = []
  try {
    workspaces = scope.get('workspaceRegistry')?.list?.() ?? []
  } catch {
    workspaces = []
  }
  if (!Array.isArray(workspaces) || workspaces.length === 0) return items
  const byPath = new Map()
  for (const workspace of workspaces) {
    if (typeof workspace?.path === 'string') byPath.set(workspace.path, workspace.title ?? workspace.path)
  }
  return items.map((item) => {
    if (item.cwd === null) return item
    const exact = byPath.get(item.cwd)
    if (exact !== undefined) return { ...item, workspace: exact }
    const lower = item.cwd.toLowerCase()
    for (const [path, title] of byPath) {
      if (path.toLowerCase() === lower) return { ...item, workspace: title }
    }
    return item
  })
}

/**
 * Refuse a request a browser page on another origin initiated.
 * @param request - incoming request.
 * @returns whether the route may answer it.
 */
function isSameOrigin(request) {
  const site = request.headers.get('sec-fetch-site')
  return site === null || site === 'same-origin' || site === 'none'
}

/**
 * Write one JSON response.
 * @param body - JSON-safe payload.
 * @param status - HTTP status.
 * @returns Fetch response.
 */
function sendJson(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    },
  })
}
