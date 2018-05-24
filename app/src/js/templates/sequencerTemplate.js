const template = document.createElement('template')

template.innerHTML =

`<div class="sequencer">
    <div class="logs">
        <div class="bpmLog">BPM: 150</div>
        <div class="loopLengthLog">Length: 32 </div>
    </div>
    <div class="inputs">
        <input class="bpmInput" placeholder="Enter tempo (BPM max = 300 min = 30)" focus="false"></input>
        <input class="loopLengthInput" placeholder="Enter loop length (max = 32 min = 1)" focus="false"></input>
    </div>
    <div class="grid"></div>
    <img class="pausePlayButton" type="play" src="/image/icons8-play-button-50.png" alt="pause/play icon">
    <div class="info">Click icons and numbers to change track sound</div>
    <div class="info">Shift + click to choose activated cells </div>
    <button class="clearButton">Clear Grid</button>
    
    <style>
        .sequencer {
            color: white;
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
            border: 2px solid white;
            color: white;
            text-align: center;
            margin: 10px;
            margin-left: 9px;
            margin-right: 9px;
            margin-top: 5px;
            font-size: 8px;
            width: 200px;
            background: transparent;
            box-shadow: 0 8px 16px 0 rgba(0,0,0,0.2), 0 6px 20px 0 rgba(0,0,0,0.1);
        }

       ::placeholder {
           color: white;
       }

        .grid {
            text-align: center;  
        }

        .cell {
            height: 12px;
            width: 12px;
            position: relative;
            padding: 5px;
            margin: 2px;
            margin-top: -2px;
            background: transparent;
            border: 2px solid white;
            box-shadow: 0 8px 16px 0 rgba(0,0,0,0.2), 0 6px 10px 0 rgba(0,0,0,0.1);
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
            border: 2px solid white;
            text-align: center;
            color: white;
            background: transparent;
            box-shadow: 0 8px 16px 0 rgba(0,0,0,0.2), 0 6px 20px 0 rgba(0,0,0,0.19);
            outline: none;
        }

        .clearButton:hover {
            background: #599;
        }
        
        .clearButton:active {
          background: red;
          box-shadow: 0 5px #666;
          transform: translateY(4px);
        }

        .changeNoteMenu {
            display: inline-block;
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
module.exports.template = template
