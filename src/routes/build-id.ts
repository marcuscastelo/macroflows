export const runtime = 'nodejs'

export function GET(): Response {
  const candidate = process.env.FACTORY_RUNTIME_CANDIDATE
  if (candidate === undefined || candidate === '') {
    return new Response('', { status: 503 })
  }

  return new Response(candidate, {
    headers: { 'content-type': 'text/plain; charset=utf-8' },
  })
}
