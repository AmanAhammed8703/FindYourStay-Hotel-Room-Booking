const bcrypt = require('bcrypt')
var db = require('../config/connection')
var collection = require('../config/collection')
const req = require('express/lib/request');
const { reject } = require('bcrypt/promises');
const async = require('hbs/lib/async');
var ObjectId = require('mongodb').ObjectId;


module.exports = {
    getUserdetails: (mobile1, email) => {
        return new Promise(async (resolve, reject) => {
            let user = await db.get().collection(collection.USER_COLLECTION).findOne({ $or: [{ mobileNumber: mobile1 }, { Email: email }] })
            resolve(user)
        })
    },
    doSignUp: (data) => {
        return new Promise(async (resolve, reject) => {
            let response = {}


            data.Password = await bcrypt.hash(data.Password, 10)
            data.confirmPassword = data.Password
            db.get().collection(collection.USER_COLLECTION).insertOne(data).then((response) => {
                console.log(response);
                resolve(response)
                console.log("signup success")
            })
        }
        )
    },
    doLogin: (data) => {
        let response = {}
        return new Promise(async (resolve, reject) => {

            let user = await db.get().collection(collection.USER_COLLECTION).findOne({ Email: data.Email })
            if (user) {
                if(user.Blocked){
                    response.status = false
                    response.block=true
                    console.log("login failed")
                    resolve(response)
                }else{
                bcrypt.compare(data.Password, user.Password).then((status) => {

                    if (status) {
                        response.status = true
                        response.username = user.userName
                        response.mobileNumber = user.mobileNumber
                        console.log("login success")
                        resolve(response)
                    }
                    else {
                        console.log("login failed2")
                        response.status = false
                        resolve(response)
                    }
                })
            }
            } else {
                response.status = false
                console.log("login failed")
                resolve(response)
            }
        })


    },

    getUserMobile: (number) => {
        return new Promise(async (resolve, reject) => {
            let user = await db.get().collection(collection.USER_COLLECTION).findOne({ mobileNumber: number })
            resolve(user)
        })
    },
    getRoomDetails: () => {
        return new Promise(async (resolve, reject) => {

            let room = await db.get().collection(collection.ROOM_COLLECTION).find().limit(6).toArray()
            resolve(room)
        })
    },
    getSearchRooms: (id) => {
        return new Promise((resolve, reject) => {

        })

    },
    getOneRoomDetail: (id) => {
        return new Promise(async (resolve, reject) => {

            let roomData = await db.get().collection(collection.ROOM_COLLECTION).findOne({ _id: ObjectId(id) })
            resolve(roomData)
        })
    },
    getOneHotel: (id) => {
        return new Promise(async (resolve, reject) => {
            let hotelData = await db.get().collection(collection.VENDOR_COLLECTION).findOne({ _id: ObjectID(id) })
            resolve(hotelData)
        })
    },
    getSearchResults: (search) => {
        return new Promise(async (resolve, reject) => {
            let result = await db.get().collection(collection.VENDOR_COLLECTION).aggregate([{
                $match: { Location: search.location }
            }, {
                $lookup: {
                    from: collection.ROOM_COLLECTION,
                    localField: '_id',
                    foreignField: 'hotelId',
                     as: 'rooms'
                 }
            }, {
                 $project: { rooms: 1 ,discount:1}
             }
                 , {
                 $project: { rooms: 1, roomId: '$rooms._id' ,discount:1}
             },
             {
                 $lookup: {
                     from: collection.BOOKINGS_COLLECTION,
                     localField: 'roomId',
                     foreignField: 'roomId',
                     as: 'Bookedrooms'
                 }
             }, {
                $project: { rooms: 1, roomId: 1, Bookedrooms: 1, bookedfrom: '$Bookedrooms.from', bookedto: '$Bookedrooms.to' }
            }
            ]).toArray()
            //console.log(result);
            let roomData = await db.get().collection(collection.ROOM_COLLECTION).find({}).toArray()
            let qty
            const rooms = []
            let resolveData = []
            const bookedRooms = []
            for (let i of result) {
                for (let j of i.roomId) {
                    rooms.push(j)
                }
            }
            for (let i of result) {
                for (let j of i.Bookedrooms) {
                    bookedRooms.push(j)
                }
            }
            // console.log(rooms);
            // console.log(bookedRooms);
            for (let i of roomData) {
                console.log(typeof (i.quantity));
                if (parseInt(i.quantity) < parseInt(search.room)) {
                    let id = i._id
                    for (let l in rooms) {
                        // console.log(ObjectId(rooms[l]));
                        // console.log(id);
                        if ((ObjectId(rooms[l])).toString() === (id).toString()) {
                            // console.log("hee");
                            // console.log(l, id);
                            rooms.splice(l, 1);
                        }
                    }
                }
            }
            for (let i of bookedRooms) {


                for (let r of roomData) {

                   // console.log(r._id, i.roomId)
                    if (r._id.toString() === i.roomId.toString()) {

                        qty = parseInt(r.quantity)
                        // console.log("quan" + typeof (r.quantity));
                        // console.log(qty)
                    }
                }
                for (let k of bookedRooms) {
                    if (i.roomId.toString() === k.roomId.toString()) {

                       //console.log("qty" + qty);
                        var dateOne = search.from
                        var dateTwo = search.to
                        var searchFrom = new Date(dateOne.split("-").reverse().join("-"))
                        var searchTo = new Date(dateTwo.split("-").reverse().join("-"))
                        var checkFrom = new Date(i.from.split("-").reverse().join("-"))
                        var checkTo = new Date(i.to.split("-").reverse().join("-"))
                        if (checkFrom <= searchFrom && searchFrom <= checkTo) {
                            qty = qty - 1

                        } else if (checkFrom <= searchTo && searchTo <= checkTo) {
                            qty = qty - 1

                        } else if (searchFrom <= checkFrom && checkTo < searchTo) {
                            qty = qty - 1

                        }

                        // console.log(search.room);
                        // console.log("qty" + qty);
                        // console.log(typeof (parseInt(search.room)));
                        // console.log("qn" + typeof (qty));
                        let no = parseInt(search.room)
                       // console.log(no);
                        if (qty < no) {

                            let id = i.roomId
                            for (let l in rooms) {
                                // console.log(ObjectId(rooms[l]));
                                // console.log(id);
                                if ((ObjectId(rooms[l])).toString() === (id).toString()) {
                                    // console.log("hee");
                                    // console.log(l, id);
                                    rooms.splice(l, 1);
                                }
                            }


                        }
                    }
                }
            }
            resolve(rooms)
        })
    },
    getOneRoom: (id) => {
        return new Promise(async (resolve, reject) => {
            let result = await db.get().collection(collection.ROOM_COLLECTION).aggregate([
                {
                    $match: { _id: ObjectId(id) }
                }, {
                    $lookup: {
                        from: collection.VENDOR_COLLECTION,
                        localField: 'hotelId',
                        foreignField: '_id',
                        as: 'hotel'
                    }
                }, {
                    $project: {
                        price: 1, category: 1, id: 1, bed: 1, Aminity1: 1, Aminity2: 1, Aminity3: 1, Aminity4: 1, Aminity5: 1,
                        hotel: 1,discount:1,userId:"$review.userId",review:1
                    }

                },
                {
                    $lookup:{
                        from:collection.USER_COLLECTION,
                        localField:"userId",
                        foreignField:"_id",
                        as:"reviewUser"
                    }
                },
                {
                    $project: {
                        price: 1, category: 1, id: 1, bed: 1, Aminity1: 1, Aminity2: 1, Aminity3: 1, Aminity4: 1, Aminity5: 1,
                        hotel: 1,discount:1,reviewUser:1,review:1
                    }

                },
            ]).toArray()
            console.log(result);
            resolve(result[0])
        })
    },
    addBooking: (data) => {
        return new Promise(async (resolve, reject) => {
            await db.get().collection(collection.BOOKINGS_COLLECTION).insertOne(data).then((response) => {
                console.log("booked");
                resolve(response)
            })
        })
    },
    roomCheck: (roomId, data) => {
        let search = data
        return new Promise(async (resolve, reject) => {
            let roomCheck = await db.get().collection(collection.ROOM_COLLECTION).aggregate([{
                $match: { _id: ObjectId(roomId) }
            }, {
                $project: { quantity: 1 }
            }, {
                $lookup: {
                    from: collection.BOOKINGS_COLLECTION,
                    localField: '_id',
                    foreignField: 'roomId',
                    as: 'bookings'
                }
            }]).toArray()
            console.log(roomCheck);

            for (let i of roomCheck) {
                let qty = parseInt(i.quantity)
                let no = parseInt(search.room)
                if (no < qty) {
                    for (let j of i.bookings) {
                        console.log(j.from, j.to);
                        var dateOne = search.from
                        var dateTwo = search.to
                        var searchFrom = new Date(dateOne.split("-").reverse().join("-"))
                        var searchTo = new Date(dateTwo.split("-").reverse().join("-"))
                        var checkFrom = new Date(j.from.split("-").reverse().join("-"))
                        var checkTo = new Date(j.to.split("-").reverse().join("-"))
                        if (checkFrom <= searchFrom && searchFrom <= checkTo) {
                            qty = qty - 1

                        } else if (checkFrom <= searchTo && searchTo <= checkTo) {
                            qty = qty - 1

                        } else if (searchFrom <= checkFrom && checkTo < searchTo) {
                            qty = qty - 1

                        }



                    }
                    resolve(qty)
                } else {
                    resolve(qty)
                }
            }



        })
    },
    updateProfile: (id, data) => {
        console.log(id);
        console.log(id, data);
        let response = {}
        return new Promise(async (resolve, reject) => {
            console.log("h");
            let email = await db.get().collection(collection.USER_COLLECTION).findOne({ Email: data.Email, _id: { $ne: id } })
            let number = await db.get().collection(collection.USER_COLLECTION).findOne({ mobileNumber: data.mobileNumber, _id: { $ne: id } })
            if (email && number) {
                console.log("he");
                response.updateEmailNumberError = true
                await db.get().collection(collection.USER_COLLECTION).updateOne({ _id: id }, { $set: { userName: data.userName } })
            } else if (email) {
                response.updateEmailError = true
                await db.get().collection(collection.USER_COLLECTION).updateOne({ _id: id }, { $set: { userName: data.userName, mobileNumber: data.mobileNumber } })

            } else if (number) {
                response.updateNumberError = true
                await db.get().collection(collection.USER_COLLECTION).updateOne({ _id: id }, { $set: { userName: data.userName, Email: data.Email } })
            } else {

                await db.get().collection(collection.USER_COLLECTION).updateOne({ _id: id }, {
                    $set: {
                        userName: data.userName,
                        Email: data.Email,
                        mobileNumber: data.mobileNumber

                    }
                })
            }
            console.log("hel");
            let user = await db.get().collection(collection.USER_COLLECTION).findOne({ _id: id })
            console.log(user);
            response.activeNo = user.mobileNumber
            resolve(response)
        })
    },
    updatePassword: (id, data) => {
        let response = {}
        return new Promise(async (resolve, reject) => {
            console.log("up");
            let user = await db.get().collection(collection.USER_COLLECTION).findOne({ _id: ObjectId(id) })
            bcrypt.compare(data.currentPassword, user.Password).then(async (status) => {
                if (status) {
                    data.newPassword = await bcrypt.hash(data.newPassword, 10)
                    data.confirmNewPassword = data.newPassword
                    await db.get().collection(collection.USER_COLLECTION).updateOne({ _id: ObjectId(id) }, { $set: { Password: data.newPassword, confirmPassword: data.confirmNewPassword } })
                    console.log("upd");
                } else {
                    response.wrongPassword = true

                }
                resolve(response)
            })

        })
    },
    getUserBookings: (id) => {
        let response={}
        return new Promise(async (resolve, reject) => {
            let bookings = await db.get().collection(collection.BOOKINGS_COLLECTION).aggregate([{
                $match: { userId: id }
            }, {
                $lookup: {
                    from: collection.ROOM_COLLECTION,
                    localField: 'roomId',
                    foreignField: '_id',
                    as: "room"
                }
            }, {
                $project: { userId: 1, hotelid: 1, roomId: 1, from: 1, to: 1, days: 1, guest: 1, amount: 1, status: 1, payment: 1, category: '$room.category' }
            }, {
                $lookup: {
                    from: collection.VENDOR_COLLECTION,
                    localField: 'hotelid',
                    foreignField: '_id',
                    as: 'hotel'
                }
            }, {
                $project: { userId: 1, hotelid: 1, roomId: 1, from: 1, to: 1, days: 1, guest: 1, amount: 1, status: 1, payment: 1, category: 1, hotel: '$hotel.propertyName' }
            }

            ]).toArray()
            let upcoming = []
            let CheckedOut = []
            let CheckedIn = []
            let today = []
            for (let i of bookings) {
                let from = new Date(i.from.split("-").reverse().join("-"))
                
                let to = new Date(i.to.split("-").reverse().join("-"))
                to.setHours(12);
                console.log(from);
                console.log(to);
                date = new Date()
                date.setHours(0);
                date.setMilliseconds(0)
                date.setMinutes(0)
                date.setSeconds(0)
                // date = new Date(date.split(' ')[0])
                console.log(date);
                if (to < date) {
                    console.log("yes");
                }
                if (to < date||i.status=="CheckedOut"||i.status=="Cancelled") {
                    CheckedOut.push(i)
                } else if (from == date) {
                    today.push(i)
                } else if (from > date && i.status!="Cancelled") {
                    upcoming.push(i)
                } else {
                    CheckedIn.push(i)
                }
            }
            response.today=today
            response.checkedIn=CheckedIn
            response.checkedOut=CheckedOut
            response.upcoming=upcoming
            
            resolve(response)
            
            
        })
    },
    cancelRoom:(id)=>{
        console.log(id);
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.BOOKINGS_COLLECTION).updateOne({_id:ObjectId(id)},{$set:{status:"Cancelled"}}).then((response)=>{
                console.log(response);
                resolve(response)
            })
        })
    },
    addToWallet:(id,amt)=>{
        
        return new Promise(async(resolve,reject)=>{
            
            let user=await db.get().collection(collection.USER_COLLECTION).findOne({_id:ObjectId(id)})
            if(user.wallet){
                let wallet=parseInt(user.wallet)+parseInt(amt)
                db.get().collection(collection.USER_COLLECTION).updateOne({_id:ObjectId(id)},{$set:{wallet:wallet}})
            }else{
                let wallet=parseInt(amt)
                db.get().collection(collection.USER_COLLECTION).updateOne({_id:ObjectId(id)},{$set:{wallet:wallet}})
            }
        })
    },
    getBookingDetails:(id)=>{
        return new Promise(async(resolve,reject)=>{
            let booking=await db.get().collection(collection.BOOKINGS_COLLECTION).findOne({_id:ObjectId(id)})
            resolve(booking)
        })
    },
    decreaseWallet:(id,amount)=>{
        return new Promise(async(resolve,reject)=>{
            let user=await db.get().collection(collection.USER_COLLECTION).findOne({_id:ObjectId(id)})
                let wallet=parseInt(user.wallet)-parseInt(amount)
                db.get().collection(collection.USER_COLLECTION).updateOne({_id:ObjectId(id)},{$set:{wallet:wallet}}).then((response)=>{
                    resolve(response)
                })
           
        })
    },
    getCoupons:(id)=>{
        return new Promise(async(resolve,reject)=>{
            console.log(id);
            
            let users=await db.get().collection(collection.USER_COLLECTION).find({}).toArray()
            let coupons=await db.get().collection(collection.COUPONS_COLLECTION).find({$or:[{auth:'admin'},{auth:id}]}).toArray()
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
                    let coupon=await db.get().collection(collection.COUPONS_COLLECTION).findOne({_id: i._id})
                    await db.get().collection(collection.COUPONS_COLLECTION).deleteOne({ _id: i._id }).then(async()=>{
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
                }
            }
            coupons=await db.get().collection(collection.COUPONS_COLLECTION).find({$or:[{auth:'admin'},{auth:id}]}).toArray()
            resolve(coupons)
        })
    },
    getOffers:()=>{
        return new Promise(async(resolve,reject)=>{
            let offers=await db.get().collection(collection.OFFERS_COLLECTION).find({}).toArray()
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
             offers=await db.get().collection(collection.OFFERS_COLLECTION).find({}).toArray()
            resolve(offers)
        })
    },
    addCouponUser:(id,coupon)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.USER_COLLECTION).updateOne({_id:ObjectId(id)},{ $push: { coupons: coupon } })

        })
    },
    addReview:(id,review)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.ROOM_COLLECTION).updateOne({_id:id},{$push:{review:review}})
        })
    },
    getCoupon:(name)=>{
        return new Promise(async(resolve,reject)=>{
            let coupon=await db.get().collection(collection.COUPONS_COLLECTION).findOne({couponCode:name})
            resolve(coupon)
        })
    },
    getLocations:()=>{
        return new Promise(async(resolve,reject)=>{
           let location=await db.get().collection(collection.VENDOR_COLLECTION).aggregate([{
               $group:{_id:"$Location"}
           }]).toArray()
           resolve(location)
           console.log(location);
        })
    }


}             