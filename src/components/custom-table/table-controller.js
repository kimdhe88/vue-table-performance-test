async function search(data, searchText, option = { isCaseSensitive: false, property: null }) {
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
}

async function sort(data = Array, propertyName = String, isAscending = true) {
  let sortList;
  if (isAscending) sortList = data.sort((a, b) => (a[propertyName] < b[propertyName] ? -1 : a[propertyName] > b[propertyName] ? 1 : 0));
  else sortList = data.sort((a, b) => (a[propertyName] < b[propertyName] ? 1 : a[propertyName] > b[propertyName] ? -1 : 0));
  return sortList;
}

export default class TableController {
  constructor() {
    this.items = new Array();
    this.view = new Array();
    this.headers = new Array();
  }

  /*
   * setting area
   */
  initializeTable(items) {
    this.items = items;
    Object.assign(this.view, this.items);
    // this.headers = this.refactoringHeaders(headers);
  }

  refactoringHeaders(givenHeader) {
    for (let idx in givenHeader) {
      givenHeader[idx]._colidx = idx;
      givenHeader[idx].alginType = 0;
    }
    this.headers = givenHeader;
    return this.headers;
  }

  getAlginTypeByColumnName(columnName) {
    let alginType;
    for (let idx in this.headers) if (this.headers[idx].name == columnName) header = headers[idx].alginType;
    return alginType;
  }

  /* table controll area */
  async ascendingOrder(columnName) {
    Object.assign(this.view, await sort(this.items, columnName, true));
    // return this.view;
  }

  async descendingOrder(columnName) {
    Object.assign(this.view, await sort(this.items, columnName, false));
    // return this.view;
  }

  async tableSearch(searchText, option = { isCaseSensitive: false, property: null }) {
    Object.assign(this.view, await search(this.items, searchText, option));
    // return this.view;
  }

  getItems() {
    return this.items;
  }

  getView() {
    return this.view;
  }

  getHeaders() {
    return this.headers;
  }

  getColumnNameByIndex(colidx) {
    return this.headers.filter((header) => header._colidx == colidx)[0].name;
  }

  getDataByIndex(rowidx, colidx) {
    let columnName = this.getColumnNameByIndex(colidx);
    return this.view[rowidx][columnName];
  }

  //test
  setViewData(rowidx, columnName, data) {
    this.view[rowidx][columnName] = data;
  }
}
