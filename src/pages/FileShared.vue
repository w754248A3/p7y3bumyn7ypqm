<script setup lang="ts">
import { onMounted, ref } from 'vue';

interface SharedFile {
  text: string;
  fileName: string;
  fileBase64Data: string;
}

const fileBinding = ref<SharedFile>({
  text: '',
  fileName: '',
  fileBase64Data: '',
});

const isLoading = ref(false);
const isUploading = ref(false);
const errorMessage = ref('');
const previewName = ref('');

const toBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === 'string') {
        const base64 = result.split(',')[1] ?? '';
        resolve(base64);
      } else {
        reject(new Error('读取文件失败'));
      }
    };
    reader.onerror = () => reject(reader.error ?? new Error('读取文件失败'));
    reader.readAsDataURL(file);
  });

const getBase64Url = (base64Str: string): string =>
  `data:application/octet-stream;base64,${base64Str}`;

const loadFile = async () => {
  try {
    errorMessage.value = '';
    isLoading.value = true;

    const res = await fetch(`/fileshared`, { method: 'GET' });
    if (!res.ok) throw new Error('获取文件失败');

    const data: SharedFile = await res.json();
    data.fileBase64Data = data.fileBase64Data
      ? getBase64Url(data.fileBase64Data)
      : '';
      console.log(data);
    fileBinding.value = data;
  } catch (err: any) {
    errorMessage.value = err?.message ?? '加载失败，请稍后重试';
  } finally {
    isLoading.value = false;
  }
};

const sendFile = async (file: File) => {
  isUploading.value = true;
  errorMessage.value = '';
  previewName.value = file.name;
  try {
    const base64Str = await toBase64(file);
    const res = await fetch('/fileshared', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileName: file.name,
        fileBase64Data: base64Str,
      } as SharedFile),
    });
    if (!res.ok) throw new Error('上传失败');
    await loadFile();
  } catch (err: any) {
    errorMessage.value = err?.message ?? '上传失败，请稍后重试';
  } finally {
    isUploading.value = false;
  }
};

const onFileChange = async (event: Event) => {
  const input = event.target as HTMLInputElement;
  if (input.files && input.files[0]) {
    await sendFile(input.files[0]);
    input.value = '';
  }
};

onMounted(() => {
  loadFile();
});
</script>

<template>
  <div class="file-shared">
    <header class="header">
      <div>
        <p class="title">文件共享</p>
        <p class="subtitle">上传文件并查看最新的共享内容</p>
      </div>
      <label class="upload-btn">
        <input type="file" accept="image/*" @change="onFileChange" />
        <span v-if="isUploading">上传中...</span>
        <span v-else>上传文件</span>
      </label>
    </header>

    <section class="card">
      <div class="card-header">
        <div>
          <p class="card-title">当前共享</p>
          <p class="card-desc">
            {{ fileBinding.fileName ? '最新文件如下' : '暂无文件，请上传' }}
          </p>
        </div>
        <button class="refresh-btn" :disabled="isLoading" @click="loadFile">
          {{ isLoading ? '刷新中...' : '刷新' }}
        </button>
      </div>

      <div v-if="errorMessage" class="alert">
        {{ errorMessage }}
      </div>

      <div v-if="fileBinding.fileBase64Data" class="preview">
        <img
          :src="fileBinding.fileBase64Data"
          :alt="fileBinding.fileName || 'shared file'"
        />
        <div class="preview-info">
          <p class="file-name">{{ fileBinding.fileName }}</p>
          <p class="file-text" v-if="fileBinding.text">{{ fileBinding.text }}</p>
        </div>
      </div>

      <div v-else class="placeholder">
        <p>还没有共享文件，点击右上角上传一个吧。</p>
      </div>

      <div v-if="previewName && isUploading" class="upload-hint">
        正在上传：{{ previewName }}
      </div>
    </section>
  </div>
</template>

<style scoped>
.file-shared {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 20px;
  height: 100%;
  box-sizing: border-box;
  color: #1f2937;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.title {
  margin: 0;
  font-size: 1.4rem;
  font-weight: 700;
}

.subtitle {
  margin: 4px 0 0 0;
  color: #6b7280;
  font-size: 0.95rem;
}

.upload-btn {
  position: relative;
  overflow: hidden;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 10px 16px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: #fff;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.upload-btn input {
  position: absolute;
  inset: 0;
  opacity: 0;
  cursor: pointer;
}

.upload-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 8px 18px rgba(102, 126, 234, 0.35);
}

.card {
  background: #fff;
  border-radius: 16px;
  padding: 16px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 200px;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.card-title {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 700;
}

.card-desc {
  margin: 4px 0 0 0;
  color: #6b7280;
  font-size: 0.92rem;
}

.refresh-btn {
  padding: 8px 14px;
  background: #eef2ff;
  color: #4f46e5;
  border: 1px solid #c7d2fe;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s ease, transform 0.2s ease;
}

.refresh-btn:disabled {
  cursor: not-allowed;
  opacity: 0.7;
}

.refresh-btn:not(:disabled):hover {
  background: #e0e7ff;
  transform: translateY(-1px);
}

.alert {
  padding: 10px 12px;
  background: #fef2f2;
  color: #b91c1c;
  border: 1px solid #fecaca;
  border-radius: 10px;
  font-size: 0.95rem;
}

.preview {
  display: grid;
  grid-template-columns: 160px 1fr;
  gap: 14px;
  align-items: center;
}

.preview img {
  width: 100%;
  border-radius: 12px;
  object-fit: contain;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  max-height: 200px;
}

.preview-info {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.file-name {
  margin: 0;
  font-weight: 700;
  color: #111827;
}

.file-text {
  margin: 0;
  color: #4b5563;
  line-height: 1.5;
}

.placeholder {
  padding: 16px;
  border: 1px dashed #cbd5e1;
  border-radius: 12px;
  color: #6b7280;
  text-align: center;
  background: #f8fafc;
}

.upload-hint {
  font-size: 0.95rem;
  color: #4f46e5;
}

@media (max-width: 768px) {
  .file-shared {
    padding: 16px;
  }

  .header {
    flex-direction: column;
    align-items: flex-start;
  }

  .preview {
    grid-template-columns: 1fr;
  }
}
</style>
