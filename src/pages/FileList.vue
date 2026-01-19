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
    imgView:boolean;
}

const progress = ref<number>(0);

const is_progress= ref<boolean>(false);

const listViewDataRef = ref<ListData[]>();

const errorlog = ref<string>("");

const imgUrl = "/filelist?action=getMessage&app=fileList&target=";

const text_value = ref<string>("");

const getListData = async ()=>{


   const res = await fetch("/filelist?action=getMessage&app=fileList");


    const resdata : ResData = (await res.json());
    console.log(resdata);
    if(resdata.isOK===false){

        const e = "getlistdata error:"+ JSON.stringify(resdata);
        errorlog.value+="\n"+ e;
        throw Error(e);
    }

    listViewDataRef.value= resdata.obj;

};



function postWithProgress(url:string, formData:FormData, onProgress:(v:number)=> void) {
  
  is_progress.value=true;
  return new Promise<any>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.responseType = "json";

    xhr.upload.onprogress = e => {
      if (e.lengthComputable) {
        onProgress((e.loaded / e.total * 100));
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {

        if(!(xhr.response)){
            reject(new Error("HTTP res is null"));
        }
        else{
            resolve(xhr.response);
        }
        
      } else {
        reject(new Error("HTTP " + xhr.status));
      }
    };

    xhr.onerror = () => reject(new Error("network error"));

    xhr.send(formData);
  });
}


const postText = async()=>{

    const text = text_value.value;
    if(!text){
      errorlog.value+="\n"+ "text not have text";
      return;
    }


    const fd = new FormData();

    fd.append("text", text);



    const resData:ResData = await postWithProgress("/filelist?action=sendMessage&app=fileList", fd, (n)=>{
        progress.value= n;
    });

    if(resData.isOK===false){

        const e = "postText  error:"+ JSON.stringify(resData);
        errorlog.value+="\n"+ e;
        throw Error(e);
    }
    else{
      getListData();
    }
};


const onFileChange = async (event: Event) => {
  const input = event.target as HTMLInputElement;
  if (input.files && input.files[0]) {

    const file = input.files[0]
    

    const fd = new FormData();

    fd.append("text", file.name);

    fd.append("file", file);



    const resData:ResData = await postWithProgress("/filelist?action=sendMessage&app=fileList", fd, (n)=>{
        progress.value= n;
    });

    if(resData.isOK===false){

        const e = "post file error:"+ JSON.stringify(resData);
        errorlog.value+="\n"+ e;
        throw Error(e);
    }
    else{
      getListData();
    }
  }
};


const deleteData=async()=>{
    const res = await fetch("/filelist?action=deleteMessage&app=fileList", {
      method:"DELETE"
    });
    const resdata : ResData = (await res.json());
    console.log(resdata);
    if(resdata.isOK===false){

        const e = "deleteData error:"+ JSON.stringify(resdata);
        errorlog.value+="\n"+ e;
        throw Error(e);
    }
    else{
      getListData();
    }

};


</script>

<template>
  <div>
    <div>
        {{ errorlog }}
    </div>
    <div>
        <div v-for="p in listViewDataRef">
        <div v-if="p.target">
            <img v-if="p.imgView" :src="imgUrl+p.target">
            <p>{{ p.text + ":" +p.len }}</p>
            <input type="button" v-on:click="p.imgView= true" value="load img">
        </div>

        <div v-if="!p.target"></div>
            <p>{{ p.text }}</p>
        </div>
    </div>
    <div>
      <label v-if="is_progress">{{ progress }}</label>
        <input type="text" v-bind:value="text_value">
        <input type="button" v-on:click="postText" value="post text">
        <input type="button" v-on:click="getListData" value="load">
        <input type="file" accept="image/*" @change="onFileChange">
        <input type="button" v-on:click="deleteData" value="delete">

    </div>
  </div>
</template>

<style scoped>
</style>
