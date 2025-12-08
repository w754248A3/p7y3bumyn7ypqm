<script setup lang="ts">
import { ref } from 'vue';


    const getMessage = async () => {
      const res = await fetch('/sql?app=TextMessage&action=getMessage', {
        method: 'GET',
      });

        const data = await res.json();

        textList.value = data;
    };

    const sendMessage = async (message: string) => {
      await fetch('/sql?app=TextMessage&action=sendMessage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: message })
      });

      getMessage();
    };


    const textList = ref<Array<string>>([]);
    getMessage();    
</script>

<template>
  <div id="root">
    <div id="textOut">
        <div v-for="(text, index) in textList" :key="index">
            {{ text }}
        </div>
    </div>
    <div id="textInput">
        <textarea>

        </textarea>
        <button type="button" v-on:click="sendMessage('测试')">Send</button>
    </div>
  </div>
</template>

<style scoped>

</style>
