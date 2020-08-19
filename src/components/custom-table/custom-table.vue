<template>
  <div class="custom-table" @mousewheel="mousewheel" @mousedown="focusOn()">
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
              <input :id="`${item._rowidx}-${header._colidx}`" :readonly="!isEditMode" type="text" v-model="item[header._colidx].value" />
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
      isEditMode: false,
      tm: new TableManager(),
      overlay: false,
      focus: false,
      dummyText: "",
    };
  },

  watch: {
    headers: function(newHeaders) {
      this.headers = this.tm.refactoringHeaders(newHeaders);
      // console.log(this.headers);
    },
    items: function() {
      this.tm.initializeTable(this.items);
      this.initialize();
    },
  },

  methods: {
    initialize() {
      this.tm.moveCell(-1, 0, true);
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
      if (this.tm.isEditCell(rowidx, colidx)) this.onEditMode();
      else this.offEditMode();
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
      // console.log("on key down");
      // console.log(event);
    },

    keyboardControlls(event) {
      let isShotcut = event.ctrlKey || event.shiftKey || event.altKey ? true : false;

      if (!this.focus) return; // 테이블이 선택되지 않았다면 스킵.
      if (16 <= event.keyCode && event.keyCode <= 18) return 0;
      // shift, ctrl, Alt 단일 키 로 입력되었을 때 스킵.
      else console.log(event.keyCode);

      if (this.isEditMode) {
        // console.log(`데이터 데이트 모드, this.isEditMode : ${this.isEditMode}`);

        // Enter : 현재 셀 데이터 반영 후 아래라인으로
        if (!isShotcut && event.keyCode == 13) {
          event.preventDefault();
          this.offEditMode(true);
          this.tm.arrowDown();
          //update()
          // console.log("데이터 에디트 모드 종료 후 아래로 이동");
        }

        // Tab : 현재 셀 데이터 반영 후 오른쪽 셀로 이동
        if (!isShotcut && event.keyCode == 9) {
          event.preventDefault();
          this.offEditMode(true);
          this.tm.arrowRight();
          //update()
          // console.log("데이터 에디트 모드 종료 후 오른쪽 이동");
        }

        // Esc : 현재 셀 데이터 반영하지 않고 에디트 모드 종료
        if (!isShotcut && event.keyCode == 27) {
          event.preventDefault();
          this.offEditMode();
          // console.log("focus out");
          // console.log("데이터 에디트 모드 종료");
        }
      } else {
        event.preventDefault();
        // console.log(`데이터 데이트 모드 아님, this.isEditMode : ${this.isEditMode}`);
        // tab : 오른쪽으로 이동
        if (!isShotcut && event.keyCode == 9) {
          this.tm.arrowRight();
        }

        // Shift + tab : 왼쪽으로 이동
        if (!event.ctrlKey && event.shiftKey && !event.altKey && event.keyCode == 9) {
          this.tm.arrowLeft();
        }

        // Enter : 아래쪽으로 이동
        if (!isShotcut && event.keyCode == 13) {
          this.tm.arrowDown();
        }

        // Shift + Enter : 위쪽으로 이동
        if (!event.ctrlKey && event.shiftKey && !event.altKey && event.keyCode == 13) {
          this.tm.arrowUp();
        }

        // Esc : 현재 셀 데이터 반영 후 오른쪽 셀로 이동
        if (!isShotcut && event.keyCode == 27) {
          this.focusOut();
          // console.log("focus out");
        }

        //arrow up
        if (event.keyCode == 38) this.tm.arrowUp(event.ctrlKey, event.shiftKey);
        //arriw down
        if (event.keyCode == 40) this.tm.arrowDown(event.ctrlKey, event.shiftKey);
        //arrow left
        if (event.keyCode == 37) this.tm.arrowLeft(event.ctrlKey, event.shiftKey);
        //arrow right
        if (event.keyCode == 39) this.tm.arrowRight(event.ctrlKey, event.shiftKey);

        //page up
        if (event.keyCode == 33) {
          this.tm.pageUp(event.shiftKey);
        }

        //page down
        if (event.keyCode == 34) {
          this.tm.pageDown(event.shiftKey);
        }

        // 일반 데이터 입력 범위, shift key는 눌렸거나 아니거나. 단, ctrl, alt 키는 누르지 않은 상태여야 함.
        if (!event.ctrlKey && !event.altKey && 48 <= event.keyCode && event.keyCode <= 90) {
          this.onEditMode(event.key);
        }
        if (!event.ctrlKey && !event.altKey && 96 <= event.keyCode && event.keyCode <= 111) {
          this.onEditMode(event.key);
        }
        if (!event.ctrlKey && !event.altKey && 188 <= event.keyCode && event.keyCode <= 249) {
          this.onEditMode(event.key);
        }

        // Ctrl + c : 선택 된 셀 클립보드로 복사.
        if (event.ctrlKey && !event.shiftKey && !event.altKey && event.keyCode == 67) {
          // console.log(`copy to clipboard`);
        }

        // Ctrl + c : 선택 된 셀 클립보드로 복사.
        if (event.ctrlKey && !event.shiftKey && !event.altKey && event.keyCode == 86) {
          // console.log(`paste from clipboard`);
        }

        // Ctrl + a : 전체선택
        if (event.ctrlKey && !event.shiftKey && !event.altKey && event.keyCode == 65) {
          this.tm.selectAllRows();
        }

        // Ctrl + Enter : 새 줄 삽입
        if (event.ctrlKey && !event.shiftKey && !event.altKey && event.keyCode == 13) {
          // console.log("create new line");
        }

        // Shift + Enter : 현재 셀 데이터 복사하여 추가
        if (!event.ctrlKey && event.shiftKey && !event.altKey && event.keyCode == 13) {
          // console.log("copy & paste create new line");
        }

        // Shift + Delete : 현재 셀 삭제
        if (!event.ctrlKey && event.shiftKey && !event.altKey && event.keyCode == 46) {
          // console.log("선택된 셀 삭제");
        }

        // F2 : 데이터 입력 모드로 전환
        if (!event.ctrlKey && !event.shiftKey && !event.altKey && event.keyCode == 113) this.onEditMode();
      }

      if (!this.isEditMode) this.drawItems = this.tm.refresh("keyboard out");

      event.returnValue = true;
    },

    onEditMode(newChar = "") {
      // console.log(`newChar : ${newChar}`);
      let editCell = this.tm.getEditCell();
      let editCellId = `${editCell.rowidx}-${editCell.colidx}`;
      document.getElementById(editCellId).focus();
      // console.log(`this.drawItems[editCell.rowidx][editCell.colidx].value : ${this.drawItems[editCell.rowidx][editCell.colidx].value}`);
      if (newChar) this.drawItems[editCell.rowidx][editCell.colidx].value = newChar;
      this.isEditMode = true;
    },

    offEditMode(isUpdate = false) {
      let editCell = this.tm.getEditCell();
      if (isUpdate) this.tm.update(editCell.rowidx, editCell.colidx, this.drawItems[editCell.rowidx][editCell.colidx].value);
      this.isEditMode = false;
    },

    updated() {},

    sleep(ms) {
      return new Promise((resolve) => setTimeout(resolve, ms));
    },
  },

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
  border: 1px solid #82c491 !important;
}

.edit {
  /* border: 3px solid #444444; */
  background-color: #95e8b6;
  /* border: 1px solid #0a5e1d; */
  border: 1px solid #185c28 !important;
}

table {
  width: 100%;
  border-collapse: collapse;
}
th,
td {
  border: 1px dotted rgba(0, 0, 0, 0.1);
  padding: 3px 5px;
  font-size: 12px;
  /* overflow: hidden !important; */
  /* white-space: nowrap !important; */
  /* text-overflow: ellipsis !important; */
  /* position: relative; */
  /* vertical-align: middle; */
  /* border-radius: 0; */

  /* color: rgba(0, 0, 0, 0.54); */
  /* box-sizing: content-box; */
  /* width: 100%; */
  /* margin: 0 auto; */
  /* clear: both; */
  /* border-collapse: separate; */
  /* border-spacing: 0; */
  /* font-family: inherit; */
}

input:focus {
  outline: none;
}

input {
  width: 100%;
  border: 0;
}
</style>
