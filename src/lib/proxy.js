export default function proxy(){

    const queries= {};

    function response(data){
        window.parent.postMessage(JSON.stringify(data), "*");
    }

    window.addEventListener("message", (e)=>{
        let key, data;

        try {
            try {
                ({key, data, abort} = JSON.parse(e.data));
            } catch (e) {
                throw Error("invalid JSON request")
            }

            if(abort){
                const query= queries[key];
                query && query();
            }else{
                if(!data.url) throw Error('url required');

                queries[key]= fetch(data.url, data.options, (err, data)=>{
                    delete queries[key];
                    response({
                        key,
                        data: {err, data}
                    })
                });
            }
        }catch(e){
            response(e.message);
        }


    }, false);
}