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
            <v-slider v-model="beginIndex" :max="rowCount - drawRowSize" step="1"></v-slider>
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

let database;

export default {
  name: "App",

  components: {},

  data() {
    return {
      isLoading: false,
      getRows: "50",
      beginIndex: 0,
      rowCount: 0,
      drawData: [{ sample: null }],
      drawRowSize: 10,
      headers: [{ text: "sample", value: "sample" }],
      execTime: "",
    };
  },

  watch: {
    beginIndex: function (newIndex) {
      // console.log(`newIndex : ${newIndex}`);
      this.refreshDrawData();
    },
  },

  methods: {
    async getData() {
      if (this.isLoading) return;
      console.log(`get data start!!`);
      this.isLoading = true;
      let data = await db.getTableByReturnType("object", this.getRows);
      this.headers = await this.getHeaders(data.fields);
      this.rowCount = data.rowCount;
      // console.log(this.headers);
      database = data.rows;
      this.execTime = data.execTime;
      // console.log(this.headers);
      this.setBeginIndex();
      this.refreshDrawData();
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

    async setBeginIndex() {
      this.beginIndex = 0;
    },

    async moveBeginIndex(num) {
      this.beginIndex += num;
      this.maximumBeginIndex = this.rowCount - this.drawRowSize;

      if (this.beginIndex <= 0) this.beginIndex = 0;
      if (this.beginIndex > this.maximumBeginIndex)
        this.beginIndex = this.maximumBeginIndex;
    },

    async refreshDrawData() {
      let drawDataTemp = new Array();
      // for (
      //   let i = this.beginIndex;
      //   i < this.beginIndex + this.drawRowSize;
      //   i++
      // ) {
      //   drawDataTemp.push(database[i]);
      // }
      let tmp = database.slice(this.beginIndex, this.beginIndex + 10);
      // console.log(tmp);
      this.drawData = tmp;
    },
  },
};
</script>
