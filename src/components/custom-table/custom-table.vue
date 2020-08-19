<template>
  <div class="custom-table" @mousewheel="mousewheel" @mousedown="focusOn()" @mouseleave="focusOut()">
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
          <tr>
            <td v-if="showRowid" class="custom-cell fixed-cell">{{ item._rowidx + 1 }}</td>
            <td
              class="custom-cell"
              @mousedown="mouseClick(item._rowidx, header._colidx, $event)"
              @mouseover="mouseMove(item._rowidx, header._colidx)"
              @mouseup="mouseUp"
              :class="item[header._colidx].cellType == 0 ? 'non-select' : item[header._colidx].cellType == 1 ? 'edit' : 'select'"
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
import TableManager from "./table-manager";

export default {
  // props: ["headers", "items", "show-rowid"],
  props: {
    headers: { required: true },
    items: { required: true },
    showRowid: { type: Boolean, default: false },
    search: {},
  },

  components: {},

  data() {
    return {
      view: [],
      drawItems: [],
      searchText: "",
      cellReadonly: true,
      tm: new TableManager(),
      overlay: false,
      focus: false,
    };
  },

  watch: {
    headers: function(newHeaders) {
      this.headers = this.tm.refactoringHeaders(newHeaders);
      console.log(this.headers);
    },
    items: function() {
      this.tm.initializeTable(this.items);
      this.initialize();
    },
  },

  methods: {
    initialize() {
      this.tm.moveBeginRow();
      this.drawItems = this.tm.refresh("initialize");
    },

    focusOn() {
      this.focus = true;
    },
    focusOut() {
      this.focus = false;
    },

    mousewheel(event) {
      event.preventDefault();
      if (event.deltaY > 0) this.tm.mousewheelDown();
      else if (event.deltaY < 0) this.tm.mousewheelUp();
      this.drawItems = this.tm.refresh("mousewheel");
    },

    mouseClick(rowidx, colidx, event) {
      this.tm.mouseClick(rowidx, colidx, event.shiftKey, event.ctrlKey);
      this.drawItems = this.tm.refresh("mouseClick");
    },

    mouseMove(rowidx, colidx) {
      if (this.tm.mouseMove(rowidx, colidx) > 0) this.drawItems = this.tm.refresh("mouseMove");
    },

    mouseUp() {
      this.tm.mouseUp();
    },

    onkeydown(event) {
      console.log("on key down");
      console.log(event);
    },

    async keyboardControlls(event) {
      if (!this.focus) return;
      event.preventDefault();

      let isShotcut = event.ctrlKey || event.shiftKey || event.altKey ? true : false;

      //arrow up
      if (event.keyCode == 38) {
        if (event.ctrlKey) this.tm.moveBeginRow();
        else if (event.shiftKey) this.tm.moveCellAreaUp();
        else this.tm.moveCellUp(0, -1);
      }

      //arriw down
      if (event.keyCode == 40) {
        if (event.ctrlKey) this.tm.moveEndRow();
        else if (event.shiftKey) this.tm.moveCellAreaDown();
        else this.tm.moveCellDown();
      }
      //arrow left
      if (event.keyCode == 37) {
        if (event.ctrlKey) this.tm.moveBeginColumn();
        else if (event.shiftKey) this.tm.moveCellAreaLeft();
        else this.tm.moveCellLeft();
      }
      //arrow right
      if (event.keyCode == 39) {
        if (event.ctrlKey) this.tm.moveEndColumn();
        else if (event.shiftKey) this.tm.moveCellAreaRight();
        else this.tm.moveCellRight();
      }
      if (event.keyCode == 33) this.tm.pageUp(); //page up
      if (event.keyCode == 34) this.tm.pageDown(); //page down

      // 일반 데이터 입력 범위
      if (!isShotcut && 48 <= event.keyCode && event.keyCode <= 90) console.log(`data input : ${event.keyCode}`);
      if (!isShotcut && 96 <= event.keyCode && event.keyCode <= 111) console.log(`data input : ${event.keyCode}`);
      if (!isShotcut && 188 <= event.keyCode && event.keyCode <= 249) console.log(`data input : ${event.keyCode}`);

      // Ctrl + c : 선택 된 셀 클립보드로 복사.
      if (event.ctrlKey && !event.shiftKey && !event.altKey && event.keyCode == 67) {
        console.log(`copy to clipboard`);
      }

      // Ctrl + c : 선택 된 셀 클립보드로 복사.
      if (event.ctrlKey && !event.shiftKey && !event.altKey && event.keyCode == 86) {
        console.log(`paste from clipboard`);
      }

      // Ctrl + a : 전체선택
      if (event.ctrlKey && !event.shiftKey && !event.altKey && event.keyCode == 65) {
        this.tm.selectAllRows();
      }

      // Enter : 현재 셀 데이터 반영 후 아래라인으로
      if (!event.ctrlKey && !event.shiftKey && !event.altKey && event.keyCode == 13) {
        console.log("edit completed & move arrow down ");
        this.tm.arrowDown();
      }

      // Ctrl + Enter : 새 줄 삽입
      if (event.ctrlKey && !event.shiftKey && !event.altKey && event.keyCode == 13) {
        console.log("create new line");
      }

      // Shift + Enter : 현재 셀 데이터 복사하여 추가
      if (!event.ctrlKey && event.shiftKey && !event.altKey && event.keyCode == 13) {
        console.log("copy & paste create new line");
      }

      // Shift + Delete : 현재 셀 삭제
      if (!event.ctrlKey && event.shiftKey && !event.altKey && event.keyCode == 46) {
        console.log("선택된 셀 삭제");
      }

      // Tab : 현재 셀 데이터 반영 후 오른쪽 셀로 이동
      if (!event.ctrlKey && !event.shiftKey && !event.altKey && event.keyCode == 9) {
        // edit complete
        this.tm.arrowRight();
        console.log("데이터 컴플리트 후 ");
      }

      // F2 : 데이터 입력 모드로 전환
      if (!event.ctrlKey && !event.shiftKey && !event.altKey && event.keyCode == 113) {
        // edit complete
        this.cellReadonly = false;
        console.log("데이터 입력모드! ");
      }

      if (!event.keyCode != 113) {
        this.cellReadonly = true;
      }

      this.drawItems = this.tm.refresh("keyboard out");
      event.returnValue = true;
    },

    sleep(ms) {
      return new Promise((resolve) => setTimeout(resolve, ms));
    },
  },

  updated() {},

  mounted() {
    console.log("mounted()");
    window.addEventListener("keydown", async (event) => {
      this.keyboardControlls(event);
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

td:focus {
  border: 2px solid #444444;
}

input:focus {
  outline: none;
}

input {
  width: 100%;
  border: 0;
}
</style>
