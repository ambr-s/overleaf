// R2BlobPresigner: presigns short-lived GET URLs for history-v1 blobs.
//
// Web no longer hands CLSI an internal `http://filestore:3009/history/...`
// URL — that's unreachable when CLSI lives outside the VM (e.g. on Cloudflare
// Containers). We instead presign a direct R2 GET URL so CLSI fetches the
// blob from Cloudflare's edge without going through filestore at all.
//
// Key layouts mirror filestore's KeyBuilder.js exactly (don't change unless
// upstream filestore changes too):
//   project blob: `${projectKey.format(historyId)}/${hash.slice(0,2)}/${hash.slice(2)}`
//   global blob:  `${hash.slice(0,2)}/${hash.slice(2,4)}/${hash.slice(4)}`
// projectKey.format() reverses+pads+shards the historyId (see @overleaf/object-persistor).

import path from 'node:path'
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import settings from '@overleaf/settings'

const TTL_SECONDS = parseInt(process.env.R2_BLOB_URL_TTL_SECONDS || '900', 10)

let _client = null
function client() {
  if (_client) return _client
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

function projectKey(historyId) {
  const padded = (historyId || 0).toString().padStart(9, '0')
  const reversed = padded.split('').reverse().join('')
  return path.join(reversed.slice(0, 3), reversed.slice(3, 6), reversed.slice(6))
}

export async function presignProjectBlob(historyId, hash) {
  const bucket = settings.filestore?.stores?.project_blobs
  if (!bucket) throw new Error('project_blobs bucket not configured')
  const key = `${projectKey(historyId)}/${hash.slice(0, 2)}/${hash.slice(2)}`
  return await getSignedUrl(
    client(),
    new GetObjectCommand({ Bucket: bucket, Key: key }),
    { expiresIn: TTL_SECONDS }
  )
}

export async function presignGlobalBlob(hash) {
  const bucket = settings.filestore?.stores?.global_blobs
  if (!bucket) throw new Error('global_blobs bucket not configured')
  const key = `${hash.slice(0, 2)}/${hash.slice(2, 4)}/${hash.slice(4)}`
  return await getSignedUrl(
    client(),
    new GetObjectCommand({ Bucket: bucket, Key: key }),
    { expiresIn: TTL_SECONDS }
  )
}

export default { presignProjectBlob, presignGlobalBlob }
