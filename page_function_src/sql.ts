interface Env {
    database_name: D1Database;
}

export const onRequest: PagesFunction<Env> = async (context) => {

    // Create a prepared statement with our query
 
    try{
        return Response.json(context.functionPath);
    }
    catch(e){

        return Response.json(e);
    }
};