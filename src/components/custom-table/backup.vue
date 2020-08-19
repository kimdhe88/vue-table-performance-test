<template>
  <div class="custom-table" @mousewheel="tableWheelEvent" @keyDown.ctrl="echo">
    <!-- <v-chip outlined color="info">{{drawCount}} / {{fetchCount}} rows</v-chip> -->
    <v-text-field v-model="searchText" v-on:keyup.enter="tableSearch(searchText)" label="Search"></v-text-field>
    <table border="1px">
      <thead>
        <div>
          <tr>
            <th v-if="showRowid" class="custom-cell fixed-cell">{{ "rowid" }}</th>
            <th class="custom-cell fixed-cell" v-for="header in headers" v-bind:key="header._colidx" @click="tableAlign(header.name)">{{ header.text }}</th>
          </tr>
        </div>
      </thead>

      <tbody>
        <div id="sample-table" v-for="item in drawItems" v-bind:key="item._rowidx">
          <tr @keydown="rowControlls(item._rowidx, $event)">
            <td v-if="showRowid" class="custom-cell fixed-cell">{{ item._rowidx + 1 }}</td>
            <td
              class="custom-cell"
              @mousedown="mouseDown(item._rowidx, header._colidx, $event)"
              @mouseover="mouseDrag(item._rowidx, header._colidx, $event)"
              @mouseup="mouseUp"
              :class="item[header._colidx].cellType == 0 ? 'non-select' : item[header._colidx].cellType > 1 ? 'edit' : 'select'"
              @click.alt="insertRows(item._rowidx)"
              v-for="header in headers"
              v-bind:key="header._colidx"
            >
              <input :readonly="cellReadonly" type="text" v-model="item[header._colidx].value" />
            </td>
          </tr>
        </div>
      </tbody>
    </table>
  </div>
</template>

<script>
import SelectAreaManager from "./selection-area-manager";
import ArrayUtil from "./array-util";
import vueCustomScrollbar from "vue-custom-scrollbar";

export default {
  // props: ["headers", "items", "show-rowid"],
  props: {
    headers: { type: Array, required: true },
    items: { type: Array, required: true },
    showRowid: { type: Boolean, default: false },
    search: {},
  },

  components: {
    vueCustomScrollbar,
  },

  data() {
    return {
      virtualItems: [],
      drawItems: [],
      drawSize: 15,
      index: { begin: 0, last: 0 },
      selectAreaManager: new SelectAreaManager(),
      settings: {
        maxScrollbarLength: 60,
      },
      searchText: "",
      cellReadonly: true,
    };
  },

  watch: {
    headers: function(givenHeader) {
      this.resetColumnIndex(givenHeader);
    },
    items: function(newItems) {
      // console.log(`itemChange : ${newItems.length}`);
      this.itemInitialize(newItems);
      this.createDrawItems();
    },
    "index.begin": function() {
      this.createDrawItems();
    },
    selectAreaManager: function() {
      this.createDrawItems();
    },
    showRowid: function(newVal) {
      console.log(newVal);
    },
    search: function(searchText) {
      this.searchText = searchText;
    },
  },

  methods: {
    rowControlls(rowidx, event) {
      console.log(`event.keyCode  : ${event.keyCode}`);
      if (event.shiftKey)
        if (event.keyCode == 46) {
          this.deleteRows(rowidx);
          return;
        }

      if (event.ctrlKey)
        if (event.keyCode == 13) {
          this.insertRows(rowidx);
          return;
        }
      if (48 <= event.keyCode <= 90) this.cellReadonly = false;
    },

    async itemInitialize(newItems) {
      // console.log(`call itemInitialize()`);
      await Object.assign(this.virtualItems, newItems);
      this.index.begin = 0;
      this.index.last = this.virtualItems.length - this.drawSize < 0 ? 0 : this.virtualItems.length - this.drawSize;
    },

    async moveToBeginIndex(delta) {
      this.index.begin = this.index.begin + delta < 0 ? 0 : this.index.begin + delta > this.index.last ? this.index.last : this.index.begin + delta;
    },

    async createDrawItems() {
      // console.log(`[cdi-before] begin index : ${this.index.begin}`);
      let drawableItems = this.virtualItems.slice(this.index.begin, this.index.begin + this.drawSize);
      // console.log(`[cdi-after] begin index : ${this.index.begin}`);

      let itemRows = new Array();
      for (let ridx in drawableItems) {
        let itemRow = new Object();
        let rowidx = parseInt(this.index.begin) + parseInt(ridx);
        itemRow._rowidx = rowidx;
        for (let cIdx in this.headers) {
          let column = this.headers[cIdx];
          let colidx = column._colidx;
          itemRow[colidx] = new Object();
          itemRow[colidx].value = drawableItems[ridx][column.name];
          if (this.selectAreaManager.isEditCell(rowidx, colidx)) itemRow[colidx].cellType = 2;
          else if (this.selectAreaManager.isSelected(rowidx, colidx)) itemRow[colidx].cellType = 1;
          else itemRow[colidx].cellType = 0;
          // console.log(itemRow[colidx].cellType);
        }
        itemRows.push(itemRow);
      }

      this.drawItems = itemRows;
    },

    async tableWheelEvent(event) {
      event.preventDefault();
      if (event.deltaY > 0) this.moveToBeginIndex(3);
      else if (event.deltaY < 0) this.moveToBeginIndex(-3);
    },

    resetColumnIndex(givenHeader) {
      for (let idx in givenHeader) {
        this.headers[idx]._colidx = idx;
        this.headers[idx].alginType = 0;
      }
    },

    mouseDown(rowidx, colidx, event) {
      this.cellReadonly = true;
      if (!event.shiftKey && !event.ctrlKey) this.selectAreaManager.clear();
      if (event.ctrlKey) this.selectAreaManager.store();
      if (event.shiftKey) {
        this.selectAreaManager.restart();
        this.mouseDrag(rowidx, colidx);
      } else {
        this.selectAreaManager.start(rowidx, colidx);
        this.mouseDrag(rowidx, colidx);
      }
    },

    mouseDrag(rowidx, colidx, event) {
      this.selectAreaManager.tracking(rowidx, colidx);
      if (this.selectAreaManager.isActive()) this.createDrawItems();
    },

    mouseUp(rowidx, colidx) {
      // this.selectAreaManager.drawAreas();
      this.selectAreaManager.end();
    },

    allRowsSelect() {
      console.log("sample-table");
      this.selectAreaManager.clear();
      this.selectAreaManager.start(0, 0);
      this.selectAreaManager.tracking(this.virtualItems.length - 1, this.headers.length - 1);
      this.selectAreaManager.end();
      this.createDrawItems();
    },

    echo() {
      console.log("event : ");
      console.log(event);
    },

    getSelectDataText(delemeter = "\t") {
      let selectAreaList = this.selectAreaManager.getSelectArea();
      let copyString = "";
      for (let idx = 0; idx < selectAreaList.length; idx++) {
        let point = selectAreaList[idx];
        for (let rowidx = point.begin.rowidx; rowidx <= point.end.rowidx; rowidx++) {
          for (let colidx = point.begin.colidx; colidx <= point.end.colidx; colidx++) {
            if (colidx == point.end.colidx) copyString += this.getCellData(rowidx, colidx) + "\n";
            else copyString += this.getCellData(rowidx, colidx) + delemeter;
          }
        }
      }
      return copyString;
    },

    async tableAlign(columnName) {
      console.log(`tableAlign : ${columnName}`);
      let headeridx;
      for (let idx in this.headers) if (this.headers[idx].name == columnName) headeridx = idx;
      if (this.headers[headeridx].alignType != 1) {
        this.virtualItems = await ArrayUtil.sort(this.virtualItems, columnName, true);
        this.headers[headeridx].alignType = 1;
      } else {
        this.virtualItems = await ArrayUtil.sort(this.virtualItems, columnName, false);
        this.headers[headeridx].alignType = 2;
      }
      this.createDrawItems();
    },

    async tableSearch(searchText) {
      console.log(`searchText : ${searchText}`);
      let newVirtualData = await ArrayUtil.search(this.items, searchText);
      await this.itemInitialize(newVirtualData);
      this.createDrawItems();
    },

    getCellData(rowidx, colidx) {
      let columnName = new String();
      for (let idx in this.headers) if (this.headers[idx]._colidx == colidx) columnName = this.headers[idx].name;
      let data = this.virtualItems[rowidx][columnName];
      return data;
    },

    copyToClipboard() {
      let dummy = document.createElement("textarea");
      document.body.appendChild(dummy);
      let data = this.getSelectDataText();
      dummy.value = data;
      dummy.select();
      document.execCommand("copy");
      alert(`${data.length} rows copy success.`);
      document.body.removeChild(dummy);
    },

    deleteRows(rowidx) {
      this.virtualItems[rowidx].isDelete = true;
      this.createDrawItems();
    },

    insertRows(rowidx) {
      let newRows = new Object();
      newRows.isInsert = true;
      for (let idx in this.headers) newRows[this.headers[idx].name] = "";
      this.virtualItems.splice(rowidx + 1, 0, newRows);
      console.log(`begin index : ${this.index.begin}`);
      this.createDrawItems();
    },
  },

  mounted() {
    console.log("mounted()");
    // window.removeEventListener("keydown");
    let td = document.getElementsByTagName("td");

    window.addEventListener("keydown", (event) => {
      if (event.keyCode === 67) {
        console.log("insert 'C'");
        // event.preventDefault();
        if (event.ctrlKey) this.copyToClipboard();
      }
    });
  },
};
</script>

<style>
.custom-cell {
  overflow-y: hidden !important;
  overflow-x: hidden !important;
  white-space: nowrap !important;
  user-select: none;
  min-width: 100px;
  max-width: 100px;
}

.fixed-cell {
  background-color: #d8e6e0;
}

.select {
  background-color: #d9ffe2;
  border: 1px solid #185c28;
}

.edit {
  background-color: #82c491;
  border: 1px solid #0a5e1d;
}

table {
  width: 100%;
  border: 1px solid #444444;
  border-collapse: collapse;
}
th,
td {
  border: 1px solid #444444;
  padding: 0px;
  margin: 0px;
}

input {
  padding: 8px;
}
</style>
