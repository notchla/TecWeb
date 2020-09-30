const cluster = require("cluster")

function startWorker() {
    const worker = cluster.fork()
    console.log(`CLUSTER: Worker ${worker.id} started`)
}

if(cluster.isMaster){
    require("os").cpus().forEach(startWorker)
    cluster.on("disconnect", worker => console.log(
        `CLUSTER: Worker ${worker.id} disconnected from the cluster`
    ))

    cluster.on("exit", (worker, code, signal) => {
        console.log(`CLUSTER: Worker ${worker.id} died with exit code ${code} (${signal})`)
        startWorker()
    })
}
else{
    const port = process.env.PORT || 8000

    require("./index.js") (port)
}