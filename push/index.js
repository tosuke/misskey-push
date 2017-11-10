require('dotenv').config()
const axios = require('axios')
const webpush = require('web-push')
const datastore = require('@google-cloud/datastore')({
  projectId: 'misskey-push',
})

exports.push = (req, res) => {
  if (
    req.get('content-type') !== 'application/json' ||
    req.method !== 'POST' ||
    !req.query.id
  ) {
    console.error('invalid request')
    res.send()
    return
  }

  const id = req.query.id
  const body = req.body
  console.log(id, body)

  Promise.all([getSubscriber(id), format(body)])
    .then(a => sendNotification(a[0], a[1]))
    .then(() => {
      res.send()
    })
    .catch(e => {
      console.error(e)
      res.send()
    })
}

function format(body) {
  const content = body.content
  switch (body.type) {
    case 'like':
      return getUser(content.post.user).then(user => ({
        typ: 'like',
        usr: formatUser(content.user),
        post: formatPost(content.post, user),
      }))
    case 'repost':
      return getUser(content.post.user).then(user => ({
        typ: 'repost',
        usr: formatUser(content.user),
        post: formatPost(content.post, user),
      }))
    case 'mention':
      return Promise.resolve({
        typ: 'mention',
        usr: formatUser(content.post.user),
        post: formatPost(content.post, formatUser(content.post.user)),
      })
    case 'follow':
      return Promise.resolve({
        typ: 'follow',
        usr: formatUser(content.user)
      })
    default:
      return Promise.resolve({})
  }
}

function formatPost(post, user) {
  return {
    id: post.id,
    text: post.text || '',
    files: post.files || [],
    usr: user,
  }
}

function formatUser(user) {
  return {
    id: user.id,
    nameId: user.screenName,
    name: user.name,
    avatar: user.avatarUrl,
  }
}

function getUser(id) {
  return axios
    .get(`${process.env.WEBPUSH_MISSKEY_API_BASE}/v1/accounts/${id}`)
    .then(r =>
      getFileUrl(r.data.account.avatar).then(url => ({
        id,
        nameId: r.data.account.screenName,
        name: r.data.account.name,
        avatar: url,
      }))
    )
}

function getFileUrl(id) {
  return axios
    .get(`${process.env.WEBPUSH_MISSKEY_API_BASE}/v1/files/${id}`)
    .then(
      r => `${process.env.WEBPUSH_MISSKEY_FILE_BASE}/${r.data.file.serverPath}`
    )
}

function getSubscriber(id) {
  return datastore
    .get(datastore.key([process.env.WEBPUSH_DB_KIND_NAME, datastore.int(id)]))
    .then(r => r[0])
}

function sendNotification(subscriber, payload) {
  const details = webpush.generateRequestDetails(
    {
      endpoint: subscriber.endpoint,
      keys: {
        p256dh: subscriber.p256dhKey,
        auth: subscriber.authKey,
      },
    },
    JSON.stringify(payload),
    {
      TTL: 24 * 60 * 60,
      vapidDetails: {
        subject: process.env.WEBPUSH_SUBJECT,
        publicKey: process.env.WEBPUSH_PUBLIC_KEY,
        privateKey: process.env.WEBPUSH_PRIVATE_KEY,
      },
    }
  )

  return axios.post(details.endpoint, details.body, {
    headers: details.headers,
  })
}
