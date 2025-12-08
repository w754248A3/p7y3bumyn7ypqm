export const onRequest = async (context) => {
    // Create a prepared statement with our query
    try {
        const ps = context.env.database_name.prepare("SELECT text FROM textMessageTable");
        const data = await ps.raw();
        return Response.json(data.map(row => row[0]));
    }
    catch (e) {
        return Response.json(e);
    }
};
