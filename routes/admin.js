var express = require('express');
const { response } = require('../app');
var router = express.Router();
var helper = require('../helper/adminHelper')
var fs = require('fs')


var nodemailer = require('nodemailer');
const { Db } = require('mongodb');
const async = require('hbs/lib/async');


const loginVerify = (req, res, next) => {
  if (req.session.admin) {
    console.log("yes");
    next()
  } else {
    console.log("noooo");
    res.redirect('/admin')

  }
}

/* GET users listing. */
router.get('/', async function (req, res, next) {
  if (req.session.admin) {
    let counts = await helper.dashCounts()
    let most = await helper.mostBooked()
    let average = await helper.averageData()
    let lastBookings = await helper.lastBookings()
    res.render('admin/adminDash', { admintemp: true, counts, most, average, lastBookings })
  } else {
    res.render('admin/adminLogin', { admin: true, adminerr: req.session.adminerr });
    req.session.adminerr = false
  }
});
router.get('/adminHotel',loginVerify, function (req, res) {
  helper.getHotel().then((hotel) => {
    console.log(hotel)
    res.render('admin/adminHotel', { hotel, admintemp: true });
  })


});


router.post('/adminLogin',loginVerify, (req, res) => {
  helper.doLogin(req.body).then((response) => {
    if (response.admin) {
      req.session.admin = true
      res.redirect('/admin')
    } else {
      req.session.adminerr = true
      res.redirect('/admin')
    }


  })
})
router.get('/hotelView/',loginVerify, async (req, res) => {
  let id = req.query.id

  let hotel = await helper.getOneData(id)
  let rooms = await helper.getRooms(id)
  console.log(rooms);
  res.render('admin/hotelView', { hotel, rooms, admintemp: true })
})
router.get('/roomView/',loginVerify, async (req, res) => {
  let id = req.query.id
  let rooms = await helper.getOneRoom(id)
  let hotel = await helper.getOneData(rooms.hotelId)
  console.log(rooms);
  res.render('admin/roomView', { hotel, rooms, admintemp: true })

})
router.get('/deleteHotel/',loginVerify, (req, res) => {
  let id = req.query.id
  console.log(id);
  helper.deleteHotel(id).then(() => {
    fs.unlinkSync('./public/vendor-license/' + id + '.jpeg')
    res.redirect('/admin/adminHotel')
  })
})
router.get('/rejectHotel',loginVerify, async (req, res) => {
  let response = {}
  let id = req.query.id
  console.log(id);
  await helper.getOneData(id).then((resp) => {
    response = resp
  })
  console.log(response);
  helper.sendRejectMail(response.Email)

  helper.deleteHotel(id).then(() => {
    res.redirect('/admin/hotelRequest')
  })
})
router.get('/blockHotel/',loginVerify, (req, res) => {
  let id = req.query.id
  helper.blockHotel(id).then(() => {
    res.redirect('/admin/adminHotel')
  })
})
router.get('/unblockHotel/',loginVerify, (req, res) => {
  let id = req.query.id
  helper.unblockHotel(id).then(() => {
    res.redirect('/admin/adminHotel')
  })
})
router.get('/hotelRequest',loginVerify, (req, res) => {

  helper.getRequest().then((hotel) => {
    console.log(hotel);
    res.render('admin/hotelRequest', { hotel, admintemp: true })
  })

})
router.get('/requestAccept/',loginVerify, (req, res) => {
  let id = req.query.id
  helper.requestAccept(id).then(() => {
    res.redirect('/admin/hotelRequest')
  })
})
router.get('/adminLogout',loginVerify, (req, res) => {
  req.session.admin = false
  res.redirect('/admin')
})
router.get('/adminCoupons',loginVerify, async (req, res) => {
  let coupons = await helper.getAdminCoupons()
  let couponExist = req.session.couponExist
  res.render('admin/Coupons', { admintemp: true, coupons, couponExist })
  req.session.couponExist = false
})
router.post('/addCoupons',loginVerify,async (req, res) => {
  var details = req.body
  details.auth = 'admin'
  console.log(req.body);
  helper.addCoupon(details).then((response) => {
    if (response.couponExist) {
      req.session.couponExist = true
    }
    res.redirect('/admin/adminCoupons')
  })

})
router.get('/deleteCoupon/',loginVerify, (req, res) => {
  let id = req.query.id
  helper.deleteCoupon(id).then((response) => {
    console.log(response);
    res.redirect('/admin/adminCoupons')
  })
})
router.get('/getChartData',loginVerify, async (req, res) => {
  let bookings = await helper.getChartData()
  res.json(bookings)
})
router.get('/salesReport',loginVerify, async (req, res) => {
  let from
  let to
  if (req.session.salesAdminData) {
    from = req.session.salesAdminData.fromDate
    to = req.session.salesAdminData.toDate
  } else {
    let date = new Date()
    date.setHours(5)
    date.setMinutes(30)
    date.setSeconds(0)
    date.setMilliseconds(0)
    from = new Date(date)
    console.log(from);
    from.setDate(from.getDate() - 7)
    console.log(from);
    to = new Date(date)
    to.setDate(to.getDate() - 1)
    console.log(to);
  }


  let reqBookings = []
  requestFrom = new Date(from)
  requestTo = new Date(to)
  console.log(requestFrom, requestTo);
  let bookings = await helper.getGroupedBookings()
  for (let i of bookings) {
    let from = new Date(i._id.split("-").reverse().join("-"))
    if (requestFrom <= from && from <= requestTo) {
      reqBookings.push(i)
    }
  }
  let finalBooking = []
  let diff = (requestTo - requestFrom) / (1000 * 60 * 60 * 24)
  console.log(diff);
  let checkDate = requestFrom

  for (let i = 0; i <= diff; i++) {
    console.log(checkDate);
    var k = 0
    for (let j of reqBookings) {
      let jfrom = new Date(j._id.split("-").reverse().join("-"))

      if (jfrom.getTime() == checkDate.getTime()) {
        let profit = (j.amount * 10) / 100
        j.profit = parseInt(profit)
        finalBooking.push(j)
        k = 1

      }


    }
    if (k == 0) {
      if ((checkDate.getMonth() + 1) < 10) {
        let date = checkDate.getDate() + "-0" + (checkDate.getMonth() + 1) + "-" + checkDate.getFullYear()
        if (checkDate.getDate() < 10) {
          date = "0" + checkDate.getDate() + "-0" + (checkDate.getMonth() + 1) + "-" + checkDate.getFullYear()
        }
        finalBooking.push({ _id: date, count: 0, amount: 0, profit: 0 })
      } else {
        let date = checkDate.getDate() + "-" + (checkDate.getMonth() + 1) + "-" + checkDate.getFullYear()
        if (checkDate.getDate() < 10) {
          date = "0" + checkDate.getDate() + "-" + (checkDate.getMonth() + 1) + "-" + checkDate.getFullYear()
        }

        finalBooking.push({ _id: date, count: 0, amount: 0, profit: 0 })
      }
    }
    checkDate.setDate(checkDate.getDate() + 1)
  }

  console.log(finalBooking);
  let search=req.session.salesAdminData
  req.session.salesAdminData = false
  res.render('admin/salesReport', { admintemp: true, finalBooking,search })
})
router.post('/salesReport',loginVerify, async (req, res) => {
  req.session.salesAdminData = req.body
  res.redirect('/admin/salesReport')
})
router.get('/userReport',loginVerify, async (req, res) => {
  let userReport = await helper.getGroupedUser()
  res.render('admin/userReport', { admintemp: true, userReport })
})
router.get('/vendorReport',loginVerify, async (req, res) => {
  let vendorReport = await helper.getGroupedVendor()
  res.render('admin/vendorReport', { admintemp: true, vendorReport })
})
router.get('/adminUsers',loginVerify,async(req,res)=>{
  let users=await helper.getUsers()
  res.render('admin/adminUsers',{admintemp:true,users})
})
router.get('/userBlock/',loginVerify,async(req,res)=>{
 let id=req.query.id
 console.log(id);
 await helper.blockUser(id)
 res.redirect('/admin/adminUsers')
})
router.get('/userUnblock/',loginVerify,async(req,res)=>{
 let id=req.query.id
 console.log(id);
 await helper.unblockUser(id)
 res.redirect('/admin/adminUsers')
})
module.exports = router;
