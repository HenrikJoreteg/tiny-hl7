import { dset } from 'dset'

export const endOfLineRe = /\r\n|\r|\n/g

const unescapePairs = [
  [/\\F\\/g, '|'],
  [/\\S\\/g, '^'],
  [/\\T\\/g, '&'],
  [/\\E\\/g, '\\'],
  // [/\\R\\/g, '~']
]
const escapeCharacterPair = [/(?:[^EFSTR])\\(?:[^EFSTR])/g, '\\E\\']
const escapePairs = [
  [/\|/g, '\\F\\'],
  [/\^/g, '\\S\\'],
  [/\&/g, '\\T\\'],
  // [/\~/g, '\\R\\']
]

const escape = string =>
  escapePairs.reduce(
    (result, [regEx, replacement]) => result.replace(regEx, replacement),
    string
  )

const unescape = string =>
  unescapePairs.reduce(
    (result, [regEx, replacement]) => result.replace(regEx, replacement),
    string
  )

const delimiters = ['|', '^', '&']
const parseSegment = segmentRaw => {
  const segment = segmentRaw.trim()
  const result = {}

  const parseForDelimiter = (subject, address, delimiter) => {
    const parts = subject.split(delimiter)
    const nextDelimiter = delimiters[delimiters.indexOf(delimiter) + 1]
    const isHeader = address === 'MSH'
    parts.forEach((part, index) => {
      const indexAddend = isHeader && delimiter === '|' ? 2 : 1
      const currentAddress = address + '.' + (index + indexAddend)
      const isDelimiterField = currentAddress === 'MSH.2'
      if (isDelimiterField) {
        result[currentAddress] = part
      } else if (nextDelimiter && part.includes(nextDelimiter)) {
        parseForDelimiter(part, currentAddress, nextDelimiter)
      } else {
        if (part) {
          // const toAdd = part.includes('~') ? part.split('~') : part
          result[currentAddress] = unescape(part)
        } else {
          result[currentAddress] = ''
        }
      }
    })
  }
  const split = segment.split('|')
  parseForDelimiter(split.slice(1).join('|'), split[0], '|')

  return result
}

export const parse = message =>
  message
    .trim()
    .split(endOfLineRe)
    .map(seg => parseSegment(seg))

const digitRe = /\d+/g
const decrementEachValue = str => str.replace(digitRe, item => Number(item) - 1)

const serializeSegment = obj => {
  const keys = Object.keys(obj)
  const segmentId = keys[0].split('.')[0]
  const isMessageHeader = segmentId === 'MSH'
  const result = []
  keys.forEach(key => {
    const value = obj[key]
    const splitKey = key.split('.')
    dset(result, decrementEachValue(splitKey.slice(1).join('.')), value)
    return result
  })

  const join = (item, depth = 0) => {
    let result = ''
    let entryHasChildren = false
    for (let i = 0, l = item.length; i < l; i++) {
      const entry = item[i]
      let activeDelimiter = delimiters[depth]

      let toAdd = entry || ''
      if (typeof toAdd === 'object') {
        entryHasChildren = true
        toAdd = join(toAdd, depth + 1)
      } else {
        const isEncodingCharsSegment =
          isMessageHeader && depth === 0 && (i === 0 || i === 1)
        if (isEncodingCharsSegment) {
          toAdd = ''
          activeDelimiter = ''
        } else {
          // console.log('ENTRY HAS CHILDRE', entryHasChildren)
          if (!entryHasChildren) {
            toAdd = escape(toAdd)
          }
        }
      }

      result += (i === 0 ? '' : activeDelimiter) + toAdd
    }

    return result
  }

  const joined = join(result).replace(
    escapeCharacterPair[0],
    match => match.slice(0, 1) + escapeCharacterPair[1] + match.slice(-1)
  )

  return segmentId + (isMessageHeader ? '|^~\\&' : '|') + joined
}

export const serialize = arrayOfSegments =>
  arrayOfSegments.map(serializeSegment).join('\r')

const messageHead = 'MSH|^'
export const getMessages = messageString => {
  const messages = []
  let idx = messageString.indexOf(messageHead)
  while (idx !== -1) {
    const startingIndex = idx || 0
    idx = messageString.indexOf(messageHead, idx + 1)
    if (idx !== -1) {
      messages.push(messageString.slice(startingIndex, idx).trim())
    } else {
      messages.push(messageString.slice(startingIndex).trim())
    }
  }
  return messages
}
