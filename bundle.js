(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
(function (global){
(function (root) {
  'use strict'

  var Pizzicato = {}
  var Pz = Pizzicato
  var commonJS = typeof module === 'object' && module.exports
  var amd = typeof define === 'function' && define.amd

  if (commonJS) { module.exports = Pizzicato } else if (amd) { define([], Pizzicato) } else		{ root.Pizzicato = root.Pz = Pizzicato }

  var AudioContext = root.AudioContext || root.webkitAudioContext

  if (!AudioContext) {
    console.error('No AudioContext found in this environment. Please ensure your window or global object contains a working AudioContext constructor function.')
    return
  }

  Pizzicato.context = new AudioContext()

  var masterGainNode = Pizzicato.context.createGain()
  masterGainNode.connect(Pizzicato.context.destination)

  Pizzicato.Util = {

    isString: function (arg) {
      return toString.call(arg) === '[object String]'
    },

    isObject: function (arg) {
      return toString.call(arg) === '[object Object]'
    },

    isFunction: function (arg) {
      return toString.call(arg) === '[object Function]'
    },

    isNumber: function (arg) {
      return toString.call(arg) === '[object Number]' && arg === +arg
    },

    isArray: function (arg) {
      return toString.call(arg) === '[object Array]'
    },

    isInRange: function (arg, min, max) {
      if (!Pz.Util.isNumber(arg) || !Pz.Util.isNumber(min) || !Pz.Util.isNumber(max)) { return false }

      return arg >= min && arg <= max
    },

    isBool: function (arg) {
      return typeof (arg) === 'boolean'
    },

    isOscillator: function (audioNode) {
      return (audioNode && audioNode.toString() === '[object OscillatorNode]')
    },

    isAudioBufferSourceNode: function (audioNode) {
      return (audioNode && audioNode.toString() === '[object AudioBufferSourceNode]')
    },

    isSound: function (sound) {
      return sound instanceof Pz.Sound
    },

    isEffect: function (effect) {
      for (var key in Pizzicato.Effects) {
        if (effect instanceof Pizzicato.Effects[key]) { return true }
      }

      return false
    },

		// Takes a number from 0 to 1 and normalizes it to fit within range floor to ceiling
    normalize: function (num, floor, ceil) {
      if (!Pz.Util.isNumber(num) || !Pz.Util.isNumber(floor) || !Pz.Util.isNumber(ceil)) { return }

      return ((ceil - floor) * num) / 1 + floor
    },

    getDryLevel: function (mix) {
      if (!Pz.Util.isNumber(mix) || mix > 1 || mix < 0) { return 0 }

      if (mix <= 0.5) { return 1 }

      return 1 - ((mix - 0.5) * 2)
    },

    getWetLevel: function (mix) {
      if (!Pz.Util.isNumber(mix) || mix > 1 || mix < 0) { return 0 }

      if (mix >= 0.5) { return 1 }

      return 1 - ((0.5 - mix) * 2)
    }
  }
	/* In order to allow an AudioNode to connect to a Pizzicato
	Effect object, we must shim its connect method */
  var gainNode = Pizzicato.context.createGain()
  var audioNode = Object.getPrototypeOf(Object.getPrototypeOf(gainNode))
  var connect = audioNode.connect

  audioNode.connect = function (node) {
    var endpoint = Pz.Util.isEffect(node) ? node.inputNode : node
    connect.call(this, endpoint)
    return node
  }

  Object.defineProperty(Pizzicato, 'volume', {
    enumerable: true,

    get: function () {
      return masterGainNode.gain.value
    },

    set: function (volume) {
      if (Pz.Util.isInRange(volume, 0, 1) && masterGainNode) { masterGainNode.gain.value = volume }
    }
  })

  Object.defineProperty(Pizzicato, 'masterGainNode', {
    enumerable: false,

    get: function () {
      return masterGainNode
    },

    set: function (volume) {
      console.error('Can\'t set the master gain node')
    }
  })
  Pizzicato.Events = {

			/**
			 * Adds an event handler that will be treated upon
			 * the triggering of that event.
			 */
    on: function (name, callback, context) {
      if (!name || !callback) { return }

      this._events = this._events || {}
      var _event = this._events[name] || (this._events[name] = [])

      _event.push({
        callback: callback,
        context: context || this,
        handler: this
      })
    },

			/**
			 * Triggers a particular event. If a handler
			 * is linked to that event, the handler will be
			 * executed.
			 */
    trigger: function (name) {
      if (!name) { return }

      var _event, length, args, i

      this._events = this._events || {}
      _event = this._events[name] || (this._events[name] = [])

      if (!_event) { return }

      length = Math.max(0, arguments.length - 1)
      args = []

      for (i = 0; i < length; i++) { args[i] = arguments[i + 1] }

      for (i = 0; i < _event.length; i++) { _event[i].callback.apply(_event[i].context, args) }
    },

			/**
			 * Removes an event handler. If no name is provided,
			 * all handlers for this object will be removed.
			 */
    off: function (name) {
      if (name) { this._events[name] = undefined } else					{ this._events = {} }
    }

  }
  Pizzicato.Sound = function (description, callback) {
    var self = this
    var util = Pizzicato.Util
    var descriptionError = getDescriptionError(description)
    var hasOptions = util.isObject(description) && util.isObject(description.options)
    var defaultAttack = 0.04
    var defaultRelease = 0.04

    if (descriptionError) {
      console.error(descriptionError)
      throw new Error('Error initializing Pizzicato Sound: ' + descriptionError)
    }

    this.detached = hasOptions && description.options.detached
    this.masterVolume = Pizzicato.context.createGain()
    this.fadeNode = Pizzicato.context.createGain()
    this.fadeNode.gain.value = 0

    if (!this.detached) { this.masterVolume.connect(Pizzicato.masterGainNode) }

    this.lastTimePlayed = 0
    this.effects = []
    this.effectConnectors = []
    this.playing = this.paused = false
    this.loop = hasOptions && description.options.loop
    this.attack = hasOptions && util.isNumber(description.options.attack) ? description.options.attack : defaultAttack
    this.volume = hasOptions && util.isNumber(description.options.volume) ? description.options.volume : 1

    if (hasOptions && util.isNumber(description.options.release)) {
      this.release = description.options.release
    } else if (hasOptions && util.isNumber(description.options.sustain)) {
      console.warn('\'sustain\' is deprecated. Use \'release\' instead.')
      this.release = description.options.sustain
    } else {
      this.release = defaultRelease
    }

    if (!description) { (initializeWithWave.bind(this))({}, callback) } else if (util.isString(description)) { (initializeWithUrl.bind(this))(description, callback) } else if (util.isFunction(description)) { (initializeWithFunction.bind(this))(description, callback) } else if (description.source === 'file') { (initializeWithUrl.bind(this))(description.options.path, callback) } else if (description.source === 'wave') { (initializeWithWave.bind(this))(description.options, callback) } else if (description.source === 'input') { (initializeWithInput.bind(this))(description, callback) } else if (description.source === 'script') { (initializeWithFunction.bind(this))(description.options, callback) } else if (description.source === 'sound') { (initializeWithSoundObject.bind(this))(description.options, callback) }

    function getDescriptionError (description) {
      var supportedSources = ['wave', 'file', 'input', 'script', 'sound']

      if (description && (!util.isFunction(description) && !util.isString(description) && !util.isObject(description))) { return 'Description type not supported. Initialize a sound using an object, a function or a string.' }

      if (util.isObject(description)) {
        if (!util.isString(description.source) || supportedSources.indexOf(description.source) === -1) { return 'Specified source not supported. Sources can be wave, file, input or script' }

        if (description.source === 'file' && (!description.options || !description.options.path)) { return 'A path is needed for sounds with a file source' }

        if (description.source === 'script' && (!description.options || !description.options.audioFunction)) { return 'An audio function is needed for sounds with a script source' }
      }
    }

    function initializeWithWave (waveOptions, callback) {
      waveOptions = waveOptions || {}
      this.getRawSourceNode = function () {
        var frequency = this.sourceNode ? this.sourceNode.frequency.value : waveOptions.frequency
        var node = Pizzicato.context.createOscillator()
        node.type = waveOptions.type || 'sine'
        node.frequency.value = (frequency || 440)

        return node
      }
      this.sourceNode = this.getRawSourceNode()
      this.sourceNode.gainSuccessor = Pz.context.createGain()
      this.sourceNode.connect(this.sourceNode.gainSuccessor)

      if (util.isFunction(callback)) { callback() }
    }

    function initializeWithUrl (paths, callback) {
      paths = util.isArray(paths) ? paths : [paths]

      var request = new XMLHttpRequest()
      request.open('GET', paths[0], true)
      request.responseType = 'arraybuffer'

      request.onload = function (progressEvent) {
        Pizzicato.context.decodeAudioData(progressEvent.target.response, function (buffer) {
          self.getRawSourceNode = function () {
            var node = Pizzicato.context.createBufferSource()
            node.loop = this.loop
            node.buffer = buffer
            return node
          }
          if (util.isFunction(callback)) { callback() }
        }, function (error) {
          console.error('Error decoding audio file ' + paths[0])

          if (paths.length > 1) {
            paths.shift()
            initializeWithUrl(paths, callback)
            return
          }

          error = error || new Error('Error decoding audio file ' + paths[0])

          if (util.isFunction(callback)) { callback(error) }
        })
      }
      request.onreadystatechange = function (event) {
        if (request.readyState === 4 && request.status !== 200) {
          console.error('Error while fetching ' + paths[0] + '. ' + request.statusText)
        }
      }
      request.send()
    }

    function initializeWithInput (options, callback) {
      navigator.getUserMedia = (navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia)

      if (!navigator.getUserMedia) {
        console.error('Your browser does not support getUserMedia')
        return
      }

      navigator.getUserMedia({
        audio: true
      }, function (stream) {
        self.getRawSourceNode = function () {
          return Pizzicato.context.createMediaStreamSource(stream)
        }
        if (util.isFunction(callback)) { callback() }
      }, function (error) {
        if (util.isFunction(callback)) { callback(error) }
      })
    }

    function initializeWithFunction (options, callback) {
      var audioFunction = util.isFunction(options) ? options : options.audioFunction
      var bufferSize = util.isObject(options) && options.bufferSize ? options.bufferSize : null

      if (!bufferSize) {
        try { // Webkit does not automatically chose the buffer size
          var test = Pizzicato.context.createScriptProcessor()
        } catch (e) {
          bufferSize = 2048
        }
      }

      this.getRawSourceNode = function () {
        var node = Pizzicato.context.createScriptProcessor(bufferSize, 1, 1)
        node.onaudioprocess = audioFunction
        return node
      }
    }

    function initializeWithSoundObject (options, callback) {
      this.getRawSourceNode = options.sound.getRawSourceNode

      if (options.sound.sourceNode && Pz.Util.isOscillator(options.sound.sourceNode)) {
        this.sourceNode = this.getRawSourceNode()
        this.frequency = options.sound.frequency
      }
    }
  }

  Pizzicato.Sound.prototype = Object.create(Pizzicato.Events, {

    play: {
      enumerable: true,

      value: function (when, offset) {
        if (this.playing) { return }

        if (!Pz.Util.isNumber(offset)) { offset = this.offsetTime || 0 }

        if (!Pz.Util.isNumber(when)) { when = 0 }

        this.playing = true
        this.paused = false
        this.sourceNode = this.getSourceNode()

        this.applyAttack()

        if (Pz.Util.isFunction(this.sourceNode.start)) {
          this.lastTimePlayed = Pizzicato.context.currentTime - offset
          this.sourceNode.start(Pz.context.currentTime + when, offset)
        }

        this.trigger('play')
      }
    },

    stop: {
      enumerable: true,

      value: function () {
        if (!this.paused && !this.playing) { return }

        this.paused = this.playing = false
        this.stopWithRelease()

        this.offsetTime = 0
        this.trigger('stop')
      }
    },

    pause: {
      enumerable: true,

      value: function () {
        if (this.paused || !this.playing) { return }

        this.paused = true
        this.playing = false

        this.stopWithRelease()

        var elapsedTime = Pz.context.currentTime - this.lastTimePlayed

				// If we are using a buffer node - potentially in loop mode - we need to
				// know where to re-start the sound independently of the loop it is in.
        if (this.sourceNode.buffer) { this.offsetTime = elapsedTime % (this.sourceNode.buffer.length / Pz.context.sampleRate) } else					{ this.offsetTime = elapsedTime }

        this.trigger('pause')
      }
    },

    clone: {
      enumerable: true,

      value: function () {
        var clone = new Pizzicato.Sound({
          source: 'sound',
          options: {
            loop: this.loop,
            attack: this.attack,
            release: this.release,
            volume: this.volume,
            sound: this
          }
        })

        for (var i = 0; i < this.effects.length; i++) { clone.addEffect(this.effects[i]) }

        return clone
      }
    },

    onEnded: {
      enumerable: true,

      value: function (node) {
        return function () {
					// This function may've been called from the release
					// end. If in that time the Sound has been played again,
					// no action should be taken.
          if (!!this.sourceNode && this.sourceNode !== node) { return }

          if (this.playing) { this.stop() }
          if (!this.paused) { this.trigger('end') }
        }
      }
    },

		/**
		 * Adding effects will create a graph in which there will be a
		 * gain node (effectConnector) in between every effect added. For example:
		 * [fadeNode]--->[effect 1]->[connector 1]--->[effect 2]->[connector 2]--->[masterGain]
		 *
		 * Connectors are used to know what nodes to disconnect and not disrupt the
		 * connections of another Pz.Sound object using the same effect.
		 */
    addEffect: {
      enumerable: true,

      value: function (effect) {
        if (!Pz.Util.isEffect(effect)) {
          console.error('The object provided is not a Pizzicato effect.')
          return this
        }

        this.effects.push(effect)

				// Connects effect in the last position
        var previousNode = this.effectConnectors.length > 0 ? this.effectConnectors[this.effectConnectors.length - 1] : this.fadeNode
        previousNode.disconnect()
        previousNode.connect(effect)

				// Creates connector for the newly added effect
        var gain = Pz.context.createGain()
        this.effectConnectors.push(gain)
        effect.connect(gain)
        gain.connect(this.masterVolume)

        return this
      }
    },

		/**
		 * When removing effects, the graph in which there will be a
		 * gain node (effectConnector) in between every effect should be
		 * conserved. For example:
		 * [fadeNode]--->[effect 1]->[connector 1]--->[effect 2]->[connector 2]--->[masterGain]
		 *
		 * Connectors are used to know what nodes to disconnect and not disrupt the
		 * connections of another Pz.Sound object using the same effect.
		 */
    removeEffect: {
      enumerable: true,

      value: function (effect) {
        var index = this.effects.indexOf(effect)

        if (index === -1) {
          console.warn('Cannot remove effect that is not applied to this sound.')
          return this
        }

        var shouldResumePlaying = this.playing

        if (shouldResumePlaying) { this.pause() }

        var previousNode = (index === 0) ? this.fadeNode : this.effectConnectors[index - 1]
        previousNode.disconnect()

				// Disconnect connector and effect
        var effectConnector = this.effectConnectors[index]
        effectConnector.disconnect()
        effect.disconnect(effectConnector)

				// Remove connector and effect from our arrays
        this.effectConnectors.splice(index, 1)
        this.effects.splice(index, 1)

        var targetNode
        if (index > this.effects.length - 1 || this.effects.length === 0) { targetNode = this.masterVolume } else					{ targetNode = this.effects[index] }

        previousNode.connect(targetNode)

        if (shouldResumePlaying) { this.play() }

        return this
      }
    },

    connect: {
      enumerable: true,

      value: function (audioNode) {
        this.masterVolume.connect(audioNode)
        return this
      }
    },

    disconnect: {
      enumerable: true,

      value: function (audioNode) {
        this.masterVolume.disconnect(audioNode)
        return this
      }
    },

    connectEffects: {
      enumerable: true,

      value: function () {
        var connectors = []

        for (var i = 0; i < this.effects.length; i++) {
          var isLastEffect = i === this.effects.length - 1
          var destinationNode = isLastEffect ? this.masterVolume : this.effects[i + 1].inputNode

          connectors[i] = Pz.context.createGain()

          this.effects[i].outputNode.disconnect(this.effectConnectors[i])

          this.effects[i].outputNode.connect(destinationNode)
        }
      }
    },

    volume: {
      enumerable: true,

      get: function () {
        if (this.masterVolume) { return this.masterVolume.gain.value }
      },

      set: function (volume) {
        if (Pz.Util.isInRange(volume, 0, 1) && this.masterVolume) { this.masterVolume.gain.value = volume }
      }
    },

    frequency: {
      enumerable: true,

      get: function () {
        if (this.sourceNode && Pz.Util.isOscillator(this.sourceNode)) {
          return this.sourceNode.frequency.value
        }

        return null
      },

      set: function (frequency) {
        if (this.sourceNode && Pz.Util.isOscillator(this.sourceNode)) {
          this.sourceNode.frequency.value = frequency
        }
      }
    },

		/**
	 	 * @deprecated - Use "release"
		 */
    sustain: {
      enumerable: true,

      get: function () {
        console.warn('\'sustain\' is deprecated. Use \'release\' instead.')
        return this.release
      },

      set: function (sustain) {
        console.warn('\'sustain\' is deprecated. Use \'release\' instead.')

        if (Pz.Util.isInRange(sustain, 0, 10)) { this.release = sustain }
      }
    },

		/**
		 * Returns the node that produces the sound. For example, an oscillator
		 * if the Sound object was initialized with a wave option.
		 */
    getSourceNode: {
      enumerable: true,

      value: function () {
        if (this.sourceNode) {
					// Directly disconnecting the previous source node causes a
					// 'click' noise, especially noticeable if the sound is played
					// while the release is ongoing. To address this, we fadeout the
					// old source node before disonnecting it.

          var previousSourceNode = this.sourceNode
          previousSourceNode.gainSuccessor.gain.setValueAtTime(previousSourceNode.gainSuccessor.gain.value, Pz.context.currentTime)
          previousSourceNode.gainSuccessor.gain.linearRampToValueAtTime(0.0001, Pz.context.currentTime + 0.2)
          setTimeout(function () {
            previousSourceNode.disconnect()
            previousSourceNode.gainSuccessor.disconnect()
          }, 200)
        }

        var sourceNode = this.getRawSourceNode()

				// A gain node will be placed after the source node to avoid
				// clicking noises (by fading out the sound)
        sourceNode.gainSuccessor = Pz.context.createGain()
        sourceNode.connect(sourceNode.gainSuccessor)
        sourceNode.gainSuccessor.connect(this.fadeNode)
        this.fadeNode.connect(this.getInputNode())

        if (Pz.Util.isAudioBufferSourceNode(sourceNode)) { sourceNode.onended = this.onEnded(sourceNode).bind(this) }

        return sourceNode
      }
    },

		/**
		 * Returns the first node in the graph. When there are effects,
		 * the first node is the input node of the first effect.
		 */
    getInputNode: {
      enumerable: true,

      value: function () {
        if (this.effects.length > 0) { return this.effects[0].inputNode }

        return this.masterVolume
      }
    },

		/**
		 * Will take the current source node and work up the volume
		 * gradually in as much time as specified in the attack property
		 * of the sound.
		 */
    applyAttack: {
      enumerable: false,

      value: function () {
        var currentValue = this.fadeNode.gain.value
        this.fadeNode.gain.cancelScheduledValues(Pz.context.currentTime)
        this.fadeNode.gain.setValueAtTime(currentValue, Pz.context.currentTime)

        if (!this.attack) {
          this.fadeNode.gain.setValueAtTime(1.0, Pizzicato.context.currentTime)
          return
        }

        var remainingAttackTime = (1 - this.fadeNode.gain.value) * this.attack
        this.fadeNode.gain.setValueAtTime(this.fadeNode.gain.value, Pizzicato.context.currentTime)
        this.fadeNode.gain.linearRampToValueAtTime(1, Pizzicato.context.currentTime + remainingAttackTime)
      }
    },

		/**
		 * Will take the current source node and work down the volume
		 * gradually in as much time as specified in the release property
		 * of the sound before stopping the source node.
		 */
    stopWithRelease: {
      enumerable: false,

      value: function (callback) {
        var node = this.sourceNode
        var stopSound = function () {
          return Pz.Util.isFunction(node.stop) ? node.stop(0) : node.disconnect()
        }

        var currentValue = this.fadeNode.gain.value
        this.fadeNode.gain.cancelScheduledValues(Pz.context.currentTime)
        this.fadeNode.gain.setValueAtTime(currentValue, Pz.context.currentTime)

        if (!this.release) {
          stopSound()
          return
        }

        var remainingReleaseTime = this.fadeNode.gain.value * this.release
        this.fadeNode.gain.setValueAtTime(this.fadeNode.gain.value, Pizzicato.context.currentTime)
        this.fadeNode.gain.linearRampToValueAtTime(0.00001, Pizzicato.context.currentTime + remainingReleaseTime)

        window.setTimeout(function () {
          stopSound()
        }, remainingReleaseTime * 1000)
      }
    }
  })

  Pizzicato.Group = function (sounds) {
    sounds = sounds || []

    this.mergeGainNode = Pz.context.createGain()
    this.masterVolume = Pz.context.createGain()
    this.sounds = []
    this.effects = []
    this.effectConnectors = []

    this.mergeGainNode.connect(this.masterVolume)
    this.masterVolume.connect(Pz.masterGainNode)

    for (var i = 0; i < sounds.length; i++) { this.addSound(sounds[i]) }
  }

  Pizzicato.Group.prototype = Object.create(Pz.Events, {

    connect: {
      enumerable: true,

      value: function (audioNode) {
        this.masterVolume.connect(audioNode)
        return this
      }
    },

    disconnect: {
      enumerable: true,

      value: function (audioNode) {
        this.masterVolume.disconnect(audioNode)
        return this
      }
    },

    addSound: {
      enumerable: true,

      value: function (sound) {
        if (!Pz.Util.isSound(sound)) {
          console.error('You can only add Pizzicato.Sound objects')
          return
        }
        if (this.sounds.indexOf(sound) > -1) {
          console.warn('The Pizzicato.Sound object was already added to this group')
          return
        }
        if (sound.detached) {
          console.warn('Groups do not support detached sounds. You can manually create an audio graph to group detached sounds together.')
        }

        sound.disconnect(Pz.masterGainNode)
        sound.connect(this.mergeGainNode)
        this.sounds.push(sound)
      }
    },

    removeSound: {
      enumerable: true,

      value: function (sound) {
        var index = this.sounds.indexOf(sound)

        if (index === -1) {
          console.warn('Cannot remove a sound that is not part of this group.')
          return
        }

        sound.disconnect(this.mergeGainNode)
        sound.connect(Pz.masterGainNode)
        this.sounds.splice(index, 1)
      }
    },

    volume: {
      enumerable: true,

      get: function () {
        if (this.masterVolume) { return this.masterVolume.gain.value }
      },

      set: function (volume) {
        if (Pz.Util.isInRange(volume, 0, 1)) { this.masterVolume.gain.value = volume }
      }
    },

    play: {
      enumerable: true,

      value: function () {
        for (var i = 0; i < this.sounds.length; i++) { this.sounds[i].play() }

        this.trigger('play')
      }

    },

    stop: {
      enumerable: true,

      value: function () {
        for (var i = 0; i < this.sounds.length; i++) { this.sounds[i].stop() }

        this.trigger('stop')
      }

    },

    pause: {
      enumerable: true,

      value: function () {
        for (var i = 0; i < this.sounds.length; i++) { this.sounds[i].pause() }

        this.trigger('pause')
      }

    },

		/**
		 * Similarly to Sound objects, adding effects will create a graph in which there will be a
		 * gain node (effectConnector) in between every effect added. For example:
		 * [fadeNode]--->[effect 1]->[connector 1]--->[effect 2]->[connector 2]--->[masterGain]
		 *
		 * Connectors are used to know what nodes to disconnect and not disrupt the
		 * connections of another Pz.Group object using the same effect.
		 */
    addEffect: {
      enumerable: true,

      value: function (effect) {
        if (!Pz.Util.isEffect(effect)) {
          console.error('The object provided is not a Pizzicato effect.')
          return this
        }

        this.effects.push(effect)

				// Connects effect in the last position
        var previousNode = this.effectConnectors.length > 0 ? this.effectConnectors[this.effectConnectors.length - 1] : this.mergeGainNode
        previousNode.disconnect()
        previousNode.connect(effect)

				// Creates connector for the newly added effect
        var gain = Pz.context.createGain()
        this.effectConnectors.push(gain)
        effect.connect(gain)
        gain.connect(this.masterVolume)

        return this
      }
    },

		/**
		 * When removing effects, the graph in which there will be a
		 * gain node (effectConnector) in between every effect should be
		 * conserved. For example:
		 * [fadeNode]--->[effect 1]->[connector 1]--->[effect 2]->[connector 2]--->[masterGain]
		 *
		 * Connectors are used to know what nodes to disconnect and not disrupt the
		 * connections of another Pz.Group object using the same effect.
		 */
    removeEffect: {
      enumerable: true,

      value: function (effect) {
        var index = this.effects.indexOf(effect)

        if (index === -1) {
          console.warn('Cannot remove effect that is not applied to this group.')
          return this
        }

        var previousNode = (index === 0) ? this.mergeGainNode : this.effectConnectors(index - 1)
        previousNode.disconnect()

				// Disconnect connector and effect
        var effectConnector = this.effectConnectors[index]
        effectConnector.disconnect()
        effect.disconnect(effectConnector)

				// Remove connector and effect from our arrays
        this.effectConnectors.splice(index, 1)
        this.effects.splice(index, 1)

        var targetNode
        if (index > this.effects.length - 1 || this.effects.length === 0) { targetNode = this.masterVolume } else					{ targetNode = this.effects[index] }

        previousNode.connect(targetNode)

        return this
      }
    }

  })
  Pizzicato.Effects = {}

  var baseEffect = Object.create(null, {

    connect: {
      enumerable: true,

      value: function (audioNode) {
        this.outputNode.connect(audioNode)
        return this
      }
    },

    disconnect: {
      enumerable: true,

      value: function (audioNode) {
        this.outputNode.disconnect(audioNode)
        return this
      }
    }
  })
  Pizzicato.Effects.Delay = function (options) {
    this.options = {}
    options = options || this.options

    var defaults = {
      feedback: 0.5,
      time: 0.3,
      mix: 0.5
    }

    this.inputNode = Pizzicato.context.createGain()
    this.outputNode = Pizzicato.context.createGain()
    this.dryGainNode = Pizzicato.context.createGain()
    this.wetGainNode = Pizzicato.context.createGain()
    this.feedbackGainNode = Pizzicato.context.createGain()
    this.delayNode = Pizzicato.context.createDelay()

		// line in to dry mix
    this.inputNode.connect(this.dryGainNode)
		// dry line out
    this.dryGainNode.connect(this.outputNode)

		// feedback loop
    this.delayNode.connect(this.feedbackGainNode)
    this.feedbackGainNode.connect(this.delayNode)

		// line in to wet mix
    this.inputNode.connect(this.delayNode)
		// wet out
    this.delayNode.connect(this.wetGainNode)

		// wet line out
    this.wetGainNode.connect(this.outputNode)

    for (var key in defaults) {
      this[key] = options[key]
      this[key] = (this[key] === undefined || this[key] === null) ? defaults[key] : this[key]
    }
  }

  Pizzicato.Effects.Delay.prototype = Object.create(baseEffect, {

		/**
		 * Gets and sets the dry/wet mix.
		 */
    mix: {
      enumerable: true,

      get: function () {
        return this.options.mix
      },

      set: function (mix) {
        if (!Pz.Util.isInRange(mix, 0, 1)) { return }

        this.options.mix = mix
        this.dryGainNode.gain.value = Pizzicato.Util.getDryLevel(this.mix)
        this.wetGainNode.gain.value = Pizzicato.Util.getWetLevel(this.mix)
      }
    },

		/**
		 * Time between each delayed sound
		 */
    time: {
      enumerable: true,

      get: function () {
        return this.options.time
      },

      set: function (time) {
        if (!Pz.Util.isInRange(time, 0, 180)) { return }

        this.options.time = time
        this.delayNode.delayTime.value = time
      }
    },

		/**
		 * Strength of each of the echoed delayed sounds.
		 */
    feedback: {
      enumerable: true,

      get: function () {
        return this.options.feedback
      },

      set: function (feedback) {
        if (!Pz.Util.isInRange(feedback, 0, 1)) { return }

        this.options.feedback = parseFloat(feedback, 10)
        this.feedbackGainNode.gain.value = this.feedback
      }
    }

  })
  Pizzicato.Effects.Compressor = function (options) {
    this.options = {}
    options = options || this.options

    var defaults = {
      threshold: -24,
      knee: 30,
      attack: 0.003,
      release: 0.250,
      ratio: 12
    }

    this.inputNode = this.compressorNode = Pizzicato.context.createDynamicsCompressor()
    this.outputNode = Pizzicato.context.createGain()

    this.compressorNode.connect(this.outputNode)

    for (var key in defaults) {
      this[key] = options[key]
      this[key] = (this[key] === undefined || this[key] === null) ? defaults[key] : this[key]
    }
  }

  Pizzicato.Effects.Compressor.prototype = Object.create(baseEffect, {

		/**
		 * The level above which compression is applied to the audio.
		 * MIN: -100
		 * MAX: 0
		 */
    threshold: {
      enumerable: true,

      get: function () {
        return this.compressorNode.threshold.value
      },
      set: function (value) {
        if (Pizzicato.Util.isInRange(value, -100, 0)) { this.compressorNode.threshold.value = value }
      }
    },

		/**
		 * A value representing the range above the threshold where
		 * the curve smoothly transitions to the "ratio" portion. More info:
		 * http://www.homestudiocorner.com/what-is-knee-on-a-compressor/
		 * MIN 0
		 * MAX 40
		 */
    knee: {
      enumerable: true,

      get: function () {
        return this.compressorNode.knee.value
      },
      set: function (value) {
        if (Pizzicato.Util.isInRange(value, 0, 40)) { this.compressorNode.knee.value = value }
      }
    },

		/**
		 * How soon the compressor starts to compress the dynamics after
		 * the threshold is exceeded. If volume changes are slow, you can
		 * push this to a high value. Short attack times will result in a
		 * fast response to sudden, loud sounds, but will make the changes
		 * in volume much more obvious to listeners.
		 * MIN 0
		 * MAX 1
		 */
    attack: {
      enumerable: true,

      get: function () {
        return this.compressorNode.attack.value
      },
      set: function (value) {
        if (Pizzicato.Util.isInRange(value, 0, 1)) { this.compressorNode.attack.value = value }
      }
    },

		/**
		 * How soon the compressor starts to release the volume level
		 * back to normal after the level drops below the threshold.
		 * A long time value will tend to lose quiet sounds that come
		 * after loud ones, but will avoid the volume being raised too
		 * much during short quiet sections like pauses in speech.
		 * MIN 0
		 * MAX 1
		 */
    release: {
      enumerable: true,

      get: function () {
        return this.compressorNode.release.value
      },
      set: function (value) {
        if (Pizzicato.Util.isInRange(value, 0, 1)) { this.compressorNode.release.value = value }
      }
    },

		/**
		 * The amount of compression applied to the audio once it
		 * passes the threshold level. The higher the Ratio the more
		 * the loud parts of the audio will be compressed.
		 * MIN 1
		 * MAX 20
		 */
    ratio: {
      enumerable: true,

      get: function () {
        return this.compressorNode.ratio.value
      },
      set: function (value) {
        if (Pizzicato.Util.isInRange(value, 1, 20)) { this.compressorNode.ratio.value = value }
      }
    },

    getCurrentGainReduction: function () {
      return this.compressorNode.reduction
    }

  })
	/**
	 * Frequencies below the cutoff frequency pass
	 * through; frequencies above it are attenuated.
	 */
  Pizzicato.Effects.LowPassFilter = function (options) {
    Filter.call(this, options, 'lowpass')
  }

	/**
	 * Frequencies below the cutoff frequency are
	 * attenuated; frequencies above it pass through.
	 */
  Pizzicato.Effects.HighPassFilter = function (options) {
    Filter.call(this, options, 'highpass')
  }

	/**
	 * Filters used by Pizzicato stem from the biquad filter node. This
	 * function acts as a common constructor. The only thing that changes
	 * between filters is the 'type' of the biquad filter node.
	 */
  function Filter (options, type) {
    this.options = {}
    options = options || this.options

    var defaults = {
      frequency: 350,
      peak: 1
    }

    this.inputNode = this.filterNode = Pz.context.createBiquadFilter()
    this.filterNode.type = type

    this.outputNode = Pizzicato.context.createGain()

    this.filterNode.connect(this.outputNode)

    for (var key in defaults) {
      this[key] = options[key]
      this[key] = (this[key] === undefined || this[key] === null) ? defaults[key] : this[key]
    }
  }

  var filterPrototype = Object.create(baseEffect, {

		/**
		 * The cutoff frequency of the filter.
		 * MIN: 10
		 * MAX: 22050 (half the sampling rate of the current context)
		 */
    frequency: {
      enumerable: true,

      get: function () {
        return this.filterNode.frequency.value
      },
      set: function (value) {
        if (Pizzicato.Util.isInRange(value, 10, 22050)) { this.filterNode.frequency.value = value }
      }
    },

		/**
		 * Indicates how peaked the frequency is around
		 * the cutoff. The greater the value is, the
		 * greater is the peak.
		 * MIN: 0.0001
		 * MAX: 1000
		 */
    peak: {
      enumerable: true,

      get: function () {
        return this.filterNode.Q.value
      },
      set: function (value) {
        if (Pizzicato.Util.isInRange(value, 0.0001, 1000)) { this.filterNode.Q.value = value }
      }
    }
  })

  Pizzicato.Effects.LowPassFilter.prototype = filterPrototype
  Pizzicato.Effects.HighPassFilter.prototype = filterPrototype
  Pizzicato.Effects.Distortion = function (options) {
    this.options = {}
    options = options || this.options

    var defaults = {
      gain: 0.5
    }

    this.waveShaperNode = Pizzicato.context.createWaveShaper()
    this.inputNode = this.outputNode = this.waveShaperNode

    for (var key in defaults) {
      this[key] = options[key]
      this[key] = (this[key] === undefined || this[key] === null) ? defaults[key] : this[key]
    }
  }

  Pizzicato.Effects.Distortion.prototype = Object.create(baseEffect, {

		/**
		 * Gets and sets the gain (amount of distortion).
		 */
    gain: {
      enumerable: true,

      get: function () {
        return this.options.gain
      },

      set: function (gain) {
        if (!Pz.Util.isInRange(gain, 0, 1)) { return }

        this.options.gain = gain
        this.adjustGain()
      }
    },

		/**
		 * Sets the wave curve with the correct gain. Taken from
		 * http://stackoverflow.com/questions/22312841/waveshaper-node-in-webaudio-how-to-emulate-distortion
		 */
    adjustGain: {
      writable: false,
      configurable: false,
      enumerable: false,
      value: function () {
        var gain = Pz.Util.isNumber(this.options.gain) ? parseInt(this.options.gain * 100, 10) : 50
        var n_samples = 44100
        var curve = new Float32Array(n_samples)
        var deg = Math.PI / 180
        var x

        for (var i = 0; i < n_samples; ++i) {
          x = i * 2 / n_samples - 1
          curve[i] = (3 + gain) * x * 20 * deg / (Math.PI + gain * Math.abs(x))
        }

        this.waveShaperNode.curve = curve
      }
    }

  })
  Pizzicato.Effects.Flanger = function (options) {
    this.options = {}
    options = options || this.options

    var defaults = {
      time: 0.45,
      speed: 0.2,
      depth: 0.1,
      feedback: 0.1,
      mix: 0.5
    }

    this.inputNode = Pizzicato.context.createGain()
    this.outputNode = Pizzicato.context.createGain()
    this.inputFeedbackNode = Pizzicato.context.createGain()
    this.wetGainNode = Pizzicato.context.createGain()
    this.dryGainNode = Pizzicato.context.createGain()
    this.delayNode = Pizzicato.context.createDelay()
    this.oscillatorNode = Pizzicato.context.createOscillator()
    this.gainNode = Pizzicato.context.createGain()
    this.feedbackNode = Pizzicato.context.createGain()
    this.oscillatorNode.type = 'sine'

    this.inputNode.connect(this.inputFeedbackNode)
    this.inputNode.connect(this.dryGainNode)

    this.inputFeedbackNode.connect(this.delayNode)
    this.inputFeedbackNode.connect(this.wetGainNode)

    this.delayNode.connect(this.wetGainNode)
    this.delayNode.connect(this.feedbackNode)

    this.feedbackNode.connect(this.inputFeedbackNode)

    this.oscillatorNode.connect(this.gainNode)
    this.gainNode.connect(this.delayNode.delayTime)

    this.dryGainNode.connect(this.outputNode)
    this.wetGainNode.connect(this.outputNode)

    this.oscillatorNode.start(0)

    for (var key in defaults) {
      this[key] = options[key]
      this[key] = (this[key] === undefined || this[key] === null) ? defaults[key] : this[key]
    }
  }

  Pizzicato.Effects.Flanger.prototype = Object.create(baseEffect, {

    time: {
      enumberable: true,

      get: function () {
        return this.options.time
      },

      set: function (time) {
        if (!Pz.Util.isInRange(time, 0, 1)) { return }

        this.options.time = time
        this.delayNode.delayTime.value = Pz.Util.normalize(time, 0.001, 0.02)
      }
    },

    speed: {
      enumberable: true,

      get: function () {
        return this.options.speed
      },

      set: function (speed) {
        if (!Pz.Util.isInRange(speed, 0, 1)) { return }

        this.options.speed = speed
        this.oscillatorNode.frequency.value = Pz.Util.normalize(speed, 0.5, 5)
      }
    },

    depth: {
      enumberable: true,

      get: function () {
        return this.options.depth
      },

      set: function (depth) {
        if (!Pz.Util.isInRange(depth, 0, 1)) { return }

        this.options.depth = depth
        this.gainNode.gain.value = Pz.Util.normalize(depth, 0.0005, 0.005)
      }
    },

    feedback: {
      enumberable: true,

      get: function () {
        return this.options.feedback
      },

      set: function (feedback) {
        if (!Pz.Util.isInRange(feedback, 0, 1)) { return }

        this.options.feedback = feedback
        this.feedbackNode.gain.value = Pz.Util.normalize(feedback, 0, 0.8)
      }
    },

    mix: {
      enumberable: true,

      get: function () {
        return this.options.mix
      },

      set: function (mix) {
        if (!Pz.Util.isInRange(mix, 0, 1)) { return }

        this.options.mix = mix
        this.dryGainNode.gain.value = Pizzicato.Util.getDryLevel(this.mix)
        this.wetGainNode.gain.value = Pizzicato.Util.getWetLevel(this.mix)
      }
    }

  })
  Pizzicato.Effects.StereoPanner = function (options) {
    this.options = {}
    options = options || this.options

    var defaults = {
      pan: 0
    }

    this.inputNode = Pizzicato.context.createGain()
    this.outputNode = Pizzicato.context.createGain()

    if (Pizzicato.context.createStereoPanner) {
      this.pannerNode = Pizzicato.context.createStereoPanner()
      this.inputNode.connect(this.pannerNode)
      this.pannerNode.connect(this.outputNode)
    } else {
      this.inputNode.connect(this.outputNode)
    }

    for (var key in defaults) {
      this[key] = options[key]
      this[key] = (this[key] === undefined || this[key] === null) ? defaults[key] : this[key]
    }
  }

  Pizzicato.Effects.StereoPanner.prototype = Object.create(baseEffect, {

		/**
		 * Pan position
		 */
    pan: {
      enumerable: true,

      get: function () {
        return this.options.pan
      },

      set: function (pan) {
        if (!Pz.Util.isInRange(pan, -1, 1)) { return }

        this.options.pan = pan
        if (this.pannerNode) {
          this.pannerNode.pan.value = pan
        }
      }
    }

  })
  Pizzicato.Effects.Convolver = function (options, callback) {
    this.options = {}
    options = options || this.options

    var self = this
    var request = new XMLHttpRequest()
    var defaults = {
      mix: 0.5
    }

    this.callback = callback

    this.inputNode = Pizzicato.context.createGain()
    this.convolverNode = Pizzicato.context.createConvolver()
    this.outputNode = Pizzicato.context.createGain()

    this.wetGainNode = Pizzicato.context.createGain()
    this.dryGainNode = Pizzicato.context.createGain()

    this.inputNode.connect(this.convolverNode)

    this.convolverNode.connect(this.wetGainNode)
    this.inputNode.connect(this.dryGainNode)

    this.dryGainNode.connect(this.outputNode)
    this.wetGainNode.connect(this.outputNode)

    for (var key in defaults) {
      this[key] = options[key]
      this[key] = (this[key] === undefined || this[key] === null) ? defaults[key] : this[key]
    }

    if (!options.impulse) {
      console.error('No impulse file specified.')
      return
    }

    request.open('GET', options.impulse, true)
    request.responseType = 'arraybuffer'
    request.onload = function (e) {
      var audioData = e.target.response

      Pizzicato.context.decodeAudioData(audioData, function (buffer) {
        self.convolverNode.buffer = buffer

        if (self.callback && Pz.Util.isFunction(self.callback)) { self.callback() }
      }, function (error) {
        error = error || new Error('Error decoding impulse file')

        if (self.callback && Pz.Util.isFunction(self.callback)) { self.callback(error) }
      })
    }

    request.onreadystatechange = function (event) {
      if (request.readyState === 4 && request.status !== 200) {
        console.error('Error while fetching ' + options.impulse + '. ' + request.statusText)
      }
    }

    request.send()
  }

  Pizzicato.Effects.Convolver.prototype = Object.create(baseEffect, {

    mix: {
      enumerable: true,

      get: function () {
        return this.options.mix
      },

      set: function (mix) {
        if (!Pz.Util.isInRange(mix, 0, 1)) { return }

        this.options.mix = mix
        this.dryGainNode.gain.value = Pizzicato.Util.getDryLevel(this.mix)
        this.wetGainNode.gain.value = Pizzicato.Util.getWetLevel(this.mix)
      }
    }
  })
	/**
	 * Adapted from https://github.com/mmckegg/web-audio-school/blob/master/lessons/3.%20Effects/18.%20Ping%20Pong%20Delay/answer.js
	 */

  Pizzicato.Effects.PingPongDelay = function (options) {
    this.options = {}
    options = options || this.options

    var defaults = {
      feedback: 0.5,
      time: 0.3,
      mix: 0.5
    }

    this.inputNode = Pizzicato.context.createGain()
    this.outputNode = Pizzicato.context.createGain()
    this.delayNodeLeft = Pizzicato.context.createDelay()
    this.delayNodeRight = Pizzicato.context.createDelay()
    this.dryGainNode = Pizzicato.context.createGain()
    this.wetGainNode = Pizzicato.context.createGain()
    this.feedbackGainNode = Pizzicato.context.createGain()
    this.channelMerger = Pizzicato.context.createChannelMerger(2)

		// dry mix
    this.inputNode.connect(this.dryGainNode)
		// dry mix out
    this.dryGainNode.connect(this.outputNode)

		// the feedback loop
    this.delayNodeLeft.connect(this.channelMerger, 0, 0)
    this.delayNodeRight.connect(this.channelMerger, 0, 1)
    this.delayNodeLeft.connect(this.delayNodeRight)
    this.feedbackGainNode.connect(this.delayNodeLeft)
    this.delayNodeRight.connect(this.feedbackGainNode)

		// wet mix
    this.inputNode.connect(this.feedbackGainNode)

		// wet out
    this.channelMerger.connect(this.wetGainNode)
    this.wetGainNode.connect(this.outputNode)

    for (var key in defaults) {
      this[key] = options[key]
      this[key] = (this[key] === undefined || this[key] === null) ? defaults[key] : this[key]
    }
  }

  Pizzicato.Effects.PingPongDelay.prototype = Object.create(baseEffect, {

		/**
		 * Gets and sets the dry/wet mix.
		 */
    mix: {
      enumerable: true,

      get: function () {
        return this.options.mix
      },

      set: function (mix) {
        if (!Pz.Util.isInRange(mix, 0, 1)) { return }

        this.options.mix = mix
        this.dryGainNode.gain.value = Pizzicato.Util.getDryLevel(this.mix)
        this.wetGainNode.gain.value = Pizzicato.Util.getWetLevel(this.mix)
      }
    },

		/**
		 * Time between each delayed sound
		 */
    time: {
      enumerable: true,

      get: function () {
        return this.options.time
      },

      set: function (time) {
        if (!Pz.Util.isInRange(time, 0, 180)) { return }

        this.options.time = time
        this.delayNodeLeft.delayTime.value = time
        this.delayNodeRight.delayTime.value = time
      }
    },

		/**
		 * Strength of each of the echoed delayed sounds.
		 */
    feedback: {
      enumerable: true,

      get: function () {
        return this.options.feedback
      },

      set: function (feedback) {
        if (!Pz.Util.isInRange(feedback, 0, 1)) { return }

        this.options.feedback = parseFloat(feedback, 10)
        this.feedbackGainNode.gain.value = this.feedback
      }
    }

  })
	/**
	 * Adapted from https://github.com/web-audio-components/simple-reverb
	 */

  Pizzicato.Effects.Reverb = function (options) {
    var self = this

    this.options = {}
    options = options || this.options

    var defaults = {
      mix: 0.5,
      time: 0.01,
      decay: 0.01,
      reverse: false
    }

    this.inputNode = Pizzicato.context.createGain()
    this.reverbNode = Pizzicato.context.createConvolver()
    this.outputNode = Pizzicato.context.createGain()
    this.wetGainNode = Pizzicato.context.createGain()
    this.dryGainNode = Pizzicato.context.createGain()

    this.inputNode.connect(this.reverbNode)
    this.reverbNode.connect(this.wetGainNode)
    this.inputNode.connect(this.dryGainNode)
    this.dryGainNode.connect(this.outputNode)
    this.wetGainNode.connect(this.outputNode)

    for (var key in defaults) {
      this[key] = options[key]
      this[key] = (this[key] === undefined || this[key] === null) ? defaults[key] : this[key]
    }

    (buildImpulse.bind(this))()
  }

  Pizzicato.Effects.Reverb.prototype = Object.create(baseEffect, {

    mix: {
      enumerable: true,

      get: function () {
        return this.options.mix
      },

      set: function (mix) {
        if (!Pz.Util.isInRange(mix, 0, 1)) { return }

        this.options.mix = mix
        this.dryGainNode.gain.value = Pizzicato.Util.getDryLevel(this.mix)
        this.wetGainNode.gain.value = Pizzicato.Util.getWetLevel(this.mix)
      }
    },

    time: {
      enumerable: true,

      get: function () {
        return this.options.time
      },

      set: function (time) {
        if (!Pz.Util.isInRange(time, 0.0001, 10)) { return }

        this.options.time = time;
        (buildImpulse.bind(this))()
      }
    },

    decay: {
      enumerable: true,

      get: function () {
        return this.options.decay
      },

      set: function (decay) {
        if (!Pz.Util.isInRange(decay, 0.0001, 10)) { return }

        this.options.decay = decay;
        (buildImpulse.bind(this))()
      }

    },

    reverse: {
      enumerable: true,

      get: function () {
        return this.options.reverse
      },

      set: function (reverse) {
        if (!Pz.Util.isBool(reverse)) { return }

        this.options.reverse = reverse;
        (buildImpulse.bind(this))()
      }
    }

  })

  function buildImpulse () {
    var length = Pz.context.sampleRate * this.time
    var impulse = Pizzicato.context.createBuffer(2, length, Pz.context.sampleRate)
    var impulseL = impulse.getChannelData(0)
    var impulseR = impulse.getChannelData(1)
    var n, i

    for (i = 0; i < length; i++) {
      n = this.reverse ? length - i : i
      impulseL[i] = (Math.random() * 2 - 1) * Math.pow(1 - n / length, this.decay)
      impulseR[i] = (Math.random() * 2 - 1) * Math.pow(1 - n / length, this.decay)
    }

    this.reverbNode.buffer = impulse
  }
  Pizzicato.Effects.Tremolo = function (options) {
		// adapted from
		// https://github.com/mmckegg/web-audio-school/blob/master/lessons/3.%20Effects/13.%20Tremolo/answer.js

    this.options = {}
    options = options || this.options

    var defaults = {
      speed: 4,
      depth: 1,
      mix: 0.8
    }

		// create nodes
    this.inputNode = Pizzicato.context.createGain()
    this.outputNode = Pizzicato.context.createGain()
    this.dryGainNode = Pizzicato.context.createGain()
    this.wetGainNode = Pizzicato.context.createGain()

    this.tremoloGainNode = Pizzicato.context.createGain()
    this.tremoloGainNode.gain.value = 0
    this.lfoNode = Pizzicato.context.createOscillator()

    this.shaperNode = Pizzicato.context.createWaveShaper()
    this.shaperNode.curve = new Float32Array([0, 1])
    this.shaperNode.connect(this.tremoloGainNode.gain)

		// dry mix
    this.inputNode.connect(this.dryGainNode)
    this.dryGainNode.connect(this.outputNode)

		// wet mix
    this.lfoNode.connect(this.shaperNode)
    this.lfoNode.type = 'sine'
    this.lfoNode.start(0)

    this.inputNode.connect(this.tremoloGainNode)
    this.tremoloGainNode.connect(this.wetGainNode)
    this.wetGainNode.connect(this.outputNode)

    for (var key in defaults) {
      this[key] = options[key]
      this[key] = (this[key] === undefined || this[key] === null) ? defaults[key] : this[key]
    }
  }

  Pizzicato.Effects.Tremolo.prototype = Object.create(baseEffect, {

		/**
		 * Gets and sets the dry/wet mix.
		 */
    mix: {
      enumerable: true,

      get: function () {
        return this.options.mix
      },

      set: function (mix) {
        if (!Pz.Util.isInRange(mix, 0, 1)) { return }

        this.options.mix = mix
        this.dryGainNode.gain.value = Pizzicato.Util.getDryLevel(this.mix)
        this.wetGainNode.gain.value = Pizzicato.Util.getWetLevel(this.mix)
      }
    },

		/**
		 * Speed of the tremolo
		 */
    speed: {
      enumerable: true,

      get: function () {
        return this.options.speed
      },

      set: function (speed) {
        if (!Pz.Util.isInRange(speed, 0, 20)) { return }

        this.options.speed = speed
        this.lfoNode.frequency.value = speed
      }
    },

		/**
		 * Depth of the tremolo
		 */
    depth: {
      enumerable: true,

      get: function () {
        return this.options.depth
      },

      set: function (depth) {
        if (!Pz.Util.isInRange(depth, 0, 1)) { return }

        this.options.depth = depth
        this.shaperNode.curve = new Float32Array([1 - depth, 1])
      }
    }

  })
  Pizzicato.Effects.DubDelay = function (options) {
    this.options = {}
    options = options || this.options

    var defaults = {
      feedback: 0.6,
      time: 0.7,
      mix: 0.5,
      cutoff: 700
    }

    this.inputNode = Pizzicato.context.createGain()
    this.outputNode = Pizzicato.context.createGain()
    this.dryGainNode = Pizzicato.context.createGain()
    this.wetGainNode = Pizzicato.context.createGain()
    this.feedbackGainNode = Pizzicato.context.createGain()
    this.delayNode = Pizzicato.context.createDelay()
    this.bqFilterNode = Pizzicato.context.createBiquadFilter()

		// dry mix
    this.inputNode.connect(this.dryGainNode)
    this.dryGainNode.connect(this.outputNode)

		// wet mix
    this.inputNode.connect(this.wetGainNode)
    this.inputNode.connect(this.feedbackGainNode)

    this.feedbackGainNode.connect(this.bqFilterNode)
    this.bqFilterNode.connect(this.delayNode)
    this.delayNode.connect(this.feedbackGainNode)
    this.delayNode.connect(this.wetGainNode)

    this.wetGainNode.connect(this.outputNode)

    for (var key in defaults) {
      this[key] = options[key]
      this[key] = (this[key] === undefined || this[key] === null) ? defaults[key] : this[key]
    }
  }

  Pizzicato.Effects.DubDelay.prototype = Object.create(baseEffect, {

		/**
		 * Gets and sets the dry/wet mix.
		 */
    mix: {
      enumerable: true,

      get: function () {
        return this.options.mix
      },

      set: function (mix) {
        if (!Pz.Util.isInRange(mix, 0, 1)) { return }

        this.options.mix = mix
        this.dryGainNode.gain.value = Pizzicato.Util.getDryLevel(this.mix)
        this.wetGainNode.gain.value = Pizzicato.Util.getWetLevel(this.mix)
      }
    },

		/**
		 * Time between each delayed sound
		 */
    time: {
      enumerable: true,

      get: function () {
        return this.options.time
      },

      set: function (time) {
        if (!Pz.Util.isInRange(time, 0, 180)) { return }

        this.options.time = time
        this.delayNode.delayTime.value = time
      }
    },

		/**
		 * Strength of each of the echoed delayed sounds.
		 */
    feedback: {
      enumerable: true,

      get: function () {
        return this.options.feedback
      },

      set: function (feedback) {
        if (!Pz.Util.isInRange(feedback, 0, 1)) { return }

        this.options.feedback = parseFloat(feedback, 10)
        this.feedbackGainNode.gain.value = this.feedback
      }
    },

		/**
		 * Frequency on delay repeats
		 */
    cutoff: {
      enumerable: true,

      get: function () {
        return this.options.cutoff
      },

      set: function (cutoff) {
        if (!Pz.Util.isInRange(cutoff, 0, 4000)) { return }

        this.options.cutoff = cutoff
        this.bqFilterNode.frequency.value = this.cutoff
      }
    }

  })
	/**
	 * See http://webaudio.prototyping.bbc.co.uk/ring-modulator/
	 */
  Pizzicato.Effects.RingModulator = function (options) {
    this.options = {}
    options = options || this.options

    var defaults = {
      speed: 30,
      distortion: 1,
      mix: 0.5
    }

    this.inputNode = Pizzicato.context.createGain()
    this.outputNode = Pizzicato.context.createGain()
    this.dryGainNode = Pizzicato.context.createGain()
    this.wetGainNode = Pizzicato.context.createGain()

		/**
		 * `vIn` is the modulation oscillator input
		 * `vc` is the audio input.
		 */
    this.vIn = Pizzicato.context.createOscillator()
    this.vIn.start(0)
    this.vInGain = Pizzicato.context.createGain()
    this.vInGain.gain.value = 0.5
    this.vInInverter1 = Pizzicato.context.createGain()
    this.vInInverter1.gain.value = -1
    this.vInInverter2 = Pizzicato.context.createGain()
    this.vInInverter2.gain.value = -1
    this.vInDiode1 = new DiodeNode(Pizzicato.context)
    this.vInDiode2 = new DiodeNode(Pizzicato.context)
    this.vInInverter3 = Pizzicato.context.createGain()
    this.vInInverter3.gain.value = -1
    this.vcInverter1 = Pizzicato.context.createGain()
    this.vcInverter1.gain.value = -1
    this.vcDiode3 = new DiodeNode(Pizzicato.context)
    this.vcDiode4 = new DiodeNode(Pizzicato.context)

    this.outGain = Pizzicato.context.createGain()
    this.outGain.gain.value = 3

    this.compressor = Pizzicato.context.createDynamicsCompressor()
    this.compressor.threshold.value = -24
    this.compressor.ratio.value = 16

		// dry mix
    this.inputNode.connect(this.dryGainNode)
    this.dryGainNode.connect(this.outputNode)

		// wet mix
    this.inputNode.connect(this.vcInverter1)
    this.inputNode.connect(this.vcDiode4.node)
    this.vcInverter1.connect(this.vcDiode3.node)
    this.vIn.connect(this.vInGain)
    this.vInGain.connect(this.vInInverter1)
    this.vInGain.connect(this.vcInverter1)
    this.vInGain.connect(this.vcDiode4.node)
    this.vInInverter1.connect(this.vInInverter2)
    this.vInInverter1.connect(this.vInDiode2.node)
    this.vInInverter2.connect(this.vInDiode1.node)
    this.vInDiode1.connect(this.vInInverter3)
    this.vInDiode2.connect(this.vInInverter3)
    this.vInInverter3.connect(this.compressor)
    this.vcDiode3.connect(this.compressor)
    this.vcDiode4.connect(this.compressor)
    this.compressor.connect(this.outGain)
    this.outGain.connect(this.wetGainNode)

		// line out
    this.wetGainNode.connect(this.outputNode)

    for (var key in defaults) {
      this[key] = options[key]
      this[key] = (this[key] === undefined || this[key] === null) ? defaults[key] : this[key]
    }
  }

  var DiodeNode = function (context_) {
    this.context = context_
    this.node = this.context.createWaveShaper()
    this.vb = 0.2
    this.vl = 0.4
    this.h = 1
    this.setCurve()
  }

  DiodeNode.prototype.setDistortion = function (distortion) {
    this.h = distortion
    return this.setCurve()
  }

  DiodeNode.prototype.setCurve = function () {
    var i,
      samples,
      v,
      value,
      wsCurve,
      _i,
      _ref,
      retVal

    samples = 1024
    wsCurve = new Float32Array(samples)

    for (i = _i = 0, _ref = wsCurve.length; _ref >= 0 ? _i < _ref : _i > _ref; i = _ref >= 0 ? ++_i : --_i) {
      v = (i - samples / 2) / (samples / 2)
      v = Math.abs(v)
      if (v <= this.vb) {
        value = 0
      } else if ((this.vb < v) && (v <= this.vl)) {
        value = this.h * ((Math.pow(v - this.vb, 2)) / (2 * this.vl - 2 * this.vb))
      } else {
        value = this.h * v - this.h * this.vl + (this.h * ((Math.pow(this.vl - this.vb, 2)) / (2 * this.vl - 2 * this.vb)))
      }
      wsCurve[i] = value
    }

    retVal = this.node.curve = wsCurve
    return retVal
  }

  DiodeNode.prototype.connect = function (destination) {
    return this.node.connect(destination)
  }

  Pizzicato.Effects.RingModulator.prototype = Object.create(baseEffect, {

		/**
		 * Gets and sets the dry/wet mix.
		 */
    mix: {
      enumerable: true,

      get: function () {
        return this.options.mix
      },

      set: function (mix) {
        if (!Pz.Util.isInRange(mix, 0, 1)) { return }

        this.options.mix = mix
        this.dryGainNode.gain.value = Pizzicato.Util.getDryLevel(this.mix)
        this.wetGainNode.gain.value = Pizzicato.Util.getWetLevel(this.mix)
      }
    },

		/**
		 * Speed on the input oscillator
		 */
    speed: {
      enumerable: true,

      get: function () {
        return this.options.speed
      },

      set: function (speed) {
        if (!Pz.Util.isInRange(speed, 0, 2000)) { return }

        this.options.speed = speed
        this.vIn.frequency.value = speed
      }
    },

		/**
		 * Level of distortion
		 */
    distortion: {
      enumerable: true,

      get: function () {
        return this.options.distortion
      },

      set: function (distortion) {
        if (!Pz.Util.isInRange(distortion, 0.2, 50)) { return }

        this.options.distortion = parseFloat(distortion, 10)

        var diodeNodes = [this.vInDiode1, this.vInDiode2, this.vcDiode3, this.vcDiode4]

        for (var i = 0, l = diodeNodes.length; i < l; i++) {
          diodeNodes[i].setDistortion(distortion)
        }
      }
    }

  })
  Pizzicato.Effects.Quadrafuzz = function (options) {
    this.options = {}
    options = options || this.options

    var defaults = {
      lowGain: 0.6,
      midLowGain: 0.8,
      midHighGain: 0.5,
      highGain: 0.6
    }

    this.inputNode = Pz.context.createGain()
    this.outputNode = Pz.context.createGain()
    this.dryGainNode = Pz.context.createGain()
    this.wetGainNode = Pz.context.createGain()

    this.lowpassLeft = Pz.context.createBiquadFilter()
    this.lowpassLeft.type = 'lowpass'
    this.lowpassLeft.frequency.value = 147
    this.lowpassLeft.Q.value = 0.7071

    this.bandpass1Left = Pz.context.createBiquadFilter()
    this.bandpass1Left.type = 'bandpass'
    this.bandpass1Left.frequency.value = 587
    this.bandpass1Left.Q.value = 0.7071

    this.bandpass2Left = Pz.context.createBiquadFilter()
    this.bandpass2Left.type = 'bandpass'
    this.bandpass2Left.frequency.value = 2490
    this.bandpass2Left.Q.value = 0.7071

    this.highpassLeft = Pz.context.createBiquadFilter()
    this.highpassLeft.type = 'highpass'
    this.highpassLeft.frequency.value = 4980
    this.highpassLeft.Q.value = 0.7071

    this.overdrives = []
    for (var i = 0; i < 4; i++) {
      this.overdrives[i] = Pz.context.createWaveShaper()
      this.overdrives[i].curve = getDistortionCurve()
    }

    this.inputNode.connect(this.wetGainNode)
    this.inputNode.connect(this.dryGainNode)
    this.dryGainNode.connect(this.outputNode)

    var filters = [this.lowpassLeft, this.bandpass1Left, this.bandpass2Left, this.highpassLeft]
    for (i = 0; i < filters.length; i++) {
      this.wetGainNode.connect(filters[i])
      filters[i].connect(this.overdrives[i])
      this.overdrives[i].connect(this.outputNode)
    }

    for (var key in defaults) {
      this[key] = options[key]
      this[key] = (this[key] === undefined || this[key] === null) ? defaults[key] : this[key]
    }
  }

  function getDistortionCurve (gain) {
    var sampleRate = Pz.context.sampleRate
    var curve = new Float32Array(sampleRate)
    var deg = Math.PI / 180

    for (var i = 0; i < sampleRate; i++) {
      var x = i * 2 / sampleRate - 1
      curve[i] = (3 + gain) * x * 20 * deg / (Math.PI + gain * Math.abs(x))
    }
    return curve
  }

  Pizzicato.Effects.Quadrafuzz.prototype = Object.create(baseEffect, {

    lowGain: {
      enumerable: true,

      get: function () {
        return this.options.lowGain
      },

      set: function (lowGain) {
        if (!Pz.Util.isInRange(lowGain, 0, 1)) { return }

        this.options.lowGain = lowGain
        this.overdrives[0].curve = getDistortionCurve(Pz.Util.normalize(this.lowGain, 0, 150))
      }
    },

    midLowGain: {
      enumerable: true,

      get: function () {
        return this.options.midLowGain
      },

      set: function (midLowGain) {
        if (!Pz.Util.isInRange(midLowGain, 0, 1)) { return }

        this.options.midLowGain = midLowGain
        this.overdrives[1].curve = getDistortionCurve(Pz.Util.normalize(this.midLowGain, 0, 150))
      }
    },

    midHighGain: {
      enumerable: true,

      get: function () {
        return this.options.midHighGain
      },

      set: function (midHighGain) {
        if (!Pz.Util.isInRange(midHighGain, 0, 1)) { return }

        this.options.midHighGain = midHighGain
        this.overdrives[2].curve = getDistortionCurve(Pz.Util.normalize(this.midHighGain, 0, 150))
      }
    },

    highGain: {
      enumerable: true,

      get: function () {
        return this.options.highGain
      },

      set: function (highGain) {
        if (!Pz.Util.isInRange(highGain, 0, 1)) { return }

        this.options.highGain = highGain
        this.overdrives[3].curve = getDistortionCurve(Pz.Util.normalize(this.highGain, 0, 150))
      }
    }
  })

  return Pizzicato
})(typeof window !== 'undefined' ? window : global)

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],2:[function(require,module,exports){
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
    this._chosenTrack
    this._hasFocus = false
    this._synth = new Synth()
    this._isPlaying = false

    this._effects = {
      analyser: [],
      delay: [],
      flanger: [],
      reverb: [],
      tremolo: [],
      ringModulator: []
    }

    this._effectsControl = this._synth.shadowRoot.querySelectorAll('.trackEffectControl')[0]
    this._audioSources = {}
    this._audioContext = Pizzicato.context
    this._out = this._audioContext.destination
    this._effectsGainNodes = {}
    this._startGainNode = this._audioContext.createGain()
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
      this.renderGrid(Number(newValue))
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
    this.renderGrid(16)
    this.inputListen()
    this._trackSamples['1'].src = '/audio/drums/kicks/1.wav'
    this._trackSamples['2'].src = '/audio/drums/snares/1.wav'
    this._trackSamples['3'].src = '/audio/drums/hihats/1.wav'
    this._trackSamples['4'].src = '/audio/drums/toms/1.wav'
    this._trackSamples['5'].src = '/audio/drums/cymbals/1.wav'
    this._trackSamples['6'].src = '/audio/drums/percussion/1.wav'
    this._trackSamples['7'].src = '/audio/drums/claps/1.wav'

    Object.values(this._trackSamples).forEach((sample, i) => {
      this._effectsGainNodes[i] = this._audioContext.createGain()
      let source = this._audioContext.createMediaElementSource(sample)
      source.connect(this._effectsGainNodes[i])
      source.connect(this._startGainNode)
      this._audioSources[i + 1] = source
    })
    this._startGainNode.connect(this._out)
    this.effectsRouting(true)
    this._chosenTrack = 8
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
        let instrumentTypeSampleAmount = {kicks: 26, snares: 23, hihats: 15, toms: 9, cymbals: 4, percussion: 13, claps: 6, cowbells: 1, synths: 1}
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

      if (event.target.getAttribute('class') === 'bpmInput' || event.target.getAttribute('class') === 'loopLengthInput') {
        event.target.setAttribute('focus', 'true')
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
        if (event.target.getAttribute('class') === 'bpmInput') {
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

    window.addEventListener('click', () => {
      this._audioContext.resume()
    })

    this._effectsControl.onchange = (event) => {
      this._effects[event.target.parentNode.id][this._chosenTrack - 1].options[event.target.name] = Number(event.target.value)
      this.effectsRouting(false, this._chosenTrack)
    }
  }
    /**
   * Renders grid of the sequencer
   *
   * @memberof Sequencer
   */
  renderGrid (loopLength) {

    if(!loopLength){
      let loopLength = Number(this.getAttribute('looplength'))
    }

    let column = 0
    let row = 1
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
      cell.setAttribute('samplePitch', '1')
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
        let cellParameters =
          {
            column: this._cells[i].getAttribute('column'),
            note: this._cells[i].getAttribute('note'),
            octave: this._cells[i].getAttribute('octave'),
            noteLength: this._cells[i].getAttribute('noteLength'),
            samplePitch: this._cells[i].getAttribute('samplePitch'),
            chosen: this._cells[i].getAttribute('chosen')
          }
        grid[Number(this._cells[i].getAttribute('row'))].push(cellParameters)
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
        if (this._storedGrid[Number(this._cells[i].getAttribute('row'))][i2].column === this._cells[i].getAttribute('column')) {
          debugger
          let storedCell = this._storedGrid[Number(this._cells[i].getAttribute('row'))][i2]
          this._cells[i].setAttribute('column', storedCell.column)
          this._cells[i].setAttribute('note', storedCell.note)
          this._cells[i].setAttribute('octave', storedCell.octave)
          this._cells[i].setAttribute('noteLength', storedCell.noteLength)
          this._cells[i].setAttribute('samplePitch', storedCell.samplePitch)
          this._cells[i].setAttribute('chosen', storedCell.chosen)

          let cellChosen = false

          if (this._cells[i].getAttribute('chosen') === 'true') {
            cellChosen = true
          }

          this.cellActivate(this._cells[i], cellChosen)
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
            this._trackSamples[cells[i].getAttribute('row')].playbackRate = cells[i].getAttribute('samplePitch')
            let playPromise = this._trackSamples[cells[i].getAttribute('row')].play()
            playPromise.then(_ => {

            }).catch(error => {

            })
          } else {
            if (cells[cells.length - 1].getAttribute('active') === 'false') {
              this.cellDeactivate(cells[cells.length - 1])
            }
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
   * @memberof Sequence
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
    cell.setAttribute('chosen', 'false')
    cell.style.backgroundColor = 'white'
  }
  /**
   * Deactivates a cell in the grid
   *
   * @memberof Sequencer
   */
  cellActivate (cell, cellChosen, shiftClick) {
    cell.setAttribute('active', 'true')
    cell.setAttribute('chosen', 'false')
    cell.style.backgroundColor = 'yellow'

    if (cellChosen === true) {
      cell.style.backgroundColor = 'green'
      cell.setAttribute('chosen', 'true')
      this._chosenTrack = Number(cell.getAttribute('row'))
      // put in own function
      // updates effect section to match chosen track
      let effectSections = this._synth.shadowRoot.querySelectorAll('.trackEffectSection')
      let synthSection = {
        modulation: this._synth.shadowRoot.querySelectorAll('.modulationSection')[0],
        effects: this._synth.shadowRoot.querySelectorAll('.synthEffects')[0]
      }

      effectSections.forEach(section => {
        section.style.display = 'none'
      })

      if (this._trackInstrument[cell.getAttribute('row')] !== 'synths') {
        effectSections[this._chosenTrack - 1].style.display = 'inherit'
        synthSection.modulation.style.display = 'none'
        synthSection.effects.style.display = 'none'
      } else {
        synthSection.modulation.style.display = 'inherit'
        synthSection.effects.style.display = 'inherit'
      }

      this._grid.querySelectorAll('.cell').forEach(c => {
        if (c.getAttribute('active') === 'true' && c !== cell) {
          this.cellActivate(c, false)
        }
      })
    }
    // put in own function
    if (this.shadowRoot.querySelectorAll('.changeNoteMenu')[0]) {
      if (this._trackInstrument[cell.getAttribute('row')] === 'synths' && cellChosen === true) {
        if (this.shadowRoot.querySelectorAll('.changeNoteMenu')[0].getAttribute('type') === 'sample') {
          this._grid.removeChild(this.shadowRoot.querySelectorAll('.changeNoteMenu')[0])
        }
        if (this.shadowRoot.querySelectorAll('.changeNoteMenu')[0]) {
          this.shadowRoot.querySelectorAll('.changeNoteMenu')[0].setAttribute('assignedCell', cell.id)
          this.shadowRoot.querySelectorAll('.noteSelectionMenu')[0].children[1].value = cell.getAttribute('note')
          this.shadowRoot.querySelectorAll('.octaveSelectionMenu')[0].children[1].value = cell.getAttribute('octave')
          this.shadowRoot.querySelectorAll('.noteLengthInput')[0].children[1].value = cell.getAttribute('noteLength')
          cell.style.border = 'green'
        } else {
          this.changeCellNote(cell)
        }
      } if (this._trackInstrument[cell.getAttribute('row')] !== 'synths' && cellChosen === true) {
        if (this.shadowRoot.querySelectorAll('.changeNoteMenu')[0].getAttribute('type') === 'synth') {
          this._grid.removeChild(this.shadowRoot.querySelectorAll('.changeNoteMenu')[0])
          this.changeCellNote(cell)
        }

        if (this.shadowRoot.querySelectorAll('.changeNoteMenu')[0]) {
          this.shadowRoot.querySelectorAll('.changeNoteMenu')[0].setAttribute('assignedCell', cell.id)
          this.shadowRoot.querySelector("input[name='samplePitch']").value = cell.getAttribute('samplePitch')
          cell.style.border = 'green'
        } else {
          this.changeCellNote(cell)
        }
      }
    } else {
      this.changeCellNote(cell)
    }
  }

  changeCellNote (cell) {
    let changeNoteMenu = document.createElement('div')
    let noteSelectionMenu = document.createElement('div')
    let octaveSelectionMenu = document.createElement('div')
    let noteLengthInput = document.createElement('div')
    let sampleLengthInput = document.createElement('div')
    let samplePitchInput = document.createElement('div')
    let closeButton = document.createElement('div')

    changeNoteMenu.setAttribute('class', 'changeNoteMenu')
    noteSelectionMenu.setAttribute('class', 'noteSelectionMenu')
    octaveSelectionMenu.setAttribute('class', 'octaveSelectionMenu')
    noteLengthInput.setAttribute('class', 'noteLengthInput')
    sampleLengthInput.setAttribute('class', 'sampleLengthInput')
    samplePitchInput.setAttribute('class', 'samplePitchInput')

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

    samplePitchInput.innerHTML =
    `<span>Playback rate: </span>
    <input type="range" min="0.1" max="4" step="0.05"
        value="1.0" list="samplePitches" name="samplePitch">`

    changeNoteMenu.setAttribute('assignedcell', cell.id)

    closeButton.innerText = 'x'

    if (this._trackInstrument[cell.getAttribute('row')] === 'synths') {
      changeNoteMenu.appendChild(noteSelectionMenu)
      changeNoteMenu.appendChild(octaveSelectionMenu)
      changeNoteMenu.appendChild(noteLengthInput)
      changeNoteMenu.appendChild(closeButton)
      cell.parentNode.appendChild(changeNoteMenu)
      changeNoteMenu.setAttribute('type', 'synth')
    }

    if (this._trackInstrument[cell.getAttribute('row')] !== 'synths') {
      changeNoteMenu.appendChild(samplePitchInput)
      changeNoteMenu.appendChild(closeButton)
      cell.parentNode.appendChild(changeNoteMenu)
      changeNoteMenu.setAttribute('type', 'sample')
    }

    let changeNoteElement = this.shadowRoot.querySelector("select[name='note']")
    let changeOctaveElement = this.shadowRoot.querySelector("select[name='octave']")
    let changeNoteLengthElement = this.shadowRoot.querySelector("input[name='noteLength']")
    let changeSamplePitchElement = this.shadowRoot.querySelector("input[name='samplePitch']")

    if (this._grid.querySelectorAll('.changeNoteMenu')[0]) {
      if (this._trackInstrument[cell.getAttribute('row')] === 'synths') {
        changeNoteElement.value = cell.getAttribute('note')
        changeOctaveElement.value = cell.getAttribute('octave')
        changeNoteLengthElement.value = cell.getAttribute('noteLength')
      } if (this._trackInstrument[cell.getAttribute('row')] !== 'synths') {
        changeSamplePitchElement.value = cell.getAttribute('samplePitch')
      }
    }

    changeNoteMenu.onchange = () => {
      let cells = this._grid.querySelectorAll('.cell')
      cells.forEach(c => {
        if (c.id === changeNoteMenu.getAttribute('assignedcell')) {
          if (this._trackInstrument[cell.getAttribute('row')] === 'synths') {
            c.setAttribute('note', `${changeNoteElement.value}`)
            c.setAttribute('octave', `${changeOctaveElement.value}`)
            c.setAttribute('noteLength', `${changeNoteLengthElement.value}`)
          } else {
            c.setAttribute('samplePitch', `${changeSamplePitchElement.value}`)
            console.log(cell.getAttribute('samplePitch'))
          }
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
    if (track && this._audioSources[track] !== null) {
      this._audioSources[track].disconnect(this._startGainNode)
      this._audioSources[track] = null
    }

    let effectOptionObj
    let oldReverb
    let oldFlanger
    let oldTremolo
    let oldDelay
    let oldRingModulator

    if (this._effects.analyser[track - 1] && track) {
      oldReverb = this._effects.reverb[track - 1]
      oldFlanger = this._effects.flanger[track - 1]
      oldTremolo = this._effects.tremolo[track - 1]
      oldDelay = this._effects.delay[track - 1]
      oldRingModulator = this._effects.ringModulator[track - 1]
    }

    if (defaultSettings === false) {
      effectOptionObj = {
        flanger: oldFlanger.options,
        delay: oldDelay.options,
        reverb: oldReverb.options,
        tremolo: oldTremolo.options,
        ringmodulator: oldRingModulator.options
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

      for (let i = 0; i < 7; i++) {
        this._effects.analyser.push(this._audioContext.createAnalyser())
        this._effects.delay.push(new Pizzicato.Effects.Delay(effectOptionObj.delay))
        this._effects.flanger.push(new Pizzicato.Effects.Flanger(effectOptionObj.flanger))
        this._effects.reverb.push(new Pizzicato.Effects.Reverb(effectOptionObj.reverb))
        this._effects.tremolo.push(new Pizzicato.Effects.Tremolo(effectOptionObj.tremolo))
        this._effects.ringModulator.push(new Pizzicato.Effects.RingModulator(effectOptionObj.ringmodulator))

        this._effectsGainNodes[i].connect(this._effects.flanger[i])
        this._effects.flanger[i].connect(this._effects.tremolo[i])
        this._effects.tremolo[i].connect(this._effects.ringModulator[i])
        this._effects.ringModulator[i].connect(this._effects.delay[i])
        this._effects.delay[i].connect(this._effects.reverb[i])
        this._effects.reverb[i].connect(this._effects.analyser[i])
      }
      return
    }

    this._effects.analyser[track - 1] = this._audioContext.createAnalyser()
    this._effects.delay[track - 1] = new Pizzicato.Effects.Delay(effectOptionObj.delay)
    this._effects.flanger[track - 1] = new Pizzicato.Effects.Flanger(effectOptionObj.flanger)
    this._effects.reverb[track - 1] = new Pizzicato.Effects.Reverb(effectOptionObj.reverb)
    this._effects.tremolo[track - 1] = new Pizzicato.Effects.Tremolo(effectOptionObj.tremolo)
    this._effects.ringModulator[track - 1] = new Pizzicato.Effects.RingModulator(effectOptionObj.ringmodulator)

    this._effectsGainNodes[track - 1].connect(this._effects.flanger[track - 1])
    this._effects.flanger[track - 1].connect(this._effects.tremolo[track - 1])
    this._effects.tremolo[track - 1].connect(this._effects.ringModulator[track - 1])
    this._effects.ringModulator[track - 1].connect(this._effects.delay[track - 1])
    this._effects.delay[track - 1].connect(this._effects.reverb[track - 1])
    this._effects.reverb[track - 1].connect(this._effects.analyser[track - 1])
    this._effects.analyser[track - 1].connect(this._out)

    if (oldReverb !== undefined) {
      oldFlanger.disconnect()
      oldTremolo.disconnect()
      oldRingModulator.disconnect()
      this._effectsGainNodes[track - 1].connect(oldDelay)
      setTimeout(() => {
        oldDelay.disconnect()
        this._effectsGainNodes[track - 1].connect(oldReverb)
      }, oldDelay.options.time * 1000)
      setTimeout(() => {
        oldReverb.disconnect()
      }, oldReverb.options.time * 1000)
    }
  }
  updateEffectSection (cell) {
   // updates effect section to match chosen track
    let effectSections = this._synth.shadowRoot.querySelectorAll('.trackEffectSection')
    let synthSection = {
      modulation: this._synth.shadowRoot.querySelectorAll('.settingsbar')[0],
      effects: this._synth.shadowRoot.querySelectorAll('.synthEffects')[0]
    }

    effectSections.forEach(section => {
      section.style.display = 'none'
    })

    if (this._trackInstrument[cell.getAttribute('row')] !== 'synths') {
      effectSections[this._chosenTrack - 1].style.display = 'inherit'
      synthSection.modulation.display = 'none'
      synthSection.effects.style.display = 'none'
    } else {
      synthSection.modulation.style.display = 'inherit'
      synthSection.effects.style.display = 'inherit'
    }
  }
  resumeAudio () {
    if (typeof this._audioContext === 'undefined' || this._audioContext === null) {
      return
    }
    if (this._audioContext.state === 'suspended') {
      this._audioContext.resume()
    }
  }
}

window.customElements.define('grid-sequencer', Sequencer)

module.exports = Sequencer

},{"./Pizzicato.js":1,"./synth":3,"./templates/sequencerTemplate":5}],3:[function(require,module,exports){
/**
 * Webcomponent for creating a synth application.
 *
 * @module src/synth.js
 * @author Lowe Marklund
 * @version 1.0
 */

 'use strict'

 const SynthTemplate = require('./templates/synthTemplate')
 const Pizzicato = require('./Pizzicato.js')
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
     this._carrierGainControl = this.shadowRoot.querySelector("input[name='carrierGain']")
     this._modulationFreqControl = this.shadowRoot.querySelector("input[name='modulationFreq']")
     this._modulationDepthControl = this.shadowRoot.querySelector("input[name='modulationDepth']")
     this._modulation2FreqControl = this.shadowRoot.querySelector("input[name='modulation2Freq']")
     this._modulation2DepthControl = this.shadowRoot.querySelector("input[name='modulation2Depth']")
     this._flangerControl = this.shadowRoot.querySelector('#flanger')
     this._tremoloControl = this.shadowRoot.querySelector('#tremolo')
     this._reverbControl = this.shadowRoot.querySelector('#reverb')
     this._ringModulatorControl = this.shadowRoot.querySelector('#ringModulator')
     this._delayControl = this.shadowRoot.querySelector('#delay')
     this._lfoFrequency = this.shadowRoot.querySelector("input[name='lfoFreq']")
     this._audioContext = Pizzicato.context
     this._out = this._audioContext.destination
     this._effectsGainNode = this._audioContext.createGain()
     this._oscList = {}
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
     this._triggerKeys = ['Tab', '1', 'q', '2', 'w', 'e', '4', 'r', '5', 't', '6', 'y', 'u', '8', 'i', '9', 'o', 'p', '0', 'å', '´', '¨', '\u27f5', '\u21b5']
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

    //  this._lfoFrequency.addEventListener('change', () => {
    //    this.changeLfoFreq()
    //  })

     this._flangerControl.onchange = (event) => {
       this._flanger.options[event.target.name] = Number(event.target.value)
       this.effectsRouting(false)
     }

     this._tremoloControl.onchange = (event) => {
       this._tremolo.options[event.target.name] = Number(event.target.value)
       this.effectsRouting(false)
     }

     this._reverbControl.onchange = (event) => {
       this._reverb.options[event.target.name] = Number(event.target.value)
       this.effectsRouting(false)
     }

     this._ringModulatorControl.onchange = (event) => {
       this._ringModulator.options[event.target.name] = Number(event.target.value)
       this.effectsRouting(false)
     }

     this._delayControl.onchange = (event) => {
       this._delay.options[event.target.name] = Number(event.target.value)
       this.effectsRouting(false)
     }

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

         if (event.repeat === false && this._triggerKeys.includes(triggeredKey) && this._sequencer._loopLengthInput.getAttribute('focus') === 'false' && this._sequencer._bpmInput.getAttribute('focus') === 'false') {
           let key = this._keyboard.querySelector(`#key${triggeredKey}`)
           this.notePressed(key, triggeredKey)
           key.style.backgroundColor = '#599'
         } else {
           this._sequencer._loopLengthInput.setAttribute('focus', 'false')
           this._sequencer._bpmInput.setAttribute('focus', 'false')
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

     window.addEventListener('click', () => {
       this._audioContext.resume()
     })

     window.addEventListener('keydown', () => {
       this._audioContext.resume()
     })
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

     this.effectsRouting(true)
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

     carrierGain.gain.value = this._carrierGainControl.value
     modulatorGain.gain.value = this._modulationDepthControl.value
     modulator.frequency.value = this._modulationFreqControl.value
     modulator2Gain.gain.value = this._modulation2DepthControl.value
     modulator2.frequency.value = this._modulation2FreqControl.value

      // frequency modulation routing
     carrier.connect(carrierGain)
     carrier.connect(this._effectsGainNode)
     carrierGain.connect(modulator.frequency)
     modulator.connect(modulatorGain)
     modulatorGain.connect(this._effectsGainNode)
     carrierGain.connect(modulator2.frequency)
     modulator2.connect(modulator2Gain)
     modulator2Gain.connect(this._effectsGainNode)

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
         })
         delete this._oscList[cellId]
       } else {
         this._oscList[id].forEach(osc => {
           osc.stop()
         })
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

   effectsRouting (defaultSettings) {
     let effectOptionObj
     let oldReverb
     let oldFlanger
     let oldTremolo
     let oldDelay
     let oldRingModulator

     if (this._analyser) {
       oldReverb = this._reverb
       oldFlanger = this._flanger
       oldTremolo = this._tremolo
       oldDelay = this._delay
       oldRingModulator = this._delay
     }

     if (defaultSettings === false) {
       effectOptionObj = {
         flanger: this._flanger.options,
         delay: this._delay.options,
         reverb: this._reverb.options,
         tremolo: this._tremolo.options,
         ringmodulator: this._ringModulator.options
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

     this._effectsGainNode.gain.value = 1

     this._analyser = this._audioContext.createAnalyser()

     this._delay = new Pizzicato.Effects.Delay(effectOptionObj.delay)

     this._flanger = new Pizzicato.Effects.Flanger(effectOptionObj.flanger)

     this._reverb = new Pizzicato.Effects.Reverb(effectOptionObj.reverb)

     this._tremolo = new Pizzicato.Effects.Tremolo(effectOptionObj.tremolo)

     this._lowPassFilter = new Pizzicato.Effects.LowPassFilter({
       frequency: 0,
       peak: 0
     })

     this._highPassFilter = new Pizzicato.Effects.HighPassFilter({
       frequency: 0,
       peak: 0
     })

     this._ringModulator = new Pizzicato.Effects.RingModulator(effectOptionObj.ringmodulator)

     this._effectsGainNode.connect(this._flanger)
     this._flanger.connect(this._tremolo)
     this._tremolo.connect(this._ringModulator)
     this._ringModulator.connect(this._delay)
   // this._lowPassFilter.connect(this._highPassFilter)
   // this._highPassFilter.connect(this._delay)
     this._delay.connect(this._reverb)
     this._reverb.connect(this._analyser)
     this._analyser.connect(this._masterGainNode)

     if (oldReverb !== undefined) {
       oldReverb.disconnect()
       oldFlanger.disconnect()
       oldDelay.disconnect()
       oldRingModulator.disconnect()
       oldTremolo.disconnect()
     }
   }

   resumeAudio () {
     if (typeof this._audioContext === 'undefined' || this._audioContext === null) {
       return
     }
     if (this._audioContext.state === 'suspended') {
       this._audioContext.resume()
     }
   }
}

 window.customElements.define('synth-element', Synth)

 module.exports = Synth

},{"./Pizzicato.js":1,"./templates/synthTemplate":6}],4:[function(require,module,exports){
const template = document.createElement('template')

template.innerHTML =

`
<div class="effectSettings"
    <div class="effect" id="flanger">
    <span>Flanger </span>
    <br>
    <span>Time: </span>
    <input type="range" min="0.0" max="1.0" step="0.01"
        value="0" list="flangerTime" name="time">
    <br>
    <span>Depth: </span>
    <input type="range" min="0.0" max="1.0" step="0.01"
        value="0" list="flangerDepth" name="depth">
    <br>
    <span>Speed: </span>
    <input type="range" min="0.0" max="1.0" step="0.01"
        value="0" list="flangerSpeed" name="speed">
    <br>
    <span>Feedback: </span>
    <input type="range" min="0.0" max="1.0" step="0.01"
        value="0" list="flangerFeedBack" name="feedback">
    <br>
    <span>Mix: </span>
    <input type="range" min="0.0" max="1.0" step="0.01"
        value="0" list="flangerMix" name="mix">
    </div>

    <div class="effect" id="tremolo">
    <span>Tremolo </span>
    <br>
    <span>Depth: </span>
    <input type="range" min="0.0" max="20" step="0.01"
        value="0" list="tremoloDepth" name="depth">
    <br>
    <span>Speed: </span>
    <input type="range" min="0.0" max="1000" step="1"
        value="0" list="tremoloSpeed" name="speed">
    <br>
    <span>Mix: </span>
    <input type="range" min="0.0" max="1.0" step="0.01"
        value="0" list="tremoloMix" name="mix">
    </div>   

    <div class="effect" id="reverb">
    <span>Reverb </span>
    <br>
    <span>time: </span>
    <input type="range" min="0.0" max="3" step="0.01"
        value="0" list="reverbTime" name="time">
    <br>
    <span>Decay: </span>
    <input type="range" min="0.0" max="1" step="0.01"
        value="0" list="reverbDecay" name="decay">
    <br>
    <span>Mix: </span>
    <input type="range" min="0.0" max="1" step="0.01"
        value="0" list="reverbMix" name="mix">
    <br>
    </div>

    <div class="effect" id="ringModulator">
    <span>Ring Modulator </span>
    <br>
    <span>Speed: </span>
    <input type="range" min="0.0" max="2000" step="1"
        value="0" list="ringModSpeed" name="speed">
    <br>
    <span>Distortion: </span>
    <input type="range" min="0.0" max="50" step="0.5"
        value="0" list="ringModDistortion" name="distortion">
    <br>
    <span>Mix: </span>
    <input type="range" min="0.0" max="1" step="0.01"
        value="0" list="ringModulatorMix" name="mix">
    <br>
    </div>
    <br>
    <div class="effect" id="delay">
    <span>Delay </span>
    <br>
    <span>Volume: </span>
    <input type="range" min="0.0" max="5" step="0.1"
        value="0" list="delayVolume" name="volume">
    <br>
    <span>Time: </span>
    <input type="range" min="0.0" max="5" step="0.1"
        value="0" list="delayTime" name="time">
    <br>
    <span>Feedback: </span>
    <input type="range" min="0.0" max="1" step="0.01"
        value="0" list="delayFeedback" name="feedback">
    <br>
    <span>Mix: </span>
    <input type="range" min="0.0" max="1" step="0.01"
        value="0" list="delayMix" name="mix">
    <br>
    </div>

    <div class="effect" id="highpassFilter">
    <span>highpass Filter </span>
    <br>
    <span>Volume: </span>
    <input type="range" min="0.0" max="5" step="0.1"
        value="0" list="delayVolume" name="volume">
    <br>
    <span>Time: </span>
    <input type="range" min="0.0" max="5" step="0.1"
        value="0" list="delayTime" name="time">
    <br>
    <span>Feedback: </span>
    <input type="range" min="0.0" max="1" step="0.01"
        value="0" list="delayFeedback" name="feedback">
    <br>
    <span>Mix: </span>
    <input type="range" min="0.0" max="1" step="0.01"
        value="0" list="delayMix" name="mix">
    <br>
    </div>
`

{ /* <div class="lfoFreq">
<span>Lfo freq: </span>
<input type="range" min="0" max="1" step="0.01"
value="1" list="lfoFreq" name="lfoFreq">
*/ }

module.exports.template = template

},{}],5:[function(require,module,exports){
const template = document.createElement('template')

template.innerHTML =

`<div class="sequencer">
    <div class="logs">
        <div class="bpmLog">BPM: 150</div>
        <div class="loopLengthLog">Length: 16 </div>
    </div>
    <div class="inputs">
        <input class="bpmInput" placeholder="Enter tempo (BPM) max = 300 min = 30" focus="false"></input>
        <input class="loopLengthInput" placeholder="Enter loop length (max = 32 min = 1)" focus="false"></input>
    </div>
    <div class="grid"></div>
    <img class="pausePlayButton" type="play" src="/image/icons8-play-button-50.png" alt="pause/play icon">
    <div class="info">Click icons and numbers to change track sound</div>
    <button class="clearButton">Clear Grid</button>
    
    <style>
        .sequencer {
            margin-left: 30px;
            margin-right: 20px;
            width: 500;
            font-family: avenir;
            text-align: center;
            user-drag: none; 
            user-select: none;
            -moz-user-select: none;
            -khtml-user-select: none;
            -webkit-user-select: none;
            -o-user-select: none;
        }
        .instrumentLog {
            text-align: center;
            font-size: 30px;
            margin: 10px;
            font-family: avenir;
        }
        .logs {
            text-align: center;
            margin-right: 5px;
            width: auto;
        }

        .logs div {
            display: inline-block;
            text-align: center;
            margin-left: 70px;
            margin-right: 70px;
        }

        .info {
            font-size: 10px;
            margin: 10px;
        }

        }
        .inputs {
            float: center;
        }

        .inputs input{
            text-align: center;
            margin: 10px;
            margin-left: 9px;
            margin-right: 9px;
            margin-top: 5px;
            font-size: 8px;
            width: 200px;
        }

        .grid {
            text-align: center;  
        }

        .cell {
            height: 15px;
            width: 15px;
            position: relative;
            box-shadow: 1px 1px 5px rgba(0, 0, 0, .5);
            padding: 5px;
            margin: 1px;
            border-radius: 3px;
            background: white;
        }

        .instrumentIcon{
            height: 15px;
            width: 15px;
            position: relative;
            padding: 5px;
            margin-left: -42px;
            margin-bottom: -1px;
            border-radius: 3px;
            position:absolute;

        }

        .instrumentNumber {
            display: inline;
            margin-left: -18px;
            margin-top: 5px;
            position:absolute;
        
        }

        .pausePlayButton {
           margin-top: 10px;
           margin-right: 0px;
           width: 30px
        }

        .clearButton {
            text-align: left;
        }

        .changeNoteMenu {
            display: inline-block;
        }
    </style>
</div>
`
module.exports.template = template

},{}],6:[function(require,module,exports){
const template = document.createElement('template')
const effectTemplate = require('./effectSectionTemplate')
const effectSection = effectTemplate.template.innerHTML

template.innerHTML =
`<div class="synth">
    <div class="keyboard">
      <div class="settingsBar">
      <div class="modulationSection">
        <div class="volumeInput">
          <span>Volume: </span>
          <input type="range" min="0.0" max="1.0" step="0.01"
              value="0.5" list="volumes" name="volume">
          <datalist id="volumes">
            <option value="0.0" label="Mute">
            <option value="1.0" label="100%">
          </datalist>
        </div>
        <span>Carrier Gain: </span>
        <input type="range" min="0" max="3000" step="1"
            value="1" list="carrierGain" name="carrierGain">
        <div class="modulationInput">
            <span>Modulation Freq: </span>
            <input type="range" min="1" max="1500" step="1"
                value="750" list="modulationFreq" name="modulationFreq">
            <span>Modulation Depth: </span>
            <input type="range" min="0" max="1" step="0.01"
                value="0" list="modulationDepth" name="modulationDepth">
        </div>
        <div class="modulationInput">
          <span>Modulation 2 Freq: </span>
          <input type="range" min="1" max="1500" step="1"
              value="750" list="modulation2Freq" name="modulation2Freq">
          <span>Modulation 2 Depth: </span>
          <input type="range" min="0" max="1" step="0.01"
              value="0" list="modulation2Depth" name="modulation2Depth">
          
        </div>
        <div class="right">
          <span>Carrier waveform: </span>
          <select name="waveform">
            <option value="sine">Sine</option>
            <option value="square" selected>Square</option>
            <option value="sawtooth">Sawtooth</option>
            <option value="triangle">Triangle</option>
          </select>
          <span> Mod1 waveform: </span>
          <select name="waveform2">
            <option value="sine">Sine</option>
            <option value="square" selected>Square</option>
            <option value="sawtooth">Sawtooth</option>
            <option value="triangle">Triangle</option>
          </select>
          <span> Mod2 waveform: </span>
          <select name="waveform3">
            <option value="sine">Sine</option>
            <option value="square" selected>Square</option>
            <option value="sawtooth">Sawtooth</option>
            <option value="triangle">Triangle</option>
          </select>
        </div>
        <div>
        <span>Keyboard octave: </span>
        <select name="octave" class="octaveControl">
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
        <div class="synthEffects">${effectSection}</div>
        <div class="trackEffectControl">
            <div class="trackEffectSection" id="track1Effects">${effectSection}</div>
            <div class="trackEffectSection" id="track2Effects">${effectSection}</div>
            <div class="trackEffectSection" id="track3Effects">${effectSection}</div>
            <div class="trackEffectSection" id="track4Effects">${effectSection}</div>
            <div class="trackEffectSection" id="track5Effects">${effectSection}</div>
            <div class="trackEffectSection" id="track6Effects">${effectSection}</div>
            <div class="trackEffectSection" id="track7Effects">${effectSection}</div>
        </div>
       
        </div>
    </div>
  </div>
  <div>
<div>
    <style>
      .synth {
        height: 110px;
        white-space: nowrap;
        margin-left: 10px;
    
      }
      .keyboard {
        height: 100px;
        padding: 10px;
        margin: 20px;
        position: relative;
       
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

      .octaveControl {
        margin-top: 10px;
        display: inline-block;

      }
      
      .octave {
        margin-top: 10px;
        display: inline-block;

      }
      
      .settingsBar {
        float: right;
        margin-left: 30px;
        margin-top: -175px;
        padding: 20px;
        font: 10px "Avenir", "Lucida Grande", "Arial", sans-serif;
        position: flexible;
        height: auto;
        width: auto;
      }
      .right {
        margin-top: 10px;
        text-align: left;
      }

      .volumeInput{
        text-align: left;
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

      .modulationInput{
        text-align: left;
      }

      .lfoFreq{
        text-align: left;
        margin-top: 10px;
      }

      .effectSettings {
        margin-top: 20px;
        
      }

      .effect {
        margin-top: 20px;
        display: inline-block;
      }

      .trackEffectSection{
          display: none;
          margin-left: 10px;
      }

      .synthEffects {

      }
    </style>
</div>
`

{ /* <div class="lfoFreq">
<span>Lfo freq: </span>
<input type="range" min="0" max="1" step="0.01"
value="1" list="lfoFreq" name="lfoFreq">
*/ }

module.exports.template = template

},{"./effectSectionTemplate":4}],7:[function(require,module,exports){
const Sequencer = require('../app/src/js/sequencer.js')

let newSequencer = new Sequencer()

newSequencer._synth._sequencer = newSequencer

document.querySelector('body').insertBefore(newSequencer._synth, document.querySelector('body').children[0])
document.querySelector('body').insertBefore(newSequencer, document.querySelector('body').children[0])

newSequencer.style.display = 'none'
newSequencer._synth.style.display = 'none'

},{"../app/src/js/sequencer.js":2}]},{},[7]);
