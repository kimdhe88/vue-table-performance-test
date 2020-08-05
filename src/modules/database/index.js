import axios from "axios";

let defaultHost = "http://192.168.10.243:3000";

async function getObjectData(limit) {
  try {
    let rows = await axios
      .get(`${defaultHost}/api/v1/tables?limit=${limit}`)
      .then((res) => {
        console.log("get data success");
        return res.data;
      })
      .catch((err) => {
        console.log("get data");
        console.log(err);
      });

    return rows;
  } catch (e) {
    throw e;
  }
}

async function getTables(limit) {
  try {
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

export default { getTables };
