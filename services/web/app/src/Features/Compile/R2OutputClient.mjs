// R2OutputClient: presigns short-lived GET URLs for CLSI output files.
//
// Replaces the bytes-through-web `_proxyToClsi` path for output files. When
// the editor asks for /project/.../build/.../output/<file>, web 302s to a
// presigned R2 URL so the browser fetches the PDF straight from Cloudflare's
// edge instead of streaming through the VM.
//
// Auth: relies on Overleaf web's existing session/ACL middleware. We only
// presign after web has authorized the request, so unauthenticated clients
// can't get a redirect.
//
// Bucket key shape matches what clsi-rs writes:
//   project/<scope>/build/<build_id>/output/<file>
// where scope = `${pid}` or `${pid}-${uid}`.

import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import settings from '@overleaf/settings'

const TTL_SECONDS = parseInt(process.env.R2_OUTPUT_URL_TTL_SECONDS || '300', 10)

let _client = null
function client() {
  if (_client) return _client
  // Reuse the filestore S3 config — same R2 endpoint and creds.
  const s3 = settings.filestore?.s3 || {}
  if (!s3.endpoint || !s3.key || !s3.secret) {
    throw new Error('filestore.s3 endpoint/key/secret not configured')
  }
  _client = new S3Client({
    region: s3.region || 'auto',
    endpoint: s3.endpoint,
    credentials: { accessKeyId: s3.key, secretAccessKey: s3.secret },
    forcePathStyle: s3.pathStyle !== false,
  })
  return _client
}

// Pattern: /project/<pid>[/user/<uid>]/build/<bid>/output/<file>
const OUTPUT_PATH_RE =
  /^\/project\/([^/]+)(?:\/user\/([^/]+))?\/build\/([^/]+)\/output\/(.+)$/

// Returns null if the path isn't an output file path. Otherwise returns a
// presigned R2 URL suitable for a 302.
export async function maybePresignFromPath(pathname) {
  const m = pathname.match(OUTPUT_PATH_RE)
  if (!m) return null
  const [, pid, uid, bid, file] = m
  const scope = uid ? `${pid}-${uid}` : pid
  const key = `project/${scope}/build/${bid}/output/${file}`
  const bucket = process.env.OVERLEAF_CLSI_OUTPUT_BUCKET
  if (!bucket) throw new Error('OVERLEAF_CLSI_OUTPUT_BUCKET not configured')
  return await getSignedUrl(
    client(),
    new GetObjectCommand({ Bucket: bucket, Key: key }),
    { expiresIn: TTL_SECONDS }
  )
}

export default { maybePresignFromPath }
