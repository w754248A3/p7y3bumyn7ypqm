<script setup lang="ts">
import { ref, nextTick, onMounted, watch } from 'vue';

interface ResData {
  isOK: boolean;
  message: string;
  obj: any;
}

interface ListData {
  text: string;
  len: number | null;
  target: number | null;
  imgLoaded?: boolean;
  imgSrc?: string;
  imgBlob?: Blob;
  imgFileName?: string;
}

interface MessageItem {
  id: number;
  text: string;
  isImage: boolean;
  imageUrl?: string;
  imageBlob?: Blob;
  fileName?: string;
  timestamp?: string;
  isSent?: boolean;
  imgLoaded?: boolean;
  imgLoading?: boolean; // 是否正在加载
  imgLoadingProgress?: number; // 加载进度 0-100
}

const progress = ref<number>(0);
const is_progress = ref<boolean>(false);
const listViewDataRef = ref<ListData[]>([]);
const errorMessage = ref<string>("");
const showErrorModal = ref<boolean>(false);
const showImageModal = ref<boolean>(false);
const modalImageUrl = ref<string>("");
const modalImageFileName = ref<string>("");
const text_value = ref<string>("");
const messagesContainer = ref<HTMLElement | null>(null);
const fileInputRef = ref<HTMLInputElement | null>(null);
const messages = ref<MessageItem[]>([]);

const imgUrl = "/filelist?action=getMessage&app=fileList&target=";

// 显示错误模态窗口
const showError = (error: string) => {
  errorMessage.value = error;
  showErrorModal.value = true;
};

// 关闭错误模态窗口
const closeErrorModal = () => {
  showErrorModal.value = false;
  errorMessage.value = "";
};

// 显示图片模态窗口
const showImagePreview = (imageUrl: string, fileName: string) => {
  modalImageUrl.value = imageUrl;
  modalImageFileName.value = fileName;
  showImageModal.value = true;
};

// 关闭图片模态窗口
const closeImageModal = () => {
  showImageModal.value = false;
  modalImageUrl.value = "";
  modalImageFileName.value = "";
};

// 滚动到底部
const scrollToBottom = () => {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
  }
};

// 监听消息列表变化，自动滚动到底部
watch(messages, () => {
  nextTick(() => {
    scrollToBottom();
  });
}, { deep: true });

// 加载图片
const loadImage = async (item: MessageItem) => {
  if (item.imgLoaded || !item.isImage || !item.fileName || item.imgLoading) return;
  
  // 记录加载前的滚动状态，防止图片加载后导致滚动跳跃
  const container = messagesContainer.value;
  if (!container) return;
  
  const scrollHeightBefore = container.scrollHeight;
  const scrollTopBefore = container.scrollTop;
  const clientHeightBefore = container.clientHeight;
  const isNearBottom = scrollHeightBefore - scrollTopBefore - clientHeightBefore < 50; // 50px阈值
  
  // 查找消息项
  const msgIndex = messages.value.findIndex(m => m.id === item.id);
  if (msgIndex === -1) return;
  
  const v = messages.value[msgIndex];
  if (!v) {
    console.log("messages.value[msgIndex] is false");
    return;
  }
  
  try {
    const target = listViewDataRef.value.find(p => p.text === item.fileName && p.target !== null && p.target !== undefined)?.target;
    if (target === null || target === undefined) return;

    // 设置加载状态
    v.imgLoading = true;
    v.imgLoadingProgress = 0;

    // 使用 XMLHttpRequest 来获取加载进度
    return new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('GET', imgUrl + target, true);
      xhr.responseType = 'blob';

      // 监听进度事件
      xhr.onprogress = (e) => {
        if (e.lengthComputable && v) {
          const percent = Math.round((e.loaded / e.total) * 100);
          v.imgLoadingProgress = percent;
        }
      };

      // 处理加载完成
      xhr.onload = async () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const blob = xhr.response;
            const fileName = item.fileName || 'image';
            const file = new File([blob], fileName, { type: blob.type });
            const url = URL.createObjectURL(file);
            
            // 更新消息项
            if (v) {
              v.imgLoaded = true;
              v.imgLoading = false;
              v.imgLoadingProgress = 100;
              v.imageUrl = url;
              v.imageBlob = file;
            }
            
            // 更新列表数据
            const listIndex = listViewDataRef.value.findIndex(p => p.text === item.fileName && p.target === target);
            if (listIndex !== -1) {
              const listItem = listViewDataRef.value[listIndex];
              if (listItem) {
                listItem.imgLoaded = true;
                listItem.imgSrc = url;
                listItem.imgBlob = file;
                listItem.imgFileName = fileName;
              }
            }
            
            // 等待DOM更新后调整滚动位置
            await nextTick();
            
            if (container) {
              const scrollHeightAfter = container.scrollHeight;
              const heightDiff = scrollHeightAfter - scrollHeightBefore;
              
              if (isNearBottom) {
                // 如果之前在底部附近，保持滚动到底部
                scrollToBottom();
              } else if (heightDiff > 0) {
                // 如果不在底部，增加滚动位置以保持视觉位置
                container.scrollTop = scrollTopBefore + heightDiff;
              }
            }
            
            resolve();
          } catch (error) {
            if (v) {
              v.imgLoading = false;
              v.imgLoadingProgress = 0;
            }
            reject(error);
          }
        } else {
          if (v) {
            v.imgLoading = false;
            v.imgLoadingProgress = 0;
          }
          reject(new Error(`加载图片失败: HTTP ${xhr.status}`));
        }
      };

      // 处理错误
      xhr.onerror = () => {
        if (v) {
          v.imgLoading = false;
          v.imgLoadingProgress = 0;
        }
        reject(new Error('网络错误'));
      };

      xhr.send();
    });
  } catch (error) {
    if (v) {
      v.imgLoading = false;
      v.imgLoadingProgress = 0;
    }
    showError(`加载图片失败: ${error instanceof Error ? error.message : String(error)}`);
  }
};

// 点击图片显示模态窗口
const handleImageClick = (item: MessageItem) => {
  if (item.imageUrl && item.fileName) {
    showImagePreview(item.imageUrl, item.fileName);
  }
};

// 下载图片
const downloadImage = (imageUrl: string, fileName: string) => {
  const link = document.createElement('a');
  link.href = imageUrl;
  link.download = fileName;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// 将 ListData 转换为 MessageItem
const convertListDataToMessage = (item: ListData, index: number): MessageItem => {
  const isImage = item.target !== null && item.len !== null && 
                 item.target !== undefined && item.len !== undefined &&
                 typeof item.target === 'number' && typeof item.len === 'number';
  return {
    id: index,
    text: item.text || '',
    isImage: isImage,
    imageUrl: item.imgSrc,
    imageBlob: item.imgBlob,
    fileName: isImage ? (item.text || 'image') : undefined,
    timestamp: new Date().toLocaleTimeString(),
    isSent: index % 2 === 0,
    imgLoaded: item.imgLoaded || false,
    imgLoading: false,
    imgLoadingProgress: 0,
  };
};

// 添加新消息到列表
const addMessageToList = (data: ListData) => {
  // 添加到 listViewDataRef
  listViewDataRef.value.push(data);
  
  // 计算新的索引
  const newIndex = listViewDataRef.value.length - 1;
  
  // 转换为消息并添加到 messages
  const newMessage = convertListDataToMessage(data, newIndex);
  messages.value.push(newMessage);
  
  // 滚动到底部
  nextTick(() => {
    scrollToBottom();
  });
};

// 获取列表数据
const getListData = async () => {
  try {
    const res = await fetch("/filelist?action=getMessage&app=fileList");
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const resdata: ResData = await res.json();
    console.log(resdata);
    
    if (resdata.isOK === false) {
      const e = "获取消息列表失败: " + JSON.stringify(resdata);
      showError(e);
      return;
    }

    listViewDataRef.value = resdata.obj || [];
    
    // 转换为消息格式
    messages.value = listViewDataRef.value.map((item, index) => {
      return convertListDataToMessage(item, index);
    });
  } catch (error) {
    showError(`获取消息列表失败: ${error instanceof Error ? error.message : String(error)}`);
  }
};

// 上传文件（带进度）
function postWithProgress(url: string, formData: FormData, onProgress: (v: number) => void) {
  is_progress.value = true;
  progress.value = 0;
  
  return new Promise<ResData>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.responseType = "json";

    xhr.upload.onprogress = e => {
      if (e.lengthComputable) {
        const percent = (e.loaded / e.total * 100);
        onProgress(percent);
      }
    };

    xhr.onload = () => {
      is_progress.value = false;
      if (xhr.status >= 200 && xhr.status < 300) {
        if (!xhr.response) {
          reject(new Error("HTTP 响应为空"));
        } else {
          resolve(xhr.response);
        }
      } else {
        reject(new Error(`HTTP ${xhr.status}`));
      }
    };

    xhr.onerror = () => {
      is_progress.value = false;
      reject(new Error("网络错误"));
    };

    xhr.send(formData);
  });
}

// 发送文本
const postText = async () => {
  const text = text_value.value.trim();
  if (!text) {
    showError("文本内容不能为空");
    return;
  }

  try {
    const fd = new FormData();
    fd.append("text", text);

    const resData: ResData = await postWithProgress("/filelist?action=sendMessage&app=fileList", fd, (n) => {
      progress.value = n;
    });
    console.log(resData);
    if (resData.isOK === false) {
      const e = "发送文本失败: " + JSON.stringify(resData);
      showError(e);
      return;
    }
    
    // 返回的数据只有text,len,target
    // 根据返回的内容更新ui就不需要每次都调用getListData
    const data: ListData = resData.obj;
    if (data) {
      console.log(data);
      // 初始化数据
      data.imgLoaded = false;
      addMessageToList(data);
    }

    text_value.value = "";
  } catch (error) {
    showError(`发送文本失败: ${error instanceof Error ? error.message : String(error)}`);
  }
};

// 文件选择处理
const onFileChange = async (event: Event) => {
  const input = event.target as HTMLInputElement;
  if (input.files && input.files[0]) {
    const file = input.files[0];

    // 检查是否是图片
    if (!file.type.startsWith('image/')) {
      showError("请选择图片文件");
      input.value = "";
      return;
    }

    try {
      const fd = new FormData();
      fd.append("text", file.name);
      fd.append("file", file);

      const resData: ResData = await postWithProgress("/filelist?action=sendMessage&app=fileList", fd, (n) => {
        progress.value = n;
      });
      console.log(resData);
      if (resData.isOK === false) {
        const e = "上传文件失败: " + JSON.stringify(resData);
        showError(e);
        return;
      }
      
      // 返回的数据只有text,len,target
      // 根据返回的内容更新ui就不需要每次都调用getListData
      const data: ListData = resData.obj;
      if (data) {
        console.log(data);
        // 初始化数据，图片需要点击加载
        data.imgLoaded = false;
        addMessageToList(data);
      }
      
      // 清空文件输入
      if (input) {
        input.value = "";
      }
    } catch (error) {
      showError(`上传文件失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
};

// 触发文件选择
const triggerFileSelect = () => {
  if (fileInputRef.value) {
    fileInputRef.value.click();
  }
};

// 删除所有数据
const deleteData = async () => {
  if (!confirm("确定要删除所有消息吗？")) {
    return;
  }

  try {
    const res = await fetch("/filelist?action=deleteMessage&app=fileList", {
      method: "DELETE"
    });
    
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    
    const resdata: ResData = await res.json();
    console.log(resdata);
    
    if (resdata.isOK === false) {
      const e = "删除消息失败: " + JSON.stringify(resdata);
      showError(e);
      return;
    }

    await getListData();
  } catch (error) {
    showError(`删除消息失败: ${error instanceof Error ? error.message : String(error)}`);
  }
};

// 回车发送消息（Shift+Enter换行）
const handleKeyDown = (event: KeyboardEvent) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    postText();
  }
};

// 处理输入框聚焦
const handleInputFocus = () => {
  setTimeout(() => {
    if (messagesContainer.value) {
      scrollToBottom();
    }
  }, 300);
};

onMounted(() => {
  getListData();
});
</script>

<template>
  <div class="chat-container">
    <!-- 聊天消息区域 -->
    <div class="messages-wrapper" ref="messagesContainer">
      <div class="messages-container">
        <div
          v-for="(message, index) in messages"
          :key="message.id || index"
          :class="['message', message.isSent ? 'message-sent' : 'message-received']"
        >
          <div class="message-bubble">
            <!-- 文本消息 -->
            <p v-if="!message.isImage" class="message-text">{{ message.text }}</p>
            
            <!-- 图片消息 -->
            <div v-else class="image-message">
              <div class="image-info">
                <p class="image-filename">{{ message.fileName }}</p>
                <span class="message-time">{{ message.timestamp || '刚刚' }}</span>
              </div>
              
              <!-- 加载中，显示进度条 -->
              <div v-if="message.imgLoading" class="image-loading-container">
                <div class="image-placeholder loading-placeholder">
                  <div class="placeholder-content">
                    <span class="placeholder-icon">⏳</span>
                    <div class="loading-progress-bar">
                      <div class="loading-progress-fill" :style="{ width: (message.imgLoadingProgress || 0) + '%' }"></div>
                    </div>
                    <span class="placeholder-text">{{ message.imgLoadingProgress || 0 }}%</span>
                  </div>
                </div>
              </div>
              
              <!-- 未加载时显示占位符 -->
              <div v-else-if="!message.imgLoaded" class="image-placeholder" @click="loadImage(message)">
                <div class="placeholder-content">
                  <span class="placeholder-icon">🖼️</span>
                  <span class="placeholder-text">点击加载图片</span>
                </div>
              </div>
              
              <!-- 已加载的图片 -->
              <div v-else-if="message.imageUrl" class="image-container">
                <img
                  :src="message.imageUrl"
                  :alt="message.fileName || '图片'"
                  :title="message.fileName || '图片'"
                  class="message-image"
                  @click="handleImageClick(message)"
                  @error="() => showError('图片加载失败')"
                />
              </div>
              
              <!-- 加载失败的情况 -->
              <div v-else class="image-placeholder error-placeholder">
                <div class="placeholder-content">
                  <span class="placeholder-icon">❌</span>
                  <span class="placeholder-text">加载失败</span>
                </div>
              </div>
            </div>
            
            <!-- 文本消息的时间戳 -->
            <span v-if="!message.isImage" class="message-time">{{ message.timestamp || '刚刚' }}</span>
          </div>
        </div>
        
        <div v-if="messages.length === 0" class="empty-state">
          <p>还没有消息，开始聊天吧！</p>
        </div>
      </div>
    </div>

    <!-- 上传进度条 -->
    <div v-if="is_progress" class="progress-container">
      <div class="progress-bar">
        <div class="progress-fill" :style="{ width: progress + '%' }"></div>
      </div>
      <span class="progress-text">{{ Math.round(progress) }}%</span>
    </div>

    <!-- 输入区域 -->
    <div class="input-container">
      <div class="input-wrapper">
        <textarea
          v-model="text_value"
          class="message-input"
          placeholder="输入消息... (Shift+Enter 换行)"
          rows="1"
          @keydown="handleKeyDown"
          @focus="handleInputFocus"
          @input="(e) => {
            const target = e.target as HTMLTextAreaElement;
            target.style.height = 'auto';
            target.style.height = Math.min(target.scrollHeight, 120) + 'px';
          }"
        ></textarea>
        
        <input
          ref="fileInputRef"
          type="file"
          accept="image/*"
          @change="onFileChange"
          style="display: none;"
        />
        
        <button
          type="button"
          class="action-button image-button"
          @click="triggerFileSelect"
          title="选择图片"
        >
          <span class="button-icon">📷</span>
        </button>
        
        <button
          type="button"
          class="send-button"
          @click="postText"
          :disabled="!text_value.trim()"
        >
          <span class="send-icon">📤</span>
                  <span class="send-text">发送</span>
        </button>
        
        <button
          type="button"
          class="action-button refresh-button"
          @click="getListData"
          title="刷新消息"
        >
          <span class="button-icon">🔄</span>
        </button>
        
        <button
          type="button"
          class="action-button delete-button"
          @click="deleteData"
          title="删除所有消息"
        >
          <span class="button-icon">🗑️</span>
        </button>
      </div>
    </div>

    <!-- 错误模态窗口 -->
    <div v-if="showErrorModal" class="modal-overlay" @click="closeErrorModal">
      <div class="modal-content error-modal" @click.stop>
        <div class="modal-header">
          <h3>错误</h3>
          <button class="modal-close" @click="closeErrorModal">×</button>
        </div>
        <div class="modal-body">
          <p>{{ errorMessage }}</p>
        </div>
        <div class="modal-footer">
          <button class="modal-button" @click="closeErrorModal">确定</button>
        </div>
      </div>
    </div>

    <!-- 图片预览模态窗口 -->
    <div v-if="showImageModal" class="modal-overlay" @click="closeImageModal">
      <div class="modal-content image-modal" @click.stop>
        <div class="modal-header">
          <h3>{{ modalImageFileName }}</h3>
          <div class="modal-actions">
            <button
              class="modal-button download-button"
              @click="downloadImage(modalImageUrl, modalImageFileName)"
              title="下载图片"
            >
              <span class="download-icon">💾</span>
              <span class="download-text">下载</span>
            </button>
            <button class="modal-close" @click="closeImageModal">×</button>
          </div>
        </div>
        <div class="modal-body image-modal-body">
          <img
            :src="modalImageUrl"
            :alt="modalImageFileName"
            :title="modalImageFileName"
            class="modal-image"
            @click.stop
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.chat-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  background: #f0f2f5;
  overflow: hidden;
}

.messages-wrapper {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 20px;
  background: linear-gradient(to bottom, #e5ddd5 0%, #e5ddd5 50%, #d2d2d2 100%);
  background-image: 
    repeating-linear-gradient(
      0deg,
      transparent,
      transparent 2px,
      rgba(0, 0, 0, 0.03) 2px,
      rgba(0, 0, 0, 0.03) 4px
    );
  -webkit-overflow-scrolling: touch;
}

.messages-container {
  max-width: 800px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.message {
  display: flex;
  animation: fadeIn 0.3s ease-in;
}

.message-sent {
  justify-content: flex-end;
}

.message-received {
  justify-content: flex-start;
}

.message-bubble {
  max-width: 70%;
  padding: 12px 16px;
  border-radius: 18px;
  position: relative;
  word-wrap: break-word;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.message-sent .message-bubble {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-bottom-right-radius: 4px;
}

.message-received .message-bubble {
  background: white;
  color: #333;
  border-bottom-left-radius: 4px;
}

.message-text {
  margin: 0;
  font-size: 15px;
  line-height: 1.4;
  word-break: break-word;
}

.message-time {
  display: block;
  font-size: 11px;
  opacity: 0.7;
  margin-top: 4px;
  text-align: right;
}

.message-received .message-time {
  text-align: left;
}

.image-message {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.image-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.image-filename {
  margin: 0;
  font-size: 14px;
  font-weight: 500;
  word-break: break-word;
}

.image-placeholder {
  width: 200px;
  height: 150px;
  border: 2px dashed rgba(255, 255, 255, 0.5);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  background: rgba(255, 255, 255, 0.1);
}

.message-received .image-placeholder {
  border-color: rgba(0, 0, 0, 0.2);
  background: rgba(0, 0, 0, 0.05);
}

.image-placeholder:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: scale(1.02);
}

.message-received .image-placeholder:hover {
  background: rgba(0, 0, 0, 0.1);
}

.error-placeholder {
  border-color: rgba(255, 0, 0, 0.3);
  background: rgba(255, 0, 0, 0.05);
  cursor: default;
}

.error-placeholder:hover {
  transform: none;
}

.loading-placeholder {
  cursor: default;
  pointer-events: none;
}

.loading-placeholder:hover {
  transform: none;
  background: rgba(255, 255, 255, 0.1);
}

.message-received .loading-placeholder:hover {
  background: rgba(0, 0, 0, 0.05);
}

.image-loading-container {
  width: 200px;
  height: 150px;
}

.loading-progress-bar {
  width: 150px;
  height: 4px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 2px;
  overflow: hidden;
  margin: 8px 0;
}

.message-received .loading-progress-bar {
  background: rgba(0, 0, 0, 0.1);
}

.loading-progress-fill {
  height: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  transition: width 0.3s ease;
  border-radius: 2px;
}

.placeholder-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  opacity: 0.7;
}

.placeholder-icon {
  font-size: 32px;
}

.placeholder-text {
  font-size: 12px;
}

.image-container {
  max-width: 300px;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.image-container:hover {
  transform: scale(1.02);
}

.message-image {
  width: 100%;
  height: auto;
  max-height: 300px;
  object-fit: contain;
  display: block;
  border-radius: 8px;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #999;
  font-size: 14px;
}

.progress-container {
  background: white;
  border-top: 1px solid #e0e0e0;
  padding: 8px 20px;
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

.progress-bar {
  flex: 1;
  height: 6px;
  background: #e0e0e0;
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 12px;
  color: #666;
  min-width: 40px;
  text-align: right;
}

.input-container {
  background: white;
  border-top: 1px solid #e0e0e0;
  padding: 15px 20px;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);
  flex-shrink: 0;
  position: relative;
  z-index: 10;
}

.input-wrapper {
  max-width: 800px;
  margin: 0 auto;
  display: flex;
  gap: 8px;
  align-items: flex-end;
}

.message-input {
  flex: 1;
  padding: 12px 16px;
  border: 2px solid #e0e0e0;
  border-radius: 24px;
  font-size: 15px;
  font-family: inherit;
  resize: none;
  outline: none;
  transition: all 0.3s ease;
  max-height: 120px;
  overflow-y: auto;
  background: #f8f9fa;
  color: #333;
  line-height: 1.5;
}

.message-input:focus {
  border-color: #667eea;
  background: white;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.message-input::placeholder {
  color: #999;
  opacity: 1;
}

.action-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  padding: 0;
  border: 2px solid #e0e0e0;
  border-radius: 50%;
  background: #f8f9fa;
  cursor: pointer;
  transition: all 0.3s ease;
  flex-shrink: 0;
}

.action-button:hover {
  border-color: #667eea;
  background: white;
  transform: translateY(-2px);
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.2);
}

.action-button .button-icon {
  font-size: 20px;
}

.send-button {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 12px 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 24px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
  white-space: nowrap;
  flex-shrink: 0;
}

.send-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.send-button:active:not(:disabled) {
  transform: translateY(0);
}

.send-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.send-icon {
  font-size: 16px;
}

.send-text {
  font-size: 15px;
}

/* 模态窗口样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.2s ease;
}

.modal-content {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  max-width: 90vw;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  animation: slideUp 0.3s ease;
}

.error-modal {
  max-width: 500px;
  width: 90%;
}

.image-modal {
  max-width: 95vw;
  max-height: 95vh;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px;
  border-bottom: 1px solid #e0e0e0;
  gap: 12px;
}

.modal-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.download-button {
  padding: 8px 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 6px;
}

.download-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.download-icon {
  font-size: 16px;
}

.download-text {
  font-size: 14px;
}

.modal-close {
  background: none;
  border: none;
  font-size: 28px;
  color: #999;
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.modal-close:hover {
  background: #f0f0f0;
  color: #333;
}

.modal-body {
  padding: 20px;
  overflow-y: auto;
  flex: 1;
}

.error-modal .modal-body {
  max-height: 400px;
}

.image-modal-body {
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  max-height: calc(95vh - 80px);
}

.modal-image {
  max-width: 100%;
  max-height: calc(95vh - 80px);
  object-fit: contain;
  display: block;
}

.modal-footer {
  padding: 15px 20px;
  border-top: 1px solid #e0e0e0;
  display: flex;
  justify-content: flex-end;
}

.modal-button {
  padding: 10px 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.modal-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 移动端响应式 */
@media (max-width: 768px) {
  .chat-container {
    height: 100%;
    min-height: 0;
  }

  .messages-wrapper {
    padding: 15px 12px;
    min-height: 0;
    flex: 1 1 auto;
  }

  .message-bubble {
    max-width: 85%;
    padding: 10px 14px;
  }

  .message-text {
    font-size: 14px;
  }

  .image-placeholder {
    width: 150px;
    height: 120px;
  }

  .image-loading-container {
    width: 150px;
    height: 120px;
  }

  .loading-progress-bar {
    width: 120px;
  }

  .image-container {
    max-width: 250px;
  }

  .message-image {
    max-height: 250px;
  }

  .input-container {
    padding: 12px 15px;
    padding-bottom: calc(12px + env(safe-area-inset-bottom));
  }

  .input-wrapper {
    gap: 6px;
  }

  .message-input {
    padding: 10px 14px;
    font-size: 14px;
  }

  .action-button {
    width: 40px;
    height: 40px;
  }

  .action-button .button-icon {
    font-size: 18px;
  }

  .send-button {
    padding: 10px 20px;
    font-size: 14px;
  }

  .send-text {
    display: none;
  }

  .send-icon {
    font-size: 18px;
  }
  
  .download-text {
    display: none;
  }
  
  .download-icon {
    font-size: 18px;
  }
}

@media (max-width: 480px) {
  .chat-container {
    height: 100%;
    min-height: 0;
  }

  .messages-wrapper {
    padding: 12px 10px;
    min-height: 0;
    flex: 1 1 auto;
  }

  .message-bubble {
    max-width: 90%;
    padding: 8px 12px;
  }

  .message-text {
    font-size: 13px;
  }

  .message-time {
    font-size: 10px;
  }

  .image-placeholder {
    width: 120px;
    height: 100px;
  }

  .image-loading-container {
    width: 120px;
    height: 100px;
  }

  .loading-progress-bar {
    width: 100px;
  }

  .placeholder-icon {
    font-size: 24px;
  }

  .placeholder-text {
    font-size: 10px;
  }

  .image-container {
    max-width: 200px;
  }

  .message-image {
    max-height: 200px;
  }

  .input-container {
    padding: 10px 12px;
    padding-bottom: calc(10px + env(safe-area-inset-bottom));
  }

  .input-wrapper {
    gap: 4px;
  }

  .message-input {
    padding: 8px 12px;
    font-size: 13px;
  }

  .action-button {
    width: 36px;
    height: 36px;
  }

  .action-button .button-icon {
    font-size: 16px;
  }

  .send-button {
    padding: 8px 16px;
    min-width: 44px;
  }
  
  .download-text {
    display: none;
  }
  
  .download-button {
    padding: 6px 12px;
  }
  
  .download-icon {
    font-size: 16px;
  }
}

/* 滚动条样式 */
.messages-wrapper::-webkit-scrollbar {
  width: 6px;
}

.messages-wrapper::-webkit-scrollbar-track {
  background: transparent;
}

.messages-wrapper::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 3px;
}

.messages-wrapper::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.3);
}
</style>
