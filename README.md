# tiny-hl7

Incomplete, in progress, not fully spec compliant, but relatively tiny parse/serialize support for HL7 messages into a fairly simple to use JS format.

It exports two main methods `parse` and `serialize` and a helper function `getMessages` for grabbing individual messages out of a group.

## Motivation

1. I wanted a lib small enough to do this in a browser as a tiny part of a clientside JS app.
2. I wanted the simplest possible parsed structure that's easy to consume by address.

## Parse/Serialize Example

```js
import hl7 from 'tiny-hl7'

const message = `MSH|^~\&|5.0^IBI^L|^^|DBO^IBI^L|QS4444^^|20171025213259||ACK^V01^ACK|5465156441.100178620|P|2.3.1|
MSA|AR|QS444437861000000042|Not logged in: User login failed|||207^^HL70357|
ERR|^^^207^^HL70357|
`

const parsed = hl7.parse(message)

console.log(parsed)
/*
[
  {
    'MSH.2': '^~\\&',
    'MSH.3.1': '5.0',
    'MSH.3.2': 'IBI',
    'MSH.3.3': 'L',
    'MSH.4.1': '',
    'MSH.4.2': '',
    'MSH.4.3': '',
    'MSH.5.1': 'DBO',
    'MSH.5.2': 'IBI',
    'MSH.5.3': 'L',
    'MSH.6.1': 'QS4444',
    'MSH.6.2': '',
    'MSH.6.3': '',
    'MSH.7': '20171025213259',
    'MSH.8': '',
    'MSH.9.1': 'ACK',
    'MSH.9.2': 'V01',
    'MSH.9.3': 'ACK',
    'MSH.10': '5465156441.100178620',
    'MSH.11': 'P',
    'MSH.12': '2.3.1',
    'MSH.13': '',
  },
  {
    'MSA.1': 'AR',
    'MSA.2': 'QS444437861000000042',
    'MSA.3': 'Not logged in: User login failed',
    'MSA.4': '',
    'MSA.5': '',
    'MSA.6.1': '207',
    'MSA.6.2': '',
    'MSA.6.3': 'HL70357',
    'MSA.7': '',
  },
  {
    'ERR.1.1': '',
    'ERR.1.2': '',
    'ERR.1.3': '',
    'ERR.1.4': '207',
    'ERR.1.5': '',
    'ERR.1.6': 'HL70357',
    'ERR.2': '',
  },
]
*/

const reSerialized = hl7.serialize(parsed)

console.log(reSerialized === message) // true
```

## Simple message generation example

Here we generate an "ack" acknowledging receipt of a message by combining parse to extract values to echo back:

```js
import hl7 from 'tiny-hl7'

const generateAck = incoming => {
  const messageHeader = hl7.parse(incoming)[0]

  return serialize([
    {
      'MSH.3': messageHeader['MSH.5'],
      'MSH.5': messageHeader['MSH.3'],
      'MSH.7': dateToHL7TimeStamp(new Date()),
      'MSH.10': shortid(),
    },
    {
      'MSA.1': 'AA',
      'MSA.2': messageHeader['MSH.10'],
    },
  ])
}
```

## Running tests

```
npm test
```

## Changelog

- `1.0.0` - initial release

## License

[MIT](https://mit.joreteg.com/)
