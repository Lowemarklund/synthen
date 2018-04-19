const Synth = require('./synth')
const Sequencer = require('./sequencer')

let newSynth = new Synth()
let newSequencer = new Sequencer()

document.querySelector('body').insertBefore(newSynth, document.querySelector('body').children[0])
document.querySelector('body').insertBefore(newSequencer, document.querySelector('body').children[0])
