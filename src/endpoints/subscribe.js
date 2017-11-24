import getConfig from '../config'
import getParam from '../utils/get-param'
import axios from 'axios'
import { insert } from '../store'

export default async function subscribe (auth, body) {
  const config = await getConfig()
  const { username, password } = (() => {
    if (auth.type === 'basic') {
      return auth
    } else {
      throw new Error('auth failure')
    }
  })()
  const endpoint = getParam(body, 'endpoint')
  const p256dhKey = getParam(body, 'p256dhKey')
  const authKey = getParam(body, 'authKey')
  const { id: userId } = await axios
    .get(`${config.MISSKEY_API_BASE}/accounts/@${username}`)
    .then(r => r.data.account)

  const { token } = await axios
    .post(`${config.MISSKEY_WEBHOOK_BASE}/sessions`, {
      account: username,
      password
    })
    .then(r => r.data)

  try {
    const id = await insert(userId, endpoint, authKey, p256dhKey)
    const triggerUrl = `${config.MISSKEY_PUSH_TRIGGER}?id=${id}`
    await axios.post(
      `${config.MISSKEY_WEBHOOK_BASE}/webhooks/outgoings`,
      { uri: triggerUrl },
      { headers: { authorization: `Bearer ${token}` } }
    )
    return {
      id
    }
  } finally {
    await axios.delete(`${config.MISSKEY_WEBHOOK_BASE}/session`, {
      headers: {
        authorization: `Bearer ${token}`
      }
    })
  }
}
