export async function onRequest(context) {
    try{
        // Create a prepared statement with our query
        const ps = context.env.database_name.prepare("SELECT * FROM images");
        const data = await ps.first();

        return Response.json(data);
    }
    catch(e){
        return Response.json(e);
    }
  
}