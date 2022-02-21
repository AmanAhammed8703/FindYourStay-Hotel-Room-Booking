const bcrypt = require('bcrypt')
const db = require('../config/connection')
var collection = require('../config/collection')
const async = require('hbs/lib/async')
const { reject, promise } = require('bcrypt/promises')
const req = require('express/lib/request')
const { ObjectID } = require('mongodb')
const { response } = require('../app')
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

    },
    todayBooking:(id)=>{
        console.log(id);
        return new Promise(async(resolve,reject)=>{
            let response={}
            let bookings=await db.get().collection(collection.BOOKINGS_COLLECTION).aggregate([{
                $match:{hotelid:ObjectId(id)}

            },{
                $lookup:{
                    from:collection.ROOM_COLLECTION,
                    localField:'roomId',
                    foreignField:'_id',
                    as:'roomDetails'

                }
            },{
                $project:{userId:{$toObjectId:'$userId'},from:1,to:1,days:1,room:1,guest:1,amount:1,status:1,payment:1,categoty:'$roomDetails.category'}
            },
            {
                $lookup:{
                    from:collection.USER_COLLECTION,
                    localField:'userId',
                    foreignField:'_id',
                    as:'user'
                }
            },{
                $project:{userId:1,from:1,to:1,days:1,room:1,guest:1,amount:1,status:1,payment:1,categoty:1,userName:'$user.userName',userMobile:'$user.mobileNumber'}
            }]).toArray()
            console.log(bookings);

            
            let today = []
            for(let i of bookings){
                let from = new Date(i.from.split("-").reverse().join("-"))
                let to = new Date(i.to.split("-").reverse().join("-"))
                to.setHours(0);
                to.setHours(5);
                to.setMinutes(30)
                console.log(from);
                console.log(to);
                date = new Date()
                date.setHours(0);
                date.setHours(5);
                date.setMilliseconds(0)
                date.setMinutes(0)
                date.setMinutes(30)
                date.setSeconds(0)
               
                console.log(date);
                if (from.getTime() === date.getTime() && i.status=="upcoming") {
                    today.push(i)
                    console.log(from.getTime());
                    console.log(date.getTime());
                } 
            }
            response=today
         
            
            resolve(response)
        })
    },
     upcomingBooking:(id)=>{
        console.log(id);
        return new Promise(async(resolve,reject)=>{
            let response={}
            let bookings=await db.get().collection(collection.BOOKINGS_COLLECTION).aggregate([{
                $match:{hotelid:ObjectId(id)}

            },{
                $lookup:{
                    from:collection.ROOM_COLLECTION,
                    localField:'roomId',
                    foreignField:'_id',
                    as:'roomDetails'

                }
            },{
                $project:{userId:{$toObjectId:'$userId'},from:1,to:1,days:1,room:1,guest:1,amount:1,status:1,payment:1,categoty:'$roomDetails.category'}
            },
        {
            $lookup:{
                from:collection.USER_COLLECTION,
                localField:'userId',
                foreignField:'_id',
                as:'user'
            }
        },{
            $project:{userId:1,from:1,to:1,days:1,room:1,guest:1,amount:1,status:1,payment:1,categoty:1,userName:'$user.userName',userMobile:'$user.mobileNumber'}
        }]).toArray()
            console.log(bookings);

            
            let upcoming = []
            for(let i of bookings){
                let from = new Date(i.from.split("-").reverse().join("-"))
                let to = new Date(i.to.split("-").reverse().join("-"))
                to.setHours(12);
                console.log(from);
                console.log(to);
                date = new Date()
                date.setHours(5);
                date.setMilliseconds(0)
                date.setMinutes(30)
                date.setSeconds(0)
                // date = new Date(date.split(' ')[0])
                console.log(date);
                if (from > date) {
                    upcoming.push(i)
                }
            }
            response=upcoming
         
            
            resolve(response)
        })
    },
    pastBooking:(id)=>{
       console.log(id);
       return new Promise(async(resolve,reject)=>{
           let response={}
           let bookings=await db.get().collection(collection.BOOKINGS_COLLECTION).aggregate([{
               $match:{hotelid:ObjectId(id)}

           },{
               $lookup:{
                   from:collection.ROOM_COLLECTION,
                   localField:'roomId',
                   foreignField:'_id',
                   as:'roomDetails'

               }
           },{
               $project:{userId:{$toObjectId:'$userId'},from:1,to:1,days:1,room:1,guest:1,amount:1,status:1,payment:1,categoty:'$roomDetails.category'}
           },
       {
           $lookup:{
               from:collection.USER_COLLECTION,
               localField:'userId',
               foreignField:'_id',
               as:'user'
           }
       },{
           $project:{userId:1,from:1,to:1,days:1,room:1,guest:1,amount:1,status:1,payment:1,categoty:1,userName:'$user.userName',userMobile:'$user.mobileNumber'}
       }]).toArray()
           console.log(bookings);

           
           let past = []
           for(let i of bookings){
               let from = new Date(i.from.split("-").reverse().join("-"))
               let to = new Date(i.to.split("-").reverse().join("-"))
               to.setHours(12);
               console.log(from);
               console.log(to);
               date = new Date()
               date.setHours(5);
               date.setMilliseconds(0)
               date.setMinutes(30)
               date.setSeconds(0)
               // date = new Date(date.split(' ')[0])
               console.log(date);
               if (to < date ||i.status=="checkedOut") {
                   past.push(i)
                   await db.get().collection(collection.BOOKINGS_COLLECTION).updateOne({_id:i._id},{$set:{status:"checkedOut"}})
               }
           }
           response=past
        
           
           resolve(response)
       })
   },
    cancelRoom:(id)=>{
        console.log(id);
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.BOOKINGS_COLLECTION).deleteOne({_id:ObjectId(id)}).then((response)=>{
                console.log(response);
                resolve(response)
            })
        })
    },
    addToWallet:(id,amt)=>{
        console.log("hyhyhy"+id);
        return new Promise(async(resolve,reject)=>{
            
            let user=await db.get().collection(collection.USER_COLLECTION).findOne({_id:ObjectId(id)})
            console.log(    user);
            if(user.wallet){
                let wallet=parseInt(user.wallet)+parseInt(amt)
                db.get().collection(collection.USER_COLLECTION).updateOne({_id:ObjectId(id)},{$set:{wallet:wallet}}).then((response)=>{
                    resolve(response)
                })
            }else{
                let wallet=parseInt(amt)
                db.get().collection(collection.USER_COLLECTION).updateOne({_id:ObjedtId(id)},{$set:{wallet:wallet}})
            }
        })
    },
    getBookingDetails:(id)=>{
        console.log("id"+id);
        return new Promise(async(resolve,reject)=>{
            let booking=await db.get().collection(collection.BOOKINGS_COLLECTION).findOne({_id:ObjectId(id)})
            console.log("dkhfvbdsk="+booking);
            resolve(booking)
        })
    },
    checkedinBooking:(id)=>{
       console.log(id);
       return new Promise(async(resolve,reject)=>{
           let response={}
           let bookings=await db.get().collection(collection.BOOKINGS_COLLECTION).aggregate([{
               $match:{hotelid:ObjectId(id)}

           },{
               $lookup:{
                   from:collection.ROOM_COLLECTION,
                   localField:'roomId',
                   foreignField:'_id',
                   as:'roomDetails'

               }
           },{
               $project:{userId:{$toObjectId:'$userId'},from:1,to:1,days:1,room:1,guest:1,amount:1,status:1,payment:1,categoty:'$roomDetails.category'}
           },
       {
           $lookup:{
               from:collection.USER_COLLECTION,
               localField:'userId',
               foreignField:'_id',
               as:'user'
           }
       },{
           $project:{userId:1,from:1,to:1,days:1,room:1,guest:1,amount:1,status:1,payment:1,categoty:1,userName:'$user.userName',userMobile:'$user.mobileNumber'}
       }]).toArray()
           console.log(bookings);

           
           let checkedIn = []
           for(let i of bookings){
               if (i.status=='checkedIn') {
                   checkedIn.push(i)
               }
           }
           response=checkedIn
        
           
           resolve(response)
       })
   },
   statusUpdate:(id)=>{
       return new Promise(async(resolve,reject)=>{
           let booking=await db.get().collection(collection.BOOKINGS_COLLECTION).findOne({_id:ObjectId(id)})
           if(booking.status=="upcoming"){
           db.get().collection(collection.BOOKINGS_COLLECTION).updateOne({_id:ObjectId(id)},{$set:{status:"checkedIn"}}).then((response)=>{
               resolve(response)
           })
        }else{
            db.get().collection(collection.BOOKINGS_COLLECTION).updateOne({_id:ObjectId(id)},{$set:{status:"checkedOut"}}).then((response)=>{
                resolve(response)
            })
        }
       })
   },
   getVendorCoupons: (id) => {
    return new Promise(async (resolve, reject) => {
        console.log(id);
        let coupons = await db.get().collection(collection.COUPONS_COLLECTION).find({ auth: ObjectId(id) }).toArray()
        console.log(coupons);
        let date = new Date()
        date.setHours(5)
        date.setMinutes(30)
        date.setSeconds(0)
        date.setMilliseconds(0)
        console.log(date);
        for (let i of coupons) {
            console.log(i);
            if (date >= new Date(i.couponExpiry)) {
                console.log("yes");
                db.get().collection(collection.COUPONS_COLLECTION).deleteOne({ _id: i._id })
            }
        }
        coupons = await db.get().collection(collection.COUPONS_COLLECTION).find({ auth: ObjectId(id) }).toArray()
        resolve(coupons)
    })
},
deleteCoupon: (id) => {
    console.log(id);
    return new Promise(async(resolve, reject) => {
        let coupon=await db.get().collection(collection.COUPONS_COLLECTION).findOne({_id: ObjectId(id)})
            let users=await db.get().collection(collection.USER_COLLECTION).find({}).toArray()
        db.get().collection(collection.COUPONS_COLLECTION).deleteOne({ _id: ObjectId(id) }).then(async(response) => {
            resolve(response)
            for(let i in users){
                if(users[i].coupons){
                    for(let j in users[i].coupons){
                        if(users[i].coupons[j]==coupon.couponCode){
                            await db.get().collection(collection.USER_COLLECTION).updateOne({_id:users[i]._id},{$pull:{coupons:coupon.couponCode}})
                        }
                    }
                }
            }
        })
    })
},
addOffers: (data,id) => {
    return new Promise(async (resolve, reject) => {
        console.log(data);
        let response={}
        let offers= await db.get().collection(collection.OFFERS_COLLECTION).findOne({auth:ObjectId(id),offerCategory:data.offerCategory})
        console.log(offers);
        if(offers){
            response.vendorOfferExist=true
        }else{
        await db.get().collection(collection.OFFERS_COLLECTION).insertOne(data).then(async()=>{
            console.log("added");
            await db.get().collection(collection.ROOM_COLLECTION).updateMany({hotelId:ObjectId(id),category:data.offerCategory},{$set:{discount:data.offerPercentage}})
        })
        
    }
    resolve(response)
    })
},
getOffers:(id)=>{
    return new Promise(async(resolve,reject)=>{
        let offers=await db.get().collection(collection.OFFERS_COLLECTION).find({auth:ObjectId(id)}).toArray()
        console.log(offers);
        let date = new Date()
        date.setHours(5)
        date.setMinutes(30)
        date.setSeconds(0)
        date.setMilliseconds(0)
        console.log(date);
        for (let i of offers) {
            console.log(i);
            if (date >= new Date(i.offerExpiry)) {
                console.log("yes");
                await db.get().collection(collection.OFFERS_COLLECTION).deleteOne({ _id: i._id }).then(()=>{
                    db.get().collection(collection.ROOM_COLLECTION).updateOne({hotelId:i.auth,category:i.offerCategory},{$unset:{discount:""}})
                })

            }
        }
        offers=await db.get().collection(collection.OFFERS_COLLECTION).find({auth:ObjectId(id)}).toArray()
        resolve(offers)
    })
},
deleteOffers: (id) => {
    console.log(id);
    return new Promise(async(resolve, reject) => {
        let offer=await db.get().collection(collection.OFFERS_COLLECTION).findOne({_id:ObjectId(id)})
        db.get().collection(collection.OFFERS_COLLECTION).deleteOne({ _id: ObjectId(id) }).then((response) => {
            db.get().collection(collection.ROOM_COLLECTION).updateOne({hotelId:offer.auth,category:offer.offerCategory},{$unset:{discount:""}})
            resolve(response)
        })
    })
},
addCoupon: (data) => {
    return new Promise(async (resolve, reject) => {
        let response={}
        let coupons= await db.get().collection(collection.COUPONS_COLLECTION).findOne({couponCode:data.couponCode})
        console.log(coupons);
        if(coupons){
            response.couponExist=true
        }else{
        await db.get().collection(collection.COUPONS_COLLECTION).insertOne(data)
        
    }
    resolve(response)
    })
},
getProfile:(id)=>{
    return new Promise(async(resolve,reject)=>{
        let profile=await db.get().collection(collection.VENDOR_COLLECTION).findOne({_id:ObjectId(id)})
        resolve(profile)
    })
},
vendorProfileUpdate:(id,data)=>{
    return new Promise((resolve,reject)=>{
        db.get().collection(collection.VENDOR_COLLECTION).updateOne({_id:ObjectId(id)},{$set:{
            propertyName:data.propertyName,
            Email:data.Email,
            mobilNumber:data.mobilNumber,
            Location:data.Location,
            Address:data.Address,
            Description:data.Description,

        }})
    })
}
}