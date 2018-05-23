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
    <div class="info">Shift + click to choose activated cells </div>
    <button class="clearButton">Clear Grid</button>
    
    <style>
        .sequencer {

            font-family: avenir;
            text-align: center;
            user-drag: none; 
            user-select: none;
            -moz-user-select: none;
            -khtml-user-select: none;
            -webkit-user-select: none;
            -o-user-select: none;
            margin: auto;
            width: 50%;
            padding: 10px;
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
