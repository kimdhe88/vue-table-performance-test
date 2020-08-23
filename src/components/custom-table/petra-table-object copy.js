import _ from "lodash";

const search = async (data, searchText, option = { isCaseSensitive: false, property: null }) => {
  let searchList = new Array();
  if (option.isCaseSensitive) {
    if (option.property) searchList = data.filter((obj) => (obj[option.property] ? obj[option.property].toString().includes(searchText) : false));
    else searchList = data.filter((obj) => Object.values(obj).some((val) => (val ? val.toString().includes(searchText) : false)));
  } else {
    if (option.property)
      searchList = data.filter((obj) =>
        obj[option.property]
          ? obj[option.property]
              .toString()
              .toLowerCase()
              .includes(searchText.toLowerCase())
          : false
      );
    else
      searchList = data.filter((obj) =>
        Object.values(obj).some((val) =>
          val
            ? val
                .toString()
                .toLowerCase()
                .includes(searchText.toLowerCase())
            : false
        )
      );
  }
  return searchList;
};

const sort = async (data = Array, propertyName = String, isAscending = true) => {
  let sortList;
  if (isAscending) sortList = data.sort((a, b) => (a[propertyName] < b[propertyName] ? -1 : a[propertyName] > b[propertyName] ? 1 : 0));
  else sortList = data.sort((a, b) => (a[propertyName] < b[propertyName] ? 1 : a[propertyName] > b[propertyName] ? -1 : 0));
  return sortList;
};

const SORT_TYPE = { NOT: "not-sorted", ASC: "asc-sort", DESC: "desc-sort" };
const QUERY_TYPE = { INSERT: "insert", UPDATE: "update", DELETE: "delete" };

class Query {
  constructor(type, rowidx, colidx = null, before = null, after = null) {
    this.type = type;
    this.rowidx = rowidx;
    this.data = new Object();
    this.data.colidx = colidx;
    this.data.before = before;
    this.data.after = after;
  }
}

class dmlState {
  constructor(type, colidx = null, data = null) {
    this.type = type;
    this.data = new Object();
    if (colidx) this.data[colidx] = data;
  }
}

class PetraTableObject {
  constructor() {
    this.items = new Array();
    this.headers = new Array();
    this.view = new Array();

    this.redoBuffer = new Array();
    this.undoBuffer = new Array();
    this.queryBuffer = new Array();
    this.dmlStates = new Object();
    this.isTransaction = false;
  }

  /* setter */
  setItems(givenItems) {
    this.items = givenItems;
    this.view = new Array();
    Object.assign(this.view, this.items);
  }

  setHeaders(givenHeaders) {
    console.log("givenHeaders");
    console.log(givenHeaders);
    this.headers = new Array();
    for (let idx in givenHeaders) {
      this.headers[idx] = new Object();
      this.headers[idx].name = givenHeaders[idx].name;
      this.headers[idx].text = givenHeaders[idx].text;
      this.headers[idx].width = givenHeaders[idx].width;
      this.headers[idx].sortStatus = SORT_TYPE.NOT;
    }
    this.headers = givenHeaders;
    return this.headers;
  }

  /* getter */
  getItems() {
    return this.items;
  }

  getView() {
    return this.view;
  }

  getViewData(rowidx, colidx) {
    let column = this.headers[colidx].name;
    return this.view[rowidx][column];
  }

  getLastestVersionData(rowidx, colidx) {
    return !_.isUndefined(this.dmlStates[rowidx]) && !_.isUndefined(this.dmlStates[rowidx].data[colidx]) ? this.dmlStates[rowidx].data[colidx] : this.getViewData(rowidx, colidx);
  }

  getHeaders() {
    return this.headers;
  }

  /* operating functions */

  async ascendingOrderByColidx(colidx) {
    this.view = await sort(this.view, this.headers[colidx].name, true);
  }

  async descendingOrderByColidx(colidx) {
    this.view = await sort(this.view, this.headers[colidx].name, false);
  }

  async ascendingOrder(columnName) {
    this.view = await sort(this.view, columnName, true);
  }

  async descendingOrder(columnName) {
    this.view = await sort(this.view, columnName, false);
  }

  async search(searchText, option = { isCaseSensitive: false, property: null }) {
    this.view = await search(this.items, searchText, option);
  }

  getData(rowidx, colidx) {
    return this.view[rowidx][this.header[colidx].name];
  }

  /* undo redo 구현부 */
  beginTransaction() {
    this.isTransaction = true;
  }

  insert(rowidx) {
    let query = new Query(QUERY_TYPE.INSERT, rowidx);
    this.queryBuffer.push(query);
    if (!this.isTransaction) this.do();
  }

  update(rowidx, colidx, before, after) {
    let query = new Query(QUERY_TYPE.UPDATE, rowidx, colidx, before, after);
    // console.log(query);
    this.queryBuffer.push(query);
    if (!this.isTransaction) this.do();
  }

  delete(rowidx) {
    let query = new Query(QUERY_TYPE.DELETE, rowidx);
    this.queryBuffer.push(query);

    if (!this.isTransaction) this.do();
  }

  endTransaction() {
    this.isTransaction = false;
    this.do();
  }

  do() {
    let skipQueryIdx = new Array();
    for (let idx in this.queryBuffer) {
      let query = this.queryBuffer[idx];
      if (query.type == QUERY_TYPE.INSERT) this.createEmptyRowToView(query.rowidx);
      else if (query.type == QUERY_TYPE.UPDATE) {
        //
      } else if (query.type == QUERY_TYPE.DELETE && this.isInsert(query.rowidx)) this.deleteRowFromView(query.rowidx, 1);
      else if (query.type == QUERY_TYPE.DELETE && this.isDelete(query.rowidx)) {
        skipQueryIdx.push(idx); // 같은라인 반복삭제 시 redo에 담지 않음.
        continue;
      }
      this.reflectDoToDmlStates(query);
    }

    skipQueryIdx = skipQueryIdx.sort((a, b) => b - a);
    for (let i in skipQueryIdx) this.queryBuffer.splice(skipQueryIdx[i], 1); // 같은라인 반복삭제 시 redo에 담지 않음.

    if (this.queryBuffer.length > 0) this.redoBuffer.push(this.queryBuffer);
    this.queryBuffer = new Array();
    this.clearUndoBuffer();
  }

  undo() {
    let queryBuffer = this.redoBuffer.pop();
    for (let idx in queryBuffer) {
      let query = queryBuffer[idx];
      if (query.type == QUERY_TYPE.INSERT) this.deleteRowFromView(query.rowidx, 1);
      else if (query.type == QUERY_TYPE.UPDATE) {
      } else if (query.type == QUERY_TYPE.DELETE && !this.isDelete(query.rowidx)) this.createEmptyRowToView(query.rowidx);
      this.reflectUndoToDmlStates(query);
    }

    this.undoBuffer.push(queryBuffer);
  }

  /* insert에서 동작할 view에 새로운 row를 추가하는 함수묶음 */
  createEmptyRowToView(rowidx) {
    console.log("dleete인데 여기로 들어왔나요?");
    this.view.splice(rowidx, 0, this.getEmptyViewRow());
  }

  getEmptyViewRow() {
    let row = new Object();
    for (let idx in this.headers) row[this.headers[idx].name] = null;
    return row;
  }
  /******************************************************************/

  /* insert 된 rows를 delete 했을 때 view에서 제거하는 매커니즘 */
  deleteRowFromView(rowidx) {
    this.view.splice(rowidx, 1);
  }
  /******************************************************************/

  reflectDoToDmlStates(query) {
    if (query.type == QUERY_TYPE.INSERT) {
      this.increaseRowidxInDmlStatus(query.rowidx);
      this.dmlStates[query.rowidx] = new dmlState(QUERY_TYPE.INSERT);
    } else if (query.type == QUERY_TYPE.UPDATE) {
      if (_.isUndefined(this.dmlStates[query.rowidx])) this.dmlStates[query.rowidx] = new dmlState(QUERY_TYPE.UPDATE);
      this.dmlStates[query.rowidx].data[query.data.colidx] = query.data.after;
    } else if (query.type == QUERY_TYPE.DELETE) {
      if (this.isInsert(query.rowidx)) this.decreaseRowidxInDmlStatus(query.rowidx);
      else {
        if (_.isUndefined(this.dmlStates[query.rowidx])) this.dmlStates[query.rowidx] = new dmlState(QUERY_TYPE.DELETE);
        else this.dmlStates[query.rowidx].type = QUERY_TYPE.DELETE;
      }
    }
  }

  reflectUndoToDmlStates(query) {
    if (query.type == QUERY_TYPE.INSERT) {
      this.decreaseRowidxInDmlStatus(query.rowidx);
    } else if (query.type == QUERY_TYPE.UPDATE) {
      if (_.isUndefined(this.dmlStates[query.rowidx])) this.dmlStates[query.rowidx] = new dmlState(QUERY_TYPE.UPDATE);
      this.dmlStates[query.rowidx].data[query.data.colidx] = query.data.before;
    } else if (query.type == QUERY_TYPE.DELETE) {
      if (!this.isDelete(query.rowidx)) {
        this.increaseRowidxInDmlStatus(query.rowidx);
        this.dmlStates[query.rowidx] = new dmlState(QUERY_TYPE.INSERT);
      } else {
        if (this.dmlStates[query.rowidx].data.length > 0) this.dmlStates[query.rowidx].type = QUERY_TYPE.UPDATE;
        else delete this.dmlStates[query.rowidx]; // 일반 데이터 삭제였을 때 삭제정보를 state에서 제거
      }
    }
  }

  increaseRowidxInDmlStatus(givenRowidx) {
    let rowidxList = Object.keys(this.dmlStates);
    rowidxList.sort((a, b) => b - a); // rowidx를 역순으로 정렬

    rowidxList.filter((rowidx) => {
      if (parseInt(rowidx) >= parseInt(givenRowidx)) {
        let targetIdx = parseInt(rowidx) + 1;
        this.dmlStates[targetIdx] = this.dmlStates[rowidx];
        delete this.dmlStates[rowidx];
        // console.log(this.dmlStates);
      }
    });
  }

  decreaseRowidxInDmlStatus(givenRowidx) {
    let rowidxList = Object.keys(this.dmlStates).sort((a, b) => a - b); // rowidx를 오름차순 정렬

    rowidxList.filter((rowidx) => {
      if (parseInt(rowidx) == parseInt(givenRowidx)) delete this.dmlStates[rowidx];
      else if (parseInt(rowidx) > parseInt(givenRowidx)) {
        let targetIdx = parseInt(rowidx) - 1;
        this.dmlStates[targetIdx] = this.dmlStates[rowidx];
        delete this.dmlStates[rowidx];
        // console.log(this.dmlStates);
      }
    });
  }
  /******************************************************************/

  clearRedoBuffer() {
    while (this.redoBuffer.length > 0) this.redoBuffer.pop();
  }

  clearUndoBuffer() {
    while (this.undoBuffer.length > 0) this.undoBuffer.pop();
  }

  isInsert(rowidx, colidx) {
    return !_.isUndefined(this.dmlStates[rowidx]) && this.dmlStates[rowidx].type == QUERY_TYPE.INSERT ? true : false;
  }

  isUpdate(rowidx, colidx) {
    let viewCellData = this.getViewData(rowidx, colidx);
    return !_.isUndefined(this.dmlStates[rowidx]) && !_.isUndefined(this.dmlStates[rowidx].data[colidx]) && viewCellData != this.dmlStates[rowidx].data[colidx] ? true : false;
  }

  isDelete(rowidx, colidx) {
    return !_.isUndefined(this.dmlStates[rowidx]) && this.dmlStates[rowidx].type == QUERY_TYPE.DELETE ? true : false;
  }

  redo() {
    let transaction = this.undoBuffer.pop();
    for (let idx in transaction) {
      let query = transaction[idx];
      // do query
    }
  }
}

export { PetraTableObject, SORT_TYPE };
