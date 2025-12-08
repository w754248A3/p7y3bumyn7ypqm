<script setup lang="ts">
import { ref } from 'vue';


    interface Data {
        text:string
        fileName:string
        fileBase64Data:string
    }

    const fileBinding = ref<Data>({
        text: "",
        fileName: "",
        fileBase64Data: "",
    });

    const toBase64 = async (file: File): Promise<string> => {
        const buf:any = await file.bytes();

        if(buf.toBase64){
            return buf.toBase64();
        }
        else{
            throw new Error("Buffer does not support toBase64 method");
        }
    };

    const getBase64Url = (base64Str:string): string => {
        return "data:application/octet;base64," + base64Str;
    };

    // const fromBase64 = (base64Str: string): Uint8Array => {
    //     const obj:any = Uint8Array;
    //     return obj.fromBase64(base64Str);
    // };

    const loadFile = async () => {
        const res = await fetch(`/fileshared`, {
            method: 'GET',
        });

        const data:Data = await res.json();
        data.fileBase64Data= getBase64Url(data.fileBase64Data);
        fileBinding.value= data;

    };

    const sendFile = async (file: File) => {
        
        const base64Str = await toBase64(file);

        const res = await fetch('/fileshared', {
            method: 'POST',
         
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                fileName: file.name,
                fileBase64Data: base64Str,
            } as Data),
        });

        const data = await res.json();
        console.log('File upload response:', data);
    };

    const onFileChange = async (event: Event) => {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files[0]) {
            const file = input.files[0];
            
            await sendFile(file);
            
            await loadFile();
        }
    };

    await loadFile();
</script>

<template>
    <div class="file-shared-container">
        <img v-if="fileBinding.fileBase64Data" :src="fileBinding.fileBase64Data" :alt="fileBinding.fileName" style="max-width: 100%; height: auto;"/>
        <input type="file" @change="onFileChange"/>
        
    </div>
</template>

<style scoped>
</style>
