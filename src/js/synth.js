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
      .synth {
        width: 660px;
        height: 110px;
        white-space: nowrap;
        margin: 10px;
      }
      .keyboard {
        width: auto;
        padding: 10px;
        margin: 20px;
      }
      
      .key {
        cursor: pointer;
        font: 16px "Open Sans", "Lucida Grande", "Arial", sans-serif;
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
      
      .key:hover {
        background-color: #eef;
      }
      
      .key:active {
        background-color: #000;
        color: #fff;
      }
      
      .octave {
        display: inline-block;
        padding: 0 6px 0 0;
      }
      
      .settingsBar {
        padding: 20px;
        font: 14px "Open Sans", "Lucida Grande", "Arial", sans-serif;
        position: flexible;
        vertical-align: middle;
        width: 100%;
        height: 30px;
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
    
  noteFreq[2]["C"] = 65.406391325149658;
  noteFreq[2]["C#"] = 69.295657744218024;
  noteFreq[2]["D"] = 73.416191979351890;
  noteFreq[2]["D#"] = 77.781745930520227;
  noteFreq[2]["E"] = 82.406889228217482;
  noteFreq[2]["F"] = 87.307057858250971;
  noteFreq[2]["F#"] = 92.498605677908599;
  noteFreq[2]["G"] = 97.998858995437323;
  noteFreq[2]["G#"] = 103.826174394986284;
  noteFreq[2]["A"] = 110.000000000000000;
  noteFreq[2]["A#"] = 116.540940379522479;
  noteFreq[2]["B"] = 123.470825314031027;

  noteFreq[3]["C"] = 130.812782650299317;
  noteFreq[3]["C#"] = 138.591315488436048;
  noteFreq[3]["D"] = 146.832383958703780;
  noteFreq[3]["D#"] = 155.563491861040455;
  noteFreq[3]["E"] = 164.813778456434964;
  noteFreq[3]["F"] = 174.614115716501942;
  noteFreq[3]["F#"] = 184.997211355817199;
  noteFreq[3]["G"] = 195.997717990874647;
  noteFreq[3]["G#"] = 207.652348789972569;
  noteFreq[3]["A"] = 220.000000000000000;
  noteFreq[3]["A#"] = 233.081880759044958;
  noteFreq[3]["B"] = 246.941650628062055;

    return noteFreq
  }

  setup(){
    this._noteFreq = this.createNoteTable()
    this._masterGainNode = this._audioContext.createGain()
    this._masterGainNode.connect(this._audioContext.destination)
    this._masterGainNode.gain.value = this._volumeControl.value

    this._volumeControl.addEventListener("change", ()=>{
      this.changeVolume()
    }, false);

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
    this._masterGainNode.gain.value = this._volumeControl.value
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
      this.notePressed(keyElement)  
    }, false)
    keyElement.addEventListener("mouseup", event =>{
      this.noteReleased(keyElement) 
    }, false)
    keyElement.addEventListener("mouseover", event =>{
      this.noteReleased(keyElement) 
    }, false)
    keyElement.addEventListener("mouseleave", event =>{
      this.noteReleased(keyElement) 
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

  notePressed(keyElement) {
    let dataset = keyElement.dataset
    if (!dataset["pressed"]) {
      this._oscList[dataset["octave"][dataset["note"]]] = this.playTone(dataset["frequency"])
      dataset["pressed"] = "yes"
    }
  }

  noteReleased(keyElement) {
    let dataset = keyElement.dataset
    if (dataset && dataset["pressed"]) {
      this._oscList[dataset["octave"][dataset["note"]]].stop()
      this._oscList[dataset["octave"][dataset["note"]]] = null
      delete dataset["pressed"]
    }
  }
}

  
window.customElements.define('synth-element', Synth)

module.exports = Synth