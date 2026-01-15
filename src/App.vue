<script setup lang="ts">
import { ref, shallowRef } from 'vue';
import TextMessage from './pages/TextMessage.vue';
import CameraView from './pages/CameraView.vue';
import FileShared from './pages/FileShared.vue';

// 定义页面配置接口
interface PageConfig {
  name: string;
  component: any;
  icon?: string;
}

// 页面列表配置
const pages: PageConfig[] = [
  { name: '文本消息', component: TextMessage, icon: '💬' },
  { name: '相机视图', component: CameraView, icon: '📷' },
  { name: '文件共享', component: FileShared, icon: '📁' },
  { name:"文件列表",  component:FileList, icon:'📁'}
];

if (!pages[0]) {

  throw new Error("No pages configured!");
}

const currentPageIndex = ref(0);
// 当前显示的组件
const currentComponent = shallowRef(pages[0].component);
const switchPage = (index: number) => {
  if (pages[index]) {
    currentPageIndex.value = index;
    currentComponent.value = pages[index].component;
  }
};

</script>

<template>
  <div class="app-container">
    <!-- 导航侧边栏 -->
    <aside class="sidebar">
      <h2 class="sidebar-title">功能列表</h2>
      <nav class="nav-list">
        <button v-for="(page, index) in pages" :key="index"
          :class="['nav-item', { active: currentPageIndex === index }]" @click="switchPage(index)">
          <span class="nav-icon">{{ page.icon }}</span>
          <span class="nav-text">{{ page.name }}</span>
        </button>
      </nav>
    </aside>

    <!-- 主内容区 -->
    <main class="main-content">
      <component :is="currentComponent" />
    </main>
  </div>
</template>

<style scoped>
.app-container {
  display: flex;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
}

.sidebar {
  width: 250px;
  background: linear-gradient(180deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 20px;
  box-shadow: 2px 0 10px rgba(0, 0, 0, 0.1);
  overflow-y: auto;
  flex-shrink: 0;
}

.sidebar-title {
  margin: 0 0 20px 0;
  font-size: 1.5rem;
  font-weight: 600;
  text-align: center;
  padding-bottom: 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
}

.nav-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 15px 20px;
  background: rgba(255, 255, 255, 0.1);
  border: none;
  border-radius: 12px;
  color: white;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: left;
  width: 100%;
}

.nav-item:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: translateX(5px);
}

.nav-item.active {
  background: rgba(255, 255, 255, 0.25);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  font-weight: 600;
}

.nav-icon {
  font-size: 1.3rem;
}

.nav-text {
  flex: 1;
}

.main-content {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  background: #f5f5f5;
  display: flex;
  flex-direction: column;
}

/* 移动端响应式 */
@media (max-width: 768px) {
  .app-container {
    flex-direction: column;
    height: 100vh;
    height: 100dvh; /* 使用动态视口高度，考虑移动端浏览器UI */
  }

  .sidebar {
    width: 100%;
    height: auto;
    max-height: none;
    flex-shrink: 0;
    padding: 15px;
  }

  .sidebar-title {
    font-size: 1.2rem;
    margin-bottom: 15px;
    padding-bottom: 15px;
  }

  .nav-list {
    flex-direction: row;
    overflow-x: auto;
    gap: 8px;
    padding-bottom: 5px;
    -webkit-overflow-scrolling: touch;
  }

  .nav-item {
    flex-shrink: 0;
    padding: 12px 16px;
    min-width: 120px;
    justify-content: center;
  }

  .nav-text {
    display: none;
  }

  .nav-icon {
    font-size: 1.5rem;
  }

  .main-content {
    flex: 1;
    min-height: 0;
    overflow: hidden;
  }
}

@media (max-width: 480px) {
  .app-container {
    height: 100vh;
    height: 100dvh;
  }

  .sidebar {
    padding: 10px;
  }

  .sidebar-title {
    font-size: 1rem;
    margin-bottom: 10px;
    padding-bottom: 10px;
  }

  .nav-item {
    padding: 10px 12px;
    min-width: 80px;
  }

  .main-content {
    flex: 1;
    min-height: 0;
  }
}
</style>
