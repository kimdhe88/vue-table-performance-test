<template>
  <v-app>
    <v-form v-model="valid">
      <v-container>
        <v-row>
          <v-col cols="12" md="4">
            <div v-on:click="getString">
              <v-btn small :loading="isLoading" color="primary">get data</v-btn>
            </div>
          </v-col>
          <v-col cols="12" md="4">
            <div v-on:click="getArray">
              <v-btn small :loading="isLoading" color="primary">get data</v-btn>
            </div>
          </v-col>
          <v-col cols="12" md="4">
            <div v-on:click="getObject">
              <v-btn small :loading="isLoading" color="primary">50만건 object</v-btn>
            </div>
          </v-col>
        </v-row>

        <v-row>
          <v-col cols="12" md="4">{{stringSize}}</v-col>
          <v-col cols="12" md="4">{{arraySize}}</v-col>
          <v-col cols="12" md="4">{{objectSize}}</v-col>
        </v-row>
      </v-container>
    </v-form>
  </v-app>
</template>

<script>
import axios from "axios";
import db from "../modules/database";
let database = "";
export default {
  name: "App",

  components: {},

  data() {
    return {
      data: "",
      isLoading: false,
      stringSize: "",
      arraySize: "",
      objectSize: "",
    };
  },

  methods: {
    async getString() {
      console.log("get string start!");
      if (this.isLoading) return;
      this.isLoading = true;
      let data = await db.getTableByReturnType("string");
      console.log(`data.size : ${data.size}`);
      // this.data = data.rows;
      this.stringSize = data.size;
      this.isLoading = false;
    },
    async getArray(type) {
      console.log("get array start!");
      if (this.isLoading) return;
      this.isLoading = true;
      let data = await db.getTableByReturnType("array");
      console.log(`data.size : ${data.size}`);
      // this.data = data.rows;
      this.arraySize = data.size;
      this.isLoading = false;
    },
    async getObject(type) {
      console.log("get object start!");
      if (this.isLoading) return;
      this.isLoading = true;
      let data = await db.getTableByReturnType("object");
      console.log(`data.size : ${data.size}`);
      database = data.rows;
      this.objectSize = data.size;
      this.isLoading = false;
    },
  },
};
</script>
