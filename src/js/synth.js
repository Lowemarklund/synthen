/**
 * Webcomponent for creating a synth application.
 *
 * @module src/synth.js
 * @author Lowe Marklund
 * @version 1.0
 */

 'use strict'

 const SynthTemplate = require('./templates/synthTemplate')
 const template = SynthTemplate.template

/**
 * Synth.
 *
 * @class Synth
 * @extends {window.HTMLElement}
 */

 class Synth extends window.HTMLElement {
  /**
   * Creates an instance of Memory .
   * @memberof Synth
   */
   constructor () {
     super()
     this.attachShadow({mode: 'open'})
     this.shadowRoot.appendChild(template.content.cloneNode(true))
     this._synth = this.shadowRoot.querySelector('.synth')
     this._keyboard = this.shadowRoot.querySelector('.keyboard')
     this._newKeyboard = this.shadowRoot.querySelector('.newKeyboard')
     this._carrierWavePicker = this.shadowRoot.querySelector("select[name='waveform']")
     this._modulatorWavePicker = this.shadowRoot.querySelector("select[name='waveform2']")
     this._modulator2WavePicker = this.shadowRoot.querySelector("select[name='waveform3']")
     this._octavePicker = this.shadowRoot.querySelector("select[name='octave']")
     this._volumeControl = this.shadowRoot.querySelector("input[name='volume']")
     this._carrierGain = this.shadowRoot.querySelector("input[name='carrierGain']")
     this._modulationFreqControl = this.shadowRoot.querySelector("input[name='modulationFreq']")
     this._modulationDepthControl = this.shadowRoot.querySelector("input[name='modulationDepth']")
     this._modulation2FreqControl = this.shadowRoot.querySelector("input[name='modulation2Freq']")
     this._modulation2DepthControl = this.shadowRoot.querySelector("input[name='modulation2Depth']")
     this._lfoFrequency = this.shadowRoot.querySelector("input[name='lfoFreq']")
     this._audioContext = Pizzicato.context
     this._out = this._audioContext.destination
     this._triggerKeys = ['Tab', '1', 'q', '2', 'w', 'e', '4', 'r', '5', 't', '6', 'y', 'u', '8', 'i', '9', 'o', 'p', '0', 'å', '´', '¨', '\u27f5', '\u21b5']
     this._oscList = {}
     this._masterGainNode = null
     this._noteFreq = null
     this._customWaveform = null
     this._sineTerms = null
     this._cosineTerms = null
     this._sequencer = null
     this._activeNotes = {
       1: null,
       2: null,
       3: null,
       4: null,
       5: null,
       6: null,
       7: null,
       8: null
     }
   }

  /**
   * Watches attributes for changes on the element.
   *
   * @readonly
   * @static
   * @memberof Synth
   */
   static get observedAttributes () {

   }

  /**
   * Called by the browser engine when an attribute changes.
   *
   * @param {string} attributeName
   * @param {string} oldValue
   * @param {string} newValue
   * @memberof Synth
   */
   attributeChangedCallback (attributeName, oldValue, newValue) {

   }
    /**
   * Called when the element is connected to the DOM.
   *
   * @memberof Synth
   */
   connectedCallback () {
     this.setup()
     this.inputListen()
   }

     /**
   * Listens after input from the user.
   *
   * @memberof Synth
   */
   inputListen () {
     this._octavePicker.addEventListener('change', () => {
       let keyboardOctaves = this._keyboard.querySelectorAll('.octave')

        // removes previous keyboard octaves
       keyboardOctaves.forEach(octave => {
         this._keyboard.removeChild(octave)
       })

       this._noteFreq = this.createNoteTable(1)
       this.createKeyboard(Number(this._octavePicker.value))
     }, false)

     this._volumeControl.addEventListener('change', () => {
       this.changeVolume()
     }, false)

     this._lfoFrequency.addEventListener('change', () => {
       this.changeLfoFreq()
     })

     window.addEventListener('keydown', event => {
       if (document.activeElement !== this._sequencer) {
         event.preventDefault()
         let triggeredKey = event.key
         switch (event.code) {
           case 'BracketRight':
             triggeredKey = '¨'
             break
           case 'Enter':
             triggeredKey = '\u21b5'
             break
           case 'Backspace':
             triggeredKey = '\u27f5'
             break
           case 'Equal':
             triggeredKey = '´'
             break
         }
         if (event.repeat === false && this._triggerKeys.includes(triggeredKey)) {
           let key = this._keyboard.querySelector(`#key${triggeredKey}`)
           this.notePressed(key, triggeredKey)
           key.style.backgroundColor = '#599'
         }
       }
     })

     window.addEventListener('keyup', event => {
       let triggeredKey = event.key

       switch (event.code) {
         case 'BracketRight':
           triggeredKey = '¨'
           break
         case 'Enter':
           triggeredKey = '\u21b5'
           break
         case 'Backspace':
           triggeredKey = '\u27f5'
           break
         case 'Equal':
           triggeredKey = '´'
           break
       }
       if (this._triggerKeys.includes(triggeredKey)) {
         let key = this._keyboard.querySelector(`#key${triggeredKey}`)
         this.noteReleased(key, triggeredKey)
         key.style.backgroundColor = 'white'

         if (key.getAttribute('class') === 'sharpKey') {
           key.style.backgroundColor = 'black'
         }
       }
     }, false)
   }

      /**
   * Creates array of pitches
   *
   * @memberof Synth
   */
   createNoteTable (octave) {
     let noteFreq = []

     for (let i = 0; i < 8; i++) {
       noteFreq[octave + i] = []
     }

     noteFreq[octave]['C'] = 32.703195662574829
     noteFreq[octave]['C#'] = 34.647828872109012
     noteFreq[octave]['D'] = 36.708095989675945
     noteFreq[octave]['D#'] = 38.890872965260113
     noteFreq[octave]['E'] = 41.203444614108741
     noteFreq[octave]['F'] = 43.653528929125485
     noteFreq[octave]['F#'] = 46.249302838954299
     noteFreq[octave]['G'] = 48.999429497718661
     noteFreq[octave]['G#'] = 51.913087197493142
     noteFreq[octave]['A'] = 55.000000000000000
     noteFreq[octave]['A#'] = 58.270470189761239
     noteFreq[octave]['B'] = 61.735412657015513

     for (var pitch in noteFreq[octave]) {
       for (let i = 2; i < 8; i++) {
         noteFreq[i][pitch] = noteFreq[i - 1][pitch] * 2
       }
     }

     this._noteFreq = noteFreq
     return noteFreq
   }

   createKeyboard (octave) {
     let keyIndex = 0

     this._noteFreq.forEach((keys, i1) => {
       if (i1 <= octave + 1 && i1 >= octave) {
         let keyList = Object.entries(keys)
         let whiteKeys = document.createElement('div')
         let blackKeys = document.createElement('div')
         let octaveElem = document.createElement('div')
         octaveElem.className = 'octave'

         keyList.forEach((key, i2) => {
           if (key[0].length > 1) {
             blackKeys.appendChild(this.createKey(key[0], i1, key[1], keyIndex))
           } else {
             whiteKeys.appendChild(this.createKey(key[0], i1, key[1], keyIndex))
           }

           keyIndex++
         })

         octaveElem.appendChild(blackKeys)
         octaveElem.appendChild(whiteKeys)
         this._keyboard.appendChild(octaveElem)
       }
     })
   }

   setup () {
     this._noteFreq = this.createNoteTable(1)
     this._masterGainNode = this._audioContext.createGain()
     this._masterGainNode.connect(this._out)
     this._masterGainNode.gain.value = this._volumeControl.value
     this._noteLength = 500

     this.createKeyboard(3)

     this._sineTerms = new Float32Array([0, 0, 1, 0, 1])
     this._cosineTerms = new Float32Array(this._sineTerms.length)
     this._customWaveform = this._audioContext.createPeriodicWave(this._cosineTerms, this._sineTerms)
   }

   createKey (note, octave, freq, keyIndex) {
     let keyElement = document.createElement('div')
     let labelElement = document.createElement('div')

     keyElement.className = 'key'
     keyElement.id = `key${this._triggerKeys[keyIndex]}`
     keyElement.dataset['octave'] = octave
     keyElement.dataset['note'] = note
     keyElement.dataset['frequency'] = freq

     if (note.length > 1) {
       keyElement.setAttribute('class', 'sharpKey')
     }

     labelElement.innerHTML = this._triggerKeys[keyIndex]

     keyElement.appendChild(labelElement)

     keyElement.addEventListener('mousedown', event => {
       this.notePressed(keyElement)
     }, false)
     keyElement.addEventListener('mouseup', event => {
       this.noteReleased(keyElement)
     }, false)
     keyElement.addEventListener('mouseover', event => {
       this.noteReleased(keyElement)
     }, false)
     keyElement.addEventListener('mouseleave', event => {
       this.noteReleased(keyElement)
     }, false)

     return keyElement
   }

   playTone (freq) {
     let carrier = this._audioContext.createOscillator() 
     let modulator = this._audioContext.createOscillator()
     let modulator2 = this._audioContext.createOscillator()
     let carrierGain = this._audioContext.createGain()
     let modulatorGain = this._audioContext.createGain()
     let modulator2Gain = this._audioContext.createGain()

     carrierGain.gain.value = this._carrierGain.value
     modulatorGain.gain.value = this._modulationDepthControl.value
     modulator.frequency.value = this._modulationFreqControl.value
     modulator2Gain.gain.value = this._modulation2DepthControl.value
     modulator2.frequency.value = this._modulation2FreqControl.value

      //frequency modulation connections
     carrier.connect(carrierGain)
     carrier.connect(this._masterGainNode)
     carrierGain.connect(modulator.frequency)
     modulator.connect(modulatorGain)
     modulatorGain.connect(this._masterGainNode)
     carrierGain.connect(modulator2.frequency)
     modulator2.connect(modulator2Gain)
     modulator2Gain.connect(this._masterGainNode)
      
     let oscillator = Pizzicato.context.createOscillator();
     let distortion = new Pizzicato.Effects.Distortion();
     let analyser = Pizzicato.context.createAnalyser();
     
     oscillator.connect(distortion);
     distortion.connect(analyser);


     let type = this._carrierWavePicker.options[this._carrierWavePicker.selectedIndex].value
     let type2 = this._modulatorWavePicker.options[this._modulatorWavePicker.selectedIndex].value
     let type3 = this._modulator2WavePicker.options[this._modulator2WavePicker.selectedIndex].value

     if (type === 'custom') {
       carrier.setPeriodicWave(this._customWaveform)
     } else {
       carrier.type = type
       modulator.type = type2
       modulator2.type = type3
     }

     carrier.frequency.value = freq
    
     carrier.start()
     modulator.start()
     modulator2.start()

     return [carrier, modulator, modulator2]
   }

   notePressed (keyElement, id, cell) {
     let dataset = keyElement.dataset

     if (!dataset['pressed']) {
       if (cell) {
         let cellId = cell.getAttribute('row') + cell.getAttribute('column')
         let row = Number(cellId[0])

         if (this._activeNotes[row] !== null) {
           this.noteReleased(this._activeNotes[row].keyElement, this._activeNotes[row].id, this._activeNotes[row].cellId)
         }

         this._activeNotes[row] = {
           keyElement: keyElement,
           id: id,
           cellId: cellId
         }

         this._oscList[cellId] = this.playTone(dataset['frequency'])

         this._noteLength = Number(cell.getAttribute('noteLength'))

         setTimeout(() => {
           this.noteReleased(keyElement, id, cellId)
         }, this._noteLength)
       } else {
         this._oscList[id] = this.playTone(dataset['frequency'])
       }

       dataset['pressed'] = 'yes'
     }
   }

   noteReleased (keyElement, id, cellId) {
     let dataset = keyElement.dataset

     if (dataset && dataset['pressed']) {
       if (cellId) {
        this._oscList[cellId].forEach(osc => {
          osc.stop()
        });
         delete this._oscList[cellId]
       } else {
        this._oscList[id].forEach(osc => {
          osc.stop()
        });
         delete this._oscList[id]
       }
       delete dataset['pressed']
     }
   }

   changeVolume () {
     this._masterGainNode.gain.value = this._volumeControl.value
   }

   changeLfoFreq () {

  }
}

 window.customElements.define('synth-element', Synth)

 module.exports = Synth
