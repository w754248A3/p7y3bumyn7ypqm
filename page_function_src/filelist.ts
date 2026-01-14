
interface Env {
    d1filelistdata: D1Database;
}


const createRes = (isOK:boolean, message:string, obj:any)=>{

    return Response.json({isOK, message, obj});
};

export const onRequestGet: PagesFunction<Env> = async (context) => {

    // Create a prepared statement with our query

    try {
         const url = new URL(context.request.url);

         const text = url.searchParams.get("text");
      
        const sql = `
                    WITH next_num AS (
                        SELECT COALESCE(MAX(target), 0) + 1 AS v
                        FROM main
                    )
                    INSERT INTO main(text, len, target)
                    SELECT
                        ?1,
                        ?2,
                        v
                    FROM next_num
                    RETURNING target, text, len;

               `;

               const ps = context.env.d1filelistdata.prepare(sql);
                


              const data=   await ps.bind(text||"null or unkw", 200).raw<[number, string, number]>();

            
              return createRes(true, "ok", data);

    }
    catch (e) {

        return createRes(false, "error", e);
    }
};




export const onRequestPost: PagesFunction<Env> = async (context) => {



    try {
        const url = new URL(context.request.url);

        const action = url.searchParams.get("action");
        const app = url.searchParams.get("app");
       
        if (app === "fileList" && action === "sendMessage") {

            const fd = await context.request.formData();

            const text = fd.get("text");

            if((text instanceof String) === false){
                return createRes(false, "text type error", null);
                
            }

            const file = fd.get("file");

            if(file){
                
               if((file instanceof File) === false){
                return createRes(false, "file type error", null);
               }





               const SPANCOUNT = 1*1024*1024*1.5;
               const size = file.size;


               const sql = `
                    WITH next_num AS (
                        SELECT COALESCE(MAX(target), 0) + 1 AS v
                        FROM main
                    )
                    INSERT INTO main(text, len, target)
                    SELECT
                        ?1,
                        ?2,
                        v
                    FROM next_num
                    RETURNING target;

               `;

               const ps = context.env.d1filelistdata.prepare(sql);
                


              const data=   await ps.bind((<string>text), size).raw<[Number]>();






               for(let start = 0, end = Math.min(SPANCOUNT, size-start);
                start<= size;
                end =Math.min(SPANCOUNT, size-start), start+=end){

                    const spanFile = file.slice(start, end);

               }
               file.size

            }
            else{


                const ps = context.env.d1filelistdata.prepare("INSERT INTO main (text) VALUES (?)");
                
                await ps.bind((<string>text)).raw();

                return createRes(true, "ok", text);
             
            }

        }
        else {
            return createRes(false, "No valid action specified", {path:context.functionPath, url: context.request.url, app:app, action:action });
           
        }

    }
    catch (e) {

        return createRes(false, "exption", e);
    }
};