/**
 * Webcomponent for creating a synth application.
 *
 * @module src/synth.js
 * @author Lowe Marklund
 * @version 1.0
 */

 'use strict'

 const template = document.createElement('template')

 template.innerHTML =
`<div class="synth">
    <div class="keyboard">
      <div class="settingsBar">
        <div class="volumeInput">
          <span>Volume: </span>
          <input type="range" min="0.0" max="1.0" step="0.01"
              value="0.5" list="volumes" name="volume">
          <datalist id="volumes">
            <option value="0.0" label="Mute">
            <option value="1.0" label="100%">
          </datalist>
        </div>
        <div class="right">
          <span>Current waveform: </span>
          <select name="waveform">
            <option value="sine">Sine</option>
            <option value="square" selected>Square</option>
            <option value="sawtooth">Sawtooth</option>
            <option value="triangle">Triangle</option>
          </select>
          <span>Current octave: </span>
          <select name="octave">
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3" selected>3</option>
            <option value="4">4</option>
            <option value="5">5</option>
            <option value="6">6</option>
            <option value="7">7</option>
          </select>
        </div>
    </div>
  </div>
<div>

    <style>
      .synth {
        width: 500px;
        height: 110px;
        white-space: nowrap;
        margin-left: 10px;
    
      }
      .keyboard {
        width: auto;
        padding: 10px;
        margin: 20px;
       
      }
      
      .key {
        cursor: pointer;
        font: 10px "Open Sans", "Lucida Grande", "Arial", sans-serif;
        border: 1px solid black;
        border-radius: 5px;
        width: 20px;
        height: 80px;
        padding: 10px;
        text-align: center;
        box-shadow: 2px 2px darkgray;
        display: inline-block;
        position: relative;
        margin-right: 3px;
        user-select: none;
        -moz-user-select: none;
        -webkit-user-select: none;
        -ms-user-select: none;
      }
      
      .key div {
        position: flexible;
        bottom: 0;
        text-align: center;
        width: 100%;
        pointer-events: none;
      }
      
      .key div sub {
        font-size: 10px;
        pointer-events: none;
      }
      
      .key:active {
        background-color: #599;
        color: #fff;
      }

      .sharpKey:active {
        background-color: #599;
        color: #fff;
      }

      
      .octave {
        display: inline-block;
        padding: 0 6px 0 0;
      }
      
      .settingsBar {
        margin-bottom: 20px;
        padding: 20px;
        font: 14px "Open Sans", "Lucida Grande", "Arial", sans-serif;
        position: flexible;
        vertical-align: middle;
        width: 100%;
        height: 30px;
      }
      .right {
        margin: 10px;
        text-align: center;
      }

      .volumeInput{
        text-align: center;
      }

      .sharpKey {
        cursor: pointer;
        font: 10px "Open Sans", "Lucida Grande", "Arial", sans-serif;
        border: 1px solid black;
        border-radius: 5px;
        width: 10px;
        height: 80px;
        padding: 10px;
        text-align: center;
        box-shadow: 2px 2px darkgray;
        display: inline-block;
        position: relative;
        margin-right: 3px;
        user-select: none;
        -moz-user-select: none;
        -webkit-user-select: none;
        -ms-user-select: none;
        background-color: black;
        color: white;
        margin-left: 20px;
      }
  
    </style>
</div>
`

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
     this._wavePicker = this.shadowRoot.querySelector("select[name='waveform']")
     this._octavePicker = this.shadowRoot.querySelector("select[name='octave']")
     this._volumeControl = this.shadowRoot.querySelector("input[name='volume']")
     this._audioContext = new (window.AudioContext || window.webkitAudioContext)()
     this._triggerKeys = ['Tab', '1', 'q', '2', 'w', 'e', '4', 'r', '5', 't', '6', 'y', 'u', '8', 'i', '9', 'o', 'p', '+', 'å', '´', '¨', '\u27f5', '\u21b5']
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

     window.addEventListener('keydown', event => {
      if(document.activeElement !== this._sequencer){
        event.preventDefault()
        if (event.repeat === false && this._triggerKeys.includes(event.key)) {
          let key = this._keyboard.querySelector(`#key${event.key}`)
          this.notePressed(key, event.key)
          key.style.backgroundColor = '#599'
        }
      }
     })

     window.addEventListener('keyup', event => {
       if (this._triggerKeys.includes(event.key)) {
         let key = this._keyboard.querySelector(`#key${event.key}`)
         this.noteReleased(key, event.key)
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
         noteFreq[i][pitch] = noteFreq[i-1][pitch] * 2
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
     this._masterGainNode.connect(this._audioContext.destination)
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
     let osc = this._audioContext.createOscillator()
     osc.connect(this._masterGainNode)

     let type = this._wavePicker.options[this._wavePicker.selectedIndex].value

     if (type === 'custom') {
       osc.setPeriodicWave(this._customWaveform)
     } else {
       osc.type = type
     }

     osc.frequency.value = freq
     osc.start()

     return osc
   }

   notePressed (keyElement, id, cell) {

     let dataset = keyElement.dataset


     if (!dataset['pressed']) {
       if(cell){
        let cellId = cell.getAttribute('row') + cell.getAttribute('column')
        let row = Number(cellId[0])

        if(this._activeNotes[row] !== null){
          this.noteReleased(this._activeNotes[row].keyElement, this._activeNotes[row].id, this._activeNotes[row].cellId)
        }

        this._activeNotes[row] = {
          keyElement: keyElement,
          id: id,
          cellId: cellId
        } 
          
        this._oscList[cellId] = this.playTone(dataset['frequency'])

        this._noteLength = Number(cell.getAttribute('noteLength'))

        console.log(this._noteLength)

        setTimeout(() => {
          this.noteReleased(keyElement, id, cellId)
        }, this._noteLength)
         
       }else{
          this._oscList[id] = this.playTone(dataset['frequency'])
       }

       dataset['pressed'] = 'yes'
     }
   }

   noteReleased (keyElement, id, cellId) {
     let dataset = keyElement.dataset
     
     if (dataset && dataset['pressed']) {
       if(cellId){
        this._oscList[cellId].stop()
        delete this._oscList[cellId] 
       }else{
        this._oscList[id].stop()
        delete this._oscList[id] 
       }
        delete dataset['pressed']
     }
   }

   changeVolume () {
     this._masterGainNode.gain.value = this._volumeControl.value
   }
}

 window.customElements.define('synth-element', Synth)

 module.exports = Synth
