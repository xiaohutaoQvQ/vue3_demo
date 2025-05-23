// src/router/index.ts
import { createRouter, createWebHistory } from 'vue-router';
import PdfViewer from '@/components/PdfViewer.vue';

const useRouter = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/:fileName',
      name: 'PdfPreview',
      component: PdfViewer
    }
  ]
});

export default useRouter; // ✅ 使用默认导出