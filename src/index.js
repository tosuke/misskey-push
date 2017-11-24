import authparser from 'http-auth-parser'
import subscribeImpl from './endpoints/subscribe'
import unsubscribeImpl from './endpoints/unsubscribe'
import pushImpl from './endpoints/push'
import keyImpl from './endpoints/key'

export function subscribe (req, res) {
  authparser(req)
  subscribeImpl(req.auth, req.body)
    .then(r => {
      console.log(r)
      res.status(200).json(r)
    })
    .catch(e => {
      console.error(e)
      res.status(400).json({ message: e.message })
    })
}

export function unsubscribe (req, res) {
  authparser(req)
  unsubscribeImpl(req.auth, req.body)
    .then(r => {
      console.log(r)
      res.status(200).json(r)
    })
    .catch(e => {
      console.log(e)
      r.status(400).json({ message: e.message })
    })
}

export function key (req, res) {
  keyImpl()
    .then(r => {
      console.log(r)
      res.status(200).json(r)
    })
    .catch(e => {
      console.log(e)
      r.status(400).json({ message: e.message })
    })
}

export function push (req, res) {
  pushImpl(req.query, req.body)
    .catch(e => {
      console.error(e)
    })
    .then(() => {
      res.status(200).send()
    })
}
