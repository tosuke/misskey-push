export default function getParam (body, name) {
  if (body[name]) {
    return body[name]
  } else {
    throw new Error(`missing param '${name}'`)
  }
}
