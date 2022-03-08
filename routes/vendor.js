var express = require('express');
const help = require('nodemon/lib/help');
const { response } = require('../app');
var router = express.Router();
var helper = require('../helper/vendorHelper')
var ObjectId = require('mongodb').ObjectId;
var userhelper = require('../helper/userHelper');
const async = require('hbs/lib/async');
const { Db } = require('mongodb');
const s3= require('../helper/s3')

const loginVerify = (req, res, next) => {
    if (req.session.vendor) {
      console.log("yes");
      next()
    } else {
      console.log("noooo");
      res.redirect('/vendor')
  
    }
  }

  const isVendorBlocked=async(req,res,next)=>{
      let vendor=await helper.getVendor(req.session.vendorId)
      if(vendor.Block){
          req.session.vendor=false
          req.session.vendorBlock=true
          res.redirect('/vendor')
      }else{
          next()
      }
  }
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
router.get('/vendorHome',loginVerify,isVendorBlocked,async function (req, res, next) {
    
        let id=ObjectId(req.session.vendorId)
        let counts=await helper.dashCount(id)
        let lastBookings=await helper.lastBookings(id)
        let today=await helper.todayBooking(id)
         today=today.length
        let checkedIn=await helper.checkedinBooking(id)
        checkedIn=checkedIn.length
        console.log(checkedIn);
        res.render('vendor/vendorDash', { vendortemp: true,today,checkedIn ,counts,lastBookings});
    

});
router.get('/addRoom/',loginVerify,isVendorBlocked, function (req, res, next) {
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

    helper.addCount(req.session.vendorId, roomid, req.body).then(async() => {
        res.redirect('/vendor/vendorHome')
        if (req.files) {
            if (req.files.roomImage1) {
                let image1 = req.files.roomImage1
                await image1.mv('./public/vendor-room-images/' + roomid + '1.jpeg')
                let file = {
                    path : './public/vendor-room-images/' + roomid +'1.jpeg',
                    filename : 'vendor-room-images/'+roomid+'1.jpeg'
                  }
                  let result = await s3.upload(file)
                  console.log(result);

            }
            if (req.files.roomImage2) {
                let image2 = req.files.roomImage2
                await image2.mv('./public/vendor-room-images/' + roomid + '2.jpeg')
                let file = {
                    path : './public/vendor-room-images/' + roomid +'2.jpeg',
                    filename : 'vendor-room-images/'+roomid+'2.jpeg'
                  }
                  let result = await s3.upload(file)
                  console.log(result);
            }
            if (req.files.roomImage3) {
                let image3 = req.files.roomImage3
                await image3.mv('./public/vendor-room-images/' + roomid + '3.jpeg')
                let file = {
                    path : './public/vendor-room-images/' + roomid+'3.jpeg',
                    filename : 'vendor-room-images/'+roomid+'3.jpeg'
                  }
                  let result = await s3.upload(file)
                  console.log(result);
            }
            if (req.files.roomImage4) {
                let image4 = req.files.roomImage4
                await image4.mv('./public/vendor-room-images/' + roomid + '4.jpeg')
                let file = {
                    path : './public/vendor-room-images/' + roomid +'4.jpeg',
                    filename : 'vendor-room-images/'+roomid+'4.jpeg'
                  }
                  let result = await s3.upload(file)
                  console.log(result);
            }
        }
    })
})
router.get('/showRooms',loginVerify,isVendorBlocked, async (req, res) => {
    let rooms = {}
    await helper.getRooms(req.session.vendorId).then((response) => {
        rooms = response
    })
    res.render('vendor/showRooms', { rooms, vendortemp: true })
})
router.get('/vendorSignup', function (req, res, next) {
    if (req.session.vendor) {
        res.render('vendor/vendorHome');
    } else {
        res.render('vendor/vendorSignup', { vendorErr: req.session.vendorErr })
        req.session.vendorErr = false
    }


});
router.post('/vendorSignup', async function (req, res, next) {
   
    helper.doSignup(req.body).then(async(response) => {
        if (response.exist) {
            req.session.vendorErr = true
            res.redirect('/vendorSignup')
        } else {

            req.session.vendorId = response.insertedId
            console.log(response.insertedId);
            console.log("req=" + req.session.vendorId);

            let image = req.files.License
            await image.mv('./public/vendor-license/' + (response.insertedId) + '.jpeg')
            let file = {
                path : './public/vendor-license/' + response.insertedId + '.jpeg',
                filename : 'vendor-license/'+response.insertedId+".jpeg"
              }
              let result = await s3.upload(file)
              console.log(result);
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
router.post('/addRoom',loginVerify,isVendorBlocked, (req, res) => {
    console.log(req.body);
    helper.addRoom(req.body, req.session.vendorId).then(async(response) => {
        if (response.exist) {
            res.redirect('/vendorSignup')
        } else {


            console.log(response.insertedId);

            console.log(req.files);
            let image1 = req.files.roomImage1
            let image2 = req.files.roomImage2
            let image3 = req.files.roomImage3
            let image4 = req.files.roomImage4
            await image1.mv('./public/vendor-room-images/' + (response.insertedId) + '1.jpeg')
            await image2.mv('./public/vendor-room-images/' + (response.insertedId) + '2.jpeg')
            await image3.mv('./public/vendor-room-images/' + (response.insertedId) + '3.jpeg')
            await image4.mv('./public/vendor-room-images/' + (response.insertedId) + '4.jpeg')
            for(let i=1;i<=4;i++){

                let file = {
                    path : './public/vendor-room-images/' + response.insertedId + i+'.jpeg',
                    filename : 'vendor-room-images/'+response.insertedId+i+'.jpeg'
                  }
                  let result = await s3.upload(file)
                  console.log(result);
            }
            res.redirect('/vendor/vendorHome')
        }
    })
})
router.get('/vendorLogout', (req, res) => {
    req.session.vendor = false
    res.redirect('/vendor')
})
router.get('/roomView/',loginVerify,isVendorBlocked, (req, res) => {
    let id = req.query.id
    helper.getRoomDetails(id).then((response) => {

        res.render('vendor/vendorRoomView', { rooms: response, vendortemp: true })
    })
})
router.get('/todayBooking',loginVerify,isVendorBlocked, async (req, res) => {
    let data = []
    vendorId = req.session.vendorId
    console.log(vendorId);
    await helper.todayBooking(vendorId).then((response) => {
        data = response
        console.log(data);
    })
    res.render('vendor/todayBooking', { vendortemp: true, data })
})
router.get('/upcomingBooking',loginVerify,isVendorBlocked, async (req, res) => {
    let data = []
    vendorId = req.session.vendorId
    console.log(vendorId);
    await helper.upcomingBooking(vendorId).then((response) => {
        data = response

    })
    console.log("data" + data);
    res.render('vendor/upcomingBooking', { vendortemp: true, data })
})
router.get('/checkedinBooking',loginVerify,isVendorBlocked, async (req, res) => {
    let data = []
    vendorId = req.session.vendorId
    console.log(vendorId);
    await helper.checkedinBooking(vendorId).then((response) => {
        data = response

    })
    console.log("data" + data);
    res.render('vendor/checkedinBooking', { vendortemp: true, data })
})
router.get('/pastBooking',loginVerify,isVendorBlocked, async (req, res) => {
    let data = []
    vendorId = req.session.vendorId
    console.log(vendorId);
    await helper.pastBooking(vendorId).then((response) => {
        data = response

    })
    console.log("data" + data);
    res.render('vendor/pastBooking', { vendortemp: true, data })
})
router.get('/cancelRoom/',loginVerify,isVendorBlocked, async (req, res) => {
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
router.get('/cancelRoomToday/',loginVerify,isVendorBlocked, async (req, res) => {
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
router.get('/statusUpdate/',loginVerify,isVendorBlocked, async (req, res) => {
    let id = req.query.id

    await helper.statusUpdate(id).then((response) => {
        console.log(response);
        res.redirect('/vendor/todayBooking')
    })
})
router.get('/statusUpdateOut/',loginVerify,isVendorBlocked, async (req, res) => {
    let id = req.query.id

    await helper.statusUpdate(id).then((response) => {
        console.log(response);
        res.redirect('/vendor/checkedinBooking')
    })
})
router.get('/vendorCoupons',loginVerify,isVendorBlocked, async (req, res) => {
    let coupons = await helper.getVendorCoupons(req.session.vendorId)
    let vendorCouponExist = req.session.vendorCouponExist
    res.render('vendor/vendorCoupon', { vendortemp: true, coupons, vendorCouponExist })
    req.session.vendorCouponExist = false
})
router.post('/addCoupons',loginVerify,isVendorBlocked, async (req, res) => {
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

router.get('/vendorOffers',loginVerify,isVendorBlocked,async(req,res)=>{
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
router.get('/vendorProfile',loginVerify,isVendorBlocked,async(req,res)=>{
    let profile=await helper.getProfile(req.session.vendorId)
    let pword=req.session.wrongVendorPassword
    console.log(profile);
    res.render('vendor/vendorProfile',{vendortemp:true,profile ,pword})
    req.session.wrongVendorPassword=false
})
router.post('/editProfile',loginVerify,isVendorBlocked,(req,res)=>{
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
router.get('/changePassword',loginVerify,isVendorBlocked,(req,res)=>{
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
router.get('/vendorReport',loginVerify,isVendorBlocked,async(req,res)=>{
    let from
    let to
    if(req.session.salesUserData){
        from=req.session.salesUserData.fromDate
        to=req.session.salesUserData.toDate
    }else{
        let date=new Date()
        date.setHours(5)
        date.setMinutes(30)
        date.setSeconds(0)
        date.setMilliseconds(0)
        from=new Date(date)
        console.log(from);
        from.setDate(from.getDate()-7)
        console.log(from);
        to=new Date(date)
        to.setDate(to.getDate()-1)
        console.log(to);
    }

    
    let reqBookings = []
  requestFrom = new Date(from)
  requestTo = new Date(to)
  console.log(requestFrom, requestTo);
    let vendorBooking=await helper.getVendorBooking(req.session.vendorId)
    
    for (let i of vendorBooking) {
        let from = new Date(i._id.split("-").reverse().join("-"))
        if (requestFrom <= from && from <= requestTo) {
          reqBookings.push(i)
        }
      }
      console.log(vendorBooking);
      let finalBooking = []
      let diff = (requestTo - requestFrom) / (1000 * 60 * 60 * 24)
      console.log(diff); 
      let checkDate = requestFrom
      for (let i = 0; i <= diff; i++) {
        
        var k= 0
        for (let j of reqBookings) {
          let jfrom = new Date(j._id.split("-").reverse().join("-"))
          console.log("jfrom");
          console.log(jfrom,checkDate);
          if (jfrom.getTime() == checkDate.getTime()) {
            let afterprofit=(j.amount)-((j.amount*10)/100)
            j.afterprofit=parseInt(afterprofit)
            finalBooking.push(j)
            k = 1
            
          }
    
    
        }
        if (k == 0) {
          if((checkDate.getMonth()+1)<10){
            let date = checkDate.getDate() + "-0" + (checkDate.getMonth() + 1) + "-" + checkDate.getFullYear()
            if(checkDate.getDate()<10){
              date = "0"+checkDate.getDate() + "-0" + (checkDate.getMonth() + 1) + "-" + checkDate.getFullYear()
            }
          finalBooking.push({_id:date,count:0,amount:0,afterprofit:0})
          }else{
            let date = checkDate.getDate() + "-" + (checkDate.getMonth() + 1) + "-" + checkDate.getFullYear()
            if(checkDate.getDate()<10){
              date = "0"+checkDate.getDate() + "-" + (checkDate.getMonth() + 1) + "-" + checkDate.getFullYear()
            }
          finalBooking.push({_id:date,count:0,amount:0,afterprofit:0})
          }
        }
        checkDate.setDate(checkDate.getDate() + 1)
      }
      console.log(finalBooking);
      let search=req.session.salesUserData
      req.session.salesUserData=false
      
    res.render('vendor/salesReport',{vendortemp:true,finalBooking,search})
})
router.post('/vendorReport',async(req,res)=>{
    console.log(req.body);
    req.session.salesUserData=req.body
    res.redirect('/vendor/vendorReport')
})
router.get('/addBooking',loginVerify,async(req,res)=>{
    let from
    let to
    let quantity
    let search
    let guest
    if(req.session.vendorBooking){
         search=req.session.vendorBooking
         search.room=parseInt(search.room)
         search.guest=parseInt(search.guest)
        from=search.fromDate
        to=search.toDate
        guest=search.guest
        quantity=search.room
    }else{
         from=new Date()
        from.setHours(5)
        from.setMinutes(30)
        from.setSeconds(0)
        from.setMilliseconds(0)
         to=new Date(from)
        to.setDate(from.getDate()+1)
        guest=1
        quantity=1
    }
    let rooms=await helper.getToadyAvailable(req.session.vendorId,from,to,quantity)
    console.log(rooms);
    let diff=(new Date(to)-new Date(from))/(1000*60*60*24)
    for(let i of rooms){
        
       
        
        let totalAmount=(parseInt(i.price)*diff)+(parseInt(i.bed)*parseInt(guest))
        
        i.totalAmount=totalAmount
    }
    let checkOut=[]
    for(let i of rooms){
        let totals={}
        
        totals.hotelid=ObjectId(req.session.vendorId)
        totals.roomId=i._id
        totals.from=((from.toString()).split("-").reverse().join("-"))
        totals.to=((to.toString()).split("-").reverse().join("-"))
        totals.days=diff.toString()
        totals.room=quantity.toString()
        totals.guest=guest.toString()
        totals.amount=i.totalAmount.toString()
        totals.status="upcoming"
        totals.payment="Pay at Hotel"
        checkOut.push(totals)
    }
    console.log(rooms);
    req.session.offlineBookingsTotal=checkOut
    res.render('vendor/addBooking',{vendortemp:true,rooms,search,vendorid:ObjectId(req.session.vendorId)})
    req.session.vendorBooking=false
})
router.post('/addBooking',(req,res)=>{
    console.log(req.body);
    req.session.vendorBooking=req.body
    res.redirect('/vendor/addBooking')
})
router.get('/bookNow/',loginVerify,isVendorBlocked,async(req,res)=>{
    let id=req.query.id
    let check=req.session.offlineBookingsTotal
    console.log(check);
    
    console.log(check);
    for(let i of check){
        i.hotelid=ObjectId(i.hotelid)
    i.roomId=ObjectId(i.roomId)
        if(i.roomId==id){
            await helper.offlineBooking(i)
        }
    }
    res.redirect("/vendor")    

}) 
module.exports = router;
