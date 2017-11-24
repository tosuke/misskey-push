import Datastore from '@google-cloud/datastore'
const datastore = Datastore()
import getConfig from './config'

export async function insert (userId, endpoint, authKey, p256dhKey) {
  const config = await getConfig()
  const key = await datastore
    .allocateIds(datastore.key(config.DATASTORE_SUBSCRIBER_KIND), 1)
    .then(a => a[0][0])
  const entity = {
    key,
    data: [
      {
        name: 'userId',
        value: userId
      },
      {
        name: 'endpoint',
        value: endpoint,
        excludeFromIndexes: true
      },
      {
        name: 'authKey',
        value: authKey,
        excludeFromIndexes: true
      },
      {
        name: 'p256dhKey',
        value: p256dhKey,
        excludeFromIndexes: true
      }
    ]
  }

  await datastore.save(entity)
  return key.id
}

export async function destroy (id) {
  const config = await getConfig()
  const key = datastore.key([
    config.DATASTORE_SUBSCRIBER_KIND,
    datastore.int(id)
  ])
  await datastore.delete(key)
}

export async function findById (id) {
  const config = await getConfig()
  const key = datastore.key([
    config.DATASTORE_SUBSCRIBER_KIND,
    datastore.int(id)
  ])
  return await datastore.get(key).then(a => a[0])
}
