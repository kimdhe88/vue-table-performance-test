const min = (arg1, arg2) => {
  arg1 = parseInt(arg1);
  arg2 = parseInt(arg2);
  return arg1 < arg2 ? arg1 : arg2;
};

const max = (arg1, arg2) => {
  arg1 = parseInt(arg1);
  arg2 = parseInt(arg2);
  return arg1 < arg2 ? arg2 : arg1;
};

class Point {
  constructor() {
    this.rowidx = -1;
    this.colidx = -1;
  }
}

class Area {
  constructor() {
    this.datumPoint = new Point();
    this.selectedPoint = new Point();
    this.mousePoint = new Point();
    this.selectedSection = { initial: new Point(), terminal: new Point() };
  }

  clearPoints() {
    this.datumPoint = new Point();
    this.selectedPoint = new Point();
    this.mousePoint = new Point();
    this.selectedSection = { initial: new Point(), terminal: new Point() };
  }

  getDatumPoint() {
    return this.datumPoint;
  }

  getSelectedPoint() {
    return this.selectedPoint;
  }

  getMousePoint() {
    return this.mousePoint;
  }

  getSelectedSection() {
    return this.selectedSection;
  }

  setDatumPoint(rowidx, colidx) {
    this.datumPoint.rowidx = rowidx;
    this.datumPoint.colidx = colidx;
  }

  setSelectedPoint(rowidx, colidx) {
    this.selectedPoint.rowidx = rowidx;
    this.selectedPoint.colidx = colidx;
  }

  setMousePoint(rowidx, colidx) {
    this.mousePoint = { rowidx, colidx };
  }

  setSelectedSection(p1 = { rowidx, colidx }, p2 = { rowidx, colidx }) {
    this.selectedSection.initial.rowidx = min(p1.rowidx, p2.rowidx);
    this.selectedSection.initial.colidx = min(p1.colidx, p2.colidx);
    this.selectedSection.terminal.rowidx = max(p1.rowidx, p2.rowidx);
    this.selectedSection.terminal.colidx = max(p1.colidx, p2.colidx);
  }

  isDatumPoint(rowidx, colidx) {
    return this.datumPoint.rowidx == rowidx && this.datumPoint.colidx == colidx;
  }

  isSelectedPoint(rowidx, colidx) {
    return this.selectedPoint.rowidx == rowidx && this.selectedPoint.colidx == colidx;
  }

  isMousePoint(rowidx, colidx) {
    return this.mousePoint.rowidx == rowidx && this.mousePoint.colidx == colidx;
  }

  isSelectedSection(rowidx, colidx) {
    let inRowidxInRange = this.selectedSection.initial.rowidx > rowidx ? false : this.selectedSection.terminal.rowidx < rowidx ? false : true;
    let inColidxInRange = this.selectedSection.initial.colidx > colidx ? false : this.selectedSection.terminal.colidx < colidx ? false : true;
    return inRowidxInRange && inColidxInRange;
  }
}

const NONE = 0;
const DRAGGING = 1;

export default class SelectedSection {
  constructor() {
    this.area = new Area();
    this.areaList = new Array();
    this.mode = this.debug = false;
  }

  isDatumPoint(rowidx, colidx) {
    return this.area.isDatumPoint(rowidx, colidx);
  }

  isSelectedPoint(rowidx, colidx) {
    return this.area.isSelectedPoint(rowidx, colidx);
  }

  isMousePoint(rowidx, colidx) {
    return this.area.isMousePoint(rowidx, colidx);
  }

  isSelectedSection(rowidx, colidx) {
    let isSelectionPoint = false;
    if (this.area.isSelectedSection(rowidx, colidx)) isSelectionPoint = true;
    for (let idx in this.areaList) if (this.areaList[idx].isSelectedSection(rowidx, colidx)) isSelectionPoint = true;
    return isSelectionPoint;
  }

  getDatumPoint() {
    return this.area.getDatumPoint();
  }

  getSelectedPoint() {
    return this.area.getSelectedPoint();
  }

  getMousePoint() {
    return this.area.getMousePoint();
  }

  getSelectedSection() {
    let areaList = new Array();
    areaList.push(this.area.getSelectedSection());
    for (let idx in this.areaList) areaList.push(this.areaList[idx].getSelectedSection());
    return areaList;
  }

  getSelectedSectionRowidxList() {
    let rowidxList = new Array();
    let selectedSection = this.area.getSelectedSection();
    for (let i = selectedSection.initial.rowidx; i <= selectedSection.terminal.rowidx; i++) if (!rowidxList.includes(i)) rowidxList.push(i);
    for (let idx in this.areaList) {
      selectedSection = this.areaList[idx].getSelectedSection();
      for (let i = selectedSection.initial.rowidx; i <= selectedSection.terminal.rowidx; i++) if (!rowidxList.includes(i)) rowidxList.push(i);
    }
    // console.log(rowidxList.sort((a, b) => a - b));
    return rowidxList.sort((a, b) => a - b);
  }

  /* management functions */
  clear() {
    this.area.clearPoints();
    while (this.areaList.length != 0) this.areaList.pop();
  }

  store() {
    this.areaList.push(this.area);
    this.area = new Area();
  }

  startDragging(rowidx, colidx) {
    this.mode = DRAGGING;
    this.area.setDatumPoint(rowidx, colidx);
    // console.log(this.area.datumPoint);
  }

  restartDragging() {
    this.mode = DRAGGING;
  }

  tracking(rowidx, colidx, justKeyboard = false) {
    // if (!justKeyboard) console.log("마우스 입력이 개입됨. ");
    if (this.mode == DRAGGING) {
      this.area.setSelectedPoint(rowidx, colidx);
      // console.log(rowidx, colidx);
      this.area.setSelectedSection(this.area.getDatumPoint(), this.area.getSelectedPoint());
    }
    if (!justKeyboard) this.area.setMousePoint(rowidx, colidx);
  }

  stopDragging() {
    this.mode = NONE;
  }
}
