const Synth = require('./synth')

let newSynth = new Synth()

document.querySelector('body').insertBefore(newSynth, document.querySelector('body').children[0])
