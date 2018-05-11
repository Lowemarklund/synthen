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
