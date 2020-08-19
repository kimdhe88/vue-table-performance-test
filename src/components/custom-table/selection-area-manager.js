class Area {
  constructor() {
    this.initialize();
  }

  initialize() {
    this.point = { begin: { rowidx: 0, colidx: 0 }, end: { rowidx: 0, colidx: 0 } };
    this.controlPoint = { rowidx: 0, colidx: 0 };
    this.nowPoint = { rowidx: 0, colidx: 0 };
    this.isActivated = false;
  }

  setControlPoint(rowidx, colidx) {
    this.controlPoint = { rowidx, colidx };
    this.isActivated = true;
  }

  isControlPoint(rowidx, colidx) {
    if (this.controlPoint.rowidx == rowidx && this.controlPoint.colidx == colidx) return true;
    else return false;
  }

  min(arg1, arg2) {
    return arg1 < arg2 ? arg1 : arg2;
  }

  max(arg1, arg2) {
    return arg1 < arg2 ? arg2 : arg1;
  }

  setNowPoint(rowidx, colidx) {
    if (!this.isActivated) return;
    this.nowPoint = { rowidx, colidx };
    this.point.begin.rowidx = this.min(this.controlPoint.rowidx, rowidx);
    this.point.begin.colidx = this.min(this.controlPoint.colidx, colidx);
    this.point.end.rowidx = this.max(this.controlPoint.rowidx, rowidx);
    this.point.end.colidx = this.max(this.controlPoint.colidx, colidx);
  }

  isIncluded(rowidx, colidx) {
    // if (!this.isActivated) return false;
    let isRowIncluded = this.point.begin.rowidx > rowidx ? false : this.point.end.rowidx < rowidx ? false : true;
    let isColumnIncluded = this.point.begin.colidx > colidx ? false : this.point.end.colidx < colidx ? false : true;
    if (isRowIncluded && isColumnIncluded) return true;
    else return false;
  }

  getArea() {
    return this.point;
  }

  getControlPoint() {
    return this.controlPoint;
  }

  getNowPoint() {
    return this.nowPoint;
  }

  isActive() {
    return this.isActivated;
  }

  setActive() {
    this.isActivated = true;
  }

  setInactive() {
    this.isActivated = false;
  }
}

export default class SelectionAreaManager {
  constructor() {
    this.area = new Area();
    this.areaList = new Array();
    this.debug = false;
  }

  clear() {
    if (this.debug) console.log("sam clear");
    this.area.initialize();
    while (this.areaList.length != 0) this.areaList.pop();
  }

  isSelected(rowidx, colidx) {
    if (this.area.isIncluded(rowidx, colidx)) return true;
    for (let idx in this.areaList) if (this.areaList[idx].isIncluded(rowidx, colidx)) return true;
    return false;
  }

  start(rowidx, colidx) {
    if (this.debug) console.log("sam start");
    this.area.setControlPoint(rowidx, colidx);
  }

  restart() {
    if (this.debug) console.log("sam restart");
    this.area.setActive();
  }

  tracking(rowidx, colidx) {
    if (this.debug) console.log("sam tracking");
    // console.log(this.area.isActive());
    if (this.area.isActive()) this.area.setNowPoint(rowidx, colidx);
  }

  end() {
    if (this.debug) console.log("sam end");
    this.area.setInactive();
  }

  isActive() {
    return this.area.isActive();
  }

  store() {
    if (this.debug) console.log("sam store");
    this.areaList.push(this.area);
    this.area = new Area();
  }

  isEditCell(rowidx, colidx) {
    return this.area.isControlPoint(rowidx, colidx);
  }

  getEditCell() {
    return Object.assign({}, this.area.getControlPoint());
  }

  getNowCell() {
    return Object.assign({}, this.area.getNowPoint());
  }
  //   test function
  drawAreas() {
    console.log(this.area.getArea());

    for (let idx in this.areaList) {
      console.log(`${idx} index array`);
      console.log(this.areaList[idx].getArea());
    }
  }

  getSelectArea() {
    let areaList = new Array();
    areaList.push(this.area.getArea());
    for (let idx in this.areaList) areaList.push(this.areaList[idx].getArea());
    return areaList;
  }
}
