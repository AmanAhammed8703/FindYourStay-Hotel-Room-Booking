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
                        response.vendorBlock = true
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
                                response.user = false
                                resolve(response)
                            }
                        })
                    }
                } else {
                    response.notApproved = true
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
    addCount: (vendorId, roomId, data) => {
        console.log("hello");
        return new Promise(async (resolve, reject) => {
            console.log("hello");
            db.get().collection(collection.ROOM_COLLECTION).updateOne({ _id: ObjectId(roomId) }, {
                $set: {
                    "price": data.price,
                    "quantity": data.quantity,
                    "Aminity1": data.Aminity1,
                    "Aminity2": data.Aminity2,
                    "Aminity3": data.Aminity3,
                    "Aminity4": data.Aminity4,
                    "Aminity5": data.Aminity5
                }
            }).then((response) => {
                console.log(response);
                resolve("done")
            })



        })
    },
    getRooms: (id) => {
        return new Promise(async (resolve, reject) => {
            console.log(id);
            let rooms = await db.get().collection(collection.ROOM_COLLECTION).find({ hotelId: ObjectId(id) }).toArray()
            resolve(rooms)
        })
    },
    matchRooms: (id, type) => {
        console.log(id, type);
        return new Promise(async (resolve, reject) => {
            let match = await db.get().collection(collection.ROOM_COLLECTION).aggregate([{
                $match: { hotelId: ObjectId(id) }
            }, {
                $match: { category: type }
            }
            ]).toArray()
            let matchlen = match.length

            if (matchlen == 0) {
                resolve("empty")
            } else {
                resolve(match[0])
            }
        })
    },
    getRoomDetails: (id) => {
        return new Promise(async (resolve, reject) => {
            let room = await db.get().collection(collection.ROOM_COLLECTION).findOne({ _id: ObjectId(id) })
            resolve(room)
        })

    },
    todayBooking: (id) => {
        console.log(id);
        return new Promise(async (resolve, reject) => {
            let response = {}
            let bookings = await db.get().collection(collection.BOOKINGS_COLLECTION).aggregate([{
                $match: { hotelid: ObjectId(id) }

            }, {
                $lookup: {
                    from: collection.ROOM_COLLECTION,
                    localField: 'roomId',
                    foreignField: '_id',
                    as: 'roomDetails'

                }
            }, {
                $project: { userId: { $toObjectId: '$userId' }, from: 1, to: 1, days: 1, room: 1, guest: 1, amount: 1, status: 1, payment: 1, categoty: '$roomDetails.category' }
            },
            {
                $lookup: {
                    from: collection.USER_COLLECTION,
                    localField: 'userId',
                    foreignField: '_id',
                    as: 'user'
                }
            }, {
                $project: { userId: 1, from: 1, to: 1, days: 1, room: 1, guest: 1, amount: 1, status: 1, payment: 1, categoty: 1, userName: '$user.userName', userMobile: '$user.mobileNumber' }
            }]).toArray()

            // console.log(bookings);


            let today = []
            for (let i of bookings) {
                let from = new Date(i.from.split("-").reverse().join("-"))
                let to = new Date(i.to.split("-").reverse().join("-"))
                to.setHours(0);
                to.setHours(5);
                to.setMinutes(30)
                // console.log(from);
                // console.log(to);
                date = new Date()
                date.setHours(0);
                date.setHours(5);
                date.setMilliseconds(0)
                date.setMinutes(0)
                date.setMinutes(30)
                date.setSeconds(0)

                // console.log(date);
                if (from.getTime() === date.getTime() && i.status == "upcoming") {
                    today.push(i)
                    // console.log(from.getTime());
                    // console.log(date.getTime());
                }
            }
            response = today


            resolve(response)
        })
    },
    upcomingBooking: (id) => {
        console.log(id);
        return new Promise(async (resolve, reject) => {
            let response = {}
            let bookings = await db.get().collection(collection.BOOKINGS_COLLECTION).aggregate([{
                $match: { hotelid: ObjectId(id) }

            }, {
                $lookup: {
                    from: collection.ROOM_COLLECTION,
                    localField: 'roomId',
                    foreignField: '_id',
                    as: 'roomDetails'

                }
            }, {
                $project: { userId: { $toObjectId: '$userId' }, from: 1, to: 1, days: 1, room: 1, guest: 1, amount: 1, status: 1, payment: 1, categoty: '$roomDetails.category' }
            },
            {
                $lookup: {
                    from: collection.USER_COLLECTION,
                    localField: 'userId',
                    foreignField: '_id',
                    as: 'user'
                }
            }, {
                $project: { userId: 1, from: 1, to: 1, days: 1, room: 1, guest: 1, amount: 1, status: 1, payment: 1, categoty: 1, userName: '$user.userName', userMobile: '$user.mobileNumber' }
            }]).toArray()
            console.log(bookings);


            let upcoming = []
            for (let i of bookings) {
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
            response = upcoming


            resolve(response)
        })
    },
    pastBooking: (id) => {
        console.log(id);
        return new Promise(async (resolve, reject) => {
            let response = {}
            let bookings = await db.get().collection(collection.BOOKINGS_COLLECTION).aggregate([{
                $match: { hotelid: ObjectId(id) }

            }, {
                $lookup: {
                    from: collection.ROOM_COLLECTION,
                    localField: 'roomId',
                    foreignField: '_id',
                    as: 'roomDetails'

                }
            }, {
                $project: { userId: { $toObjectId: '$userId' }, from: 1, to: 1, days: 1, room: 1, guest: 1, amount: 1, status: 1, payment: 1, categoty: '$roomDetails.category' }
            },
            {
                $lookup: {
                    from: collection.USER_COLLECTION,
                    localField: 'userId',
                    foreignField: '_id',
                    as: 'user'
                }
            }, {
                $project: { userId: 1, from: 1, to: 1, days: 1, room: 1, guest: 1, amount: 1, status: 1, payment: 1, categoty: 1, userName: '$user.userName', userMobile: '$user.mobileNumber' }
            }]).toArray()
            console.log(bookings);


            let past = []
            for (let i of bookings) {
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
                if (to < date || i.status == "checkedOut") {
                    past.push(i)
                    await db.get().collection(collection.BOOKINGS_COLLECTION).updateOne({ _id: i._id }, { $set: { status: "checkedOut" } })
                }
            }
            response = past


            resolve(response)
        })
    },
    cancelRoom: (id) => {
        console.log(id);
        return new Promise((resolve, reject) => {
            db.get().collection(collection.BOOKINGS_COLLECTION).deleteOne({ _id: ObjectId(id) }).then((response) => {
                console.log(response);
                resolve(response)
            })
        })
    },
    addToWallet: (id, amt) => {
        console.log("hyhyhy" + id);
        return new Promise(async (resolve, reject) => {

            let user = await db.get().collection(collection.USER_COLLECTION).findOne({ _id: ObjectId(id) })
            console.log(user);
            if (user.wallet) {
                let wallet = parseInt(user.wallet) + parseInt(amt)
                db.get().collection(collection.USER_COLLECTION).updateOne({ _id: ObjectId(id) }, { $set: { wallet: wallet } }).then((response) => {
                    resolve(response)
                })
            } else {
                let wallet = parseInt(amt)
                db.get().collection(collection.USER_COLLECTION).updateOne({ _id: ObjedtId(id) }, { $set: { wallet: wallet } })
            }
        })
    },
    getBookingDetails: (id) => {
        console.log("id" + id);
        return new Promise(async (resolve, reject) => {
            let booking = await db.get().collection(collection.BOOKINGS_COLLECTION).findOne({ _id: ObjectId(id) })
            console.log("dkhfvbdsk=" + booking);
            resolve(booking)
        })
    },
    checkedinBooking: (id) => {
        console.log(id);
        return new Promise(async (resolve, reject) => {
            let response = {}
            let bookings = await db.get().collection(collection.BOOKINGS_COLLECTION).aggregate([{
                $match: { hotelid: ObjectId(id) }

            }, {
                $lookup: {
                    from: collection.ROOM_COLLECTION,
                    localField: 'roomId',
                    foreignField: '_id',
                    as: 'roomDetails'

                }
            }, {
                $project: { userId: { $toObjectId: '$userId' }, from: 1, to: 1, days: 1, room: 1, guest: 1, amount: 1, status: 1, payment: 1, categoty: '$roomDetails.category' }
            },
            {
                $lookup: {
                    from: collection.USER_COLLECTION,
                    localField: 'userId',
                    foreignField: '_id',
                    as: 'user'
                }
            }, {
                $project: { userId: 1, from: 1, to: 1, days: 1, room: 1, guest: 1, amount: 1, status: 1, payment: 1, categoty: 1, userName: '$user.userName', userMobile: '$user.mobileNumber' }
            }]).toArray()



            let checkedIn = []
            for (let i of bookings) {
                if (i.status == 'checkedIn') {
                    checkedIn.push(i)
                }
            }
            response = checkedIn
            //    console.log(checkedIn);

            resolve(response)
        })
    },
    statusUpdate: (id) => {
        return new Promise(async (resolve, reject) => {
            let booking = await db.get().collection(collection.BOOKINGS_COLLECTION).findOne({ _id: ObjectId(id) })
            if (booking.status == "upcoming") {
                db.get().collection(collection.BOOKINGS_COLLECTION).updateOne({ _id: ObjectId(id) }, { $set: { status: "checkedIn" } }).then((response) => {
                    resolve(response)
                })
            } else {
                let date=new Date()
                let month=date.getMonth()+1
                let daydate=date.getDate()
                let year=date.getFullYear()
                date=daydate+"-"+month+"-"+year
                db.get().collection(collection.BOOKINGS_COLLECTION).updateOne({ _id: ObjectId(id) }, { $set: { status: "checkedOut" ,to:date} }).then((response) => {
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
    addOffers: (data, id) => {
        return new Promise(async (resolve, reject) => {
            console.log(data);
            let response = {}
            let offers = await db.get().collection(collection.OFFERS_COLLECTION).findOne({ auth: ObjectId(id), offerCategory: data.offerCategory })
            console.log(offers);
            if (offers) {
                response.vendorOfferExist = true
            } else {
                await db.get().collection(collection.OFFERS_COLLECTION).insertOne(data).then(async () => {
                    console.log("added");
                    await db.get().collection(collection.ROOM_COLLECTION).updateMany({ hotelId: ObjectId(id), category: data.offerCategory }, { $set: { discount: data.offerPercentage } })
                })

            }
            resolve(response)
        })
    },
    getOffers: (id) => {
        return new Promise(async (resolve, reject) => {
            let offers = await db.get().collection(collection.OFFERS_COLLECTION).find({ auth: ObjectId(id) }).toArray()
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
                    await db.get().collection(collection.OFFERS_COLLECTION).deleteOne({ _id: i._id }).then(() => {
                        db.get().collection(collection.ROOM_COLLECTION).updateOne({ hotelId: i.auth, category: i.offerCategory }, { $unset: { discount: "" } })
                    })

                }
            }
            offers = await db.get().collection(collection.OFFERS_COLLECTION).find({ auth: ObjectId(id) }).toArray()
            resolve(offers)
        })
    },
    deleteOffers: (id) => {
        console.log(id);
        return new Promise(async (resolve, reject) => {
            let offer = await db.get().collection(collection.OFFERS_COLLECTION).findOne({ _id: ObjectId(id) })
            db.get().collection(collection.OFFERS_COLLECTION).deleteOne({ _id: ObjectId(id) }).then((response) => {
                db.get().collection(collection.ROOM_COLLECTION).updateOne({ hotelId: offer.auth, category: offer.offerCategory }, { $unset: { discount: "" } })
                resolve(response)
            })
        })
    },
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
    getProfile: (id) => {
        return new Promise(async (resolve, reject) => {
            let profile = await db.get().collection(collection.VENDOR_COLLECTION).findOne({ _id: ObjectId(id) })
            resolve(profile)
        })
    },
    vendorProfileUpdate: (id, data) => {
        return new Promise(async (resolve, reject) => {
            let response = {}
            let email = await db.get().collection(collection.VENDOR_COLLECTION).findOne({ Email: data.Email, _id: { $ne: id } })
            let mobile = await db.get().collection(collection.VENDOR_COLLECTION).findOne({ mobileNumber: data.mobileNumber, _id: { $ne: id } })
            if (email && mobile) {
                response.vendorExistEmailMobile = true
                db.get().collection(collection.VENDOR_COLLECTION).updateOne({ _id: ObjectId(id) }, {
                    $set: {
                        propertyName: data.propertyName,
                        Location: data.Location,
                        Address: data.Address,
                        Description: data.Description,

                    }
                })
            } else if (email) {
                response.vendorExistEmail = true
                db.get().collection(collection.VENDOR_COLLECTION).updateOne({ _id: ObjectId(id) }, {
                    $set: {
                        propertyName: data.propertyName,
                        mobilNumber: data.mobilNumber,
                        Location: data.Location,
                        Address: data.Address,
                        Description: data.Description,

                    }
                })

            } else if (mobile) {
                response.vendorExistMobile = true
                db.get().collection(collection.VENDOR_COLLECTION).updateOne({ _id: ObjectId(id) }, {
                    $set: {
                        propertyName: data.propertyName,
                        Email: data.Email,
                        Location: data.Location,
                        Address: data.Address,
                        Description: data.Description,

                    }
                })
            } else {
                db.get().collection(collection.VENDOR_COLLECTION).updateOne({ _id: ObjectId(id) }, {
                    $set: {
                        propertyName: data.propertyName,
                        Email: data.Email,
                        mobilNumber: data.mobilNumber,
                        Location: data.Location,
                        Address: data.Address,
                        Description: data.Description,

                    }
                })
            }
            resolve(response)


        })
    },
    updatePassword: (id, data) => {
        return new Promise(async (resolve, reject) => {
            let response = {}
            let vendor = await db.get().collection(collection.VENDOR_COLLECTION).findOne({ _id: ObjectId(id) })
            bcrypt.compare(data.currentPassword, vendor.Password).then(async (status) => {
                if (status) {
                    data.newPassword = await bcrypt.hash(data.newPassword, 10)
                    data.confirmNewPassword = data.newPassword
                    await db.get().collection(collection.VENDOR_COLLECTION).updateOne({ _id: ObjectId(id) }, { $set: { Password: data.newPassword, confirmPassword: data.confirmNewPassword } })
                    console.log("upd");
                } else {
                    response.wrongPassword = true
                    console.log("password not match");

                }
                resolve(response)
            })
        })
    },
    dashCount: (id) => {
        return new Promise(async (resolve, reject) => {
            let response = {}
            let date = new Date()
            date.setHours(5)
            date.setMinutes(30)
            date.setSeconds(0)
            date.setMilliseconds(0)
            let thisMonth = date.getMonth() + 1
            let thisYear = date.getFullYear()
            let upcoming = await db.get().collection(collection.BOOKINGS_COLLECTION).aggregate([{
                $match: { $and: [{ hotelid: id }, { status: "upcoming" }] }
            }]).toArray()


            let upcomingCount = 0
            for (let i of upcoming) {
                let from = new Date(i.from.split("-").reverse().join("-"))
                let fromMonth = from.getMonth() + 1
                let fromYear = from.getFullYear()
                if (fromMonth == thisMonth && fromYear == thisYear && from > date) {
                    upcomingCount++
                }
            }
            response.upcomingCount = upcomingCount
            let totalRevenue = 0
            let revenue = await db.get().collection(collection.BOOKINGS_COLLECTION).aggregate([{
                $match: { hotelid: id }
            },
            {
                $project: { from: 1, amount: 1, status: { $ne: ["$status", "cancelled"] } }
            }

            ]).toArray()

            for (let i of revenue) {
                let from = new Date(i.from.split("-").reverse().join("-"))

                let fromMonth = from.getMonth() + 1
                let fromYear = from.getFullYear()

                if (fromMonth == thisMonth && fromYear == thisYear) {
                    totalRevenue += parseInt(i.amount)
                }
            }
            response.totalRevenue = totalRevenue

            resolve(response)
        })
    },
    getChartData: (id) => {
        return new Promise(async (resolve, reject) => {
            let bookings = await db.get().collection(collection.BOOKINGS_COLLECTION).aggregate([{
                $match: { hotelid: id }
            },
            {
                $project: { _id: 0, from: 1 }
            }]).toArray()
            //console.log(bookings);
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
                // console.log(from);
                // console.log("month=" + fromMonth);
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
                $match: { hotelid: id }
            },
            {
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

            let monthRevenue = await db.get().collection(collection.BOOKINGS_COLLECTION).aggregate([{
                $match: { hotelid: id }
            },
            {
                $project: { from: 1, amount: 1 }
            }
            ]).toArray()
            response.amount={}
            response.amount.jan = 0
            response.amount.feb = 0
            response.amount.mar = 0
            response.amount.apr = 0
            response.amount.may = 0
            response.amount.jun = 0
            response.amount.jul = 0
            response.amount.aug = 0
            response.amount.sep = 0
            response.amount.oct = 0
            response.amount.nov = 0
            response.amount.dec = 0
            for (let i of monthRevenue) {
                let from = new Date(i.from.split("-").reverse().join("-"))
                fromYear = from.getFullYear()
                fromMonth = from.getMonth() + 1
                if (year == fromYear) {
                    if (fromMonth == 1) {
                        response.amount.jan ==response.amount.jan+parseInt(i.amount)
                    } else if (fromMonth == 2) {
                        response.amount.feb=response.amount.feb+parseInt(i.amount)
                    } else if (fromMonth == 3) {
                        response.amount.mar=response.amount.mar+parseInt(i.amount)
                    } else if (fromMonth == 4) {
                        response.amount.apr=response.amount.apr+parseInt(i.amount)
                    } else if (fromMonth == 5) {
                        response.amount.may=response.amount.may+parseInt(i.amount)
                    } else if (fromMonth == 6) {
                        response.amount.jun=response.amount.jun+parseInt(i.amount)
                    } else if (fromMonth == 7) {
                        response.amount.jul=response.amount.jul+parseInt(i.amount)
                    } else if (fromMonth == 8) {
                        response.amount.aug=response.amount.aug+parseInt(i.amount)
                    } else if (fromMonth == 9) {
                        response.amount.sep=response.amount.sep+parseInt(i.amount)
                    } else if (fromMonth == 10) {
                        response.amount.oct=response.amount.oct+parseInt(i.amount)
                    } else if (fromMonth == 11) {
                        response.amount.nov=response.amount.nov+parseInt(i.amount)
                    } else {
                        response.amount.dec=response.amount.dec+parseInt(i.amount)
                    }

                }
            }
            console.log(response.amount);
            resolve(response)
        })
    },
    lastBookings:(id)=>{
        return new Promise(async(resolve,reject)=>{
            let lastbookings=await db.get().collection(collection.BOOKINGS_COLLECTION).aggregate([{
                $match:{hotelid:id}
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
        }]).sort({_id:-1}).limit(10).toArray()
            resolve(lastbookings)
        })
    },
    getVendorBooking:(id)=>{
        return new Promise(async(resolve,reject)=>{
            
            let vendorBookings=await db.get().collection(collection.BOOKINGS_COLLECTION).aggregate([{
                $match:{hotelid:ObjectId(id)}
            },
                {
                $project:{from:1,amount:{$toInt:"$amount"}}
            },{
                $group: { _id: '$from', count: { $sum: 1 } ,amount:{$sum:"$amount"}}
                
            }]).toArray()
            
            resolve(vendorBookings)
            
        })
    },
    getToadyAvailable:(id,from,to,qty)=>{
        let hotelid=ObjectId(id)
        let availableRooms=[]
        console.log(hotelid);
        return new Promise(async(resolve,reject)=>{
            let booked=await db.get().collection(collection.ROOM_COLLECTION).aggregate([{
                $match:{hotelId:hotelid}
            },{
                $project:{_id:1,category:1,quantity:1,price:1,discount:1,bed:1}
            },{
                $lookup:{
                    from:collection.BOOKINGS_COLLECTION,
                    localField:'_id',
                    foreignField:'roomId',
                    as:"booked"
                }
            },{
                $project:{booked:"$booked",quantity:1,price:1,category:1,discount:1,bed:1}
            }]).toArray()
            
            for(let i of booked){
                let totalqty=parseInt(i.quantity)
                console.log(totalqty);
                for(let j of i.booked){

                let bookFrom=new Date(j.from.split("-").reverse().join("-"))
                let bookTo=new Date(j.to.split("-").reverse().join("-"))
                console.log(bookFrom,bookTo,from,to);
                    if(bookFrom<=from && from<=bookTo){
                        totalqty--
                    }else if(bookFrom<=to && to<=bookTo){
                        totalqty--
                    }else  if(from<bookFrom && bookTo<to){
                        totalqty--
                    }
                
                }

                console.log(totalqty,qty);
                if(totalqty>=qty){
                    console.log("yes");
                    console.log(totalqty,qty);
                    i.remaining=totalqty

                    availableRooms.push(i)
                }
            }
            console.log(availableRooms);
            resolve(availableRooms)
        })
    },
    offlineBooking:(data)=>{
        return new Promise(async(resolve,reject)=>{
            await db.get().collection(collection.BOOKINGS_COLLECTION).insertOne(data)
            resolve()
        })
    },
    getVendor:(id)=>{
        return new Promise(async (resolve,reject)=>{
            let vendor=await db.get().collection(collection.VENDOR_COLLECTION).findOne({_id:ObjectId(id)})
            resolve(vendor)
        })
    }

}