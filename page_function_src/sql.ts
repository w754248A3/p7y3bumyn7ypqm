interface Env {
    database_name: D1Database;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {

    // Create a prepared statement with our query

    try {

        const url = new URL(context.request.url);

        const action = url.searchParams.get("action");
        const app = url.searchParams.get("app");
        if (app === "TextMessage" && action === "getMessage") {

            const q = `SELECT text
                        FROM (
                            SELECT *
                            FROM textMessageTable
                            ORDER BY id DESC 
                            LIMIT 100
                        ) AS sub_query
                        ORDER BY id ASC; 
                        `


            const ps = context.env.database_name.prepare(q);
            const data = await ps.raw<[string]>();

            return Response.json(data.map(row => row[0]));
        }
        else {
            return Response.json({ message: "No valid action specified", path:context.functionPath, url: context.request.url, app:app, action:action });
        }

    }
    catch (e) {

        return Response.json(e);
    }
};

export const onRequestPost: PagesFunction<Env> = async (context) => {



    try {
        const url = new URL(context.request.url);

        const action = url.searchParams.get("action");
        const app = url.searchParams.get("app");
        if (app === "TextMessage" && action === "sendMessage") {

            const req = await context.request.json<{ text: string }>();
            const textMessage = req.text;

            const ps = context.env.database_name.prepare("INSERT INTO textMessageTable (text) VALUES (?)");
            const data = await ps.bind(textMessage).run();

            return Response.json({ message: "Message stored successfully", text: textMessage });
        }
        else {

            return Response.json({ message: "No valid action specified", path:context.functionPath, url: context.request.url, app:app, action:action });
        }

    }
    catch (e) {

        return Response.json(e);
    }
};