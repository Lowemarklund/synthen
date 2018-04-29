const template = document.createElement('template')

<<<<<<< HEAD
 template.innerHTML =
 
=======
template.innerHTML =
>>>>>>> e3ddcb61931b77251546aefaf177fa44b07ad9da
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
<<<<<<< HEAD
module.exports.template = template
=======
module.exports.template = template
>>>>>>> e3ddcb61931b77251546aefaf177fa44b07ad9da
