
interface Env {
    d1filelistdata: D1Database;
}


const createRes = (isOK: boolean, message: string, obj: any) => {

    return Response.json({ isOK, message, obj });
};

export const onRequestGet: PagesFunction<Env> = async (context) => {

    // Create a prepared statement with our query

    try {
        const url = new URL(context.request.url);

        const action = url.searchParams.get("action");
        const app = url.searchParams.get("app");
        const target = url.searchParams.get("target");

        if (app === "fileList" && action === "getMessage") {

            if (target) {

                if (target.length > 10) {
                    return createRes(false, "target len > 10", target);
                }


                if (/^[0-9]+$/.test(target) === false) {

                    return createRes(false, "target has not 0-9 char", target);
                }

                const targetN = Number.parseInt(target, 10);

                if (Number.isNaN(targetN) || targetN === Infinity) {
                    return createRes(false, "target is NAN or Infinity", target);
                }

                const sql = `SELECT data
                            FROM filedata
                            WHERE target = ?1
                            ORDER BY id ASC; 
                            `;

                const ps = context.env.d1filelistdata.prepare(sql);



                const data = await ps.bind(targetN).raw<[Array<number>]>();
                
                if (data.length === 0) {
                    return createRes(false, "target where data is 0", target);
                }

                console.log(typeof data[0][0]);
                console.log("blob count", data.map(p => p[0].length));

                const u8as = data.map(p => Uint8Array.from(p));

                const combinedBlob = new Blob(u8as, {
                    type: "application/octet-stream"
                });

                const response = new Response(combinedBlob, {
                    headers: {
                        "Content-Length": combinedBlob.size.toString()
                    }
                });

                return response;

            }
            else {


                const sql = `SELECT text, len, target
                        FROM (
                            SELECT *
                            FROM main
                            ORDER BY id DESC 
                            LIMIT 100
                        ) AS sub_query
                        ORDER BY id ASC; 
                        `;

                const ps = context.env.d1filelistdata.prepare(sql);



                const data = await ps.raw<[string, number, number]>();

                const obj = data.map(p=> {return {text:p[0], len:p[1], target:p[2]};});
                return createRes(true, "ok", obj);


            }

        }
        else {
            return createRes(false, "No valid action specified", { path: context.functionPath, url: context.request.url, app: app, action: action });

        }

    }
    catch (e) {

        console.log("exption", e);
        return createRes(false, "exption", {json:JSON.stringify(e), mes:e.message});
    }
};


function isString(s:any) {
    return typeof(s) === 'string' || s instanceof String;
}


export const onRequestPost: PagesFunction<Env> = async (context) => {



    try {
        const url = new URL(context.request.url);

        const action = url.searchParams.get("action");
        const app = url.searchParams.get("app");

        if (app === "fileList" && action === "sendMessage") {

            const fd = await context.request.formData();

            const text = fd.get("text");

            if (!isString(text)) {
                return createRes(false, "text type error", null);

            }

            const file = fd.get("file");

            if (file) {

                if ((file instanceof File) === false || (file instanceof Blob) === false) {
                    return createRes(false, "file type error", null);
                }





                const SPANCOUNT = 1 * 1024 * 1024 * 1.5;
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



                const data = await ps.bind((<string>text), size).raw<[number]>();

                const target = data[0][0];




                let start = 0;

                while (start < size) {
                    let spanCount = Math.min(SPANCOUNT, size - start);



                    const spanFile = file.slice(start, start + spanCount);
                    const ab = await spanFile.arrayBuffer();
                    const sql = "INSERT INTO filedata(target, data) VALUES (?1, ?2)";

                    const ps = context.env.d1filelistdata.prepare(sql);
                    const d1res = await ps.bind(target, ab).run();

                    console.log({ d1res, start, end: start + spanCount, size });


                    start += spanCount;
                }


                return createRes(true, "ok", target);



            }
            else {


                const ps = context.env.d1filelistdata.prepare("INSERT INTO main (text) VALUES (?)");

                const d1res = await ps.bind((<string>text)).run();

                return createRes(true, "ok", { d1res, text });

            }

        }
        else {
            return createRes(false, "No valid action specified", { path: context.functionPath, url: context.request.url, app: app, action: action });

        }

    }
    catch (e) {
        console.log("exption", e);
        return createRes(false, "exption", {json:JSON.stringify(e), mes:e.message});
    }
};