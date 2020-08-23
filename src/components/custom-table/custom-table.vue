<template>
  <div class="custom-table" @mousewheel="mousewheel">
    <!-- <v-chip outlined color="info">{{drawCount}} / {{fetchCount}} rows</v-chip> -->
    <v-text-field
      v-show="search"
      v-model="searchText"
      v-on:keyup.enter="tableSearch(searchText)"
      @click="focusOut()"
      label="검색"
    ></v-text-field>
    <table border="1px" v-show="drawHeaders.length > 0" :draggable="false">
      <thead>
        <div>
          <tr class="non-data">
            <th v-show="showNo">{{ "No." }}</th>
            <th
              v-for="(header, colidx) in drawHeaders"
              v-bind:key="colidx"
              @click="columnOrder(colidx)"
            >{{ header.name }}</th>
          </tr>
        </div>
      </thead>
      <tbody @mousedown="focusOn()">
        <div v-for="(drawItem, rowidx) in drawItems" v-bind:key="rowidx">
          <tr v-if="drawItem? true : false">
            <td v-show="showNo" class="non-data">{{ parseInt(rowidx) + 1 }}</td>
            <td
              :class="item.cellType"
              @mousedown="mouseClick(rowidx, colidx, $event)"
              @dblclick="doubleClick(rowidx, colidx, $event)"
              @mouseover="mouseMove(rowidx, colidx)"
              @mouseup="mouseUp"
              v-for="(item, colidx) in drawItem"
              v-bind:key="colidx"
            >
              <div v-if="item.cellType == 'edit' ? true : false">
                <label class="wrapper">
                  <input :id="`${rowidx}-${colidx}`" type="text" v-model="editText" />
                </label>
              </div>
              <div v-else>{{item.value}}</div>
            </td>
          </tr>
        </div>
      </tbody>
    </table>
  </div>
</template>

<script>
import PetraTableManager from "./petra-table-manager";

export default {
  // props: ["headers", "items", "show-rowid"],
  props: {
    headers: { required: true },
    items: { required: true },
    showNo: { type: Boolean, default: true },
    search: { type: Boolean, default: true },
  },

  components: {},

  data() {
    return {
      view: [],
      drawHeaders: [],
      drawItems: [],
      cellReadonly: true,
      ptm: new PetraTableManager(),
      overlay: false,
      focus: false,
      isEdit: 0,
      searchText: "",
      editText: "",
    };
  },

  watch: {
    headers: function (newHeaders) {
      console.log("watch headers");
      this.ptm.setHeaders(newHeaders);
      this.drawHeaders = this.ptm.getHeaders();
    },
    items: function (newItems) {
      console.log("watch items");
      this.ptm.setItems(newItems);
      this.drawItems = this.ptm.refresh();
    },
  },

  methods: {
    echo(event) {
      console.log("echo");
      console.log(event);
    },

    focusOn() {
      this.focus = true;
    },
    focusOut() {
      console.log("focus out!");
      this.focus = false;
    },

    mousewheel(event) {
      event.preventDefault();
      if (event.deltaY > 0) this.ptm.mousewheelDown();
      else if (event.deltaY < 0) this.ptm.mousewheelUp();
      this.drawItems = this.ptm.refresh("mousewheel");
    },

    mouseClick(rowidx, colidx, event) {
      if (!this.ptm.isDatumPoint(rowidx, colidx)) this.ptm.editOff();
      this.ptm.mouseClick(rowidx, colidx, event.ctrlKey, event.shiftKey);
      this.drawItems = this.ptm.refresh("mouseClick");
    },

    doubleClick(rowidx, colidx, event) {
      this.onEditMode();
    },

    mouseMove(rowidx, colidx) {
      this.ptm.mouseMove(rowidx, colidx);
      this.drawItems = this.ptm.refresh("mouseMove");
    },

    mouseUp() {
      this.ptm.mouseUp();
    },

    keyboardControlls(event) {
      let isShotcut =
        event.ctrlKey || event.shiftKey || event.altKey ? true : false;

      if (!this.focus) return; // 테이블이 선택되지 않았다면 스킵.
      if (16 <= event.keyCode && event.keyCode <= 18) return 0;
      // shift, ctrl, Alt 단일 키 로 입력되었을 때 스킵.
      // else console.log(event.keyCode);

      if (this.ptm.isEditMode()) {
        // Enter : 현재 셀 데이터 반영 후 아래라인으로
        if (!isShotcut && event.keyCode == 13) {
          event.preventDefault();
          let editPoint = this.ptm.getDatumPoint();
          this.ptm.update(
            editPoint.rowidx,
            editPoint.colidx,
            this.ptm.getLastestVersionData(editPoint.rowidx, editPoint.colidx),
            this.editText
          );
          this.ptm.editOff();
          this.ptm.arrowDown();
        }

        // Shift + Enter : 현재 셀 데이터 반영 후 위 라인으로
        if (
          !event.ctrlKey &&
          event.shiftKey &&
          !event.altKey &&
          event.keyCode == 13
        ) {
          event.preventDefault();
          let editPoint = this.ptm.getDatumPoint();
          this.ptm.update(
            editPoint.rowidx,
            editPoint.colidx,
            this.ptm.getLastestVersionData(editPoint.rowidx, editPoint.colidx),
            this.editText
          );
          this.ptm.editOff();
          this.ptm.arrowUp();
        }

        // Tab : 현재 셀 데이터 반영 후 오른쪽 셀로 이동
        if (!isShotcut && event.keyCode == 9) {
          event.preventDefault();
          let editPoint = this.ptm.getDatumPoint();
          this.ptm.update(
            editPoint.rowidx,
            editPoint.colidx,
            this.ptm.getLastestVersionData(editPoint.rowidx, editPoint.colidx),
            this.editText
          );
          this.ptm.editOff();
          this.ptm.arrowRight();
          // console.log("데이터 에디트 모드 종료 후 오른쪽 이동");
        }

        // Tab : 현재 셀 데이터 반영 후 오른쪽 셀로 이동
        if (
          !event.ctrlKey &&
          event.shiftKey &&
          !event.altKey &&
          event.keyCode == 9
        ) {
          event.preventDefault();
          let editPoint = this.ptm.getDatumPoint();
          this.ptm.update(
            editPoint.rowidx,
            editPoint.colidx,
            this.ptm.getLastestVersionData(editPoint.rowidx, editPoint.colidx),
            this.editText
          );
          this.ptm.editOff();
          this.ptm.arrowLeft();
          // console.log("데이터 에디트 모드 종료 후 오른쪽 이동");
        }

        // Esc : 현재 셀 데이터 반영하지 않고 에디트 모드 종료
        if (!isShotcut && event.keyCode == 27) {
          event.preventDefault();
          this.ptm.editOff();
          // console.log("데이터 에디트 모드 종료");
        }
      } else {
        // Ctrl + v : 붙여넣기 이벤트라면 preventDefault()로 이벤트를 막지 않음.
        if (
          !(
            event.ctrlKey &&
            !event.shiftKey &&
            !event.altKey &&
            event.keyCode == 86
          )
        )
          event.preventDefault();
        else return 0;

        // Ctrl + c : 선택 된 셀 클립보드로 복사.
        if (
          event.ctrlKey &&
          !event.shiftKey &&
          !event.altKey &&
          event.keyCode == 67
        ) {
          this.copyToClipboard();
        }

        // event.preventDefault();
        // console.log(`데이터 데이트 모드 아님, this.isEditMode : ${this.isEditMode}`);
        // tab : 오른쪽으로 이동
        if (!isShotcut && event.keyCode == 9) {
          this.ptm.arrowRight();
        }

        // Shift + tab : 왼쪽으로 이동
        if (
          !event.ctrlKey &&
          event.shiftKey &&
          !event.altKey &&
          event.keyCode == 9
        ) {
          this.ptm.arrowLeft();
        }

        // Enter : 아래쪽으로 이동
        if (!isShotcut && event.keyCode == 13) {
          this.ptm.arrowDown();
        }

        // Shift + Enter : 위쪽으로 이동
        if (
          !event.ctrlKey &&
          event.shiftKey &&
          !event.altKey &&
          event.keyCode == 13
        ) {
          this.ptm.arrowUp();
        }

        // Esc : 포커스 아웃
        if (!isShotcut && event.keyCode == 27) {
          this.focusOut();
          // console.log("focus out");
        }

        //arrow up
        if (event.keyCode == 38)
          this.ptm.arrowUp(event.ctrlKey, event.shiftKey);
        //arriw down
        if (event.keyCode == 40)
          this.ptm.arrowDown(event.ctrlKey, event.shiftKey);
        //arrow left
        if (event.keyCode == 37)
          this.ptm.arrowLeft(event.ctrlKey, event.shiftKey);
        //arrow right
        if (event.keyCode == 39)
          this.ptm.arrowRight(event.ctrlKey, event.shiftKey);

        //page up
        if (event.keyCode == 33) {
          this.ptm.pageUp(event.shiftKey);
        }

        //page down
        if (event.keyCode == 34) {
          this.ptm.pageDown(event.shiftKey);
        }

        // 일반 데이터 입력 범위, shift key는 눌렸거나 아니거나. 단, ctrl, alt 키는 누르지 않은 상태여야 함.
        if (
          !event.ctrlKey &&
          !event.altKey &&
          48 <= event.keyCode &&
          event.keyCode <= 90
        ) {
          // console.log(event);
          this.onEditMode(event.key);
        }
        if (
          !event.ctrlKey &&
          !event.altKey &&
          96 <= event.keyCode &&
          event.keyCode <= 111
        ) {
          this.onEditMode(event.key);
        }
        if (
          !event.ctrlKey &&
          !event.altKey &&
          188 <= event.keyCode &&
          event.keyCode <= 249
        ) {
          this.onEditMode(event.key);
        }

        // Ctrl + a : 전체선택
        if (
          event.ctrlKey &&
          !event.shiftKey &&
          !event.altKey &&
          event.keyCode == 65
        ) {
          this.ptm.selectAllRows();
        }

        // Ctrl + z : undo
        if (
          event.ctrlKey &&
          !event.shiftKey &&
          !event.altKey &&
          event.keyCode == 90
        ) {
          this.ptm.undo();
        }

        // Ctrl + Shift + z : redo
        if (
          event.ctrlKey &&
          event.shiftKey &&
          !event.altKey &&
          event.keyCode == 90
        ) {
          this.ptm.redo();
        }

        // Ctrl + s : commit
        if (
          event.ctrlKey &&
          !event.shiftKey &&
          !event.altKey &&
          event.keyCode == 83
        ) {
          console.log("commit");
          let query = this.ptm.commit();
          alert(query);
        }

        // Ctrl + r : cancle
        if (
          event.ctrlKey &&
          !event.shiftKey &&
          !event.altKey &&
          event.keyCode == 82
        ) {
          this.ptm.cancle();
          alert("transaction cancle");
        }

        // Ctrl + Enter : 현제 셀의 다음 줄에 새 줄 삽입
        if (
          event.ctrlKey &&
          !event.shiftKey &&
          !event.altKey &&
          event.keyCode == 13
        ) {
          let targetRowidx = parseInt(this.ptm.getDatumPoint().rowidx) + 1;
          this.ptm.insert(targetRowidx);
          this.ptm.arrowDown();
        }

        // Ctrl + Shift + Enter : 현재 셀의 이전 줄에 새 줄 삽입
        if (
          event.ctrlKey &&
          event.shiftKey &&
          !event.altKey &&
          event.keyCode == 13
        ) {
          let targetRowidx = this.ptm.getDatumPoint().rowidx;
          this.ptm.insert(targetRowidx);
        }

        // Shift + Enter : 현재 셀 데이터 복사하여 추가
        if (
          !event.ctrlKey &&
          event.shiftKey &&
          !event.altKey &&
          event.keyCode == 13
        ) {
          // console.log("copy & paste create new line");
        }

        // Shift + Delete : 현재 셀 삭제
        if (
          !event.ctrlKey &&
          event.shiftKey &&
          !event.altKey &&
          event.keyCode == 46
        ) {
          let selectedSectionRowidxList = this.ptm.getSelectedSectionRowidxList();
          // let targetRowidx = this.ptm.getDatumPoint().rowidx;
          this.ptm.beginTransaction();
          for (let idx in selectedSectionRowidxList) {
            let rowidx = selectedSectionRowidxList[idx];
            if (!this.ptm.isInsert(rowidx)) this.ptm.arrowDown();
            this.ptm.delete(rowidx);
          }
          this.ptm.endTransaction();

          // console.log("선택된 셀 삭제");
        }

        // F2 : 데이터 입력 모드로 전환
        if (
          !event.ctrlKey &&
          !event.shiftKey &&
          !event.altKey &&
          event.keyCode == 113
        )
          this.onEditMode();
      }

      if (!this.ptm.isEditMode())
        this.drawItems = this.ptm.refresh("keyboard out");

      event.returnValue = true;
    },

    ascii(data) {
      return data.charCodeAt(0);
    },

    async onEditMode(inputKey = "") {
      // return 0;
      // console.log(`newChar : ${newChar}`);
      let editCell = this.ptm.getDatumPoint();
      let cellid = `${editCell.rowidx}-${editCell.colidx}`;
      console.log(`cellid : ${cellid}`);
      this.ptm.editOn();
      this.drawItems = this.ptm.refresh();
      this.editText = this.ptm.getViewData(editCell.rowidx, editCell.colidx);

      while (!document.getElementById(cellid)) {
        await this.sleep(1);
        // console.log("sleep 1 ms ...");
        // waitMS += 1;
      }

      document.getElementById(cellid).focus();
      document.getElementById(cellid).select();
      if (inputKey) this.editText = inputKey;

      // this.isEditMode = true;
    },

    offEditMode(isUpdate = false) {
      // return 0;
      let editCell = this.ptm.getDatumPoint();
      if (isUpdate)
        this.ptm.update(
          editCell.rowidx,
          editCell.colidx,
          this.drawItems[editCell.rowidx][editCell.colidx].value
        );

      // selection clear
      if (window.getSelection) {
        if (window.getSelection().empty) {
          // Chrome
          window.getSelection().empty();
        } else if (window.getSelection().removeAllRanges) {
          // Firefox
          window.getSelection().removeAllRanges();
        }
      } else if (document.selection) {
        // IE?
        document.selection.empty();
      }

      this.ptm.editOff();
    },

    copyToClipboard() {
      console.log(`@@@@@@@@@@@@@@@@@@@@ [ copy to clipboard ]`);
      let dummy = document.createElement("textarea");
      document.body.appendChild(dummy);
      dummy.value = this.ptm.getSelectAreaDataToString();
      console.log(dummy.value);
      dummy.select();
      document.execCommand("copy");
      // alert(`${data.length} rows copy success.`);
      document.body.removeChild(dummy);
    },

    pasteFromClipboard(event) {
      if (this.ptm.isEditMode()) return 0;
      // console.log(`@@@@@@@@@@@@@@@@@@@@ [ paste from clipboard ]`);
      let plainData = event.clipboardData.getData("text/plain");
      let clipboardDataList = this.ptm.clipboardDataIntoArray(plainData);

      let datumPoint = this.ptm.getDatumPoint();
      let limitRowIndex = this.ptm.getView().length - 1;
      let limitColIndex = this.ptm.getHeaders().length - 1;
      let inInsertRows = false;
      this.ptm.beginTransaction();
      for (let ridx in clipboardDataList) {
        let clipboardRow = clipboardDataList[ridx];
        let targetRowidx = parseInt(datumPoint.rowidx) + parseInt(ridx);
        if (targetRowidx > parseInt(limitRowIndex)) break;
        if (this.ptm.isInsert(targetRowidx)) inInsertRows = true;
        if (inInsertRows && !this.ptm.isInsert(targetRowidx))
          this.ptm.insert(targetRowidx);
        // if (this.ptm.isInsert(targetRowidx)) this.ptm.insert(targetRowidx);
        for (let cidx in clipboardRow) {
          let clipboardData = clipboardRow[cidx];
          let targetColidx = parseInt(datumPoint.colidx) + parseInt(cidx);
          if (targetColidx > parseInt(limitColIndex)) break;
          this.ptm.update(
            targetRowidx,
            targetColidx,
            this.ptm.getLastestVersionData(targetRowidx, targetColidx),
            clipboardData
          );
        }
      }
      this.ptm.endTransaction();
      this.drawItems = this.ptm.refresh("pasteFromClipboard");
    },

    async tableSearch(searchText) {
      await this.ptm.search(searchText);
      this.drawItems = this.ptm.refresh("table search");
    },

    async columnOrder(columnName) {
      await this.ptm.order(columnName);
      this.drawItems = this.ptm.refresh("column order");
    },

    sleep(ms) {
      return new Promise((resolve) => setTimeout(resolve, ms));
    },
  },

  mounted() {
    console.log("mounted()");

    console.log("keydown listener added!!! @@@@@@@@@@@@@@@@@@@@@@@@@");
    window.addEventListener("keydown", (event) => {
      this.keyboardControlls(event);
    });

    console.log("paste listener added!!! @@@@@@@@@@@@@@@@@@@@@@@@@");
    window.addEventListener("paste", (event) => {
      this.pasteFromClipboard(event);
    });
  },
};
</script>

<style>
.non-data {
  background-color: #d8e6e0;
}

.edit {
  background-color: white;
  border: 1px solid #185c28 !important;
  box-shadow: 2px 2px 1px 1px gray !important;
}

.editable {
  background-color: #95e8b6;
  border: 1px solid #185c28 !important;
}

.selected {
  background-color: #d9ffe2;
  border: 1px solid #82c491 !important;
}

.delete {
  background-color: #ffb0b0;
}

.insert {
  background-color: #b0c5ff;
}

.update {
  background-color: #fffbb0;
}

.mouseover {
  background-color: #f0f0f0;
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
  min-width: 100px;
  max-width: 100px;
  overflow-y: hidden !important;
  overflow-x: hidden !important;
  white-space: nowrap !important;
  user-select: none;
}

input:focus {
  outline: none;
}

input {
  ime-mode: active;
  width: 100%;
  border: 0;
}

.wrapper {
  position: relative;
  user-select: none;
}

.wrapper::after {
  content: "";
  display: block;
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}
</style>
