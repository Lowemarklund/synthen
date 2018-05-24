const template = document.createElement('template')
const effectTemplate = require('./effectSectionTemplate')
const effectSection = effectTemplate.template.innerHTML

template.innerHTML =
`<div class="synth">
<div class="modulationSection">
<div class="volumeInput">
  <span>Volume: </span>
  <input type="range" min="0.0" max="1.0" step="0.01"
      value="0.5" list="volumes" name="volume">
<span>Carrier Gain: </span>
<input type="range" min="0" max="3000" step="1"
    value="1" list="carrierGain" name="carrierGain">
<div class="modulationInput">
    <span>Modulation Freq: </span>
    <input type="range" min="1" max="1500" step="1"
        value="0" list="modulationFreq" name="modulationFreq">
    <span>Modulation Depth: </span>
    <input type="range" min="0" max="1" step="0.01"
        value="0" list="modulationDepth" name="modulationDepth">
</div>
</div>
<div class="modulationInput">
  <span>Modulation 2 Freq: </span>
  <input type="range" min="1" max="1500" step="1"
      value="0" list="modulation2Freq" name="modulation2Freq">
  <span>Modulation 2 Depth: </span>
  <input type="range" min="0" max="1" step="0.01"
      value="0" list="modulation2Depth" name="modulation2Depth">
  
</div>
<div class="right">
  <span>Carrier waveform: </span>
  <select name="waveform" class="synthOptionBox">
    <option value="sine">Sine</option>
    <option value="square" selected>Square</option>
    <option value="sawtooth">Sawtooth</option>
    <option value="triangle">Triangle</option>
  </select>
  <span> Mod1 waveform: </span>
  <select name="waveform2" class="synthOptionBox">
    <option value="sine">Sine</option>
    <option value="square" selected>Square</option>
    <option value="sawtooth">Sawtooth</option>
    <option value="triangle">Triangle</option>
  </select>
  <span> Mod2 waveform: </span>
  <select name="waveform3" class="synthOptionBox"> 
    <option value="sine">Sine</option>
    <option value="square" selected>Square</option>
    <option value="sawtooth">Sawtooth</option>
    <option value="triangle">Triangle</option>
  </select>
</div>
<div>
<span>Keyboard octave: </span>
<select name="octave" class="synthOptionBox">
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
<div class="settingsBar">

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
    <div class="keyboard"></div>
  <div>
<div>
    <style>
      .synth {
        color: white;
        height: 110px;
        white-space: nowrap;
        margin-left: 10px;
    
      }
      .keyboard {
        height: 150px;
        padding: 10px;
        margin: 20px;
        margin-top: -120px;
        margin-left: 20px;
        position: absolute;
      }
      
      .key {
        margin-right: -2px;
        color: white;
        position: static;
        cursor: pointer;
        font: 10px "Open Sans", "Lucida Grande", "Arial", sans-serif;
        border: 2px solid white;
        border-radius: px;
        width: 20px;
        height: 150px;
        padding: 10px;
        text-align: center;
        display: inline-block;
        line-height: 270px;
        user-select: none;
        -moz-user-select: none;
        -webkit-user-select: none;
        -ms-user-select: none;
        box-shadow:0 0 10px rgba(0,0,0,0.5) inset
        background: transparent;
        box-shadow: 0 8px 16px 0 rgba(0,0,0,0.2), 0 6px 20px 0 rgba(0,0,0,0.19);
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
        background:linear-gradient(45deg, #599 30%, #0c618f 100%);
      }


      .octaveControl {
        margin-top: 20px;
      }
      
      .octave {
        margin-top: 10px;
        display: inline-block;

      }
      
      .right {
        margin-top: 10px;
        margin-bottom: 10px;
        text-align: left;
      }

      .volumeInput{
        text-align: left;
        display: table-cell;
      }

      .sharpKey {
        cursor: pointer;
        font: 10px "Open Sans", "Lucida Grande", "Arial", sans-serif;
        width: 10px;
        height: 75px;
        padding: 10px;
        text-align: center;
        display: inline-block;
        position: relative;
        margin-bottom: -300px;
        user-select: none;
        -moz-user-select: none;
        -webkit-user-select: none;
        -ms-user-select: none;
        background-color: white;
        color: white;
        margin-left: 25px;
        top: 26px;
        border: 2px solid #000;
        box-shadow:-1px -1px 2px rgba(255,255,255,0.2) inset, 0 -5px 2px 3px rgba(0,0,0,0.6) inset, 0 2px 4px rgba(0,0,0,0.5);
        background:linear-gradient(45deg, #222 0%,#555 100%);
      }
      .sharpKey:active{
        background: linear-gradient(45deg, #599 0%,#555 100%);
      }

      #key1{
        left: 1px;
      }

      #key2{
        left: -14px;
      }

      #key4{
        left: 9px;
      }

      #key5{
        left: -6px;
      }

      #key6{
        left: -21px;
      }

      #key8{
        left: 2px;
      }

      #key9{
        left: -15px;
      }

      #key0{
        left: 8px;
      }

      #key´{
        left: -7px;
      }

      #key⟵{
        left: -23px;
        top: 27px;
      }

      .modulationInput{
        text-align: left;
      }

      .effect {
        display: table-cell;
        margin: 40px;
      }

      .effect input{
        width: 200px;
        margin-right: 20px;
      }

      .trackEffectSection{
          display: none;
          margin-left: 10px;
      }

      .modulationSection {
        float: left;
        margin-right: -30px;
        margin-top: -130px;
        padding: 20px;
        font: 10px "Avenir", "Lucida Grande", "Arial", sans-serif;
        position: relative;
        height: auto;
        width: auto;
      }

      .settingsBar {
        float: right;
        padding: 20px;
        margin-top: -160px;
        margin-left: 10px;
        font: 10px "Avenir", "Lucida Grande", "Arial", sans-serif;
        position: relative;
        height: auto;
        width: auto;
      }

      #tremolo{
        margin-top: -200px;
        margin-right: 300px;
      }

      #flanger input{
        width: 300px;
      }
      #flanger{
        margin-top: 20px;
        margin-bottom: 10px;
        margin-left: 90px;
      }

      input[type=range] {
        outline: none;
        -webkit-appearance: none; /* Hides the slider so that custom slider can be made */
        background: transparent; /* Otherwise white in Chrome */
      }

      input[type=range]::-webkit-slider-thumb {
        -webkit-appearance: none;
        border: 1px solid #000000;
        height: 10px;
        width: 3px;
        border-radius: 3px;
        background: #ffffff;
        cursor: pointer;
        box-shadow: 1px 1px 1px #000000, 0px 0px 1px #0d0d0d; /* Add cool effects to your sliders! */
      }

      input[type=range]::-webkit-slider-runnable-track {
        cursor: pointer;
        margin: 1px;
        margin-right: 3px;
        box-shadow: 0 8px 16px 0 rgba(0,0,0,0.2), 0 6px 20px 0 rgba(0,0,0,0.19);
        background: transparent;
        border: 2px solid white;
      }

     
      select {
        outline: none;
        position: relative;
        background: transparent;
        border-radius: 0px;
        border: 2px solid white;
        color: white;
        margin-left: 1px;
        margin-right: 5px;
      }

      select-items div, select-selected {
        color: #ffffff;
        padding: 8px 16px;
        border: 1px solid transparent;
        border-color: transparent transparent rgba(0, 0, 0, 0.1) transparent;
        cursor: pointer;
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
