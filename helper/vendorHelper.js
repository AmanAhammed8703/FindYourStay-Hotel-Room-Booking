const bcrypt = require('bcrypt')
const db = require('../config/connection')
var collection = require('../config/collection')
const async = require('hbs/lib/async')
const { reject, promise } = require('bcrypt/promises')
const req = require('express/lib/request')
const { ObjectID } = require('mongodb')
var ObjectId = require('mongodb').ObjectId;
module.exports = {
    doSignup: (data) => {
        return new Promise(async (resolve, reject) => {
            let response = {}
            let user = await db.get().collection(collection.VENDOR_COLLECTION).findOne({ Email: data.Email })
            if (user) {
                response.exist = true
                resolve(response)
                console.log("signup fail")
            } else {
                data.Password = await bcrypt.hash(data.Password, 10)
                data.confirmPassword = data.Password
                data.approved = false
                data.Block = false
                db.get().collection(collection.VENDOR_COLLECTION).insertOne(data).then((id) => {
                    console.log(id.insertedId);
                    response.insertedId = id.insertedId
                    resolve(response)
                })


                console.log("signup success")
            }
        })
    }, doLogin: (data) => {
        let response = {}
        return new Promise(async (resolve, reject) => {

            let user = await db.get().collection(collection.VENDOR_COLLECTION).findOne({ Email: data.Email })
            if (user) {
                if (user.approved) {

                    if (user.Block) {
                        response.vendorBlock=true
                        resolve(response)
                    } else {
                        bcrypt.compare(data.Password, user.Password).then((status) => {

                            if (status) {
                                response.user = true
                                response.id = user._id
                                console.log("login success")
                                resolve(response)
                            }
                            else {
                                console.log("login failed2")
                                response.vendorLogErr = true
                                response.user=false
                                resolve(response)
                            }
                        })
                    }
                }else{
                    response.notApproved=true
                    resolve(response)
                }
            } else {
                
                response.vendorLogErr = true
                console.log("login failed")
                resolve(response)
            }
        })


    },
    findId: (data) => {
        return new Promise(async (resolve, reject) => {
            let response = {}
            let user = await db.get().collection(collection.VENDOR_COLLECTION).findOne({ Email: data.Email })
            if (user) {
                response.id = user._id
                resolve(response)
            }
        })
    },
    addRoom: (data, vendorId) => {
        return new Promise(async (resolve, reject) => {
            let response = {}
                console.log(vendorId)
                data.hotelId = ObjectId(vendorId) 
                db.get().collection(collection.ROOM_COLLECTION).insertOne(data).then((id) => {
                    console.log(id.insertedId);
                    response.insertedId = id.insertedId
                    resolve(response)
                })
            
        })
    },
    addCount:(vendorId,roomId,data)=>{
        console.log("hello");
        return new Promise(async(resolve,reject)=>{
            console.log("hello");
            db.get().collection(collection.ROOM_COLLECTION).updateOne({_id:ObjectId(roomId)},{$set:{
            "price" : data.price,
            "quantity" :data.quantity,
            "Aminity1" : data.Aminity1,
            "Aminity2" : data.Aminity2,
            "Aminity3" : data.Aminity3,
            "Aminity4" : data.Aminity4,
            "Aminity5" : data.Aminity5}}).then((response)=>{
                console.log(response);
                resolve("done")
            })
          
        
  
        })
    },
    getRooms:(id)=>{
        return new Promise(async(resolve,reject)=>{
            console.log(id);
            let rooms=await db.get().collection(collection.ROOM_COLLECTION).find({hotelId:ObjectId(id)}).toArray()
            resolve(rooms)
        })
    },
    matchRooms:(id,type)=>{
        console.log(id,type);
        return new Promise(async(resolve,reject)=>{
            let match=await db.get().collection(collection.ROOM_COLLECTION).aggregate([{
                    $match:{hotelId:ObjectId(id)}
            },{
                $match:{category:type}
            }
        ]).toArray()
        let matchlen=match.length
        
        if(matchlen==0){
            resolve("empty")
        }else{
            resolve(match[0])
        }
        })
    },
    getRoomDetails:(id)=>{
        return new Promise(async(resolve,reject)=>{
            let room=await db.get().collection(collection.ROOM_COLLECTION).findOne({_id:ObjectId(id)})
            resolve(room)
        })

    }
}