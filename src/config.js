import Runtimeconfig from 'google-cloud-runtime-config'
const runtimeconfig = Runtimeconfig()

let config = null
export default function getConfig () {
  if (!config) {
    return runtimeconfig.getConfig('misskey-push').then(conf => {
      config = conf
      return config
    })
  } else {
    return Promise.resolve(config)
  }
}
