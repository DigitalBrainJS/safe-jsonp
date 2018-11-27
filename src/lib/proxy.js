export default function proxy(){

    function response(data){
        window.parent.postMessage(JSON.stringify(data), "*");
    }

    window.addEventListener("message", (e)=>{
        let key, data;

        try {
            try {
                ({key, data} = JSON.parse(e.data));
            } catch (e) {
                throw Error("invalid JSON request")
            }

            if(!data.url) throw Error('url required');

            fetch(data.url, data.options, (err, data)=>{
                response({
                    key,
                    data: {err, data}
                })
            });
        }catch(e){
            response(e.message);
        }


    }, false);
}