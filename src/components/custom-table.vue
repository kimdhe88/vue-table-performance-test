<template>
  <div class="custom-table" @mousewheel="tableWheelEvent">
    <table border="1px">
      <thead>
        <div>
          <tr>
            <th
              class="custom-cell"
              v-for="header in headers"
              v-bind:key="header._colid"
            >{{header.text}}</th>
          </tr>
        </div>
      </thead>
      <tr>
        <div v-for="item in drawItems" v-bind:key="item.__rowid">
          <td
            class="custom-cell"
            @mousedown="cellMouseDown(item.__rowid, header.__colid)"
            @mouseover="cellIndexTracking(item.__rowid, header.__colid)"
            @mouseup="cellMouseUp(item.__rowid, header.__colid)"
            v-for="header in headers"
            v-bind:key="header.__colid"
            :class="!item[header.__colid].isSelected ? 'non-select' : item[header.__colid].isSelected > 1 ? 'edit': 'select'"
          >{{item[header.__colid].value}}</td>
        </div>
      </tr>
    </table>
  </div>
</template>

<script>
export default {
  props: ["headers", "items"],

  data() {
    return {
      isTracking: false,
      virtualItems: "",
      drawItems: "",
      beginIndex: 0,
      maximumBeginIndex: 0,
      drawSize: 15,
      mousePoint: {
        down: { rowid: 0, colid: 0 },
        over: { rowid: 0, colid: 0 }
      },
      editCell: { rowid: 0, colid: 0 },
      selectedCells: [],
      selectCells: []
    };
  },

  watch: {
    headers: function(givenHeader) {
      this.setHeaderOrdering(givenHeader);
    },
    items: function(newItems) {
      this.virtualItems = newItems;
      this.initializeIndex();
      this.createDrawItems();
    },
    beginIndex: function() {
      this.createDrawItems();
    }
  },

  methods: {
    async cellIndexTracking(rowid, colid) {
      if (!this.isTracking) return;
      this.mousePoint.over = { rowid, colid };
      this.AddToSelectVector();
    },

    async cellMouseDown(rowid, colid) {
      this.isTracking = true;
      this.mousePoint.down = { rowid, colid };
      this.editCell = { rowid, colid };
      // console.log(this.editCell);
      this.cellIndexTracking(rowid, colid);
    },

    async cellMouseUp(idx, entry) {
      this.isTracking = false;
    },

    async cellArrowDown() {
      this.editCell.rowid += 1;
      this.mousePoint.down = this.editCell;
      this.mousePoint.over = this.editCell;
      await this.AddToSelectVector();
    },

    // index 제어
    async initializeIndex() {
      this.beginIndex = 0;
      await this.setMaximumBeginIndex();
    },

    async setMaximumBeginIndex() {
      this.maximumBeginIndex =
        this.virtualItems.length - this.drawSize < 0
          ? 0
          : this.virtualItems.length - this.drawSize;
    },

    async moveToBeginIndex(delta) {
      this.beginIndex += delta;
      if (this.beginIndex < 0) this.beginIndex = 0;
      else if (this.beginIndex > this.maximumBeginIndex)
        this.beginIndex = this.maximumBeginIndex;
    },

    async createDrawItems() {
      let drawableItems = this.virtualItems.slice(
        this.beginIndex,
        this.beginIndex + this.drawSize
      );

      let itemRows = new Array();
      for (let ridx in drawableItems) {
        let itemRow = new Object();
        let rowId = parseInt(this.beginIndex) + parseInt(ridx);
        itemRow.__rowid = rowId;
        for (let cIdx in this.headers) {
          let column = this.headers[cIdx];
          let colId = column.__colid;
          itemRow[colId] = new Object();
          itemRow[colId].value = drawableItems[ridx][column.name];
          itemRow[colId].isSelected = await this.isSelected(
            itemRow.__rowid,
            column.__colid
          );
        }
        itemRows.push(itemRow);
      }

      // console.log(buffers);
      this.drawItems = itemRows;
    },

    min(arg1, arg2) {
      return arg1 < arg2 ? arg1 : arg2;
    },

    max(arg1, arg2) {
      return arg1 < arg2 ? arg2 : arg1;
    },

    async AddToSelectVector() {
      // console.time("Extract selected cells");
      let beginRowid = this.min(
        this.mousePoint.down.rowid,
        this.mousePoint.over.rowid
      );
      let endRowId = this.max(
        this.mousePoint.down.rowid,
        this.mousePoint.over.rowid
      );
      let beginColId = this.min(
        this.mousePoint.down.colid,
        this.mousePoint.over.colid
      );
      let endColId = this.max(
        this.mousePoint.down.colid,
        this.mousePoint.over.colid
      );
      // console.log(`row id : ${beginRowid} - ${endRowId}`);
      // console.log(`col id : ${beginColId} - ${endColId}`);

      this.selectCells = new Array();
      for (let rowid = beginRowid; rowid <= endRowId; rowid++) {
        for (let colid = beginColId; colid <= endColId; colid++) {
          this.selectCells.push({ rowid, colid });
          await this.setSelected(rowid, colid);
        }
      }

      await this.setEdit(this.editCell.rowid, this.editCell.colid);

      for (let idx in this.selectedCells) {
        let isFound = false;
        for (let inIdx in this.selectCells) {
          if (
            parseInt(this.selectedCells[idx].rowid) ===
              parseInt(this.selectCells[inIdx].rowid) &&
            parseInt(this.selectedCells[idx].colid) ===
              parseInt(this.selectCells[inIdx].colid)
          ) {
            isFound = true;
            break;
          }
        }
        if (!isFound)
          await this.setUnSelected(
            this.selectedCells[idx].rowid,
            this.selectedCells[idx].colid
          );
      }

      this.selectedCells = this.selectCells;
      // console.timeEnd("Extract selected cells");
    },

    async setEdit(rowid, colid) {
      for (let rIdx in this.drawItems) {
        let row = this.drawItems[rIdx];
        let __rowid = row.__rowid;
        for (let cIdx in this.headers) {
          let col = this.headers[cIdx];
          let __colid = col.__colid;
          if (
            parseInt(__rowid) == parseInt(rowid) &&
            parseInt(__colid) == parseInt(colid)
          ) {
            this.drawItems[rIdx][__colid].isSelected = 2;
          }
        }
      }
    },

    async setSelected(rowid, colid) {
      for (let rIdx in this.drawItems) {
        let row = this.drawItems[rIdx];
        let __rowid = row.__rowid;
        for (let cIdx in this.headers) {
          let col = this.headers[cIdx];
          let __colid = col.__colid;
          if (
            parseInt(__rowid) == parseInt(rowid) &&
            parseInt(__colid) == parseInt(colid)
          ) {
            if (this.drawItems[rIdx][__colid].isSelected !== 2)
              this.drawItems[rIdx][__colid].isSelected = 1;
          }
        }
      }
    },

    async setUnSelected(rowid, colid) {
      for (let rIdx in this.drawItems) {
        let row = this.drawItems[rIdx];
        let __rowid = row.__rowid;
        for (let cIdx in this.headers) {
          let col = this.headers[cIdx];
          let __colid = col.__colid;
          if (
            parseInt(__rowid) == parseInt(rowid) &&
            parseInt(__colid) == parseInt(colid)
          ) {
            this.drawItems[rIdx][__colid].isSelected = false;
            // console.log(`unselected ${rowid}, ${colid}`);
          }
        }
      }
    },

    async tableWheelEvent(event) {
      // console.log(`table wheel : ${event.deltaY}`);
      event.preventDefault();
      if (event.deltaY > 0) this.moveToBeginIndex(3);
      else if (event.deltaY < 0) this.moveToBeginIndex(-3);
    },

    async isSelected(rowid, colid) {
      let isSelectedCell = await this.selectedCells.includes({ rowid, colid });
      return isSelectedCell;
    },

    setHeaderOrdering(givenHeader) {
      for (let idx in givenHeader) this.headers[idx].__colid = idx;
      // console.log(this.headers);
    }
  },

  mounted() {
    window.addEventListener("keydown", event => {
      // if (!this.isObject) return; // 객체 선택 상태가 아니라면 패스

      if (event.keyCode === 33) {
        // console.log("Page up");
        // event.preventDefault();
        // if (event.altKey) this.drawItems(-this.drawCount);
        // if (event.shiftKey) this.drawItems(-1000);
        // else this.drawItems(-16);
        // event.initEvent();
      }
      if (event.keyCode === 34) {
        // console.log("Page down");
        // event.preventDefault();
        // if (event.altKey) this.drawItems(this.drawCount);
        // else if (event.shiftKey) this.drawItems(1000);
        // else this.drawItems(16);
        // event.initEvent();
      }
      if (event.keyCode === 38) {
        // console.log("Arrow up");
        // event.preventDefault();
      }
      if (event.keyCode === 40) {
        // console.log("Arrow down");
        event.preventDefault();
        this.cellArrowDown();
        // if (event.ctrlKey) this.drawItems(this.drawCount);
        // else if (event.shiftKey) this.drawItems(1000);
      }
    });
  }
};
</script>

<style >
.custom-cell {
  overflow-y: hidden !important;
  overflow-x: hidden !important;
  white-space: nowrap !important;
  user-select: none;
  min-width: 100px;
  max-width: 100px;
}

.select {
  background-color: brown;
}

.edit {
  background-color: orange;
}
</style>

