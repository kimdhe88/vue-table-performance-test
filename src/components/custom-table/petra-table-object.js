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

class PetraTableObject {
  constructor() {
    this.items = new Array();
    this.headers = new Array();
    this.view = new Array();
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
}

const TASK_TYPE = { INSERT: "insert", UPDATE: "update", DELETE: "delete" };
class task {
  constructor() {
    this.type = TASK_TYPE.INSERT;
    this.rowidx = 0;
    this.data = { colidx: 0, value: "" };
  }
}

class PetraTableTransaction {
  constructor() {
    redoBuffer = new Array();
    undoBuffer = new Array();
  }

  dp() {}

  undo() {}

  redo() {}
}

export { PetraTableObject, SORT_TYPE };
