import getConfig from '../config'
import getParam from '../utils/get-param'
import { findById } from '../store'
import webpush from 'web-push'
import axios from 'axios'

export default async function push (query, body) {
  const config = await getConfig()
  const id = getParam(query, 'id')
  const subscriber = await findById(id)
  const payload = await generatePayload(body)
  await sendNotification(subscriber, payload)
}

async function generatePayload (body) {
  const content = body.content
  switch (body.type) {
    case 'like':
      return {
        typ: 'like',
        usr: {
          id: content.user.id,
          nameId: content.user.screenName,
          name: content.user.name,
          avatar: content.user.avatarUrl
        },
        post: {
          id: content.post.id,
          text: content.post.text || '',
          files: content.post.files || [],
          usr: await getUser(content.post.user)
        }
      }
    case 'repost':
      return {
        typ: 'repost',
        usr: {
          id: content.user.id,
          nameId: content.user.screenName,
          name: content.user.name,
          avatar: content.user.avatarUrl
        },
        post: {
          id: content.post.id,
          text: content.post.text || '',
          files: content.post.files || [],
          usr: await getUser(content.post.user)
        }
      }
    case 'mention':
      return {
        typ: 'mention',
        usr: {
          id: content.post.user.id,
          nameId: content.post.user.screenName,
          name: content.post.user.name,
          avatar: content.post.user.avatarUrl
        },
        post: {
          id: content.post.id,
          text: content.post.text || '',
          files: (content.post.files || []).map(file => file.id),
          usr: {
            id: content.post.user.id,
            nameId: content.post.user.screenName,
            name: content.post.user.name
          }
        }
      }
    case 'follow':
      return {
        typ: 'follow',
        usr: {
          id: content.user.id,
          nameId: content.user.screenName,
          name: content.user.name,
          avatar: content.user.avatarUrl
        }
      }
    case 'talk-user-message':
      return {
        typ: 'talk-user-message',
        usr: {
          id: content.message.user.id,
          nameId: content.message.user.screenName,
          name: content.message.user.name,
          avatar: content.message.user.avatarUrl
        },
        mes: {
          id: content.message.id,
          text: content.message.text,
          file: content.message.file ? content.message.file.id : null,
          usr: {
            id: content.message.recipient.id,
            nameId: content.message.recipient.screenName,
            name: content.message.recipient.name
          }
        }
      }
    default:
      return {}
  }
}

async function getUser (id) {
  const config = await getConfig()
  return await axios
    .get(`${config.MISSKEY_API_BASE}/accounts/${id}`)
    .then(r => ({
      id,
      nameId: r.data.account.screenName,
      name: r.data.account.name
    }))
}

async function sendNotification (subscriber, payload) {
  const config = await getConfig()
  const details = webpush.generateRequestDetails(
    {
      endpoint: subscriber.endpoint,
      keys: {
        p256dh: subscriber.p256dhKey,
        auth: subscriber.authKey
      }
    },
    JSON.stringify(payload),
    {
      TTL: 24 * 60 * 60, // 1day
      vapidDetails: {
        subject: config.VAPID_SUBJECT_URL,
        publicKey: config.VAPID_PUBLIC_KEY,
        privateKey: config.VAPID_PRIVATE_KEY
      }
    }
  )

  return await axios.post(details.endpoint, details.body, {
    headers: details.headers
  })
}
