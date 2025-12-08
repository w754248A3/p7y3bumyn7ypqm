interface Env {
    database_name: D1Database;
}

export const onRequest: PagesFunction<Env> = async (context) => {

    // Create a prepared statement with our query
 
    try{
        const ps = context.env.database_name.prepare("SELECT text FROM textMessageTable");
        const data = await ps.raw<[string]>();

        return Response.json(data.map(row=> row[0]));
    }
    catch(e){

        return Response.json(e);
    }
};