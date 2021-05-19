<template>
  <div id="swagger"></div>
</template>

<script lang="ts">
import SwaggerUI from 'swagger-ui';
import docs from './docs';
import { defineComponent, onMounted } from '@vue/composition-api';
import sl from '@/serviceLocator';

export default defineComponent({
  setup() {
    const store = sl.get('store');
    onMounted(() => {
      SwaggerUI({
        dom_id: '#swagger',
        spec: docs,
        tryItOutEnabled: false,
        requestInterceptor: req => {
          req.headers.Authorization = store.getters.idToken;
          return req;
        },
      });
    });
  },
});
</script>

<style>
.hljs-attr {
  color: white;
}
</style>
