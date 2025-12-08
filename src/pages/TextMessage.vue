<script setup lang="ts">
import { ref, nextTick, onMounted, watch } from 'vue';

interface Message {
  id?: number;
  text: string;
  timestamp?: string;
  isSent?: boolean;
}

const getMessage = async () => {
  const res = await fetch('/sql?app=TextMessage&action=getMessage', {
    method: 'GET',
  });

  const data = await res.json();
  
  // 将数据转换为消息格式，假设数据是字符串数组或对象数组
  if (Array.isArray(data)) {
    textList.value = data.map((item, index) => {
      if (typeof item === 'string') {
        return {
          id: index,
          text: item,
          timestamp: new Date().toLocaleTimeString(),
          isSent: index % 2 === 0, // 简单示例：交替显示为发送/接收
        };
      }
      return {
        id: item.id || index,
        text: item.text || item,
        timestamp: item.timestamp || new Date().toLocaleTimeString(),
        isSent: item.isSent !== undefined ? item.isSent : index % 2 === 0,
      };
    });
  }
  
  // 滚动到底部
  await nextTick();
  scrollToBottom();
};

const sendMessage = async (message: string) => {
  if (!message.trim()) return;
  
  await fetch('/sql?app=TextMessage&action=sendMessage', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text: message })
  });

  inputText.value = '';
  getMessage();
};

const textList = ref<Array<Message>>([]);
const inputText = ref<string>('');
const messagesContainer = ref<HTMLElement | null>(null);

const scrollToBottom = () => {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
  }
};

// 监听消息列表变化，自动滚动到底部
watch(textList, () => {
  nextTick(() => {
    scrollToBottom();
  });
}, { deep: true });

// 回车发送消息（Shift+Enter换行）
const handleKeyDown = (event: KeyboardEvent) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    sendMessage(inputText.value);
  }
};

onMounted(() => {
  getMessage();
});
</script>

<template>
  <div class="chat-container">
    <!-- 聊天消息区域 -->
    <div class="messages-wrapper" ref="messagesContainer">
      <div class="messages-container">
        <div
          v-for="(message, index) in textList"
          :key="message.id || index"
          :class="['message', message.isSent ? 'message-sent' : 'message-received']"
        >
          <div class="message-bubble">
            <p class="message-text">{{ message.text }}</p>
            <span class="message-time">{{ message.timestamp || '刚刚' }}</span>
          </div>
        </div>
        <div v-if="textList.length === 0" class="empty-state">
          <p>还没有消息，开始聊天吧！</p>
        </div>
      </div>
    </div>

    <!-- 输入区域 -->
    <div class="input-container">
      <div class="input-wrapper">
        <textarea
          v-model="inputText"
          class="message-input"
          placeholder="输入消息... (Shift+Enter 换行)"
          rows="1"
          @keydown="handleKeyDown"
          @input="(e) => {
            const target = e.target as HTMLTextAreaElement;
            target.style.height = 'auto';
            target.style.height = Math.min(target.scrollHeight, 120) + 'px';
          }"
        ></textarea>
        <button
          type="button"
          class="send-button"
          @click="sendMessage(inputText)"
          :disabled="!inputText.trim()"
        >
          <span class="send-icon">📤</span>
          <span class="send-text">发送</span>
        </button>
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
  flex: 1;
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

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #999;
  font-size: 14px;
}

.input-container {
  background: white;
  border-top: 1px solid #e0e0e0;
  padding: 15px 20px;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);
}

.input-wrapper {
  max-width: 800px;
  margin: 0 auto;
  display: flex;
  gap: 12px;
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
}

.message-input:focus {
  border-color: #667eea;
  background: white;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
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

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 移动端响应式 */
@media (max-width: 768px) {
  .messages-wrapper {
    padding: 15px 12px;
  }

  .message-bubble {
    max-width: 85%;
    padding: 10px 14px;
  }

  .message-text {
    font-size: 14px;
  }

  .input-container {
    padding: 12px 15px;
  }

  .input-wrapper {
    gap: 10px;
  }

  .message-input {
    padding: 10px 14px;
    font-size: 14px;
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
}

@media (max-width: 480px) {
  .messages-wrapper {
    padding: 12px 10px;
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

  .input-container {
    padding: 10px 12px;
  }

  .input-wrapper {
    gap: 8px;
  }

  .message-input {
    padding: 8px 12px;
    font-size: 13px;
  }

  .send-button {
    padding: 8px 16px;
    min-width: 44px;
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

.message-input::-webkit-scrollbar {
  width: 4px;
}

.message-input::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 2px;
}
</style>
