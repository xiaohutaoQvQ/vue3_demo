<template>
  <div class="file-preview-container">
    <!-- 文件信息头部 -->
    <div class="file-header">
      <div class="file-icon">
        <i :class="fileIconClass"></i>
      </div>
      <div class="file-info">
        <h3 class="file-name">{{ fileName }}</h3>
        <p class="file-meta">
          <span>{{ fileSize }}</span>
          <span class="divider">•</span>
          <span>{{ fileMimeType }}</span>
        </p>
      </div>
      <div class="file-actions">
        <button @click="downloadFile" class="action-btn">
          <i class="fa fa-download"></i> 下载
        </button>
        <button @click="closePreview" class="action-btn secondary">
          <i class="fa fa-times"></i> 关闭
        </button>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-indicator">
      <div class="spinner"></div>
      <p>正在加载文件内容...</p>
    </div>

    <!-- 错误状态 -->
    <div v-else-if="error" class="error-message">
      <i class="fa fa-exclamation-triangle"></i>
      <p>{{ errorMessage }}</p>
      <button @click="retryLoad" class="retry-btn">
        <i class="fa fa-refresh"></i> 重试
      </button>
    </div>

    <!-- 预览内容区域 -->
    <div v-else class="preview-content">
      <!-- PDF 预览 -->
      <div v-if="fileType === 'pdf'" class="pdf-preview">
        <embed :src="fileUrl" type="application/pdf" width="100%" height="800px" />
      </div>

      <!-- 图片预览 -->
      <div v-else-if="isImageType" class="image-preview">
        <img :src="fileUrl" :alt="fileName" class="preview-image" 
             @load="handleImageLoad" @error="handleImageError" />
        <div v-if="imageLoaded" class="image-meta">
          <span>{{ imageWidth }} × {{ imageHeight }} 像素</span>
        </div>
      </div>

      <!-- XML/JSON/文本预览 -->
      <div v-else-if="isTextType" class="text-preview">
        <div class="text-toolbar">
          <div class="format-toggle">
            <button @click="toggleFormat" class="format-btn">
              <i class="fa fa-code"></i> {{ formatted ? '原始格式' : '美化格式' }}
            </button>
          </div>
          <div class="search-box">
            <input v-model="searchText" @input="searchTextChanged" 
                   type="text" placeholder="搜索内容..." class="search-input">
            <span v-if="searchResults.length" class="search-results">
              找到 {{ searchResults.length }} 处匹配
            </span>
          </div>
        </div>
        <pre class="code-block" :class="{ 'formatted-code': formatted }">
          {{ displayContent }}
        </pre>
      </div>

      <!-- 视频预览 -->
      <div v-else-if="isVideoType" class="video-preview">
        <video controls width="100%">
          <source :src="fileUrl" :type="fileMimeType" />
          您的浏览器不支持视频播放
        </video>
      </div>

      <!-- 音频预览 -->
      <div v-else-if="isAudioType" class="audio-preview">
        <audio controls>
          <source :src="fileUrl" :type="fileMimeType" />
          您的浏览器不支持音频播放
        </audio>
      </div>

      <!-- 不支持的文件类型 -->
      <div v-else class="unsupported-preview">
        <i class="fa fa-file-o"></i>
        <p>无法预览此文件类型</p>
        <p class="small-text">文件类型: {{ fileType }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue';
import axios from 'axios';
import prettyBytes from 'pretty-bytes'; // 用于格式化文件大小

// 接收的参数
const props = defineProps({
  fileId: { type: String, required: true }, // 文件ID
  fileName: { type: String, required: true }, // 文件名
  fileSize: { type: Number, default: 0 }, // 文件大小（字节）
  fileType: { type: String, required: true }, // 文件类型（扩展名）
  fileUrl: { type: String, default: '' }, // 文件URL（可选，若提供则优先使用）
});

// 状态管理
const loading = ref(false);
const error = ref(false);
const errorMessage = ref('');
const fileContent = ref('');
const displayContent = ref('');
const formatted = ref(false);
const imageWidth = ref(0);
const imageHeight = ref(0);
const imageLoaded = ref(false);
const searchText = ref('');
const searchResults = ref([]);
const currentMatchIndex = ref(0);

// 计算属性：文件扩展名（小写）
const fileExtension = computed(() => {
  return props.fileName.split('.').pop()?.toLowerCase() || '';
});

// 计算属性：格式化后的文件大小
const formattedFileSize = computed(() => {
  return props.fileSize > 0 ? prettyBytes(props.fileSize) : '';
});

// 计算属性：文件MIME类型
const fileMimeType = computed(() => {
  const mimeTypes = {
    pdf: 'application/pdf',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    svg: 'image/svg+xml',
    xml: 'text/xml',
    json: 'application/json',
    txt: 'text/plain',
    html: 'text/html',
    mp4: 'video/mp4',
    webm: 'video/webm',
    mp3: 'audio/mpeg',
    wav: 'audio/wav',
  };
  return mimeTypes[fileExtension.value] || `application/${fileExtension.value}`;
});

// 计算属性：文件图标类
const fileIconClass = computed(() => {
  const iconClasses = {
    pdf: 'fa fa-file-pdf-o text-red-500',
    jpg: 'fa fa-file-image-o text-blue-500',
    jpeg: 'fa fa-file-image-o text-blue-500',
    png: 'fa fa-file-image-o text-blue-500',
    gif: 'fa fa-file-image-o text-blue-500',
    svg: 'fa fa-file-image-o text-blue-500',
    xml: 'fa fa-file-code-o text-green-500',
    json: 'fa fa-file-code-o text-green-500',
    txt: 'fa fa-file-text-o text-gray-500',
    html: 'fa fa-file-code-o text-orange-500',
    mp4: 'fa fa-file-video-o text-purple-500',
    webm: 'fa fa-file-video-o text-purple-500',
    mp3: 'fa fa-file-audio-o text-yellow-500',
    wav: 'fa fa-file-audio-o text-yellow-500',
    default: 'fa fa-file-o text-gray-500',
  };
  return iconClasses[fileExtension.value] || iconClasses.default;
});

// 计算属性：是否为图片类型
const isImageType = computed(() => {
  return ['jpg', 'jpeg', 'png', 'gif', 'svg'].includes(fileExtension.value);
});

// 计算属性：是否为文本类型（可预览的文本内容）
const isTextType = computed(() => {
  return ['xml', 'json', 'txt', 'html', 'md', 'csv', 'js', 'css'].includes(fileExtension.value);
});

// 计算属性：是否为视频类型
const isVideoType = computed(() => {
  return ['mp4', 'webm', 'mov', 'avi'].includes(fileExtension.value);
});

// 计算属性：是否为音频类型
const isAudioType = computed(() => {
  return ['mp3', 'wav', 'ogg', 'flac'].includes(fileExtension.value);
});

// 构建完整的文件URL
const finalFileUrl = computed(() => {
  return props.fileUrl || `${import.meta.env.VITE_BASE_URL}/api/files/download/${props.fileId}`;
});

// 关闭预览
const closePreview = () => {
  emit('close');
};

// 获取文件内容
const fetchFileContent = async () => {
  if (!isTextType.value) return;
  
  loading.value = true;
  error.value = false;
  
  try {
    const response = await axios.get(finalFileUrl.value, {
      responseType: 'text',
    });
    
    fileContent.value = response.data;
    formatContent();
  } catch (err) {
    console.error('获取文件内容失败:', err);
    error.value = true;
    errorMessage.value = '无法加载文件内容';
  } finally {
    loading.value = false;
  }
};

// 格式化内容（针对JSON/XML）
const formatContent = () => {
  if (!fileContent.value) return;
  
  try {
    if (fileExtension.value === 'json') {
      // 格式化JSON
      const parsed = JSON.parse(fileContent.value);
      displayContent.value = formatted.value 
        ? JSON.stringify(parsed, null, 2) 
        : fileContent.value;
    } else if (fileExtension.value === 'xml') {
      // 格式化XML（简单实现）
      if (formatted.value) {
        const formattedXml = formatXml(fileContent.value);
        displayContent.value = formattedXml;
      } else {
        displayContent.value = fileContent.value;
      }
    } else {
      // 其他文本类型直接显示
      displayContent.value = fileContent.value;
    }
  } catch (err) {
    console.warn('格式化内容失败，使用原始内容:', err);
    displayContent.value = fileContent.value;
  }
};

// 简单的XML格式化函数
const formatXml = (xml: string) => {
  const tab = '  ';
  let formatted = '';
  let indent = '';
  
  xml.split(/>\s*</).forEach((node) => {
    if (node.match(/^\/\w/)) {
      indent = indent.substring(tab.length); // 减少缩进
    }
    
    formatted += indent + '<' + node + '>\n';
    
    if (node.match(/^<?\w[^>]*[^\/]$/) && !node.startsWith('<?xml')) {
      indent += tab; // 增加缩进
    }
  });
  
  return formatted.substring(0, formatted.length - 1);
};

// 切换格式化状态
const toggleFormat = () => {
  formatted.value = !formatted.value;
  formatContent();
};

// 下载文件
const downloadFile = () => {
  const link = document.createElement('a');
  link.href = finalFileUrl.value;
  link.download = props.fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// 图片加载成功处理
const handleImageLoad = (event: Event) => {
  const img = event.target as HTMLImageElement;
  imageWidth.value = img.naturalWidth;
  imageHeight.value = img.naturalHeight;
  imageLoaded.value = true;
};

// 图片加载失败处理
const handleImageError = () => {
  error.value = true;
  errorMessage.value = '图片加载失败';
};

// 搜索文本变化
const searchTextChanged = () => {
  if (!searchText.value) {
    searchResults.value = [];
    return;
  }
  
  // 简单的文本搜索实现
  const regex = new RegExp(searchText.value, 'gi');
  const matches = [];
  let match;
  
  while ((match = regex.exec(displayContent.value)) !== null) {
    matches.push({
      start: match.index,
      end: match.index + match[0].length
    });
  }
  
  searchResults.value = matches;
  currentMatchIndex.value = 0;
  
  // 高亮第一个匹配
  highlightCurrentMatch();
};

// 高亮当前匹配项
const highlightCurrentMatch = () => {
  if (searchResults.value.length === 0) return;
  
  // 实际项目中可以使用更复杂的DOM操作来高亮匹配文本
  // 这里简化处理，实际实现可能需要使用mark.js等库
};

// 重试加载
const retryLoad = () => {
  error.value = false;
  fetchFileContent();
};

// 初始化
onMounted(() => {
  if (isTextType.value) {
    fetchFileContent();
  }
});

// 监听props变化，重新加载文件
watch([() => props.fileId, () => props.fileType], () => {
  resetState();
  
  if (isTextType.value) {
    fetchFileContent();
  }
});

// 重置状态
const resetState = () => {
  loading.value = false;
  error.value = false;
  errorMessage.value = '';
  fileContent.value = '';
  displayContent.value = '';
  formatted.value = false;
  imageWidth.value = 0;
  imageHeight.value = 0;
  imageLoaded.value = false;
  searchText.value = '';
  searchResults.value = [];
  currentMatchIndex.value = 0;
};

// 定义抛出事件
const emit = defineEmits(['close']);
</script>

<style scoped>
.file-preview-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
}

.file-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
  margin-bottom: 2rem;
}

.file-icon {
  font-size: 2.5rem;
  margin-right: 1rem;
}

.file-info {
  flex: 1;
}

.file-name {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 500;
  color: #334155;
}

.file-meta {
  margin: 0;
  font-size: 0.9rem;
  color: #64748b;
}

.divider {
  margin: 0 0.5rem;
}

.file-actions {
  display: flex;
  gap: 0.75rem;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1.25rem;
  background-color: #4f46e5;
  color: white;
  border: none;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn:hover {
  background-color: #4338ca;
  transform: translateY(-1px);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.action-btn.secondary {
  background-color: #e2e8f0;
  color: #334155;
}

.action-btn.secondary:hover {
  background-color: #cbd5e1;
}

.loading-indicator {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 6rem 0;
}

.spinner {
  width: 3.5rem;
  height: 3.5rem;
  border: 4px solid #e2e8f0;
  border-radius: 50%;
  border-top-color: #4f46e5;
  animation: spin 1s linear infinite;
  margin-bottom: 1.5rem;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.error-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 6rem 0;
  color: #ef4444;
}

.error-message i {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.retry-btn {
  margin-top: 1.5rem;
  background-color: #f8fafc;
  color: #4f46e5;
  border: 1px solid #e2e8f0;
  border-radius: 0.375rem;
  padding: 0.5rem 1.25rem;
  cursor: pointer;
  transition: all 0.2s;
}

.retry-btn:hover {
  background-color: #f1f5f9;
}

.preview-content {
  min-height: 500px;
}

.pdf-preview embed {
  width: 100%;
  height: 800px;
  border: none;
  border-radius: 8px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.image-preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem 0;
}

.preview-image {
  max-width: 100%;
  max-height: 700px;
  object-fit: contain;
  border-radius: 8px;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease;
}

.preview-image:hover {
  transform: scale(1.01);
}

.image-meta {
  margin-top: 1rem;
  font-size: 0.9rem;
  color: #64748b;
}

.text-preview {
  position: relative;
}

.text-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
  padding: 0.75rem 1rem;
  background-color: #f8fafc;
  border-radius: 8px;
}

.format-toggle {
  display: flex;
  align-items: center;
}

.format-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background-color: #e2e8f0;
  color: #334155;
  border: none;
  border-radius: 0.375rem;
  padding: 0.4rem 1rem;
  cursor: pointer;
  transition: all 0.2s;
}

.format-btn:hover {
  background-color: #cbd5e1;
}

.search-box {
  display: flex;
  align-items: center;
  gap: 1rem;
  position: relative;
}

.search-input {
  padding: 0.4rem 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.375rem;
  width: 250px;
  font-size: 0.9rem;
  transition: border-color 0.2s;
}

.search-input:focus {
  outline: none;
  border-color: #94a3b8;
}

.search-results {
  font-size: 0.85rem;
  color: #64748b;
}

.code-block {
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 0.9rem;
  white-space: pre-wrap;
  margin: 0;
  padding: 1.5rem;
  background-color: #f8fafc;
  border-radius: 8px;
  max-height: 700px;
  overflow: auto;
  line-height: 1.5;
  tab-size: 2;
}

.formatted-code {
  background-color: #f1f5f9;
}

.video-preview video {
  border-radius: 8px;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
}

.audio-preview audio {
  width: 100%;
  margin-top: 2rem;
  border-radius: 9999px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.unsupported-preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 6rem 0;
  color: #64748b;
}

.unsupported-preview i {
  font-size: 4rem;
  margin-bottom: 1.5rem;
  color: #94a3b8;
}

.small-text {
  font-size: 0.875rem;
  margin-top: 0.5rem;
}
</style>