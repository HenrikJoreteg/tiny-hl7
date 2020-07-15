const fs = require('fs')
const path = require('path')
const test = require('tape')
const HL7 = require('../src/hl7')
const glob = require('glob')

const sampleMessages = glob
  .sync(path.join(__dirname, './test-data/**/*.hl7'))
  .map(fileName => ({
    fileName,
    message: fs.readFileSync(fileName, 'utf8').trim(),
  }))
  .reduce((result, item) => {
    // could be more than 1 per file
    const messages = HL7.getMessages(item.message).map(message => ({
      fileName: item.fileName,
      message,
    }))

    result.push(...messages)
    return result
  }, [])

const escapeTestMessage = sampleMessages.find(item =>
  item.fileName.includes('escaping')
).message

const headerKeyRe = /^[A-Z0-9]{3}/
test('can parse and re-serialize', t => {
  sampleMessages.forEach(({ fileName, message }) => {
    const lineByLine = message.split(HL7.endOfLineRe)
    const parsed = HL7.parse(message)
    parsed.forEach(item => {
      Object.keys(item).forEach(key => {
        const passed = headerKeyRe.test(key)
        if (!passed) {
          t.fail('header does not match')
        }
      })
    })

    const processed = HL7.serialize(parsed)
    const newLineByLine = processed.split(HL7.endOfLineRe)
    let isEqual = message === processed

    if (!isEqual) {
      lineByLine.forEach((line, index) => {
        if (line !== newLineByLine[index]) {
          console.log('original')
          console.log(line)
          console.log(newLineByLine[index])
          t.fail()
        }
      })
      isEqual = true
    }

    t.ok(
      isEqual,
      'can parse and re-serialize: ' + fileName.split('/').slice(-3).join('/')
    )
  })

  t.end()
})

test('properly escapes an unescapes', t => {
  const parsed = HL7.parse(escapeTestMessage)
  const fieldWithEscapedStuff = parsed[1]['MSA.3']
  const starting =
    '\\F\\ field separator \\S\\ component separator \\T\\ subcomponent separator \\E\\ escape character'
  const expected =
    '| field separator ^ component separator & subcomponent separator \\ escape character'
  t.equal(fieldWithEscapedStuff, expected)

  const serialized = HL7.serialize(parsed)

  t.ok(serialized.includes(starting))

  t.end()
})
