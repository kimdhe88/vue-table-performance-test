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
            <div>
              <CustomTable :headers="headers" :items="items"></CustomTable>
            </div>
          </v-col>
        </v-row>

        <v-row>
          <v-col></v-col>
        </v-row>
      </v-container>
    </v-form>
  </v-app>
</template>

<script>
import axios from "axios";
import db from "../modules/database";
import CustomTable from "@/components/custom-table";

export default {
  name: "App",

  components: { CustomTable },

  data() {
    return {
      isLoading: false,
      getRows: 500,
      items: "",
      drawRowSize: 15,
      headers: "",
    };
  },

  methods: {
    async getData() {
      if (this.isLoading) return;
      console.log(`get data start!!`);
      this.isLoading = true;
      let data = await db.getTableByReturnType("object", this.getRows);
      this.headers = await this.getHeaders(data.fields);
      // console.log(this.headers);
      this.items = data.rows;

      this.isLoading = false;
    },

    async getHeaders(fields = Array) {
      let headers = new Array();
      for (let idx = 0; idx < fields.length; idx++) {
        headers[idx] = new Object();
        headers[idx].text = fields[idx];
        headers[idx].value = fields[idx];
        headers[idx].width = "50px";
        headers[idx].fixed = true;
      }
      return headers;
    },
  },
};
</script>


<style>
.text-start {
  overflow-y: hidden !important;
  overflow-x: hidden !important;
  white-space: nowrap !important;
  max-width: 200px !important;
}
</style>