<script setup lang="ts">
import { ref } from 'vue';


interface ResData{
    isOK:boolean;
    message:string;
    obj:any;
}


interface ListData{
    text:string;
    len:number;
    target:number;
}

const listViewDataRef = ref<ListData[]>();

const imgUrl = "/filelist?action=getMessage&app=fileList&target=";

const getListData = async ()=>{


   const res = await fetch("/filelist?action=getMessage&app=fileList");


    const resdata : ResData = (await res.json());
    console.log(resdata);
    if(resdata.isOK===false){

        throw Error(resdata.message);
    }

    listViewDataRef.value= resdata.obj;

};

const onFileChange = async (event: Event) => {
  const input = event.target as HTMLInputElement;
  if (input.files && input.files[0]) {

    const file = input.files[0]
    

    const fd = new FormData();

    fd.append("text", file.name);

    fd.append("file", file);


    const res = await fetch("/filelist?action=sendMessage&app=fileList",
        {
            body:fd,
            method:"POST"
        }
    );


    const resData:ResData = await res.json();

    if(resData.isOK===false){

        throw Error(resData.message);
    }
    
    prompt("send ok");

  }
};





</script>

<template>
  <div>
    <div>
        <div v-for="{text, len, target} in listViewDataRef">
        <div v-if="target">
            <img :src="imgUrl+target">
            <p>{{ text + ":" +len }}</p>
        </div>

        <div v-if="!target"></div>
            <p>{{ text }}</p>
        </div>
    </div>
    <div>
        <input type="button" v-on:click="getListData" value="load">
        <input type="file" accept="image/*" @change="onFileChange" value="sel file">

    </div>
  </div>
</template>

<style scoped>
</style>
