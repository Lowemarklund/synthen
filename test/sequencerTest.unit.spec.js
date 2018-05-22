let sequencer = document.querySelector('grid-sequencer')
sequencer.removeGrid()

describe("Sequencer", function() {
  let grid = sequencer.renderGrid(14)
  let cells = grid.querySelectorAll('.cell')
    describe("Render grid ", function() {
      it("Correct amount of cells generated ", function() {
        chai.expect(cells.length).to.equal(14*8)
      })

      it("Generated cells has correct default attributes", function() {
        let row = 0 
        let column = 1
        let correctCells = 0
        cells.forEach((cell, i) => {
          column += 1

          if(i%14 === 0){
            row += 1 
            column = 1
          }
          if(
            cell.getAttribute('active') === 'false' && 
            cell.getAttribute('id') === `${i}` &&
            cell.getAttribute('class') === 'cell' &&
            cell.getAttribute('row') === `${row}` &&
            cell.getAttribute('column') === `${column}` &&
            cell.getAttribute('note') === 'C' &&
            cell.getAttribute('octave') === '3' &&
            cell.getAttribute('noteLength') === '100' &&
            cell.getAttribute('samplePitch') === '1' &&
            cell.getAttribute('chosen') === 'false'
            )
            {
              correctCells += 1
          }
        });
        chai.expect(correctCells).to.equal(14*8)
      })
  })
  describe("Cells ", function() {
    it("Cells activated correctly ", function() {
     let activatedCells = 0

     cells.forEach((cell, i) => {
       sequencer.cellActivate(cell, false, false)

       if(cell.getAttribute('active') === 'true' && cell.style.backgroundColor === 'yellow'){
         activatedCells += 1
       }
     });
     chai.expect(activatedCells).to.equal(14*8)
   })

   it("Cells deactivated correctly ", function() {
    let deactivatedCells = 0

    cells.forEach((cell, i) => {
      sequencer.cellDeactivate(cell, false, false)

      if(cell.getAttribute('active') === 'false' && cell.style.backgroundColor === 'white'){
        deactivatedCells += 1
      }
    });
    chai.expect(deactivatedCells).to.equal(14*8)
  })
 })
 describe("Remove Grid", function() {
  it("Grid removed correctly ", function() {
   sequencer.removeGrid()
   chai.expect(grid.children.length).to.equal(0)
 })
})
})
