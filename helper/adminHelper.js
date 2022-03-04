const bcrypt = require('bcrypt')
var db = require('../config/connection')
var collection = require('../config/collection')
const { reject } = require('bcrypt/promises')
var ObjectId = require('mongodb').ObjectId;
const nodemailer = require("nodemailer");
const { getMaxListeners, response } = require('../app');
const smtpTransport = require('nodemailer-smtp-transport');
const { COUPONS_COLLECTION } = require('../config/collection');
const req = require('express/lib/request');
module.exports = {
    doLogin: (data) => {
        let response = {}
        return new Promise(async (resolve, reject) => {

            let user = await db.get().collection(collection.ADMIN_COLLECTION).findOne({ Email: data.Email })
            if (user) {
                bcrypt.compare(data.Password, user.Password).then((status) => {

                    if (status) {
                        response.admin = true

                        console.log("login success")
                        resolve(response)
                    }
                    else {
                        console.log("login failed2")
                        response.status = false
                        resolve(response)
                    }
                })
            } else {
                response.status = false
                console.log("login failed")
                resolve(response)

            }
        })


    },
    getHotel: () => {
        return new Promise(async (resolve, reject) => {
            let hotel = await db.get().collection(collection.VENDOR_COLLECTION).find({ approved: true }).toArray()
            console.log(hotel);
            resolve(hotel)
        })
    }, getRequest: () => {
        return new Promise(async (resolve, reject) => {
            let hotel = await db.get().collection(collection.VENDOR_COLLECTION).find({ approved: false }).toArray()
            resolve(hotel)
        })
    }, getOneData: (id) => {

        return new Promise(async (resolve, reject) => {

            let oneData = await db.get().collection(collection.VENDOR_COLLECTION).findOne({ _id: ObjectId(id) })


            resolve(oneData)
        })

    }, getRooms: (id) => {
        return new Promise(async (resolve, reject) => {
            console.log(id);
            let rooms = await db.get().collection(collection.ROOM_COLLECTION).find({ hotelId: ObjectId(id) }).toArray()
            resolve(rooms)
        })
    }, getOneRoom: (id) => {
        return new Promise(async (resolve, reject) => {
            console.log(id);
            let room = await db.get().collection(collection.ROOM_COLLECTION).findOne({ _id: ObjectId(id) })
            console.log(room)
            resolve(room)

        })
    },
    deleteHotel: (id) => {
        return new Promise((resolve, reject) => {
            console.log(id);

            db.get().collection(collection.VENDOR_COLLECTION).deleteOne({ _id: ObjectId(id) }).then(() => {
                console.log("deleted");
                resolve()
            })
            db.get().collection(collection.ROOM_COLLECTION).deleteMany({ hotelId: id }).then(() => {
                console.log("rooms deleted")
                resolve()
            })

        })
    },
    blockHotel: (id) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.VENDOR_COLLECTION).updateOne({ _id: ObjectId(id) }, { $set: { Block: true } }).then(() => {
                resolve()
            })
        })
    },
    unblockHotel: (id) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.VENDOR_COLLECTION).updateOne({ _id: ObjectId(id) }, { $set: { Block: false } }).then(() => {
                console.log("done");
                resolve()
            })
        })
    },
    requestAccept: (id) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.VENDOR_COLLECTION).updateOne({ _id: ObjectId(id) }, { $set: { approved: true } }).then(() => {
                resolve()
            })
        })
    },
    sendRejectMail: async (mail) => {
        const output = `
        <h3>Your hotel signup request is rejected</h3>

        <p>Please verify your credentials</p
        `;

        // create reusable transporter object using the default SMTP transport
        let transporter = nodemailer.createTransport(smtpTransport({
            host: "smtp.gmail.com",
            port: 587,
            secure: false, // true for 465, false for other ports
            auth: {
                user: 'amanahammedkt@gmail.com', // generated ethereal user
                pass: 9847406469, // generated ethereal password
            },
            tls: {
                rejectUnauthorized: false
            }
        }));

        // send mail with defined transport object
        let info = await transporter.sendMail({
            from: '"Find your stay" <amanahammedkt@gmail.com>', // sender address
            to: mail, // list of receivers
            subject: "Hello ✔", // Subject line 
            text: "Hello world?", // plain text body
            html: output, // html body
        });

        console.log("Message sent: %s", info.messageId);
        // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>

        // Preview only available when sending through an Ethereal account
        console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
        // Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...
    }
    ,
    addCoupon: (data) => {
        return new Promise(async (resolve, reject) => {
            let response = {}
            let coupons = await db.get().collection(collection.COUPONS_COLLECTION).findOne({ couponCode: data.couponCode })
            console.log(coupons);
            if (coupons) {
                response.couponExist = true
            } else {
                await db.get().collection(collection.COUPONS_COLLECTION).insertOne(data)

            }
            resolve(response)
        })
    },
    getAdminCoupons: () => {
        return new Promise(async (resolve, reject) => {
            let coupons = await db.get().collection(collection.COUPONS_COLLECTION).find({ auth: "admin" }).toArray()
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
            coupons = await db.get().collection(collection.COUPONS_COLLECTION).find({ auth: "admin" }).toArray()
            resolve(coupons)
        })
    },
    deleteCoupon: (id) => {
        console.log(id);
        return new Promise(async (resolve, reject) => {
            let coupon = await db.get().collection(collection.COUPONS_COLLECTION).findOne({ _id: ObjectId(id) })
            let users = await db.get().collection(collection.USER_COLLECTION).find({}).toArray()
            db.get().collection(collection.COUPONS_COLLECTION).deleteOne({ _id: ObjectId(id) }).then(async (response) => {
                resolve(response)
                for (let i in users) {
                    if (users[i].coupons) {
                        for (let j in users[i].coupons) {
                            if (users[i].coupons[j] == coupon.couponCode) {
                                await db.get().collection(collection.USER_COLLECTION).updateOne({ _id: users[i]._id }, { $pull: { coupons: coupon.couponCode } })
                            }
                        }
                    }
                }
            })
        })
    },
    dashCounts: () => {
        return new Promise(async (resolve, reject) => {
            let response = {}
            let userCount = await db.get().collection(collection.USER_COLLECTION).count({})
            let vendorCount = await db.get().collection(collection.VENDOR_COLLECTION).count({})
            let roomCount = await db.get().collection(collection.ROOM_COLLECTION).aggregate([{
                $project: {
                    quantity: { $toInt: '$quantity' }
                }

            }]).toArray()
            let totalRoom = 0
            for (let i of roomCount) {
                totalRoom += i.quantity
            }
            console.log(totalRoom);
            response.userCount = userCount
            response.vendorCount = vendorCount
            response.roomCount = totalRoom
            console.log(userCount);
            let ProfitOfTheMonth = await db.get().collection(collection.BOOKINGS_COLLECTION).aggregate([{
                $project: {
                    from: 1,
                    amount: 1,

                }
            }]).toArray()
            let today = new Date()
            let thisMonth = today.getMonth() + 1
            let thisYear = today.getFullYear()
            let totalAmount = 0
            for (let i of ProfitOfTheMonth) {
                let from = new Date(i.from.split("-").reverse().join("-"))
                let fMonth = from.getMonth() + 1
                let fyear = from.getFullYear()
                if (thisYear == fyear) {
                    if (fMonth == thisMonth) {
                        totalAmount += parseInt(i.amount)
                    }
                }
            }
            console.log(totalAmount);
            let MonthProfit = (totalAmount * 10) / 100
            response.MonthProfit = MonthProfit


            resolve(response)
        })

    },
    getChartData: () => {
        return new Promise(async (resolve, reject) => {
            let bookings = await db.get().collection(collection.BOOKINGS_COLLECTION).aggregate([{
                $project: { _id: 0, from: 1 }
            }]).toArray()
            console.log(bookings);
            let date = new Date()
            let response = {}
            response.jan = 0
            response.feb = 0
            response.mar = 0
            response.apr = 0
            response.may = 0
            response.jun = 0
            response.jul = 0
            response.aug = 0
            response.sep = 0
            response.oct = 0
            response.nov = 0
            response.dec = 0
            let year = date.getFullYear()
            for (let i of bookings) {
                let from = new Date(i.from.split("-").reverse().join("-"))
                fromYear = from.getFullYear()
                fromMonth = from.getMonth() + 1
                console.log(from);
                console.log("month=" + fromMonth);
                if (year == fromYear) {
                    if (fromMonth == 1) {
                        response.jan = parseInt(response.jan + 1)
                    } else if (fromMonth == 2) {
                        response.feb++
                    } else if (fromMonth == 3) {
                        response.mar++
                    } else if (fromMonth == 4) {
                        response.apr++
                    } else if (fromMonth == 5) {
                        response.may++
                    } else if (fromMonth == 6) {
                        response.jun++
                    } else if (fromMonth == 7) {
                        response.jul++
                    } else if (fromMonth == 8) {
                        response.aug++
                    } else if (fromMonth == 9) {
                        response.sep++
                    } else if (fromMonth == 10) {
                        response.oct++
                    } else if (fromMonth == 11) {
                        response.nov++
                    } else {
                        response.dec++
                    }

                }
            }
            let categories = await db.get().collection(collection.BOOKINGS_COLLECTION).aggregate([{
                $lookup: {
                    from: collection.ROOM_COLLECTION,
                    localField: 'roomId',
                    foreignField: '_id',
                    as: 'roomData'

                }
            },
            {
                $project: {
                    category: '$roomData.category'
                }
            }]).toArray()
            let suite = 0
            let superD = 0
            let delux = 0
            let standard = 0
            for (let i of categories) {
                if (i.category == "Suite Room") {
                    suite++
                } else if (i.category == "Super Delux") {
                    superD++
                } else if (i.category == "Delux") {
                    delux++
                } else {
                    standard++
                }
            }
            response.suite = suite
            response.superD = superD
            response.delux = delux
            response.standard = standard

            resolve(response)
        })
    },
    mostBooked: () => {
        return new Promise(async (resolve, reject) => {
            let response = {}
            let booked = await db.get().collection(collection.BOOKINGS_COLLECTION).aggregate([{
                $group: { _id: '$hotelid', count: { $sum: 1 } }
            }, {
                $sort: { count: -1 }
            },
            {
                $limit: 1
            },
            {
                $lookup: {
                    from: collection.VENDOR_COLLECTION,
                    localField: '_id',
                    foreignField: '_id',
                    as: "hotel"
                }
            },
            {
                $project: { hotel: '$hotel.propertyName', _id: 0 }
            }
            ]).toArray()
            
            response.mostbookedHotel = booked[0].hotel[0]
            let bookedLoc = await db.get().collection(collection.BOOKINGS_COLLECTION).aggregate([{
                $lookup:{
                    from:collection.VENDOR_COLLECTION,
                    localField:'hotelid',
                    foreignField:'_id',
                    as:"hotel"
                }
            },{
                $group: { _id: '$hotel.Location', count: { $sum: 1 } }
            }, {
                $sort: { count: -1 }
            },
            {
                $limit: 1
            }]).toArray()
            response.mostLocation=bookedLoc[0]._id[0]
           console.log(response.mostLocation);
            let bookedCategory = await db.get().collection(collection.BOOKINGS_COLLECTION).aggregate([{
                $lookup: {
                    from: collection.ROOM_COLLECTION,
                    localField: 'roomId',
                    foreignField: '_id',
                    as: 'roomData'

                }
            },
            {
                $project: {
                    category: '$roomData.category'
                }
            }, {
                $group: { _id: '$category', count: { $sum: 1 } }
            }, {
                $sort: { count: -1 }
            },
            {
                $limit: 1
            }
            ]).toArray()
            response.mostCategory = bookedCategory[0]._id[0]
            
            resolve(response)
        })
    },
    averageData:()=>{
        return new Promise(async(resolve,reject)=>{
            let response={}
            let avg=await db.get().collection(collection.BOOKINGS_COLLECTION).aggregate([{
                $project:{amount:1}
            },
            {
                $project:{amount:{$toInt:"$amount"}, _id:0}
            },
            {
                $group:{_id:null,amount:{$sum:"$amount"}}
            }]).toArray()
            response.avgAmount=parseInt((avg[0].amount)/12)
            response.avgProfit=parseInt((((avg[0].amount)*10)/100)/12)
            console.log(response.avgAmount);
            let avgBooking=await db.get().collection(collection.BOOKINGS_COLLECTION).count({})
            response.avgbooking=parseInt(avgBooking/12)
            console.log(response.avgbooking);
            resolve(response)
        })
    },
    lastBookings:()=>{
        return new Promise(async(resolve,reject)=>{
            let lastbookings=await db.get().collection(collection.BOOKINGS_COLLECTION).aggregate([{
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
        }]).sort({_id:-1}).limit(10).toArray()
            resolve(lastbookings)
        })
    },
    getGroupedBookings:()=>{
        return new Promise(async(resolve,reject)=>{
            let bookings=await db.get().collection(collection.BOOKINGS_COLLECTION).aggregate([{
                $project:{from:1,amount:{$toInt:"$amount"}}
            },{
                $group: { _id: '$from', count: { $sum: 1 } ,amount:{$sum:"$amount"}}
                
            }]).toArray()
            resolve(bookings)
        })
    },
    getGroupedUser:()=>{
        return new Promise(async(resolve,reject)=>{
            let users=await db.get().collection(collection.BOOKINGS_COLLECTION).aggregate([{
                    $project:{userId:1,amount:{$toInt:"$amount"}}
            },
                {
                $group:{_id:"$userId", count: { $sum: 1 } ,amount:{$sum:"$amount"}}
            },{
                $project:{_id:{$toObjectId:"$_id"},count:1,amount:1}
            },
        {
            $lookup:{
                from:collection.USER_COLLECTION,
                localField:"_id",
                foreignField:"_id",
                as:"user"
            }
        },{
            $project:{_id:1,count:1,amount:1,userName:"$user.userName",userMobile:"$user.mobileNumber",userEmail:"$user.Email"}
        }]).toArray()
            console.log(users);
            resolve(users)
        })
    },
    getGroupedVendor:()=>{
        return new Promise(async(resolve,reject)=>{
            let vendors=await db.get().collection(collection.BOOKINGS_COLLECTION).aggregate([{
                    $project:{hotelid:1,amount:{$toInt:"$amount"}}
            },
                {
                $group:{_id:"$hotelid", count: { $sum: 1 } ,amount:{$sum:"$amount"}}
            },{
                $project:{_id:{$toObjectId:"$_id"},count:1,amount:1}
           },
        {
            $lookup:{
                from:collection.VENDOR_COLLECTION,
                localField:"_id",
                foreignField:"_id",
                as:"vendor"
            }
        },{
            $project:{_id:1,count:1,amount:1,vendorName:"$vendor.propertyName",vendorMobile:"$vendor.mobileNumber",vendorEmail:"$vendor.Email"}
        }
         ]).toArray()
            console.log(vendors);
            resolve(vendors)
        })
    },
    getUsers:()=>{
        return new Promise(async(resolve,reject)=>{
            let users=await db.get().collection(collection.USER_COLLECTION).find({}).toArray()
            resolve(users)
        })
    },
    blockUser:(id)=>{
        console.log(id);
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.USER_COLLECTION).updateOne({_id:ObjectId(id)},{$set:{Blocked:true}}).then(()=>{
                console.log("blocked");
                resolve()
            })
        })
    }
    ,
    unblockUser:(id)=>{
        console.log(id);
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.USER_COLLECTION).updateOne({_id:ObjectId(id)},{$set:{Blocked:false}}).then(()=>{
                console.log("unblocked");
                resolve()
            })
            
        })
    }



}