<script setup lang="ts">

</script>

<template>
  <div class="camera-view-container">
    <div class="camera-content">
      <div class="camera-placeholder">
        <div class="camera-icon">📷</div>
        <h2>相机视图</h2>
        <p>相机功能页面</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.camera-view-container {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  width: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.camera-content {
  width: 100%;
  max-width: 800px;
  background: white;
  border-radius: 20px;
  padding: 40px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  text-align: center;
}

.camera-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.camera-icon {
  font-size: 80px;
  animation: pulse 2s ease-in-out infinite;
}

.camera-placeholder h2 {
  margin: 0;
  font-size: 2rem;
  color: #333;
  font-weight: 600;
}

.camera-placeholder p {
  margin: 0;
  font-size: 1.1rem;
  color: #666;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
}

/* 移动端响应式 */
@media (max-width: 768px) {
  .camera-view-container {
    padding: 15px;
  }

  .camera-content {
    padding: 30px 20px;
    border-radius: 16px;
  }

  .camera-icon {
    font-size: 60px;
  }

  .camera-placeholder h2 {
    font-size: 1.5rem;
  }

  .camera-placeholder p {
    font-size: 1rem;
  }
}

@media (max-width: 480px) {
  .camera-view-container {
    padding: 10px;
  }

  .camera-content {
    padding: 20px 15px;
    border-radius: 12px;
  }

  .camera-icon {
    font-size: 50px;
  }

  .camera-placeholder h2 {
    font-size: 1.2rem;
  }

  .camera-placeholder p {
    font-size: 0.9rem;
  }
}
</style>
