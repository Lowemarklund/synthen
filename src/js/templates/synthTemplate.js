const template = document.createElement('template')

template.innerHTML =

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
        <div class="lfoFreq">
          <span>Lfo freq: </span>
          <input type="range" min="0" max="1" step="0.01"
          value="1" list="lfoFreq" name="lfoFreq">
          <span>Keyboard octave: </span>
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
        margin-top: 10px;
        display: inline-block;

      }
      
      .settingsBar {
        margin-bottom: 20px;
        margin-left: 700px;
        padding: 20px;
        font: 14px "Open Sans", "Lucida Grande", "Arial", sans-serif;
        position: flexible;
        vertical-align: middle;
        width: 100%;
        height: 30px;
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
    </style>
</div>
`

module.exports.template = template
