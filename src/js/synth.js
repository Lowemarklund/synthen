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
    <div>
    <style>
    </style>
</div>
`

/**
 * Synth.
 *
 * @class Sequencer
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
  }

  /**
   * Watches attributes for changes on the element.
   *
   * @readonly
   * @static
   * @memberof Sequencer
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
   * @memberof Sequencer
   */
  attributeChangedCallback (attributeName, oldValue, newValue) {
    
  }
    /**
   * Called when the element is connected to the DOM.
   *
   * @memberof Sequencer
   */
  connectedCallback () {
  }

     /**
   * Listens after input from the user.
   *
   * @memberof Sequencer
   */
  inputListen () {
    
  }
  
}
  
module.exports = Synth