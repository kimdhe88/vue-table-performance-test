import TableController from "./table-controller";
import SelectionAreaController from "./selection-area-manager";

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
    return rows;
  }

  moveItemsByDeltaY(deltaY) {
    let limit = this.tc.getView().length - this.display.size;
    if (limit < 0) limit = 0;
    this.display.start += deltaY;
    if (this.display.start < 0) this.display.start = 0;
    else if (this.display.start > limit) this.display.start = limit;
  }

  moveBeginRow() {
    this.moveCell(0, -this.tc.getView().length);
  }

  moveEndRow() {
    this.moveCell(0, this.tc.getView().length);
  }

  moveBeginColumn() {
    this.moveCell(-this.tc.getHeaders().length, 0);
  }

  moveEndColumn() {
    this.moveCell(this.tc.getHeaders().length, 0);
  }

  async order(columnName) {
    let alginType = this.tc.getAlginTypeByColumnName(columnName);
    if (alginType == 0 || alginType == 2) await this.tc.ascendingOrder(columnName);
    else await this.tc.descendingOrder(columnName);
    // return this.refresh();
  }

  async search(searchText) {
    await this.tc.tableSearch(searchText);
    this.moveItemsByDeltaY(0);
    // return this.refresh();
  }

  moveCellUp() {
    this.moveCell(0, -this.delta.arrow);
  }

  moveCellDown() {
    this.moveCell(0, this.delta.arrow);
  }

  moveCellLeft() {
    this.moveCell(-this.delta.arrow, 0);
  }

  moveCellRight() {
    this.moveCell(this.delta.arrow, 0);
  }

  moveCellAreaUp() {
    this.shiftMoveCell(0, -this.delta.arrow);
  }

  moveCellAreaDown() {
    this.shiftMoveCell(0, this.delta.arrow);
  }

  moveCellAreaLeft() {
    this.shiftMoveCell(-this.delta.arrow, 0);
  }

  moveCellAreaRight() {
    this.shiftMoveCell(this.delta.arrow, 0);
  }

  mousewheelDown() {
    this.moveItemsByDeltaY(this.delta.mousewheel);
  }

  pageUp() {
    this.moveCell(0, -this.delta.page);
  }

  pageDown() {
    this.moveCell(0, this.delta.page);
  }

  mousewheelUp() {
    this.moveItemsByDeltaY(-this.delta.mousewheel);
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

  selectAllRows() {
    this.sac.clear();
    this.sac.start(0, 0);
    this.sac.tracking(this.tc.getView().length - 1, this.tc.getHeaders().length - 1);
    this.sac.end();
  }

  moveCell(deltaX, deltaY) {
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
    // this.moveItemsByDeltaY(deltaY);
    let rowlimit = parseInt(this.display.start) + parseInt(this.display.size) - 1;
    if (editCell.rowidx > rowlimit) {
      let delta = parseInt(editCell.rowidx) - rowlimit;
      // console.log(`editCell.rowidx : ${editCell.rowidx}, delta : ${delta}`);
      this.moveItemsByDeltaY(delta);
    }
    if (editCell.rowidx < this.display.start) {
      let delta = parseInt(this.display.start) - parseInt(editCell.rowidx);
      this.moveItemsByDeltaY(-delta);
    }
  }

  shiftMoveCell(deltaX, deltaY) {
    let limitX = this.tc.getHeaders().length - 1;
    let limitY = this.tc.getView().length - 1;
    let nowCell = this.sac.getNowCell();
    nowCell.rowidx = parseInt(nowCell.rowidx) + parseInt(deltaY);
    nowCell.colidx = parseInt(nowCell.colidx) + parseInt(deltaX);
    if (nowCell.rowidx < 0) nowCell.rowidx = 0;
    if (nowCell.rowidx > limitY) nowCell.rowidx = limitY;
    if (nowCell.colidx < 0) nowCell.colidx = 0;
    if (nowCell.colidx > limitX) nowCell.colidx = limitX;
    // this.sac.clear();
    // this.sac.start(editCell.rowidx, editCell.colidx);
    this.sac.restart();
    this.sac.tracking(nowCell.rowidx, nowCell.colidx);
    this.sac.end();

    if (nowCell.rowidx > this.display.start + this.display.size - 1) {
      let delta = parseInt(nowCell.rowidx) - (parseInt(this.display.start) + parseInt(this.display.size) - 1);
      console.log(`nowCell.rowidx : ${nowCell.rowidx}, delta : ${delta}`);
      this.moveItemsByDeltaY(deltaY);
    }
    if (nowCell.rowidx < this.display.start) {
      let delta = parseInt(this.display.start) - parseInt(nowCell.rowidx);
      this.moveItemsByDeltaY(-delta);
    }
  }
}
