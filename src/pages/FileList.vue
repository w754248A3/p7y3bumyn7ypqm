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

        const e = "getlistdata error:"+ JSON.stringify(resData);
        errorlog.value+="\n"+ e;
        throw Error(e);
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
        <input type="button" v-on:click="getListData" value="load">
        <input type="file" accept="image/*" @change="onFileChange">
        <input type="button" v-on:click="deleteData" value="delete">

    </div>
  </div>
</template>

<style scoped>
</style>
