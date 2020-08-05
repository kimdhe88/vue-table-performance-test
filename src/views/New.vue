<template>
  <v-app>
    <v-form v-model="valid">
      <v-container>
        <v-row>
          <v-col cols="12" md="4">
            <v-text-field v-model="getRows" :counter="10" label="get rows" required></v-text-field>
          </v-col>

          <v-col cols="12" md="4">
            <div class="my-2" v-on:click="getData">
              <v-btn small :loading="isLoading" color="primary">get data</v-btn>
            </div>
          </v-col>

          <v-col cols="12" md="4">{{execTime}} ms</v-col>
        </v-row>

        <v-row>
          <v-col>
            <div>
              <div>
                <v-data-table
                  :height="600"
                  :fixed-header="true"
                  :loading="isLoading"
                  :headers="headers"
                  :items="drawData"
                  :items-per-page="drawRowSize"
                  class="elevation-1"
                ></v-data-table>
              </div>
            </div>
          </v-col>
        </v-row>
        <v-row>
          <v-col>
            <v-btn color="warning" v-on:click="moveBeginIndex(-rowCount)">처음으로</v-btn>
          </v-col>
          <v-col>
            <v-btn color="success" v-on:click="moveBeginIndex(-10)">Page Up</v-btn>
          </v-col>
          <v-col>
            <v-btn v-on:click="moveBeginIndex(-3)">화살표 (↑)</v-btn>
          </v-col>
          <v-col>
            <v-btn v-on:click="moveBeginIndex(3)">화살표 (↓)</v-btn>
          </v-col>
          <v-col>
            <v-btn color="success" v-on:click="moveBeginIndex(10)">Page Down</v-btn>
          </v-col>
          <v-col>
            <v-btn color="warning" v-on:click="moveBeginIndex(rowCount)">마지막으로</v-btn>
          </v-col>
        </v-row>
      </v-container>
    </v-form>
  </v-app>
</template>

<script>
import axios from "axios";
import db from "../modules/database";

export default {
  name: "App",

  components: {},

  data() {
    return {
      isLoading: false,
      getRows: "50",
      beginIndex: 0,
      rowCount: 0,
      data: null,
      drawData: [{ sample: null }],
      drawRowSize: 10,
      headers: [{ text: "sample", value: "sample" }],
      execTime: "",
    };
  },

  methods: {
    async getData() {
      if (this.isLoading) return;
      console.log(`get data start!!`);
      this.isLoading = true;
      let data = await db.getTables(this.getRows);
      this.headers = await this.getHeaders(data.fields);
      this.rowCount = data.rowCount;
      // console.log(this.headers);
      this.data = data.rows;
      this.execTime = data.execTime;
      // console.log(this.headers);
      await this.moveBeginIndex(0);
      this.isLoading = false;
    },

    async getHeaders(fields = Array) {
      // console.log(fields);
      let headers = new Array();
      for (let idx = 0; idx < fields.length; idx++) {
        headers[idx] = new Object();
        headers[idx].text = fields[idx];
        headers[idx].value = fields[idx];
      }
      // console.log(headers);

      return headers;
    },

    async moveBeginIndex(num) {
      // console.log(`num : ${num}`);
      this.beginIndex += num;
      this.maximumBeginIndex = this.rowCount - this.drawRowSize;

      if (this.beginIndex <= 0) this.beginIndex = 0;
      if (this.beginIndex > this.maximumBeginIndex)
        this.beginIndex = this.maximumBeginIndex;

      // console.log(`this.beginIndex : ${this.beginIndex}`);
      // console.log(`this.maximumBeginIndex : ${this.maximumBeginIndex}`);

      let tmpDrawData = new Array();

      for (
        let i = this.beginIndex;
        i < this.beginIndex + this.drawRowSize;
        i++
      ) {
        let tmpObject = new Object();
        let tmpData = this.data[i];
        // console.log(`tmpData`);
        // console.log(tmpData);
        for (let idx in tmpData) {
          tmpObject[this.headers[idx].value] = tmpData[idx];
        }
        // console.log(`tmpObject`);
        // console.log(tmpObject);
        tmpDrawData.push(tmpObject);
      }
      // console.log(`tmpDrawData`);
      // console.log(tmpDrawData);
      this.drawData = tmpDrawData;
      // console.log("this.drawData");
      // console.log(this.drawData);
    },
  },
};
</script>
