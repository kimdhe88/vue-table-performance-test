<template>
  <div class="custom-table">
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
        <div v-for="item in draw.drawItems" v-bind:key="item._rowid">
          <td
            class="custom-cell"
            @mousedown="cellMouseDown(item._rowid, header._colid)"
            @mouseover="cellIndexTracking(item._rowid, header._colid)"
            @mouseup="cellMouseUp(item._rowid, header._colid)"
            v-for="header in headers"
            v-bind:key="header._colid"
            :class="item[header._colid].isSelected ? 'select' : 'non-select'"
          >{{item[header._colid].value}}</td>
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
      selectPoint: {
        down: { rowid: "", colid: "" },
        over: { rowid: "", colid: "" },
      },
      draw: {
        items: "",
        drawItems: "",
        beginIndex: 0,
        maximumBeginIndex: 0,
        drawCount: 15,
      },
      selectedCell: { rowid: "", colid: "" },
      selectedCells: [],
      selectCells: [],
    };
  },

  watch: {
    headers: function (givenHeader) {
      this.setHeaderOrdering(givenHeader);
    },
    items: function (newItems) {
      this.draw.items = newItems;
      this.drawItems();
    },
  },

  methods: {
    async cellIndexTracking(rowid, colid) {
      if (!this.isTracking) return;
      this.selectPoint.over.rowid = rowid;
      this.selectPoint.over.colid = colid;
      this.AddToSelectVector();
    },

    async cellMouseDown(rowid, colid) {
      this.isTracking = true;
      this.selectPoint.down.rowid = rowid;
      this.selectPoint.down.colid = colid;
      this.selectedCell = this.selectPoint.down;
      this.cellIndexTracking(rowid, colid);
    },

    async cellMouseUp(idx, entry) {
      this.isTracking = false;
    },

    async AddToSelectVector() {
      // console.time("Extract selected cells");
      let beginRowid = 0;
      let endRowId = 0;
      let beginColId = 0;
      let endColId = 0;
      if (this.selectPoint.down.rowid < this.selectPoint.over.rowid) {
        beginRowid = this.selectPoint.down.rowid;
        endRowId = this.selectPoint.over.rowid;
      } else {
        beginRowid = this.selectPoint.over.rowid;
        endRowId = this.selectPoint.down.rowid;
      }

      if (this.selectPoint.down.colid < this.selectPoint.over.colid) {
        beginColId = this.selectPoint.down.colid;
        endColId = this.selectPoint.over.colid;
      } else {
        beginColId = this.selectPoint.over.colid;
        endColId = this.selectPoint.down.colid;
      }

      console.log(`beginRowid : ${beginRowid}, endRowId : ${endRowId}`);
      console.log(`beginColId : ${beginColId}, endColId : ${endColId}`);

      this.selectCells = new Array();
      for (let rowid = beginRowid; rowid <= endRowId; rowid++) {
        for (let colid = beginColId; colid <= endColId; colid++) {
          this.selectCells.push({ rowid, colid });
          this.draw.drawItems[rowid][colid].isSelected = true;
        }
      }

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
        if (!isFound) {
          this.draw.drawItems[this.selectedCells[idx].rowid][
            this.selectedCells[idx].colid
          ].isSelected = false;
        }
      }
      console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@");

      // console.log("difference");
      // console.log(difference);

      this.selectedCells = this.selectCells;
      // console.timeEnd("Extract selected cells");
    },

    async drawItems(moveIdx = 0) {
      console.log(`draw items : ${moveIdx}`);
      this.draw.beginIndex += moveIdx;
      if (moveIdx === 0 || this.draw.beginIndex < 0) this.draw.beginIndex = 0;
      this.draw.maximumBeginIndex =
        this.items.length - this.draw.drawCount < 0
          ? 0
          : this.items.length - this.draw.drawCount;
      if (this.draw.beginIndex > this.draw.maximumBeginIndex)
        this.draw.beginIndex = this.draw.maximumBeginIndex;

      console.log(`this.draw.beginIndex : ${this.draw.beginIndex}`);
      console.log(
        `this.draw.maximumBeginIndex : ${this.draw.maximumBeginIndex}`
      );

      let itemChunk = this.draw.items.slice(
        this.draw.beginIndex,
        this.draw.beginIndex + this.draw.drawCount
      );

      let buffers = new Array();
      for (let idx in itemChunk) {
        let tmpRows = new Object();
        tmpRows._rowid = parseInt(this.draw.beginIndex + idx);
        for (let hidx in this.headers) {
          tmpRows[this.headers[hidx]._colid] = new Object();
          tmpRows[this.headers[hidx]._colid].value =
            itemChunk[idx][this.headers[hidx].value];
          tmpRows[this.headers[hidx]._colid].isSelected = await this.isSelected(
            tmpRows._rowid,
            this.headers[hidx]._colid
          );
        }
        buffers.push(tmpRows);
      }

      // console.log(buffers);
      this.draw.drawItems = buffers;
    },

    async isSelected(rowid, colid) {
      // console.log(`isSelected`);
      let isSelectedCell = await this.selectedCells.includes({ rowid, colid });
      return isSelectedCell;
    },

    getColumnName(colid) {
      let columnName = "";
      for (let idx in this.headers)
        if (this.headers[idx]._colid === colid)
          columnName = this.headers[idx].value;
      return columnName;
    },

    setHeaderOrdering(givenHeader) {
      for (let idx in givenHeader) this.headers[idx]._colid = idx;
      // console.log(this.headers);
    },
  },

  mounted() {
    window.addEventListener("keydown", (event) => {
      // if (!this.isObject) return; // 객체 선택 상태가 아니라면 패스

      if (event.keyCode === 33) {
        // console.log("Page up");
        event.preventDefault();
        if (event.altKey) this.drawItems(-this.drawCount);
        if (event.shiftKey) this.drawItems(-1000);
        else this.drawItems(-16);
        event.initEvent();
      }
      if (event.keyCode === 34) {
        // console.log("Page down");
        event.preventDefault();
        if (event.altKey) this.drawItems(this.drawCount);
        else if (event.shiftKey) this.drawItems(1000);
        else this.drawItems(16);

        // event.initEvent();
      }
      if (event.keyCode === 38) {
        // console.log("Arrow up");
        event.preventDefault();
        if (event.ctrlKey) this.drawItems(-this.drawCount);
        else if (event.shiftKey) this.drawItems(-1000);
        else this.drawItems(-3);
        // event.initEvent();
      }
      if (event.keyCode === 40) {
        // console.log("Arrow down");
        event.preventDefault();
        if (event.ctrlKey) this.drawItems(this.drawCount);
        else if (event.shiftKey) this.drawItems(1000);
        else this.drawItems(3);
        // event.initEvent();
      }
    });
  },
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
</style>

