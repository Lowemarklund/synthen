let synth = document.querySelector('synth-element')

describe("Synth", function() {
    let octave = 1
    let noteTable = synth.createNoteTable(octave)
    let expectedNoteTable = []

    for(let i = 1; i < 8; i++){
        expectedNoteTable[i] = []
        expectedNoteTable[i]['C'] = 32.703195662574829 * Math.pow(2, i-1)
        expectedNoteTable[i]['C#'] = 34.647828872109012 * Math.pow(2, i-1)
        expectedNoteTable[i]['D'] = 36.708095989675945 * Math.pow(2, i-1)
        expectedNoteTable[i]['D#'] = 38.890872965260113 * Math.pow(2, i-1)
        expectedNoteTable[i]['E'] = 41.203444614108741 * Math.pow(2, i-1)
        expectedNoteTable[i]['F'] = 43.653528929125485 * Math.pow(2, i-1)
        expectedNoteTable[i]['F#'] = 46.249302838954299 * Math.pow(2, i-1)
        expectedNoteTable[i]['G'] = 48.999429497718661 * Math.pow(2, i-1)
        expectedNoteTable[i]['G#'] = 51.913087197493142 * Math.pow(2, i-1)
        expectedNoteTable[i]['A'] = 55.000000000000000 * Math.pow(2, i-1)
        expectedNoteTable[i]['A#'] = 58.270470189761239 * Math.pow(2, i-1)
        expectedNoteTable[i]['B'] = 61.735412657015513 * Math.pow(2, i-1)
    }

    describe("Create Note table ", function() {
        it("Correct note table generated", function() {
            chai.expect(noteTable).to.deep.equal(expectedNoteTable)
        })

    })

    describe("Create key element ", function() {
        let note = 'A'
        let octave = 4
        let freq = 440
        let keyIndex = 1
        let keyElement = synth.createKey(note, octave, freq, keyIndex)

        let keyElement2 = synth.createKey('Ab', octave, freq, keyIndex)

        it("Correct key element generated", function() {
            chai.expect(keyElement.getAttribute('class')).to.equal('key')
            chai.expect(keyElement.dataset['octave']).to.equal('4')
            chai.expect(keyElement.dataset['note']).to.equal('A')
            chai.expect(keyElement.dataset['frequency']).to.equal(`${freq}`)

            chai.expect(keyElement2.getAttribute('class')).to.equal('sharpKey')
            chai.expect(keyElement2.dataset['octave']).to.equal('4')
            chai.expect(keyElement2.dataset['note']).to.equal('Ab')
            chai.expect(keyElement2.dataset['frequency']).to.equal(`${freq}`)
        })

    })

    describe("Create keyboard ", function() {
        let keyboard = synth.createKeyboard(3)
      

        it("Correct keyboard generated", function() {
            chai.expect(keyboard.children.length).to.equal(2)
            chai.expect(keyboard.children[0].nodeName).to.equal('DIV')
            chai.expect(keyboard.children[1].nodeName).to.equal('DIV')
            let keys = []

            keyboard.querySelectorAll('div').forEach(element => {
                if(element.getAttribute('keyElement') === 'true'){
                    keys.push(element)
                }
            });

            keys.sort(function(a, b){return a.dataset['octave']-b.dataset['octave']});

            keys.forEach((keyElement, i) => {
                if(i > 11){
                    chai.expect(keyElement.dataset['octave']).to.equal('4')
                }else{
                    chai.expect(keyElement.dataset['octave']).to.equal('3')
                }
                
                chai.expect(keyElement.dataset['frequency']).to.equal(`${synth._noteFreq[Number(keyElement.dataset['octave'])][keyElement.dataset['note']]}`)
               
            });
          
        })

    })
})

