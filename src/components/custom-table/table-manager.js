import TableController from "./table-controller";
import SelectionAreaController from "./selection-area-manager";
import { ssrCompile } from "vue-template-compiler";

export default class TableManager {
  constructor() {
    this.tc = new TableController();
    this.sac = new SelectionAreaController();
    this.display = {
      start: 0,
      size: 15,
    };
    this.delta = {
      cell: 1,
      mousewheel: 3,
      arrow: 1,
      page: 10,
    };
    this.displayItems = new Array();
  }

  initializeTable(items) {
    this.tc.initializeTable(items);
  }

  refactoringHeaders(headers) {
    return this.tc.refactoringHeaders(headers);
  }

  refresh(type) {
    // console.log(`refresh : ${type}`);
    let targetItems = this.tc.getView().slice(this.display.start, this.display.start + this.display.size);
    let rows = new Array();

    for (let idx in targetItems) {
      let targetItem = targetItems[idx];
      let row = new Object();
      let rowidx = parseInt(this.display.start) + parseInt(idx);
      let headers = this.tc.getHeaders();
      for (let hidx in headers) {
        let column = headers[hidx];
        let colidx = column._colidx;
        row[colidx] = new Object();
        row[colidx].value = targetItem[column.name];
        row[colidx].cellType = this.sac.isEditCell(rowidx, colidx) ? 1 : this.sac.isSelected(rowidx, colidx) ? 2 : 0; // 0:normal, 1:edit, 2:select, 3:insert, 4:delete, 5:update
        // row[colidx].cellType = 0; // 0:normal, 1:edit, 2:select, 3:insert, 4:delete, 5:update
      }
      row._rowidx = rowidx;
      rows.push(row);
    }
    this.displayItems = rows;
    return this.displayItems;
  }

  async order(columnName) {
    let alginType = this.tc.getAlginTypeByColumnName(columnName);
    // console.log(alginType);
    if (alginType == 0 || alginType == 2) {
      await this.tc.ascendingOrder(columnName);
      this.tc.setAlginTypeByColumnName(columnName, 1);
    } else {
      await this.tc.descendingOrder(columnName);
      this.tc.setAlginTypeByColumnName(columnName, 2);
    }
    // return this.refresh();
  }

  async search(searchText) {
    await this.tc.tableSearch(searchText);
    this.moveItemsByDeltaY(0);
    // return this.refresh();
  }

  // 셀 이동 관련 함수들
  moveItemsByDeltaY(deltaY) {
    let limit = this.tc.getView().length - this.display.size;
    if (limit < 0) limit = 0;
    this.display.start += deltaY;
    if (this.display.start < 0) this.display.start = 0;
    else if (this.display.start > limit) this.display.start = limit;
  }

  arrowUp(ctrlKey, shiftKey) {
    this.moveCell(0, -this.delta.arrow, ctrlKey, shiftKey);
  }

  arrowDown(ctrlKey, shiftKey) {
    this.moveCell(0, this.delta.arrow, ctrlKey, shiftKey);
  }

  arrowLeft(ctrlKey, shiftKey) {
    this.moveCell(-this.delta.arrow, 0, ctrlKey, shiftKey);
  }

  arrowRight(ctrlKey, shiftKey) {
    this.moveCell(this.delta.arrow, 0, ctrlKey, shiftKey);
  }

  pageUp(shiftKey) {
    this.moveCell(0, -this.delta.page, false, shiftKey);
  }

  pageDown(shiftKey) {
    this.moveCell(0, this.delta.page, false, shiftKey);
  }

  mousewheelUp() {
    this.moveItemsByDeltaY(-this.delta.mousewheel);
  }

  mousewheelDown() {
    this.moveItemsByDeltaY(this.delta.mousewheel);
  }

  selectAllRows() {
    this.sac.clear();
    this.sac.start(0, 0);
    this.sac.tracking(this.tc.getView().length - 1, this.tc.getHeaders().length - 1);
    this.sac.end();
  }

  mouseClick(rowidx, colidx, isShift, isCtrl) {
    if (!isShift && !isCtrl) this.sac.clear();
    if (isCtrl) this.sac.store();

    if (isShift) this.sac.restart();
    else this.sac.start(rowidx, colidx);
    this.sac.tracking(rowidx, colidx);
  }

  mouseMove(rowidx, colidx) {
    if (!this.sac.isActive()) return 0;
    this.sac.tracking(rowidx, colidx);
    return 1;
  }

  mouseUp() {
    this.sac.end();
  }

  moveCell(deltaX, deltaY, ctrlKey = false, shiftKey = false) {
    if (ctrlKey) {
      deltaX = deltaX * this.tc.getHeaders().length;
      deltaY = deltaY * this.tc.getItems().length;
    }

    if (shiftKey) this.moveNowCell(deltaX, deltaY);
    else this.moveEditCell(deltaX, deltaY);
  }

  moveEditCell(deltaX, deltaY) {
    let limitX = this.tc.getHeaders().length - 1;
    let limitY = this.tc.getView().length - 1;
    let editCell = this.sac.getEditCell();
    editCell.rowidx = parseInt(editCell.rowidx) + parseInt(deltaY);
    editCell.colidx = parseInt(editCell.colidx) + parseInt(deltaX);
    if (editCell.rowidx < 0) editCell.rowidx = 0;
    if (editCell.rowidx > limitY) editCell.rowidx = limitY;
    if (editCell.colidx < 0) editCell.colidx = 0;
    if (editCell.colidx > limitX) editCell.colidx = limitX;

    this.sac.clear();
    this.sac.start(editCell.rowidx, editCell.colidx);
    this.sac.tracking(editCell.rowidx, editCell.colidx);
    this.sac.end();

    let rowlimit = parseInt(this.display.start) + parseInt(this.display.size) - 1;
    if (editCell.rowidx > rowlimit) {
      let delta = parseInt(editCell.rowidx) - rowlimit;
      this.moveItemsByDeltaY(delta);
    }
    if (editCell.rowidx < this.display.start) {
      let delta = parseInt(this.display.start) - parseInt(editCell.rowidx);
      this.moveItemsByDeltaY(-delta);
    }
  }

  moveNowCell(deltaX, deltaY) {
    let limitX = this.tc.getHeaders().length - 1;
    let limitY = this.tc.getView().length - 1;
    let nowCell = this.sac.getNowCell();
    nowCell.rowidx = parseInt(nowCell.rowidx) + parseInt(deltaY);
    nowCell.colidx = parseInt(nowCell.colidx) + parseInt(deltaX);
    if (nowCell.rowidx < 0) nowCell.rowidx = 0;
    if (nowCell.rowidx > limitY) nowCell.rowidx = limitY;
    if (nowCell.colidx < 0) nowCell.colidx = 0;
    if (nowCell.colidx > limitX) nowCell.colidx = limitX;

    this.sac.restart();
    this.sac.tracking(nowCell.rowidx, nowCell.colidx);
    this.sac.end();

    if (nowCell.rowidx > this.display.start + this.display.size - 1) {
      let delta = parseInt(nowCell.rowidx) - (parseInt(this.display.start) + parseInt(this.display.size) - 1);
      this.moveItemsByDeltaY(deltaY);
    }
    if (nowCell.rowidx < this.display.start) {
      let delta = parseInt(this.display.start) - parseInt(nowCell.rowidx);
      this.moveItemsByDeltaY(-delta);
    }
  }

  // cell data 확인
  isEditCell(rowidx, colidx) {
    return this.sac.isEditCell(rowidx, colidx);
  }

  getCellDataByIndex(rowidx, colidx) {
    let columnName = this.tc.getColumnNameByIndex(colidx);
    return this.tc.getView()[rowidx][columnName];
  }

  getEditCell() {
    return this.sac.getEditCell();
  }

  getHeaders() {
    return this.tc.getHeaders();
  }

  getView() {
    return this.tc.getView();
  }

  /* clipboard copy & paste
   * 선택 영역으로 부터 원본 데이터를 가져온다.
   * 만약 데이터 내에 개행이 존재하는 다중라인 텍스트라면 데이터 전체를 더블쿼터(")로 감싼다.
   * 만약 다중라인 택스트 내에 더블쿼터가 존재한다면 더블쿼터를 하나 더 붙여준다.
   * 붙여넣기 시 다중라인 텍스트를 감싸는 더블쿼터 제거 후 내부에 존재하는 더블 쿼터는 싱글 쿼터로 바꿔준다.
   */
  getSelectAreaDataToString(delimiters = "\t") {
    let selectAreaList = this.sac.getSelectArea();
    let copyString = "";
    for (let idx = 0; idx < selectAreaList.length; idx++) {
      let point = selectAreaList[idx];
      for (let rowidx = point.begin.rowidx; rowidx <= point.end.rowidx; rowidx++) {
        for (let colidx = point.begin.colidx; colidx <= point.end.colidx; colidx++) {
          let cellData = this.getCellDataByIndex(rowidx, colidx);
          cellData = this.multiLineProcessingForCopy(cellData);
          if (colidx == point.end.colidx) copyString += cellData + "\n";
          else copyString += cellData + delimiters; // 데이터 + 딜리미터
        }
      }
    }
    // console.log("copy Strg");
    // console.log(copyString);
    return copyString;
  }

  multiLineProcessingForCopy(data) {
    // console.log(`data : ${data}`);
    if (data.toString().match(/\r\n|\r|\n/g)) {
      // 멀티라인일 때 진입
      data = data.replace(/\"/g, '""'); // 멀티라인 내 더블쿼터"가 있으면 이스케이프를 위해 연결 된 더블쿼터("")로 변경, excel type
      data = `"${data}"`; // 멀티라인을 더블쿼터로 감싸주기
    }
    return data;
  }

  clipboardDataToUpdate(plainText, delimiters = "\t") {
    let rows = plainText.split("\r\n");
    rows.pop(); // 클립보드에서 가져올 때 맨 마지막 줄에서 빈 줄이 하나 추가됨. 해당 라인 제거

    for (let ridx in rows) {
      let row = rows[ridx];
      let cellDataList = row.split(delimiters);
      for (let cidx in cellDataList) {
        let cellData = cellDataList[cidx];
        cellData = this.multiLineProcessingForPaste(cellData);
        // console.log(cellData);
        // this.printAsciiCodes(cellData);
        // console.log(`cellData : ${cellData}, ascii : ${this.ascii(cellData)}`);
      }
      // console.log("next line ] @@@");
    }
  }

  multiLineProcessingForPaste(data) {
    if (data.match(/^"/g) && data.match(/"$/g)) {
      data = data.replace(/^"/, ""); // 처음과 끝 " 제거
      data = data.replace(/"$/, ""); // 처음과 끝 " 제거
      data = data.replace(/\"\"/g, '"'); // 데이터 내 "" 를 "로 변경
    }
    return data;
  }

  printAsciiCodes(data) {
    for (let idx in data) console.log(`data : ${data[idx]}, ascii, ${data[idx].charCodeAt(0)}`);
  }

  ascii(data) {
    return data.charCodeAt(0);
  }

  // history and undo, redo
  update(rowidx, colidx, data) {
    let columnName = this.tc.getColumnNameByIndex(colidx);
    this.tc.setViewData(rowidx, columnName, data);
  }
}
