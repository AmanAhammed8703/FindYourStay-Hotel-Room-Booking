var express = require('express');
const help = require('nodemon/lib/help');
const { response } = require('../app');
var router = express.Router();
var helper = require('../helper/vendorHelper')
var ObjectId = require('mongodb').ObjectId;
var userhelper = require('../helper/userHelper');
const async = require('hbs/lib/async');



/* GET users listing. */
router.get('/', function (req, res, next) {
    if (req.session.vendor) {
        res.redirect('vendor/vendorHome');
    } else {
        res.render('vendor/vendorLogin', { vendorlogErr: req.session.vendorLogErr, notApproved: req.session.notApproved, vendorBlock: req.session.vendorBlock })
        req.session.vendorLogErr = false
        req.session.notApproved = false
        req.session.vendorBlock = false
    }

});
router.get('/Dash', (req, res) => {
    
    res.render('vendor/vendorDash', { admintemp: true })
})
router.get('/vendorHome',async function (req, res, next) {
    if (req.session.vendor) {
        let id=ObjectId(req.session.vendorId)
        let counts=await helper.dashCount(id)
        let lastBookings=await helper.lastBookings(id)
        let today=await helper.todayBooking(id)
         today=today.length
        let checkedIn=await helper.checkedinBooking(id)
        checkedIn=checkedIn.length
        console.log(checkedIn);
        res.render('vendor/vendorDash', { vendortemp: true,today,checkedIn ,counts,lastBookings});
    } else {
        res.render('vendor/vendorLogin')
    }

});
router.get('/addRoom/', function (req, res, next) {
    let type = req.query.type
    console.log(type);

    if (req.session.vendor) {
        helper.matchRooms(req.session.vendorId, type).then((response) => {
            if (response == "empty") {
                res.render('vendor/addRoom', { vendortemp: true, type });
            } else {
                console.log(response);
                res.render('vendor/addCount', { vendortemp: true, roomData: response })
            }
        })


    } else {
        res.render('vendor/vendorLogin', { vendorLogErr: req.session.vendorLogErr })
        req.session.vendorLogErr = false
    }


});
router.post('/addCount/', (req, res) => {
    roomid = req.query.id

    console.log(req.body);

    helper.addCount(req.session.vendorId, roomid, req.body).then(() => {
        res.redirect('/vendor/vendorHome')
        if (req.files) {
            if (req.files.roomImage1) {
                let image1 = req.files.roomImage1
                image1.mv('./public/vendor-room-images/' + roomid + '1.jpeg')
            }
            if (req.files.roomImage2) {
                let image2 = req.files.roomImage2
                image2.mv('./public/vendor-room-images/' + roomid + '2.jpeg')
            }
            if (req.files.roomImage3) {
                let image3 = req.files.roomImage3
                image3.mv('./public/vendor-room-images/' + roomid + '3.jpeg')
            }
            if (req.files.roomImage4) {
                let image4 = req.files.roomImage4
                image4.mv('./public/vendor-room-images/' + roomid + '4.jpeg')
            }
        }
    })
})
router.get('/showRooms', async (req, res) => {
    let rooms = {}
    await helper.getRooms(req.session.vendorId).then((response) => {
        rooms = response
    })
    res.render('vendor/showRooms', { rooms, vendortemp: true })
})
router.get('/vendorSignup', function (req, res, next) {
    if (req.session.vendor) {
        res.render('vendor/vendorHom');
    } else {
        res.render('vendor/vendorSignup', { vendorErr: req.session.vendorErr })
        req.session.vendorErr = false
    }


});
router.post('/vendorSignup', function (req, res, next) {
    helper.doSignup(req.body).then((response) => {
        if (response.exist) {
            req.session.vendorErr = true
            res.redirect('/vendorSignup')
        } else {

            req.session.vendorId = response.insertedId
            console.log(response.insertedId);
            console.log("req=" + req.session.vendorId);

            let image = req.files.License
            image.mv('./public/vendor-license/' + (response.insertedId) + '.jpeg')
            res.redirect('/vendor/')
        }
    })
});
router.post('/vendorLogin', (req, res) => {
    helper.doLogin(req.body).then((response) => {
        if (response.user) {
            req.session.vendorId = response.id
            console.log("done")
            req.session.vendor = true
            res.redirect('/vendor/vendorHome')
        } else {
            req.session.vendorLogErr = response.vendorLogErr
            req.session.notApproved = response.notApproved
            req.session.vendorBlock = response.vendorBlock
            res.redirect('/vendor')
        }
    })
})
router.post('/addRoom', (req, res) => {
    console.log(req.body);
    helper.addRoom(req.body, req.session.vendorId).then((response) => {
        if (response.exist) {
            res.redirect('/vendorSignup')
        } else {


            console.log(response.insertedId);

            console.log(req.files);
            let image1 = req.files.roomImage1
            let image2 = req.files.roomImage2
            let image3 = req.files.roomImage3
            let image4 = req.files.roomImage4
            image1.mv('./public/vendor-room-images/' + (response.insertedId) + '1.jpeg')
            image2.mv('./public/vendor-room-images/' + (response.insertedId) + '2.jpeg')
            image3.mv('./public/vendor-room-images/' + (response.insertedId) + '3.jpeg')
            image4.mv('./public/vendor-room-images/' + (response.insertedId) + '4.jpeg')
            res.redirect('/vendor/vendorHome')
        }
    })
})
router.get('/vendorLogout', (req, res) => {
    req.session.vendor = false
    res.redirect('/vendor')
})
router.get('/roomView/', (req, res) => {
    let id = req.query.id
    helper.getRoomDetails(id).then((response) => {

        res.render('vendor/vendorRoomView', { rooms: response, vendortemp: true })
    })
})
router.get('/todayBooking', async (req, res) => {
    let data = []
    vendorId = req.session.vendorId
    console.log(vendorId);
    await helper.todayBooking(vendorId).then((response) => {
        data = response
        console.log(data);
    })
    res.render('vendor/todayBooking', { vendortemp: true, data })
})
router.get('/upcomingBooking', async (req, res) => {
    let data = []
    vendorId = req.session.vendorId
    console.log(vendorId);
    await helper.upcomingBooking(vendorId).then((response) => {
        data = response

    })
    console.log("data" + data);
    res.render('vendor/upcomingBooking', { vendortemp: true, data })
})
router.get('/checkedinBooking', async (req, res) => {
    let data = []
    vendorId = req.session.vendorId
    console.log(vendorId);
    await helper.checkedinBooking(vendorId).then((response) => {
        data = response

    })
    console.log("data" + data);
    res.render('vendor/checkedinBooking', { vendortemp: true, data })
})
router.get('/pastBooking', async (req, res) => {
    let data = []
    vendorId = req.session.vendorId
    console.log(vendorId);
    await helper.pastBooking(vendorId).then((response) => {
        data = response

    })
    console.log("data" + data);
    res.render('vendor/pastBooking', { vendortemp: true, data })
})
router.get('/cancelRoom/', async (req, res) => {
    let id = req.query.id
    let amt = req.query.amt
    let userId = req.query.userId
    let payOption
    console.log(amt);
    console.log(id);

    await helper.getBookingDetails(id).then((response) => {
        payOption = response.payment
    })
    await helper.cancelRoom(id).then((response) => {
        console.log('cancel confirmed');
    })
    if (payOption !== "Pay at Hotel") {
        helper.addToWallet(userId, amt).then((response) => {
            console.log(response);
        })
    }
    res.redirect('/vendor/upcomingBooking')
})
router.get('/cancelRoomToday/', async (req, res) => {
    let id = req.query.id
    let amt = req.query.amt
    let userId = req.query.userId
    let payOption
    console.log(amt);
    console.log(id);

    await helper.getBookingDetails(id).then((response) => {
        payOption = response.payment
    })
    await helper.cancelRoom(id).then((response) => {
        console.log('cancel confirmed');
    })
    if (payOption !== "Pay at Hotel") {
        helper.addToWallet(userId, amt).then((response) => {
            console.log(response);
        })
    }
    res.redirect('/vendor/todayBooking')
})
router.get('/statusUpdate/', async (req, res) => {
    let id = req.query.id

    await helper.statusUpdate(id).then((response) => {
        console.log(response);
        res.redirect('/vendor/todayBooking')
    })
})
router.get('/statusUpdateOut/', async (req, res) => {
    let id = req.query.id

    await helper.statusUpdate(id).then((response) => {
        console.log(response);
        res.redirect('/vendor/checkedinBooking')
    })
})
router.get('/vendorCoupons', async (req, res) => {
    let coupons = await helper.getVendorCoupons(req.session.vendorId)
    let vendorCouponExist = req.session.vendorCouponExist
    res.render('vendor/vendorCoupon', { vendortemp: true, coupons, vendorCouponExist })
    req.session.vendorCouponExist = false
})
router.post('/addCoupons', async (req, res) => {
    var details = req.body
    details.auth = ObjectId(req.session.vendorId)
    console.log(req.body);
    helper.addCoupon(details).then((response) => {
        if (response.vendorCouponExist) {
            req.session.vendorCouponExist = true
        }
        res.redirect('/vendor/vendorCoupons')
    })

})
router.get('/deleteCoupon/',(req,res)=>{
    let id=req.query.id
    helper.deleteCoupon(id).then((response)=>{
      console.log(response);
      res.redirect('/vendor/vendorCoupons')
    })
  })

router.get('/vendorOffers',async(req,res)=>{
    let offers=await helper.getOffers(req.session.vendorId)
    let vendorOfferExist =  req.session.vendorOfferExist
    res.render('vendor/vendorOffers',{vendortemp:true ,offers,vendorOfferExist})
    req.session.vendorOfferExist = false
})

router.post('/addOffers', async (req, res) => {
    var details = req.body
    details.auth = ObjectId(req.session.vendorId)
    console.log(req.body);
    helper.addOffers(details,req.session.vendorId).then((response) => {
        if (response.vendorOfferExist) {
            req.session.vendorOfferExist = true
        }
        res.redirect('/vendor/vendorOffers')
    })

})
router.get('/deleteOffers/',(req,res)=>{
    let id=req.query.id

    helper.deleteOffers(id).then((response)=>{
      console.log(response);
      res.redirect('/vendor/vendorOffers')
    })
  })
router.get('/vendorProfile',async(req,res)=>{
    let profile=await helper.getProfile(req.session.vendorId)
    let pword=req.session.wrongVendorPassword
    console.log(profile);
    res.render('vendor/vendorProfile',{vendortemp:true,profile ,pword})
    req.session.wrongVendorPassword=false
})
router.post('/editProfile',(req,res)=>{
    console.log(req.body);
    let profile=req.body
    
    let emailMobile=req.session.vendorExistEmailMobile
    let email=req.session.vendorExistEmail
    let mobile=req.session.vendorExistMobile
    res.render('vendor/editProfile',{vendortemp:true,profile,email,mobile,emailMobile})
    req.session.vendorExistEmailMobile=false
    req.session.vendorExistEmail=false
    req.session.vendorExistMobile=false
})
router.post('/updateProfile',async(req,res)=>{
    console.log(req.body);
    await helper.vendorProfileUpdate(req.session.vendorId,req.body).then((response)=>{

        req.session.vendorExistEmailMobile=response.vendorExistEmailMobile
        req.session.vendorExistEmail=response.vendorExistEmail
        req.session.vendorExistMobile=response.vendorExistMobile
    })
    res.redirect('/vendor/vendorProfile')
})
router.get('/changePassword',(req,res)=>{
    res.render('vendor/changePassword',{vendortemp:true})
})
router.post('/updatePassword',async(req,res)=>{
    let wrong
    console.log(req.body);
     await helper.updatePassword(req.session.vendorId,req.body).then((response)=>{
        
            req.session.wrongVendorPassword=response.wrongVendorPassword
      
    })
    res.redirect('/vendor/vendorProfile')
})
router.get('/getChartData',async(req,res)=>{
    let id=ObjectId(req.session.vendorId)
    let bookings=await helper.getChartData(id)
    res.json(bookings)
  })

module.exports = router;
