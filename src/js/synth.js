/**
 * Webcomponent for creating a synth application.
 *
 * @module src/synth.js
 * @author Lowe Marklund
 * @version 1.0
 */

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
    this._keyboard = document.querySelector(".keyboard")
    this._wavePicker = document.querySelector("select[name='waveform']")
    this._volumeControl = document.querySelector("input[name='volume']")
    this._audioContext = new (window.AudioContext || window.webkitAudioContext);
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
  
}
  
window.customElements.define('synth-element', Synth)

module.exports = Synth