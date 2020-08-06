<template>
  <v-app>
    <v-form v-model="valid">
      <v-container>
        <v-row>
          <v-col cols="12" md="3">
            <v-text-field
              v-on:keyup.enter="getData"
              v-model="getRows"
              :counter="10"
              label="get rows"
              required
            ></v-text-field>
          </v-col>

          <v-col cols="12" md="2">
            <div class="my-2">
              <v-btn v-on:click="getData" small :loading="isLoading" color="primary">조회</v-btn>
            </div>
          </v-col>

          <v-col cols="12" md="3">Query execute : {{execTime}} ms</v-col>
        </v-row>
        <v-row>
          <v-col cols="12" md="6"></v-col>
          <v-col cols="12" md="2">
            <v-chip outlined color="info">{{drawCount}} / {{fetchCount}} rows</v-chip>
          </v-col>
          <v-col cols="12" md="3">
            <v-text-field v-model="search" v-on:keyup.enter="tableSearch(search)" label="Search"></v-text-field>
          </v-col>
          <v-col cols="12" md="1">
            <v-btn v-on:click="tableSearch(search)" color="secondary">검색</v-btn>
          </v-col>
        </v-row>
        <v-row>
          <v-col cols="12" md="12">
            <div id="scroll-table">
              <v-data-table
                dense
                :height="400"
                :fixed-header="true"
                :loading="isLoading"
                :headers="headers"
                :items="drawData"
                :items-per-page="drawRowSize"
                class="elevation-1"
              ></v-data-table>
            </div>
          </v-col>
        </v-row>

        <v-row>
          <v-col>
            <v-slider v-model="beginIndex" :max="maximumBeginIndex" step="1"></v-slider>
          </v-col>
        </v-row>
      </v-container>
    </v-form>
  </v-app>
</template>

<script>
import axios from "axios";
import db from "../modules/database";

let database = new Array();
let vDatabase = new Array();

export default {
  name: "App",

  components: {},

  data() {
    return {
      isLoading: false,
      getRows: 500,
      beginIndex: 0,
      fetchCount: 0,
      drawCount: 0,
      drawData: [{ sample: null }],
      drawRowSize: 10,
      headers: [{ text: "sample", value: "sample" }],
      execTime: 0,
      search: "",
    };
  },

  watch: {
    beginIndex: function (newIndex) {
      // console.log(`newIndex : ${newIndex}`);
      this.refreshDrawData();
    },
    search: function (newText) {
      // console.log(`newIndex : ${newIndex}`);
      // this.tableSearch(newText);
    },
  },

  methods: {
    async getData() {
      if (this.isLoading) return;
      console.log(`get data start!!`);
      this.isLoading = true;
      let data = await db.getTableByReturnType("object", this.getRows);
      this.headers = await this.getHeaders(data.fields);
      this.fetchCount = data.rowCount;
      this.drawCount = data.rowCount;
      // console.log(this.headers);
      database = data.rows;
      vDatabase = database;

      this.execTime = data.execTime;
      // console.log(this.headers);
      this.setBeginIndex();
      this.setMaximumBeginIndex();
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

    async setMaximumBeginIndex() {
      this.maximumBeginIndex = vDatabase.length - this.drawRowSize;
      if (this.maximumBeginIndex < 0) this.maximumBeginIndex = 0;
      console.log(`this.maximumBeginIndex : ${this.maximumBeginIndex}`);
    },

    async moveBeginIndex(num) {
      this.beginIndex += num;

      if (this.beginIndex <= 0) this.beginIndex = 0;
      if (this.beginIndex > this.maximumBeginIndex)
        this.beginIndex = this.maximumBeginIndex;
    },

    async refreshDrawData() {
      // this.drawData = database.slice(this.beginIndex, this.beginIndex + 10);
      this.drawData = vDatabase.slice(this.beginIndex, this.beginIndex + 10);
    },

    // async refreshDrawData() {
    //   let tmp = new Array();
    //   for (let i = this.beginIndex; i < this.beginIndex + 10; i++)
    //     tmp.push(vDatabase[i]);
    //   this.drawData = tmp;
    // },

    async tableSearch(searchText) {
      console.log(`table search`);

      vDatabase = database.filter((obj) =>
        Object.values(obj).some((val) =>
          val ? val.toString().toLowerCase().includes(searchText) : false
        )
      );
      this.drawCount = vDatabase.length;
      this.setMaximumBeginIndex();
      this.refreshDrawData();
    },

    async tableOrdering() {
      database.sort(function (a, b) {
        return a.seq < b.seq ? -1 : a.seq > b.seq ? 1 : 0;
      });
    },
  },

  mounted() {
    window.addEventListener("keydown", (event) => {
      // event.preventDefault();
      // console.log(`event.keyCode : ${event.keyCode}`);
      // console.log();
      if (event.keyCode === 33) {
        // console.log("Page up");
        event.preventDefault();
        if (event.altKey) this.moveBeginIndex(-this.drawCount);
        if (event.shiftKey) this.moveBeginIndex(-1000);
        else this.moveBeginIndex(-10);
        event.initEvent();
      }
      if (event.keyCode === 34) {
        // console.log("Page down");
        event.preventDefault();
        if (event.altKey) this.moveBeginIndex(this.drawCount);
        else if (event.shiftKey) this.moveBeginIndex(1000);
        else this.moveBeginIndex(10);

        event.initEvent();
      }
      if (event.keyCode === 38) {
        // console.log("Arrow up");
        event.preventDefault();
        this.moveBeginIndex(-3);
        event.initEvent();
      }
      if (event.keyCode === 40) {
        // console.log("Arrow down");
        event.preventDefault();
        this.moveBeginIndex(3);
        event.initEvent();
      }
    });
  },
};
</script>
