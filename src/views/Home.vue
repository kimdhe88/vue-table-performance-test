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
              label="조회 건수"
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
        <v-row></v-row>

        <v-row>
          <v-col>
            <div>
              <div>
                <v-data-table
                  :height="500"
                  :fixed-header="true"
                  :loading="isLoading"
                  :headers="headers"
                  :items="drawData"
                  :items-per-page="-1"
                  class="elevation-1"
                ></v-data-table>
              </div>
            </div>
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
      nulldata: null,
    };
  },

  methods: {
    async getData() {
      if (this.isLoading) return;
      console.log(`get data start!!`);
      this.isLoading = true;
      let data = await db.getTableByReturnType("object", this.getRows);
      this.headers = await this.getHeaders(data.fields);
      this.rowCount = data.rowCount;
      this.drawData = data.rows;
      this.execTime = data.execTime;
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
  },
};
</script>

