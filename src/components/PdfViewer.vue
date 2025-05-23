<template>
  <div class="pdf-preview-container">
    <h3 class="mb-4">带水印 PDF 预览</h3>
    <div class="border rounded-lg shadow-md">
      <!-- 直接通过后端接口加载带水印的 PDF -->
      <embed
        :src="pdfUrl"
        type="application/pdf"
        width="100%"
        height="600px"
        class="block"
      />
      <p v-if="!isSupported" class="p-4 text-red-500">
        您的浏览器不支持 PDF 预览，请下载后查看。
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

// 接收参数（可通过路由或父组件传递）
const props = defineProps({
  fileName: { type: String, required: true }, // 文件名（如 sample.pdf）
  watermarkText: { type: String, default: '机密' } // 水印文本
});

// 计算完整的后端 API URL
const pdfUrl = computed(() => {
    const BASE_URL = import.meta.env.VITE_BASE_URL
  return BASE_URL + `/api/files/pdf/${props.fileName}?watermark=${encodeURIComponent(props.watermarkText)}`;
});

// 检测浏览器是否支持 PDF 预览
const isSupported = ref(false);
onMounted(() => {
  isSupported.value = 'PDFViewerApplication' in window;
});
</script>

<style scoped>
.pdf-preview-container {
  max-width: 1000px;
  margin: 0 auto;
  padding: 2rem;
}

embed {
  min-height: 400px;
}

.text-red-500 {
  color: #dc2626;
}
</style>