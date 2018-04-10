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
        <div class="left">
          <span>Volume: </span>
          <input type="range" min="0.0" max="1.0" step="0.01"
              value="0.5" list="volumes" name="volume">
          <datalist id="volumes">
            <option value="0.0" label="Mute">
            <option value="1.0" label="100%">
          </datalist>
        <div class="right">
          <span>Current waveform: </span>
          <select name="waveform">
            <option value="sine">Sine</option>
            <option value="square" selected>Square</option>
            <option value="sawtooth">Sawtooth</option>
            <option value="triangle">Triangle</option>
          </select>
        </div>
      </div>
      </div>
    <div>
    <style>
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
    this._keyboard = this.shadowRoot.querySelector(".keyboard")
    this._wavePicker = this.shadowRoot.querySelector("select[name='waveform']")
    this._volumeControl = this.shadowRoot.querySelector("input[name='volume']")
    this._audioContext = new (window.AudioContext || window.webkitAudioContext)
    this._oscList = []
    this._masterGainNode = null
    this._noteFreq = null
    this._customWaveform = null
    this._sineTerms = null
    this._cosineTerms = null
  }

  /**
   * Watches attributes for changes on the element.
   *
   * @readonly
   * @static
   * @memberof Synth
   */
  static get observedAttributes () {
    return
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
    this.inputListen()
    this.setup()
  }

     /**
   * Listens after input from the user.
   *
   * @memberof Synth
   */
  inputListen () {
    this._volumeControl.addEventListener("change", this.changeVolume(), false)
  }
  
      /**
   * Creates array of pitches
   *
   * @memberof Synth
   */
  createNoteTable(){
    let noteFreq = [];
    for (let i=0; i< 9; i++) {
      noteFreq[i] = [];
    }
    noteFreq[1]["C"] = 32.703195662574829
    noteFreq[1]["C#"] = 34.647828872109012
    noteFreq[1]["D"] = 36.708095989675945
    noteFreq[1]["D#"] = 38.890872965260113
    noteFreq[1]["E"] = 41.203444614108741
    noteFreq[1]["F"] = 43.653528929125485
    noteFreq[1]["F#"] = 46.249302838954299
    noteFreq[1]["G"] = 48.999429497718661
    noteFreq[1]["G#"] = 51.913087197493142
    noteFreq[1]["A"] = 55.000000000000000
    noteFreq[1]["A#"] = 58.270470189761239
    noteFreq[1]["B"] = 61.735412657015513
    return noteFreq
  }

  setup(){
    this._noteFreq = this.createNoteTable()

    this._masterGainNode = this._audioContext.createGain()
    this._masterGainNode.connect(this._audioContext.destination)
    this._masterGainNode.gain.value = this._volumeControl.value

    this._noteFreq.forEach((keys, idx) => {
      let keyList = Object.entries(keys)
      let octaveElem = document.createElement("div")
      octaveElem.className = "octave"
      
      keyList.forEach((key)=> {
          octaveElem.appendChild(this.createKey(key[0], idx, key[1]))
      });
      this._keyboard.appendChild(octaveElem)
    });
    
    this._sineTerms = new Float32Array([0, 0, 1, 0, 1]);
    this._cosineTerms = new Float32Array(this._sineTerms.length);
    this._customWaveform = this._audioContext.createPeriodicWave(this._cosineTerms, this._sineTerms)

    for (let i = 0; i < 9; i++) {
      this._oscList[i] = []
    } 
  }

  changeVolume(){
  }

  createKey(note, octave, freq){
    let keyElement = document.createElement("div")
    let labelElement = document.createElement("div")
   
    keyElement.className = "key"
    keyElement.dataset["octave"] = octave
    keyElement.dataset["note"] = note
    keyElement.dataset["frequency"] = freq
    labelElement.innerHTML = note + "<sub>" + octave + "</sub>"
    keyElement.appendChild(labelElement)
  
    keyElement.addEventListener("mousedown", event =>{
      this.notePressed(event)  
    }, false)
    keyElement.addEventListener("mouseup", event =>{
      this.noteReleased(event) 
    }, false)
    keyElement.addEventListener("mouseleave", event =>{
      this.noteReleased(event) 
    }, false)
  
    return keyElement
  }

  playTone(freq) {
    let osc = this._audioContext.createOscillator()
    osc.connect(this._masterGainNode)
   
    let type = this._wavePicker.options[this._wavePicker.selectedIndex].value
   
    if (type == "custom") {
      osc.setPeriodicWave(this._customWaveform)
    } else {
      osc.type = type
    }
  
    osc.frequency.value = freq
    osc.start()
   
    return osc
  }

  notePressed(event) {
    if (event.buttons === 1) {
      let dataset = event.target.dataset
      console.log(dataset["pressed"])
      if (!dataset["pressed"]) {
        this._oscList[dataset["octave"][dataset["note"]]] = this.playTone(dataset["frequency"])
        dataset["pressed"] = "yes"
      }
    }
  }

  noteReleased(event) {
    let dataset = event.target.dataset
    if (dataset && dataset["pressed"]) {
      this._oscList[dataset["octave"][dataset["note"]]].stop()
      this._oscList[dataset["octave"][dataset["note"]]] = null
      delete dataset["pressed"]
    }
  }
}

  
window.customElements.define('synth-element', Synth)

module.exports = Synth