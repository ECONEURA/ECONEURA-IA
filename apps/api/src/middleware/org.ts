import { type RequestHandler } from 'express'

declare global {
  namespace Express {
    interface Request {
      org?: { id?: string; source: 'aad' | 'header' | 'body' | 'untrusted' | 'none' }
    }
  }
}

export const attachOrg: RequestHandler = (req, _res, next) => {
  const aadRequired = (process.env.AAD_REQUIRED ?? 'false') === 'true'
  let id: string | undefined
  let source: 'aad' | 'header' | 'body' | 'untrusted' | 'none' = 'none'

  // Prefer AAD claims (assume aad middleware sets req.user)
  // @ts-ignore
  id = req.user?.org_id || req.user?.tid || req.user?.tid?.toString()
  if (id) {
    req.org = { id, source: 'aad' }
    return next()
  }

  if (!aadRequired) {
    const header = (req.headers['x-org-id'] as string) || undefined
    const bodyId = (req.body && req.body.org_id) ? String(req.body.org_id) : undefined
    if (header) {
      req.org = { id: header, source: 'header' }
      return next()
    }
    if (bodyId) {
      // mark as untrusted when coming from body
      req.org = { id: bodyId, source: 'untrusted' }
      return next()
    }
  }

  req.org = { id: undefined, source: 'none' }
  return next()
}
