<template>
<!--  <div>Hello {{ dog.id }}</div>-->
  <div>{{ test }}</div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'dog',
  asyncData(context) {
    return { test: context.params.category }
    //return axios.get(`https://api.thedogapi.com/v1/images/${context.params.slug}`)
    //  // eslint-disable-next-line arrow-body-style
    //  .then(({ data }) => {
    //    return { dog: data };
    //  });
  },
};
</script>
