/**
 * Webcomponent for creating a grid sequencer application.
 *
 * @module src/desktop.js
 * @author Lowe Marklund
 * @version 1.2
 */

const Synth = require('./synth')
const SequencerTemplate = require('./templates/sequencerTemplate')
const Pizzicato = require('./Pizzicato.js')
const template = SequencerTemplate.template

/**
 * A grid sequencer.
 *
 * @class Sequencer
 * @extends {window.HTMLElement}
 */

class Sequencer extends window.HTMLElement {
  /**
   * Creates an instance of Memory .
   * @memberof Sequencer
   */
  constructor () {
    super()
    this.attachShadow({mode: 'open'})
    this.shadowRoot.appendChild(template.content.cloneNode(true))
    this._sequencer = this.shadowRoot.querySelector('.sequencer')
    this._instrumentLog = this.shadowRoot.querySelector('.instrumentLog')
    this._inputs = this.shadowRoot.querySelector('.inputs')
    this._grid = this.shadowRoot.querySelector('.grid')
    this._pausePlayButton = this.shadowRoot.querySelector('.pausePlayButton')
    this._bpmLog = this.shadowRoot.querySelector('.bpmLog')
    this._bpmInput = this.shadowRoot.querySelector('.bpmInput')
    this._loopLengthLog = this.shadowRoot.querySelector('.loopLengthLog')
    this._loopLengthInput = this.shadowRoot.querySelector('.loopLengthInput')
    this._cells = this._grid.querySelectorAll('.cell')
    this._cellColumns = null
    this._storedGrid = null
    this._click = null
    this._tempo = 150
    this._trackSamples = {
      '1': document.createElement('audio'),
      '2': document.createElement('audio'),
      '3': document.createElement('audio'),
      '4': document.createElement('audio'),
      '5': document.createElement('audio'),
      '6': document.createElement('audio'),
      '7': document.createElement('audio'),
      '8': document.createElement('audio')
    }
    this._drumImages = {
      'kicks': '/image/kicks.png',
      'snares': '/image/snares.png',
      'hihats': '/image/hi-hats.png',
      'toms': '/image/toms.png',
      'cymbals': '/image/cymbals.png',
      'percussion': '/image/percussion.png',
      'claps': '/image/claps.png',
      'cowbells': '/image/cowbells.png',
      'synths': '/image/synths.png'
    }
    this._trackInstrument = {
      1: 'kicks',
      2: 'snares',
      3: 'hihats',
      4: 'toms',
      5: 'cymbals',
      6: 'percussion',
      7: 'claps',
      8: 'synths'
    }
    this._hasFocus = false
    this._synth = new Synth()
    this._isPlaying = false

    this._effects = {
      analyser: [],
      delay: [],
      flanger: [],
      reverb: [],
      tremolo: [],
      ringModulator: [],
    }
    
    this._flangerControl = this.shadowRoot.querySelector('#flanger')
    this._tremoloControl = this.shadowRoot.querySelector('#tremolo')
    this._reverbControl = this.shadowRoot.querySelector('#reverb')
    this._ringModulatorControl = this.shadowRoot.querySelector('#ringModulator')
    this._delayControl = this.shadowRoot.querySelector('#delay')
    this._lfoFrequency = this.shadowRoot.querySelector("input[name='lfoFreq']")
    this._audioContext = Pizzicato.context
    this._out = this._audioContext.destination
    this._effectsGainNode = this._audioContext.createGain()
  }
  /**
   * Watches attributes for changes on the element.
   *
   * @readonly
   * @static
   * @memberof Sequencer
   */
  static get observedAttributes () {
    return ['looplength', 'currentbeat']
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
    // re-renders grid when loop length is changed
    if (attributeName === 'looplength' && oldValue !== null) {
      this.storeGrid()
      this.removeGrid()
      this.renderGrid(this.getAttribute('instrument'))
      this.loadStoredGrid()
      clearInterval(this._click)
      if (this._sequencer.getElementsByClassName('pausePlayButton')[0].getAttribute('type') === 'pause') {
        if (Number(newValue) < Number(this.getAttribute('currentbeat'))) {
          this.setAttribute('currentbeat', '0')
        }
        // syncs with other sequencers
        this.timeSync()
      }
    }
  }
    /**
   * Called when the element is connected to the DOM.
   *
   * @memberof Sequencer
   */
  connectedCallback () {
    this.setAttribute('looplength', '16')
    this.renderGrid()
    this.inputListen()
    this._trackSamples['1'].src = '/audio/drums/kicks/1.wav'
    this._trackSamples['2'].src = '/audio/drums/snares/1.wav'
    this._trackSamples['3'].src = '/audio/drums/hihats/1.wav'
    this._trackSamples['4'].src = '/audio/drums/toms/1.wav'
    this._trackSamples['5'].src = '/audio/drums/cymbals/1.wav'
    this._trackSamples['6'].src = '/audio/drums/percussion/1.wav'
    this._trackSamples['7'].src = '/audio/drums/claps/1.wav'
    this.effectsRouting(true)
  }

     /**
   * Listens after input from the user.
   *
   * @memberof Sequencer
   */
  inputListen () {
    this._sequencer.addEventListener('mousedown', event => {
      // activates/deactivates cell
      if (event.target.getAttribute('class') === 'cell' && event.shiftKey === false) {
        if (event.target.getAttribute('active') === 'false') {
          this.cellActivate(event.target, true)
        } else {
          this.cellDeactivate(event.target)
        }
      }
      if (event.target.getAttribute('class') === 'cell' && event.target.getAttribute('active') === 'true' && event.shiftKey === true) {
        this.cellActivate(event.target, true, true)
      }

      // pauses and plays the sequencer(s)
      if (event.target.getAttribute('class') === 'pausePlayButton') {
        if (event.target.getAttribute('type') === 'play') {
          // syncs with other sequencers
          this.timeSync()
          this._isPlaying = true
        } else {
          for (let i = 0; i < this.parentNode.parentNode.querySelectorAll('grid-sequencer').length; i++) {
            clearInterval(this.parentNode.parentNode.querySelectorAll('grid-sequencer')[i]._click)
            this.parentNode.parentNode.querySelectorAll('grid-sequencer')[i]._pausePlayButton.setAttribute('type', 'play')
            this.parentNode.parentNode.querySelectorAll('grid-sequencer')[i]._pausePlayButton.setAttribute('src', '/image/icons8-play-button-50.png')
            this.parentNode.parentNode.querySelectorAll('grid-sequencer')[i]._isPlaying = false
          }
        }
      }
        // changes sample of the track
      if (event.target.getAttribute('class') === 'instrumentIcon') {
        // changes drumtype
        let currentInstrument = Number(event.target.getAttribute('type'))
        let drumTypes = ['kicks', 'snares', 'hihats', 'toms', 'cymbals', 'percussion', 'claps', 'cowbells', 'synths']
        let nextIcon

        if (Number(event.target.getAttribute('type')) + 1 > 8) {
          nextIcon = 0
          event.target.setAttribute('src', this._drumImages[drumTypes[nextIcon]])
          event.target.setAttribute('type', [`${nextIcon}`])
          event.target.nextSibling.innerText = '1'
          this._trackSamples[event.target.nextSibling.nextSibling.getAttribute('row')].src = `/audio/drums/${drumTypes[0]}/1.wav`
          this._trackInstrument[event.target.nextSibling.nextSibling.getAttribute('row')] = drumTypes[nextIcon]
        } else {
          nextIcon = Number(event.target.getAttribute('type')) + 1
          event.target.setAttribute('src', this._drumImages[drumTypes[nextIcon]])
          event.target.setAttribute('type', [`${nextIcon}`])
          event.target.nextSibling.innerText = '1'
          this._trackSamples[event.target.nextSibling.nextSibling.getAttribute('row')].src = `/audio/drums/${drumTypes[currentInstrument + 1]}/1.wav`
          this._trackInstrument[event.target.nextSibling.nextSibling.getAttribute('row')] = drumTypes[nextIcon]
        }
      }
      if (event.target.getAttribute('class') === 'instrumentNumber') {
        // changes sample number
        let currentInstrument = Number(event.target.previousSibling.getAttribute('type'))
        let instrumentTypeSampleAmount = {kicks: 26, snares: 23, hihats: 15, toms: 9, cymbals: 4, percussion: 13, claps: 6, cowbells: 1}
        let nextSample = Number(event.target.innerText) + 1

        if (nextSample > instrumentTypeSampleAmount[Object.keys(instrumentTypeSampleAmount)[currentInstrument]]) {
          event.target.innerText = '1'
        } else {
          event.target.innerText = nextSample
          this._trackSamples[event.target.nextSibling.getAttribute('row')].src = `/audio/drums/${Object.keys(instrumentTypeSampleAmount)[currentInstrument]}/${nextSample}.wav`
        }
      }

      // clears the grid
      if (event.target.getAttribute('class') === 'clearButton') {
        this.clearGrid()
      }
    })

    this._inputs.addEventListener('keydown', event => {
      if (event.key === 'Enter') {
            // Changes the loop length to what the user has entered
        if (event.target.getAttribute('class') === 'loopLengthInput') {
               // Error handling
          if (Number(event.target.value) <= 32 && Number(event.target.value) > 0) {
            this.setAttribute('looplength', event.target.value)

            this._loopLengthLog.innerText = 'Length: ' + event.target.value
            event.target.setAttribute('placeholder', 'Enter loop length (max = 32 min = 1)')
            event.target.value = null
            event.target.blur()
          } if (Number(event.target.value) > 32 || Number(event.target.value) < 0 || isNaN(Number(event.target.value)) === true) {
            event.target.setAttribute('placeholder', 'Value must be an integer between 1 and 32')
            event.target.value = null
            event.target.blur()
          }
        }
            // Changes the tempo to what the user has entered
        if (event.target.getAttribute('class') === 'bmpInput') {
          let input = Number(event.target.value)
            // Error handling
          if (input <= 300 && input >= 30) {
            for (let i = 0; i < this.parentNode.parentNode.querySelectorAll('grid-sequencer').length; i++) {
              this.parentNode.parentNode.querySelectorAll('grid-sequencer')[i]._bpmLog.innerText = 'BPM: ' + event.target.value
            }
            this._tempo = input
            event.target.setAttribute('placeholder', 'Enter tempo (BPM) max = 300 min = 30')
            event.target.value = null
            event.target.blur()
          }

          // syncs with other sequencers
          if (this._sequencer.getElementsByClassName('pausePlayButton')[0].getAttribute('type') === 'pause' && isNaN(input) === false) {
            this.timeSync()
          }

          if (isNaN(input) === true || input < 30 || input >= 300) {
            event.target.setAttribute('placeholder', 'Value must be an integer between 30 and 3')
            event.target.value = null
            event.target.blur()
          }
        }
      }
    })

    window.addEventListener("click", () =>{
      this._audioContext.resume()
    });
  }
    /**
   * Renders grid of the sequencer
   *
   * @memberof Sequencer
   */
  renderGrid () {
    let column = 0
    let row = 1
    let loopLength = Number(this.getAttribute('looplength'))
    let maxRows = 8

    for (let i = 0; i < loopLength * 9; i++) {
      if (i === 0) {
        let instrumentType = document.createElement('img')
        let instrumentNumber = document.createElement('h6')
        instrumentType.setAttribute('src', this._drumImages[this._trackInstrument[row]])
        instrumentType.setAttribute('type', `${row - 1}`)
        instrumentType.setAttribute('class', 'instrumentIcon')
        instrumentNumber.setAttribute('class', 'instrumentNumber')
        instrumentNumber.innerText = '1'
        this._grid.appendChild(instrumentType)
        this._grid.appendChild(instrumentNumber)
      }

      let cell = document.createElement('img')
      column += 1
      cell.setAttribute('active', `false`)
      cell.setAttribute('id', `${i}`)
      cell.setAttribute('class', `cell`)
      cell.setAttribute('column', `${column}`)
      cell.setAttribute('row', `${row}`)
      cell.setAttribute('note', 'C')
      cell.setAttribute('octave', '3')
      cell.setAttribute('noteLength', '100')
      cell.setAttribute('notemenuopen', 'false')
      cell.setAttribute('chosen', 'false')
      this._grid.appendChild(cell)

      if (column === loopLength) {
        let rowBreak = document.createElement('br')
        let instrumentType = document.createElement('img')
        let instrumentNumber = document.createElement('h6')
        instrumentType.setAttribute('src', this._drumImages[this._trackInstrument[row + 1]])
        instrumentType.setAttribute('type', `${row}`)
        instrumentType.setAttribute('class', 'instrumentIcon')
        instrumentNumber.setAttribute('class', 'instrumentNumber')
        instrumentNumber.innerText = '1'
        this._grid.appendChild(rowBreak)
        this._grid.appendChild(instrumentType)
        this._grid.appendChild(instrumentNumber)

        column = 0
        row += 1
      }

      if (row > maxRows) {
        this._cells = this._grid.querySelectorAll('.cell')
        this._grid.removeChild(this._grid.querySelectorAll('.instrumentIcon')[(this._grid.querySelectorAll('.instrumentIcon').length) - 1])
        this._grid.removeChild(this._grid.querySelectorAll('.instrumentNumber')[(this._grid.querySelectorAll('.instrumentNumber').length) - 1])
        this._cellColumns = column
        if (loopLength > 16) {
          this._sequencer.style.width = `${loopLength * 31}px`
        } else {
          this._sequencer.style.width = '500px'
        }
        return this._grid
      }
    }
  }
     /**
   * Removes grid of the sequencer
   *
   * @memberof Sequencer
   */
  removeGrid () {
    let gridLength = this._grid.children.length
    for (let i = 0; i < gridLength; i++) {
      this._grid.removeChild(this._grid.firstElementChild)
    }
  }
   /**
   * Deactivates all cells of the sequencer
   *
   * @memberof Sequencer
   */
  clearGrid () {
    let gridLength = this._cells.length

    for (let i = 0; i < gridLength; i++) {
      this.cellDeactivate(this._cells[i])
      if (this._pausePlayButton.getAttribute('type') === 'pause') {
        for (let i = 0; i < this.parentNode.parentNode.querySelectorAll('grid-sequencer').length; i++) {
          clearInterval(this.parentNode.parentNode.querySelectorAll('grid-sequencer')[i]._click)
          this.parentNode.parentNode.querySelectorAll('grid-sequencer')[i].playGrid()
        }
      }
    }
  }
    /**
   * Stores a map of the sequencers activated cells
   *
   * @memberof Sequencer
   */
  storeGrid () {
    let grid = {}

    for (let i = 1; i <= 8; i++) {
      grid[i] = []
    }

    for (let i = 0; i < this._cells.length; i++) {
      if (this._cells[i].getAttribute('active') === 'true') {
        grid[Number(this._cells[i].getAttribute('row'))].push(this._cells[i].getAttribute('column'))
      }
    }
    this._storedGrid = grid
  }
   /**
   * Loads a map of activated cells into the sequencer
   *
   * @memberof Sequencer
   */
  loadStoredGrid () {
    for (let i = 0; i < this._cells.length; i++) {
      if (this._cells[i].getAttribute('column') === this.getAttribute('currentbeat') && this._cells[i].getAttribute('chosen') === 'false') {
        this._cells[i].style.backgroundColor = 'red'
      }

      for (let i2 = 0; i2 < this._storedGrid[Number(this._cells[i].getAttribute('row'))].length; i2++) {
        if (this._storedGrid[Number(this._cells[i].getAttribute('row'))][i2] === this._cells[i].getAttribute('column')) {
          this.cellActivate(this._cells[i])
        }
      }
    }
  }
   /**
   * Plays the sequencer
   *
   * @param {string} beat - The grid column to start playing at
   * @param {number} tempo - The tempo to play at
   * @return {function} - An interval creating each beat of the sequencer
   * @memberof Sequencer
   */
  playGrid (beat = this.getAttribute('currentbeat'), tempo = this._tempo) {
    let column = Number(beat)
    let cells = this._grid.querySelectorAll('.cell')

    let click = setInterval(() => {
      for (let i = 0; i < cells.length; i += 1) {
        if (Number(cells[i].getAttribute('column')) === column) {
          if (this._cells[i].getAttribute('chosen') === 'false') {
            cells[i].style.backgroundColor = 'red'
          }

          this.setAttribute('currentbeat', column)

          if (i > 0 && cells[i - 1].getAttribute('active') === 'false') {
            this.cellDeactivate(cells[i - 1])
          }
          if (cells[i].getAttribute('active') === 'true') {
            if (this._trackInstrument[cells[i].getAttribute('row')] === 'synths') {
              let note = cells[i].getAttribute('note')
              let octave = Number(cells[i].getAttribute('octave'))
              let frequency = this._synth._noteFreq[octave][note]
              let key = this._synth.createKey(note, octave, frequency, note + `${octave}`)
              this._synth.notePressed(key, note + `${octave}`, cells[i])
            }

            this._trackSamples[cells[i].getAttribute('row')].pause()
            this._trackSamples[cells[i].getAttribute('row')].currentTime = 0
            let playPromise = this._trackSamples[cells[i].getAttribute('row')].play()
            playPromise.then(_ => {

            }).catch(error => {

            })
          } else {
            this.cellDeactivate(cells[(cells.length) - 1])
          }
        }
        if (cells[i].getAttribute('active') === 'true' && cells[i].getAttribute('chosen') === 'false') {
          this.cellActivate(cells[i], false)
        }
      }

      if (column >= Number(this.getAttribute('looplength'))) {
        column = 1
      } else {
        column += 1
      }
    }, (60000 / tempo) / 4)

    this._click = click
  }
  /**
   * Syncs all the sequencers open on the desktop to start/stop at the same time
   *
   * @memberof Sequencer
   */
  timeSync () {
    for (let i = 0; i < this.parentNode.parentNode.querySelectorAll('grid-sequencer').length; i++) {
      clearInterval(this.parentNode.parentNode.querySelectorAll('grid-sequencer')[i]._click)
      let currentBeat = this.parentNode.parentNode.querySelectorAll('grid-sequencer')[i].getAttribute('currentbeat')
      this.parentNode.parentNode.querySelectorAll('grid-sequencer')[i].playGrid(currentBeat, this._tempo)
      this.parentNode.parentNode.querySelectorAll('grid-sequencer')[i]._bpmLog.innerText = `BPM: ${this._tempo}`
      if (this._pausePlayButton.getAttribute('type') === 'play') {
        this.parentNode.parentNode.querySelectorAll('grid-sequencer')[i]._pausePlayButton.setAttribute('type', 'pause')
        this.parentNode.parentNode.querySelectorAll('grid-sequencer')[i]._pausePlayButton.setAttribute('src', '/image/icons8-pause-button-50.png')
      } else {
        this.parentNode.parentNode.querySelectorAll('grid-sequencer')[i]._pausePlayButton.setAttribute('type', 'pause')
        this.parentNode.parentNode.querySelectorAll('grid-sequencer')[i]._pausePlayButton.setAttribute('src', '/image/icons8-pause-button-50.png')
      }
    }
  }
  /**
   * Activates a cell in the grid
   *
   * @memberof Sequencer
   */
  cellDeactivate (cell) {
    cell.setAttribute('active', 'false')
    cell.style.backgroundColor = 'white'
  }
  /**
   * Deactivates a cell in the grid
   *
   * @memberof Sequencer
   */
  cellActivate (cell, cellClicked, shiftClick) {
    cell.setAttribute('active', 'true')
    cell.style.backgroundColor = 'yellow'

    if (cellClicked === true) {
      cell.style.backgroundColor = 'green'
      cell.setAttribute('chosen', 'true')
      this._grid.querySelectorAll('.cell').forEach(c => {
        if (c.getAttribute('active') === 'true' && c !== cell) {
          this.cellActivate(c, false)
        }
      })
    }

    if (this._trackInstrument[cell.getAttribute('row')] === 'synths' && cellClicked === true) {
      if (this.shadowRoot.querySelectorAll('.changeNoteMenu')[0]) {
        this.shadowRoot.querySelectorAll('.changeNoteMenu')[0].setAttribute('assignedCell', cell.id)
        this.shadowRoot.querySelectorAll('.noteSelectionMenu')[0].children[1].value = cell.getAttribute('note')
        this.shadowRoot.querySelectorAll('.octaveSelectionMenu')[0].children[1].value = cell.getAttribute('octave')
        this.shadowRoot.querySelectorAll('.noteLengthInput')[0].children[1].value = cell.getAttribute('noteLength')
        cell.style.border = 'green'
      } else {
        this.changeCellNote(cell)
      }
    } if (this.shadowRoot.querySelectorAll('.changeNoteMenu')[0] && this._trackInstrument[cell.getAttribute('row')] !== 'synths' && cellClicked === true) {
      this._grid.removeChild(this.shadowRoot.querySelectorAll('.changeNoteMenu')[0])
    }
  }

  changeCellNote (cell) {
    let changeNoteMenu = document.createElement('div')
    let noteSelectionMenu = document.createElement('div')
    let octaveSelectionMenu = document.createElement('div')
    let noteLengthInput = document.createElement('div')
    let closeButton = document.createElement('div')

    changeNoteMenu.setAttribute('class', 'changeNoteMenu')
    noteSelectionMenu.setAttribute('class', 'noteSelectionMenu')
    octaveSelectionMenu.setAttribute('class', 'octaveSelectionMenu')
    noteLengthInput.setAttribute('class', 'noteLengthInput')

    noteSelectionMenu.innerHTML =
    `<span>Note: </span>
    <select name="note">
      <option value="C" selected>C</option>
      <option value="C#">C#</option>
      <option value="D">D</option>
      <option value="D#">D#</option>
      <option value="E">E</option>
      <option value="F">F</option>
      <option value="F#">F#</option>
      <option value="G">G</option>
      <option value="G#">G#</option>
      <option value="A">A</option>
      <option value="A#">A#</option>
      <option value="B">B</option>
    </select>`
    octaveSelectionMenu.innerHTML =
    `<span>Octave: </span>
    <select name="octave">
      <option value="1">1</option>
      <option value="2">2</option>
      <option value="3" selected>3</option>
      <option value="4">4</option>
      <option value="5">5</option>
      <option value="6">6</option>
      <option value="7">7</option>
    </select>`

    noteLengthInput.innerHTML =
    `<span>NoteLength: </span>
    <input type="range" min="0" max="1000" step="10"
        value="200" list="noteLengths" name="noteLength">
    <datalist id="noteLength">
      <option value="0.0" label="Mute">
      <option value="1.0" label="100%">
    </datalist>`

    changeNoteMenu.setAttribute('assignedcell', cell.id)

    closeButton.innerText = 'x'

    if (cell.getAttribute('notemenuopen') === 'false') {
      changeNoteMenu.appendChild(noteSelectionMenu)
      changeNoteMenu.appendChild(octaveSelectionMenu)
      changeNoteMenu.appendChild(noteLengthInput)
      changeNoteMenu.appendChild(closeButton)

      cell.parentNode.appendChild(changeNoteMenu)
      cell.setAttribute('notemenuopen', 'true')
    }

    let changeNoteElement = this.shadowRoot.querySelector("select[name='note']")
    let changeOctaveElement = this.shadowRoot.querySelector("select[name='octave']")
    let changeNoteLengthElement = this.shadowRoot.querySelector("input[name='noteLength']")

    if (cell.getAttribute('note') && cell.getAttribute('octave') && cell.getAttribute('noteLength') && this._grid.querySelectorAll('.changeNoteMenu')[0]) {
      changeNoteElement.value = cell.getAttribute('note')
      changeOctaveElement.value = cell.getAttribute('octave')
      changeNoteLengthElement.value = cell.getAttribute('noteLength')
    }

    changeNoteMenu.onchange = () => {
      let cells = this._grid.querySelectorAll('.cell')
      cells.forEach(c => {
        if (c.id === changeNoteMenu.getAttribute('assignedcell')) {
          c.setAttribute('note', `${changeNoteElement.value}`)
          c.setAttribute('octave', `${changeOctaveElement.value}`)
          c.setAttribute('noteLength', `${changeNoteLengthElement.value}`)
        }
      })
    }

    closeButton.onclick = (event) => {
      for (let i = 0; i < event.target.parentNode.children.length;) {
        event.target.parentNode.removeChild(event.target.parentNode.children[i])
      }
    }
  }

  effectsRouting (defaultSettings, track) {
    let effectOptionObj
    let oldReverb
    let oldFlanger
    let oldTremolo
    let oldDelay
    let oldRingModulator

    if (this._analyser && track) {
      oldReverb = this._effect.reverb[track]
      oldFlanger = this._effect.flanger[track]
      oldTremolo = this._effect.tremolo[track]
      oldDelay = this._effect.delay[track]
      oldRingModulator = this._effect.delay[track]
    }

    if (defaultSettings === false || defaultSettings === undefined) {
      effectOptionObj = {
        flanger: this._effects.flanger.options,
        delay: this._effects.delay.options,
        reverb: this._effects.reverb.options,
        tremolo: this._effects.tremolo.options,
        ringmodulator: this._effects.ringModulator.options
      }
    }

    if (defaultSettings === true) {
      effectOptionObj = {
        delay: {
          feedback: 0,
          time: 0,
          mix: 0
        },
        flanger: {
          time: 0,
          speed: 0,
          depth: 0,
          feedback: 0,
          mix: 0
        },
        reverb: {
          time: 0,
          decay: 0,
          reverse: false,
          mix: 0
        },
        tremolo: {
          speed: 0,
          depth: 0,
          mix: 0
        },
        ringmodulator:
        {
          speed: 0,
          distortion: 0,
          mix: 0
        }
      }
    }

  

    for(let i=0; i<7; i++){
      this._effects.analyser.push(this._audioContext.createAnalyser()) 
      this._effects.delay.push(new Pizzicato.Effects.Delay(effectOptionObj.delay))
      this._effects.flanger.push(new Pizzicato.Effects.Flanger(effectOptionObj.flanger))
      this._effects.reverb.push(new Pizzicato.Effects.Reverb(effectOptionObj.reverb))
      this._effects.tremolo.push(new Pizzicato.Effects.Tremolo(effectOptionObj.tremolo))
      this._effects.ringModulator.push(new Pizzicato.Effects.RingModulator(effectOptionObj.ringmodulator))
    }

    Object.values(this._effects).forEach(effect => {
      effect.forEach((trackEffect, i) => {
        this._effects.flanger[i].connect(this._effects.tremolo[i])
        this._effects.tremolo[i].connect(this._effects.ringModulator[i])
        this._effects.ringModulator[i].connect(this._effects.delay[i])
        this._effects.delay[i].connect(this._effects.reverb[i])
        this._effects.reverb[i].connect(this._effects.analyser[i])
        this._effects.analyser[i].connect(this._out) 
      });
    });
    
    
    if (oldReverb !== undefined) {
      oldReverb.disconnect()
      oldFlanger.disconnect()
      oldDelay.disconnect()
      oldRingModulator.disconnect()
      oldTremolo.disconnect()
  }
}
  resumeAudio(){
    if(typeof this._audioContext === "undefined" || this._audioContext === null){
      return;
    } 
    if(this._audioContext.state === "suspended"){
      this._audioContext.resume();
    } 
 }    
}

window.customElements.define('grid-sequencer', Sequencer)

module.exports = Sequencer
