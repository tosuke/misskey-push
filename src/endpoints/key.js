import getConfig from '../config'

export default async function key () {
  const config = await getConfig()
  return {
    vapidPublicKey: config.VAPID_PUBLIC_KEY
  }
}
