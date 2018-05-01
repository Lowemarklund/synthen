const Sequencer = require('./sequencer')

let newSequencer = new Sequencer()

newSequencer._synth._sequencer = newSequencer

document.querySelector('body').insertBefore(newSequencer._synth, document.querySelector('body').children[0])
document.querySelector('body').insertBefore(newSequencer, document.querySelector('body').children[0])