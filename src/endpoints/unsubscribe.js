import getConfig from '../config'
import getParam from '../utils/get-param'
import axios from 'axios'
import { destroy } from '../store'

export default async function unsubscribe (auth, body) {
  const config = await getConfig()
  const { username, password } = (() => {
    if (auth.type === 'basic') {
      return auth
    } else {
      throw new Error('auth-failure')
    }
  })()
  const id = getParam(body, 'id')

  const { token } = await axios
    .post(`${config.MISSKEY_WEBHOOK_BASE}/sessions`, {
      account: username,
      password
    })
    .then(r => r.data)
    .catch(e => {
      if (e.response) {
        throw new Error('auth-failure')
      }
    })

  try {
    const triggerUrl = `${config.MISSKEY_PUSH_TRIGGER}?id=${id}`
    const webhooks = await axios
      .get(`${config.MISSKEY_WEBHOOK_BASE}/webhooks/outgoings`, {
        headers: {
          authorization: `Bearer ${token}`
        }
      })
      .then(r => r.data.outgoing_hooks)
    const webhook = webhooks.filter(wh => wh.uri === triggerUrl)
    if (webhook.length) {
      const webhookId = webhook[0]._id
      await axios.delete(
        `${config.MISSKEY_WEBHOOK_BASE}/webhooks/outgoings/${webhookId}`,
        {
          headers: {
            authorization: `Bearer ${token}`
          }
        }
      )
    }
  } finally {
    await axios.delete(`${config.MISSKEY_WEBHOOK_BASE}/session`, {
      headers: {
        authorization: `Bearer ${token}`
      }
    })
  }

  await destroy(id)

  return {}
}
