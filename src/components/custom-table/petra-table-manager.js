import { PetraTableObject, SORT_TYPE } from "./petra-table-object";
import SelectedSection from "./selected-section";

const DELTA = { CELL: 1, WHEEL: 3, PAGE: 10 };
const CELLTYPE = { NONE: "none", EDITABLE: "editable", EDIT: "edit", SELECTED: "selected", MOUSEOVER: "mouseover", INSERT: "insert", UPDATE: "update", DELETE: "delete" };
const MODE = { NONE: "none", EDITTING: "editting" };

export default class PetraTable {
  constructor() {
    this.pto = new PetraTableObject();
    this.ss = new SelectedSection();
    this.mode = MODE.NONE;

    this.display = {
      start: 0,
      size: 15,
      limit: 0,
    };
  }

  /* setter */

  setItems(givenItems) {
    this.pto.setItems(givenItems);
  }

  setHeaders(givenHeaders) {
    this.pto.setHeaders(givenHeaders);
  }

  editOn() {
    console.log("editOn");
    this.mode = MODE.EDITTING;
  }

  editOff() {
    console.log("editOff");
    this.mode = MODE.NONE;
  }

  /* getter */
  getItems() {
    return this.pto.getItems();
  }

  getHeaders() {
    return this.pto.getHeaders();
  }

  getDatumPoint() {
    return this.ss.getDatumPoint();
  }

  getViewData(rowdix, colidx) {
    return this.pto.getViewData(rowdix, colidx);
  }

  isEditMode() {
    return this.mode == MODE.EDITTING;
  }

  isDatumPoint(rowidx, colidx) {
    return this.ss.isDatumPoint(rowidx, colidx);
  }

  refresh(type) {
    // console.log(`refresh : ${type}`);
    let rows = new Object();
    let targetItems = this.pto.getView().slice(this.display.start, this.display.start + this.display.size);
    for (let idx in targetItems) {
      let targetItem = targetItems[idx];
      let rowidx = parseInt(this.display.start) + parseInt(idx);
      rows[rowidx] = new Object();
      let headers = this.pto.getHeaders();
      for (let hidx in headers) {
        let header = headers[hidx];
        let colidx = hidx;
        rows[rowidx][colidx] = new Object();
        rows[rowidx][colidx].name = header.name;
        rows[rowidx][colidx].value = targetItem[header.name];
        rows[rowidx][colidx].cellType = this.getCellType(rowidx, colidx);
        // console.log(rows[rowidx][colidx].cellType);
      }
    }
    return rows;
  }

  getCellType(rowidx, colidx) {
    if (this.ss.isDatumPoint(rowidx, colidx)) {
      if (this.mode == MODE.EDITTING) return CELLTYPE.EDIT;
      else return CELLTYPE.EDITABLE;
    }
    if (this.ss.isSelectedSection(rowidx, colidx)) return CELLTYPE.SELECTED;
    if (this.ss.isMousePoint(rowidx, colidx)) return CELLTYPE.MOUSEOVER;

    return CELLTYPE.NONE;
  }

  async order(colidx) {
    let headers = this.pto.getHeaders();
    let sortStatus = headers[colidx].sortStatus;
    if (sortStatus == SORT_TYPE.NOT || sortStatus == SORT_TYPE.DESC) {
      this.pto.ascendingOrderByColidx(colidx);
      for (let idx in headers) if (idx != colidx) headers[idx].sortStatus = SORT_TYPE.NOT;
      headers[colidx].sortStatus = SORT_TYPE.ASC;
    } else {
      this.pto.descendingOrderByColidx(colidx);
      for (let idx in headers) if (idx != colidx) headers[idx].sortStatus = SORT_TYPE.NOT;
      headers[colidx].sortStatus = SORT_TYPE.DESC;
    }
  }

  async search(searchText) {
    await this.pto.search(searchText);
    this.moveDisplayPosition(0);
  }

  // 셀 이동 관련 함수들
  moveDisplayPosition(deltaY) {
    this.display.limit = this.pto.getView().length - this.display.size;
    this.display.limit = this.display.limit < 0 ? 0 : this.display.limit;
    this.display.start += deltaY;
    this.display.start = this.display.start < 0 ? 0 : this.display.start;
    this.display.start = this.display.start < this.display.limit ? this.display.start : this.display.limit;
  }

  arrowUp(ctrlKey, shiftKey) {
    this.moveCell(0, -DELTA.CELL, ctrlKey, shiftKey);
  }

  arrowDown(ctrlKey, shiftKey) {
    this.moveCell(0, DELTA.CELL, ctrlKey, shiftKey);
  }

  arrowLeft(ctrlKey, shiftKey) {
    this.moveCell(-DELTA.CELL, 0, ctrlKey, shiftKey);
  }

  arrowRight(ctrlKey, shiftKey) {
    this.moveCell(DELTA.CELL, 0, ctrlKey, shiftKey);
  }

  pageUp(shiftKey) {
    this.moveCell(0, -DELTA.PAGE, false, shiftKey);
  }

  pageDown(shiftKey) {
    this.moveCell(0, DELTA.PAGE, false, shiftKey);
  }

  mousewheelUp() {
    this.moveDisplayPosition(-DELTA.WHEEL);
  }

  mousewheelDown() {
    this.moveDisplayPosition(DELTA.WHEEL);
  }

  selectAllRows() {
    this.ss.clear();
    this.ss.startDragging(0, 0, true);
    this.ss.tracking(this.pto.getView().length - 1, this.pto.getHeaders().length - 1);
    this.ss.stopDragging();
  }

  mouseClick(rowidx, colidx, ctrlKey, shiftKey) {
    if (!ctrlKey && !shiftKey) this.ss.clear();
    if (ctrlKey && !shiftKey) this.ss.store();
    if (!ctrlKey && shiftKey) this.ss.restartDragging();
    else this.ss.startDragging(rowidx, colidx);
    this.ss.tracking(rowidx, colidx);
  }

  mouseMove(rowidx, colidx) {
    this.ss.tracking(rowidx, colidx);
  }

  mouseUp() {
    this.ss.stopDragging();
  }

  moveCell(deltaX, deltaY, ctrlKey = false, shiftKey = false) {
    if (ctrlKey) {
      deltaX = deltaX * this.pto.getHeaders().length;
      deltaY = deltaY * this.pto.getItems().length;
    }

    this.cellTypeToMove(deltaX, deltaY, shiftKey);
  }

  cellTypeToMove(deltaX, deltaY, shiftKey) {
    let limitX = this.pto.getHeaders().length - 1;
    let limitY = this.pto.getView().length - 1;
    let cell;
    if (shiftKey) cell = this.ss.getSelectedPoint();
    else cell = this.ss.getDatumPoint();

    cell.rowidx = parseInt(cell.rowidx) + parseInt(deltaY);
    cell.colidx = parseInt(cell.colidx) + parseInt(deltaX);
    if (cell.rowidx < 0) cell.rowidx = 0;
    if (cell.rowidx > limitY) cell.rowidx = limitY;
    if (cell.colidx < 0) cell.colidx = 0;
    if (cell.colidx > limitX) cell.colidx = limitX;

    if (shiftKey) this.ss.restartDragging();
    else {
      this.ss.clear();
      this.ss.startDragging(cell.rowidx, cell.colidx);
    }
    this.ss.tracking(cell.rowidx, cell.colidx, true);
    this.ss.stopDragging();

    let rowlimit = parseInt(this.display.start) + parseInt(this.display.size) - 1;
    if (cell.rowidx > rowlimit) {
      let delta = parseInt(cell.rowidx) - rowlimit;
      this.moveDisplayPosition(delta);
    }
    if (cell.rowidx < this.display.start) {
      let delta = parseInt(this.display.start) - parseInt(cell.rowidx);
      this.moveDisplayPosition(-delta);
    }
  }

  /* clipboard copy & paste
   * 선택 영역으로 부터 원본 데이터를 가져온다.
   * 만약 데이터 내에 개행이 존재하는 다중라인 텍스트라면 데이터 전체를 더블쿼터(")로 감싼다.
   * 만약 다중라인 택스트 내에 더블쿼터가 존재한다면 더블쿼터를 하나 더 붙여준다.
   * 붙여넣기 시 다중라인 텍스트를 감싸는 더블쿼터 제거 후 내부에 존재하는 더블 쿼터는 싱글 쿼터로 바꿔준다.
   */
  getSelectAreaDataToString(delimiters = "\t") {
    let selectedSection = this.ss.getSelectedSection();
    let copyString = "";
    for (let idx = 0; idx < selectedSection.length; idx++) {
      let point = selectedSection[idx];
      for (let rowidx = point.initial.rowidx; rowidx <= point.terminal.rowidx; rowidx++) {
        for (let colidx = point.initial.colidx; colidx <= point.terminal.colidx; colidx++) {
          let cellData = this.pto.getViewData(rowidx, colidx);
          cellData = this.multiLineProcessingForCopy(cellData);
          if (colidx == point.terminal.colidx) copyString += cellData + "\n";
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
        console.log(cellData);
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

  update() {}
}
