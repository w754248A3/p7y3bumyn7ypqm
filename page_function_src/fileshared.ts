
interface Env {
    database_name: D1Database;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {

    // Create a prepared statement with our query

    try {

        const q = `SELECT text FROM fileshared WHERE id = 1;`


        const ps = context.env.database_name.prepare(q);
        const data = await ps.first();

        return Response.json(data);



    }
    catch (e) {

        return Response.json(e);
    }
};

export const onRequestPost: PagesFunction<Env> = async (context) => {



    try {
        const req = await context.request.json();
        console.log("req", req);
        const textMessage = JSON.stringify(req);

        const q = `UPDATE fileshared
                        SET text = ?
                        WHERE id = 1;`
        const ps = context.env.database_name.prepare(q);
        const data = await ps.bind(textMessage).run();

        return Response.json({ message: "Message stored successfully", text: textMessage });
    }
    catch (e) {

        return Response.json(e);
    }
};