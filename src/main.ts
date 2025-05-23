// 引入createApp用于创建应用
import {createApp} from 'vue'
// 引入App根组件
import App from './App.vue'
import router from './router'; // 导入路由实例

createApp(App)
  .use(router) // ✅ 必须调用 use(router) 安装路由
  .mount('#app');
