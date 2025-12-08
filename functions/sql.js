export const onRequestGet = async (context) => {
    // Create a prepared statement with our query
    try {
        const url = new URL(context.request.url);
        const action = url.searchParams.get("action");
        const app = url.searchParams.get("app");
        if (app === "TextMessage" && action === "getMessage") {
            const ps = context.env.database_name.prepare("SELECT text FROM textMessageTable ORDER BY id DESC LIMIT 100");
            const data = await ps.raw();
            return Response.json(data.map(row => row[0]));
        }
        else {
            return Response.json({ message: "No valid action specified", path: context.functionPath, url: context.request.url, app: app, action: action });
        }
    }
    catch (e) {
        return Response.json(e);
    }
};
export const onRequestPost = async (context) => {
    try {
        const url = new URL(context.request.url);
        const action = url.searchParams.get("action");
        const app = url.searchParams.get("app");
        if (app === "TextMessage" && action === "sendMessage") {
            const req = await context.request.json();
            const textMessage = req.text;
            const ps = context.env.database_name.prepare("INSERT INTO textMessageTable (text) VALUES (?)");
            const data = await ps.bind(textMessage).run();
            return Response.json({ message: "Message stored successfully", text: textMessage });
        }
        else {
            return Response.json({ message: "No valid action specified", path: context.functionPath, url: context.request.url, app: app, action: action });
        }
    }
    catch (e) {
        return Response.json(e);
    }
};
