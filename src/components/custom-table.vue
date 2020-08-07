<template>
  <div>
    <table class="table table-dark" border="2px">
      <thead>
        <tr>
          <th scope="col">Id</th>
          <th scope="col">Name</th>
          <th scope="col">Department</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(emp,index) in employee" :key="index" :employee="employee">
          <td>{{ emp.id }}</td>
          <td>{{ emp.name }}</td>
          <td>{{ emp.department }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

