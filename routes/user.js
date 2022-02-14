const { Router, response } = require('express');
var express = require('express');
const { Db } = require('mongodb');
const help = require('nodemon/lib/help');
const { getOneRoom } = require('../helper/userHelper');
var router = express.Router();
var helper = require('../helper/userHelper')
var ObjectId = require('mongodb').ObjectId;
var fs = require('fs')
var Razorpay = require('razorpay')
var paypal = require('paypal-rest-sdk');
paypal.configure({
  'mode': 'sandbox', //sandbox or live
  'client_id': 'AYTkFhbn14OEROlHMTN87jp8ZwmJaSFSUwx05Ywcz-aKLkBVbWksuW27PhZUqS4nJRkXkfkBTmLu7op1',
  'client_secret': process.env.paypalSecrete
});
var instance = new Razorpay({
  key_id: 'rzp_test_8hOY0y9Me41Hz6',
  key_secret: process.env.razorpaySecret,
});

const serviceSID = process.env.serviceSID
const accountSID = process.env.accountSID
const authToken = process.env.authToken
const client = require('twilio')(accountSID, authToken)

const activeUser = async (req, res, next) => {
  if (req.session.activeNo) {
    await helper.getUserdetails(req.session.activeNo).then((response) => {
      req.session.userId = response._id
      req.session.username = response.userName
      console.log(req.session.userId);
    })
  }
  next()
}
const loginVerify = (req, res, next) => {
  if (req.session.user) {
    next()
  } else {
    res.redirect('/login')
    next()
  }
}
/* GET home page. */
router.get('/', activeUser, async function (req, res, next) {
  let rooms = await helper.getRoomDetails()
  console.log(rooms);
  res.render('user/index', { rooms, loggedIn: req.session.user, usertemp: true, username: req.session.username });
});
router.get('/login', function (req, res) {
  console.log(req.body)
  res.render('user/login', { nologin: req.session.nologin, usertemp: true })
  req.session.nologin = false
})
router.get('/OTPlogin', async function (req, res) {

  res.render('user/OTPlogin', { nomobile: req.session.nomobile, usertemp: true })
  req.session.nomobile = false
})
router.get('/roomDetail/', async function (req, res) {

  let id = req.query.id
  let isRooms = req.session.isRooms
  req.session.roomid = id
  let search = req.session.search
  var dateOne = search.from
  var dateTwo = search.to
  var date1 = new Date(dateOne.split("-").reverse().join("-"))
  var date2 = new Date(dateTwo.split("-").reverse().join("-"))

  console.log(date1);
  console.log(date2);


  var diff = date2.getDate() - date1.getDate()
  console.log(diff);




  helper.getOneRoom(id).then((response) => {

    console.log(response);
    let details = {}
    let room = response
    console.log(room);



    details.room = search.room
    details.guest = search.guest
    let guest = parseInt(search.guest)
    let noOfRoom = parseInt(search.room)
    let bed = 0
    if (guest > (noOfRoom * 2)) {
      bed = guest - (noOfRoom * 2)
    }
    details.bed = bed


    var total = parseInt(room.price) * parseInt(diff) * parseInt(search.room) + (bed * parseInt(room.bed))
    details.total = total
    details.days = diff
    details.id = id
    res.render('user/roomDetail', { room, search, details, isRooms, usertemp: true, loggedIn: req.session.user, username: req.session.username })
  })


})



router.post('/search', async function (req, res) {
  let result = []
  let room = []
  let search = req.body
  req.session.search = search
  console.log(search);
  await helper.getSearchResults(req.body).then((resp) => {

    result = resp

  })
  for (let i of result) {
    await helper.getOneRoom(i).then((response) => {
      room.push(response)
    })

  }
  console.log(room)

  res.render('user/all-rooms', { result: room, search: search, usertemp: true, loggedIn: req.session.user, username: req.session.username })

})
router.get('/signup', function (req, res) {

  res.render('user/signup', { exist: req.session.userExist, usertemp: true })
  console.log(req.session.userExist);
  req.session.userExist = false
})
router.get('/OTPsend', function (req, res) {

  res.render('user/OTPverify', { invalid: req.session.inavlidloginOtp, usertemp: true })
  req.session.inavlidloginOtp = false
})

router.post('/signup', function (req, res) {

  let No = req.body.mobileNumber
  let Mobile = `+91${No}`
  req.body.mobileNumber = Mobile
  console.log(req.body.mobileNumber);
  helper.getUserdetails(Mobile, req.body.Email).then((user) => {
    if (user) {
      req.session.userExist = true
      res.redirect('/signup')
    } else {
      req.session.temp = req.body

      client.verify
        .services(serviceSID)
        .verifications.create({
          to: req.body.mobileNumber,
          channel: "sms"
        }).then((resp) => {
          req.session.number = resp.to
          res.redirect('/OTPsend');
        }).catch((err) => {
          console.log(err);
        })

    }
  })
});
router.post('/otp', (req, res) => {
  let a = req.body.otp
  let number = req.session.number
  console.log(number);
  client.verify
    .services(serviceSID)
    .verificationChecks.create({
      to: number,
      code: a
    }).then(async (resp) => {
      if (resp.valid) {
        if (req.session.otp) {
          req.session.user = true
          req.session.activeNo = number
          req.session.otp = false

        } else {
          await helper.doSignUp(req.session.temp).then((response) => {
            fs.copyFile('./public/profile.png', './public/profile-picture/' + response.insertedId + '.jpeg', (err) => {
              if (err) throw err;
              console.log('source.txt was copied to destination.txt');
            });
          })
          req.session.user = true
          req.session.activeNo = number


        }
        res.redirect('/')
      } else {
        req.session.inavlidloginOtp = true
        console.log(number)
        res.redirect('/OTPsend')
      }
    }).catch((err) => {
      req.session.inavlidloginOtp = true
      res.redirect('/OTPsend')
    })
})

router.post('/login', (req, res) => {
  helper.doLogin(req.body).then((response) => {
    if (response.status) {
      console.log("done")
      req.session.user = true
      req.session.username = response.username
      req.session.activeNo = response.mobileNumber
      console.log(req.session.activeNo);
      res.redirect('/')

    } else {
      req.session.nologin = true
      res.redirect('/login')
    }

  })
})
router.get('/logout', (req, res) => {
  req.session.user = false
  res.redirect('/')

})
router.post('/otpLogin', (req, res) => {
  let No = req.body.mobileNumber
  let Mobile = `+91${No}`
  helper.getUserMobile(Mobile).then((user) => {
    if (user) {
      req.session.otp = true
      client.verify
        .services(serviceSID)
        .verifications.create({
          to: Mobile,
          channel: "sms"
        }).then((resp) => {
          req.session.number = resp.to
          res.redirect('/OTPsend');
        }).catch((err) => {
          console.log(err);
        })

    } else {
      req.session.nomobile = true
      res.redirect('/OTPlogin')

    }
  })
})
router.get('/resend', (req, res) => {
  client.verify
    .services(serviceSID)
    .verifications.create({
      to: req.session.number,
      channel: "sms"
    }).then((resp) => {

      res.redirect('/OTPsend');
    }).catch((err) => {
      console.log(err);
    })
})

router.post('/bookNow/', loginVerify, (req, res) => {
  let id = req.query.id
  console.log(req.body);

  helper.getOneRoom(id).then((response) => {
    let details = {}
    let room = response
    console.log(room)
    details.from = req.body.from
    details.to = req.body.to
    details.price = req.body.price
    details.days = req.body.days
    details.room = req.body.room
    details.guest = req.body.guest
    details.total = req.body.total
    res.render('user/bookNow', { room, details, usertemp: true, loggedIn: true, username: req.session.username })
  })
})

router.post('/book/', async (req, res) => {
  let resp = {}
  let id = req.query.id
  resp.userId = req.session.userId
  console.log(req.body);
  await helper.getOneRoom(id).then((response) => {
    resp.hotelid = response.hotel[0]._id
  })

  resp.roomId = ObjectId(id)
  resp.from = req.body.from
  resp.to = req.body.to
  resp.to = req.body.to
  resp.days = req.body.days
  resp.room = req.body.room
  resp.guest = req.body.guest
  resp.amount = req.body.total
  resp.status = "upcoming"
  if (req.body.payment) {
    resp.payment = "Pay at Hotel"
  } else {
    resp.payment = "Online"
  }
  console.log(req.body);
  console.log(resp);

  helper.addBooking(resp).then(() => {
    console.log("booking confirmed");
  })

  res.render('user/payment', { usertemp: true })

})
router.get('/success/', async(req, res) => {
  let type = req.query.type
  let resp={}
    resp = req.session.bookinDetail
  if (type == "paypal") {
    
    resp.hotelid=ObjectId(resp.hotelid)
    resp.roomId=ObjectId(resp.roomId)
    resp.payment = "Paypal"
    console.log(resp);
    await helper.addBooking(resp).then(() => {
      console.log("booking confirmed");
    }) 

  }
  res.render('user/success', { usertemp: true,loggedIn:true ,resp})
})

router.post('/roomCheck/', (req, res) => {
  let id = req.query.id
  let isRooms
  req.session.search = req.body
  console.log(req.body, id);
  helper.roomCheck(id, req.body).then((response) => {
    if (response < req.body.room) {
      isRooms = true
    } else {
      isRooms = false
    }
    req.session.isRooms = isRooms
    res.redirect(`/roomDetail?id=${id}`)
  })
})
router.get('/userProfile', (req, res) => {
  console.log(req.session.activeNo);
  helper.getUserMobile(req.session.activeNo).then((response) => {
    console.log(response);
    let user = response
    let phn = response.mobileNumber.substring(3)
    console.log(phn);
    user.mobileNumber = phn
    let emailNumber = req.session.updateEmailNumberError
    let number = req.session.updateNumberError
    let email = req.session.updateEmailError
    res.render('user/userProfile', { usertemp: true, user, emailNumber, number, email, loggedIn: true, username: req.session.username })
    req.session.updateEmailNumberError = false
    req.session.updateNumberError = false
    req.session.updateEmailError = false
  })

})
router.post('/editProfile', (req, res) => {
  user = req.body

  res.render('user/editProfile', { usertemp: true, user, loggedIn: true, username: req.session.username })
})
router.post('/updateProfile/', (req, res) => {
  let id = ObjectId(req.query.id)
  let phn = '+91' + req.body.mobileNumber
  console.log("phn" + phn);
  req.body.mobileNumber = phn
  helper.updateProfile(id, req.body).then((response) => {
    req.session.activeNo = response.activeNo
    req.session.updateEmailNumberError = response.updateEmailNumberError
    req.session.updateEmailError = response.updateEmailError
    req.session.updateNumberError = response.updateNumberError
    if (req.files) {
      let image = req.files.imgpro
      image.mv('./public/profile-picture/' + (id) + '.jpeg')
    }
    res.redirect('/userProfile')
  })


})
router.get('/updatePassword/', (req, res) => {
  let error = req.session.updatePasswordError
  let id = req.query.id
  console.log("id" + id);
  res.render('user/updatePassword', { usertemp: true, id, error, loggedIn: true, username: req.session.username })
  req.session.updatePasswordError = false
})

router.post('/updatePassword/', (req, res) => {
  let id = req.query.id
  helper.updatePassword(id, req.body).then((response) => {
    if (response.wrongPassword) {
      req.session.updatePasswordError = response.wrongPassword
      res.redirect(`/updatePassword?id=${id}`)
    } else {
      res.redirect('/userProfile')
    }
  })
})


router.get('/roomOneDetail/', (req, res) => {
  let id = req.query.id
  helper.getOneRoom(id).then((response) => {
    let room = response
    res.render('user/roomDetail', { room, usertemp: true, loggedIn: req.session.user })

  })
})
router.post('/orderRazorPay', async (req, res) => {
  console.log(req.body)

  let resp = {}
  let id = req.body.roomid
  resp.userId = req.session.userId
  console.log(req.body);
  await helper.getOneRoom(id).then((response) => {
    resp.hotelid = response.hotel[0]._id
  })

  resp.roomId = ObjectId(id)
  resp.from = req.body.from
  resp.to = req.body.to
  resp.to = req.body.to
  resp.days = req.body.days
  resp.room = req.body.room
  resp.guest = req.body.guest
  resp.amount = req.body.total
  resp.status = "upcoming"
  req.session.bookinDetail = resp





  if (req.body.payment) {

    resp.payment = "Pay at Hotel"

    console.log(req.body);
    console.log(resp);

    await helper.addBooking(resp).then(() => {
      console.log("booking confirmed");
      response.payAtHotel=true
      res.json(response)
      response.payAtHotel=false
    })
    

  } else {
    if (req.body.onlinepayment) {


      var create_payment_json = {
        "intent": "sale",
        "payer": {
          "payment_method": "paypal"
        },
        "redirect_urls": {
          "return_url": "http://localhost:3000/success?type=paypal",
          "cancel_url": "http://localhost:3000/"
        },
        "transactions": [{
          "item_list": {
            "items": [{
              "name": req.body.total,
              "sku": "item",
              "price": parseInt(parseInt(req.body.total) / 75),
              "currency": "USD",
              "quantity": 1
            }]
          },
          "amount": {
            "currency": "USD",
            "total": parseInt(parseInt(req.body.total) / 75),
          },
          "description": "This is the payment description."
        }]
      };


      paypal.payment.create(create_payment_json, function (error, payment) {
        let response={}
        if (error) {
          throw error;
        } else {
          for (let i = 0; i < payment.links.length; i++) {
            if (payment.links[i].rel === 'approval_url') {
              response.payment = payment.links[i].href
              response.paypal = true
              res.json(response)
              

              console.log(payment.links[i].href);
            }
          }
          console.log("Create Payment Response");
          console.log(payment);
        }
      });




    } else {
      let response={}
      var options = {
        amount: parseInt(req.body.total) * 100,  // amount in the smallest currency unit
        currency: "INR",
        receipt: "order_rcptid_11"
      };
      instance.orders.create(options, function (err, order) {
        if (err) {
          console.log(err);
        } else {
          console.log(order);
          response.order = order
          response.details = req.body
          res.json(response)
        }
      });
    }
  }



})
router.post('/verifypayment', async (req, res) => {
  console.log(req.body.details);
  var crypto = require("crypto");
  var expectedSignature = crypto.createHmac('sha256', 'BpksFMYUUmW9Gx160MXaehBU')
    .update(req.body['response[razorpay_order_id]'] + '|' + req.body['response[razorpay_payment_id]'])
    .digest('hex');


  if (expectedSignature === req.body['response[razorpay_signature]']) {

    let resp = {}
    let id = req.body['details[roomid]']
    resp.userId = req.session.userId
    console.log(req.body);
    await helper.getOneRoom(id).then((response) => {
      resp.hotelid = response.hotel[0]._id
    })

    resp.roomId = ObjectId(id)
    resp.from = req.body['details[from]']
    resp.to = req.body['details[to]']

    resp.days = req.body['details[days]']
    resp.room = req.body['details[room]']
    resp.guest = req.body['details[guest]']
    resp.amount = req.body['details[total]']
    resp.status = "upcoming"
    resp.payment = "Razorpay"

    console.log(req.body);
    console.log(resp);

    await helper.addBooking(resp).then(() => {
      console.log("booking confirmed");
    })


    res.json({ paymentsuccess: true })
  } else {
    res.json({ paymentsuccess: false })
  }



})
router.get('/myBookings',(req,res)=>{
  
  res.render('user/mybookings',{usertemp:true,loggedIn:true,username: req.session.username })
})





module.exports = router;
