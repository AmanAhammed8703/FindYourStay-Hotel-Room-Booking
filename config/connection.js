const MongoClient=require('mongodb').MongoClient
const state={
    db:null
}
module.exports.connect=function(done){
    const url='mongodb+srv://aman_ahammed:Encrypted1@findyourstay.xyxdl.mongodb.net/project?retryWrites=true&w=majority'
    const dbname='project'

    MongoClient.connect(url,(err,data)=>{
        if(err) return done(err)
        state.db=data.db(dbname)
        
        done()
    })
}

module.exports.get=function(){
    return state.db
}
