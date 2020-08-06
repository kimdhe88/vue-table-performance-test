import axios from "axios";

let defaultHost = "http://192.168.10.243:3000";

let tableData = new Array();
console.log("init database!!");
/* 
  테스트 소스
*/
function memorySizeOf(obj) {
  var bytes = 0;

  function sizeOf(obj) {
    if (obj !== null && obj !== undefined) {
      switch (typeof obj) {
        case "number":
          bytes += 8;
          break;
        case "string":
          bytes += obj.length * 2;
          break;
        case "boolean":
          bytes += 4;
          break;
        case "object":
          var objClass = Object.prototype.toString.call(obj).slice(8, -1);
          if (objClass === "Object" || objClass === "Array") {
            for (var key in obj) {
              if (!obj.hasOwnProperty(key)) continue;
              sizeOf(obj[key]);
            }
          } else bytes += obj.toString().length * 2;
          break;
      }
    }
    return bytes;
  }

  function formatByteSize(bytes) {
    if (bytes < 1024) return bytes + " bytes";
    else if (bytes < 1048576) return (bytes / 1024).toFixed(3) + " KiB";
    else if (bytes < 1073741824) return (bytes / 1048576).toFixed(3) + " MiB";
    else return (bytes / 1073741824).toFixed(3) + " GiB";
  }

  return formatByteSize(sizeOf(obj));
}

async function getTableByReturnType(type = String, limit = 500000) {
  try {
    let startDate = new Date().getTime();
    let data = await axios
      .get(`${defaultHost}/api/v1/tables?limit=${limit}`)
      .then((res) => {
        return res.data;
      });

    let result = new Object();
    result.fields = new Array();
    for (let idx in data.fields) result.fields.push(data.fields[idx].name);
    // console.log(1);

    let endDate = new Date().getTime();
    result.execTime = endDate - startDate; //두 시간차 계산(단위 ms)
    result.rowCount = data.rowCount;

    if (type === "object") result.rows = data.rows;
    else if (type === "array") result.rows = await rowsToArray(data.rows);
    else if (type === "string") result.rows = JSON.stringify(data.rows);

    console.log("size check");
    console.log(memorySizeOf(result.rows));
    let size = memorySizeOf(result.rows);

    if (type === "object") console.log(`${type} size : ${size}`);
    else if (type === "array") console.log(`${type} size : ${size}`);
    else if (type === "string") console.log(`${type} size : ${size}`);

    result.size = size;

    // tableData.push(result.rows);
    // let tableDatasize = memorySizeOf(tableData);
    // console.log(`tableDatasize : ${tableDatasize}`);

    return result;
  } catch (e) {
    throw e;
  }
}

/* 
  실사용 소스
*/

async function getTables(limit) {
  try {
    console.log(`get tables`);
    let startDate = new Date().getTime();
    let data = await axios
      .get(`${defaultHost}/api/v1/tables?limit=${limit}`)
      .then((res) => {
        console.log("get data success");
        return res.data;
      })
      .catch((err) => {
        console.log("get data");
        console.log(err);
      });

    let result = new Object();
    result.fields = new Array();
    for (let idx in data.fields) result.fields.push(data.fields[idx].name);

    let endDate = new Date().getTime();
    result.execTime = endDate - startDate; //두 시간차 계산(단위 ms)

    startDate = new Date().getTime();
    result.rows = await rowsToArray(data.rows);
    endDate = new Date().getTime();
    console.log(`objec to array time : ${endDate - startDate}`);

    result.rowCount = data.rowCount;

    return result;
  } catch (e) {
    throw e;
  }
}

async function rowsToArray(givenRows = Array) {
  try {
    let rtnArray = new Array();
    let fields = Object.keys(givenRows[0]);
    for (let idx in givenRows) {
      let tmpRows = new Array();
      for (let fIdx in fields) {
        let fieldName = fields[fIdx];
        tmpRows.push(givenRows[idx][fieldName]);
      }
      rtnArray.push(tmpRows);
    }
    return rtnArray;
  } catch (e) {
    throw e;
  }
}

export default { getTableByReturnType, getTables };
