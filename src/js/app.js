const Synth = require('./synth')
const Sequencer = require('./sequencer')

let newSequencer = new Sequencer()

document.querySelector('body').insertBefore(newSequencer._synth, document.querySelector('body').children[0])
document.querySelector('body').insertBefore(newSequencer, document.querySelector('body').children[0])
