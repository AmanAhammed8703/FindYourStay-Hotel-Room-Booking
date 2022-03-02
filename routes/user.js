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
    console.log("yes");
    next()
  } else {
    console.log("noooo");
    res.redirect('/login')

  }
}
const isBlocked=async(req,res,next)=>{
  if(req.session.user){
  let user=await helper.getUserdetails(req.session.activeNo)
  if(req.session.user){
    if(user.Blocked){
      req.session.userBlock=true
      res.redirect('/login')
      
    }else{
      next()
    }
  }
}else{
  next()
}
  
}
/* GET home page. */
router.get('/', activeUser,async function (req, res, next) {
  
  let locations=await helper.getLocations()
  res.render('user/index', { loggedIn: req.session.user, usertemp: true, username: req.session.username,locations });
});
router.get('/login', function (req, res) {
  console.log(req.body)
  res.render('user/login', { nologin: req.session.nologin, usertemp: true,userBlock:req.session.userBlock })
  req.session.nologin = false
  req.session.userBlock=false
})
router.get('/OTPlogin', async function (req, res) {

  res.render('user/OTPlogin', { nomobile: req.session.nomobile, usertemp: true })
  req.session.nomobile = false
})
router.get('/roomDetail/', async function (req, res) {
  let locations=await helper.getLocations()
  let id = req.query.id
  let isRooms = req.session.isRooms
  req.session.roomid = id
  let search = req.session.search
  if (req.session.search) {

    var dateOne = search.from
    var dateTwo = search.to
    var date1 = new Date(dateOne.split("-").reverse().join("-"))
    var date2 = new Date(dateTwo.split("-").reverse().join("-"))

    console.log(date1);
    console.log(date2);


    var diff = date2.getTime() - date1.getTime()
    diff = diff / (1000 * 60 * 60 * 24)
    if (diff == 0) {
      diff = 1
    }

    console.log(diff);

  }


  helper.getOneRoom(id).then((response) => {

    //console.log(response);
    let details = {}
    let room = response

    if (room.discount) {

      dis = (room.price * room.discount) / 100
      disPrice = room.price - dis
      room.ogPrice = room.price
      room.price = disPrice
      room.discountAmount = dis
    }
    console.log("room");
    //console.log(room);

    let finalReviews = []
    if (room.review) {
      let review = room.review
      let reviewUser = room.reviewUser
      console.log(review);
      console.log(reviewUser);

      for (let i of review) {
        for (let j of reviewUser) {
          if (i.userId.toString() == j._id.toString()) {
            let mergedReview = {}
            mergedReview.userId = i.userId
            mergedReview.userName = j.userName
            mergedReview.review = i.review
            finalReviews.push(mergedReview)
          }
        }
      }
    }
    console.log("final");
    console.log(finalReviews);

    if (req.session.search) {
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
    } else {
      let from = new Date
      let year1 = from.getFullYear()

      let month1 = from.getMonth()
      if (month1 < 10) {
        month1 = "0" + month1
      }
      let date1 = from.getDate()
      if (date1 < 10) {
        date1 = "0" + date1
      }
      console.log(from);
      details.from = date1 + "-" + month1 + "-" + year1
      details.to = date1 + "-" + month1 + "-" + year1
      details.room = 1
      details.guest = 1
      details.total = room.price
      details.days = 1
    }
    details.id = id

    res.render('user/roomDetail', { room, search, details, isRooms, usertemp: true, loggedIn: req.session.user, username: req.session.username, finalReviews ,locations})

  })


})



router.post('/search/', async function (req, res) {
  let locations=await helper.getLocations()
  let result = []
  let room = []
  let search = req.body
  req.session.search = search


  console.log(search);
  await helper.getSearchResults(req.body).then((resp) => {

    result = resp

  })
  if (search.suite || search.superdelux || search.delux || search.standard) {
    if (search.suite) {
      for (let i of result) {
        await helper.getOneRoom(i).then((response) => {
          if (response.category == "Suite Room") {
            room.push(response)
            
          }
        })

      }
    }
    if (search.superdelux) {
      for (let i of result) {
        await helper.getOneRoom(i).then((response) => {
          if (response.category == "Super Delux") {
            room.push(response)
          }
        })

      }
    }
    if (search.delux) {
      for (let i of result) {
        await helper.getOneRoom(i).then((response) => {
          if (response.category == "Delux") {
            room.push(response)
          }
        })

      }
    }
    if (search.standard) {
      for (let i of result) {
        await helper.getOneRoom(i).then((response) => {
          if (response.category == "Standard") {
            room.push(response)
          }
        })

      }
    }
  } else {

    for (let i of result) {
      await helper.getOneRoom(i).then((response) => {
        
          room.push(response)
        
      })

    }

  }
if(search.sort){
  
  if(search.sort=="LowToHigh"){
    function lowHigh(a, b) {
      console.log("sort");
      // Use toUpperCase() to ignore character casing
      const bandA = a.price
      const bandB = b.price
    
      let comparison = 0;
      if (bandA > bandB) {
        comparison = 1;
      } else if (bandA < bandB) {
        comparison = -1;
      }
      return comparison;
    }
    
    room.sort(lowHigh);
    
  }else{
    function highLow(a, b) {
      console.log("sort");
      // Use toUpperCase() to ignore character casing
      const bandA = a.price
      const bandB = b.price
    
      let comparison = 0;
      if (bandA < bandB) {
        comparison = 1;
      } else if (bandA > bandB) {
        comparison = -1;
      }
      return comparison;
    }
    
    room.sort(highLow);
  }

}




  // for (let i of result) {
  //   await helper.getOneRoom(i).then((response) => {
  //     room.push(response)
  //   })

  // }

  for (let i of room) {
    if (i.discount) {

      dis = (i.price * i.discount) / 100
      disPrice = i.price - dis
      i.disPrice = disPrice
      i.discountAmount = dis
    }
  }
  console.log(room)

  res.render('user/all-rooms', { result: room, search: search, usertemp: true, loggedIn: req.session.user, username: req.session.username ,locations})

})
router.post('/filter',loginVerify,isBlocked, (req, res) => {
  console.log(req.body);
  req.session.filter = req.body
  res.redirect('/search')
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
      if(response.block){
        req.session.userBlock=true
      }else{
        req.session.nologin = true
      }
      
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

router.post('/bookNow/', loginVerify,isBlocked, async (req, res) => {
  let id = req.query.id
  let resp = {}

  console.log(req.body);
  await helper.getUserdetails(req.session.activeNo).then((response) => {
    console.log(response);
    resp = response
  })
  console.log(resp);
  if (resp.wallet) {
    let balance = parseInt(resp.wallet)
    if (parseInt(req.body.total) <= balance) {
      console.log(balance);
      var wallet = true
    }
  }
  helper.getOneRoom(id).then(async (response) => {
    let details = {}
    let room = response
    if (room.discount) {

      dis = (room.price * room.discount) / 100
      disPrice = room.price - dis
      room.ogPrice = room.price
      room.price = disPrice
      room.discountAmount = dis
    }
    req.session.grandTotal = room.price
    let hotelid = room.hotel[0]._id
    console.log(room)
    let coupons = await helper.getCoupons(hotelid)
    if (resp.coupons) {
      for (let i in coupons) {
        for (let j of resp.coupons) {
          if (coupons[i].couponCode == j) {
            coupons.splice(i, 1)
          }
        }
      }
    }
    console.log(coupons);
    details.from = req.body.from
    details.to = req.body.to
    details.price = req.body.price
    details.days = req.body.days
    details.room = req.body.room
    details.guest = req.body.guest
    details.total = req.body.total
    res.render('user/bookNow', { room, details, usertemp: true, loggedIn: req.session.user, username: req.session.username, wallet, coupons })
  })
})


router.get('/success/',loginVerify,isBlocked, async (req, res) => {
  let type = req.query.type
  let resp = {}
  resp = req.session.bookinDetail
  if (type == "paypal") {

    resp.hotelid = ObjectId(resp.hotelid)
    resp.roomId = ObjectId(resp.roomId)
    resp.payment = "Paypal"
    console.log(resp);
    await helper.addBooking(resp).then((response) => {
      console.log("booking confirmed");
      console.log(req.session.userId);
      var oldPath = './public/temp-id/' + req.session.userId + '.jpeg'
      var newPath = './public/id-Proof/' + response.insertedId + '.jpeg'
      if (resp.couponName) {
        helper.addCouponUser(resp.userId, resp.couponName)
      }
      fs.rename(oldPath, newPath, function (err) {
        if (err) throw err
      })
    })

  }
  res.render('user/success', { usertemp: true, loggedIn: req.session.user, resp, username: req.session.username })
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
router.get('/userProfile',loginVerify,isBlocked, (req, res) => {
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
    res.render('user/userProfile', { usertemp: true, user, emailNumber, number, email, loggedIn: req.session.user, username: req.session.username })
    req.session.updateEmailNumberError = false
    req.session.updateNumberError = false
    req.session.updateEmailError = false
  })

})
router.post('/editProfile',loginVerify,isBlocked,(req, res) => {
  user = req.body
  res.render('user/editProfile', { usertemp: true, user, loggedIn: req.session.user, username: req.session.username })
})
router.post('/updateProfile/',loginVerify, (req, res) => {
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
router.get('/updatePassword/',loginVerify,isBlocked,(req, res) => {
  let error = req.session.updatePasswordError
  let id = req.query.id
  console.log("id" + id);
  res.render('user/updatePassword', { usertemp: true, id, error, loggedIn: req.session.user, username: req.session.username })
  req.session.updatePasswordError = false
})

router.post('/updatePassword/',loginVerify,isBlocked, (req, res) => {
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
    res.redirect(`/roomDetail?id=${id}`)

  })
})
router.post('/orderRazorPay', loginVerify,async (req, res) => {
  let grandTotal = req.session.grandTotal
  console.log(req.body)
  let resp = {}
  let idProof = req.files.idproof
  if (req.body.couponName) {
    let usedCoupon = await helper.getCoupon(req.body.couponName)
    grandTotal = (req.session.grandTotal) - ((req.session.grandTotal) * (usedCoupon.couponPercentage)) / 100
    console.log(usedCoupon);
    resp.couponPercentage=usedCoupon.couponPercentage
    req.body.couponPercentage=usedCoupon.couponPercentage
  }
  if (req.files) {
    console.log("id yes");
  } else {
    console.log("id no");
  }
  // let idProof = req.files.idProof
  // idProof.mv('./public/temp-id/IidProof.jpeg')
  
  let id = req.body.roomid
  resp.userId = req.session.userId
  idProof.mv('./public/temp-id/' + resp.userId + '.jpeg')
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
  if (req.body.couponName) {
    resp.couponName = req.body.couponName
  }
  resp.amount = req.session.grandTotal
  resp.status = "upcoming"
  req.session.bookinDetail = resp



  if (req.body.walletPayment) {
    resp.payment = "Pay with wallet"

    console.log(req.body);
    console.log(resp);
    await helper.decreaseWallet(resp.userId, resp.amount).then((response) => {
      console.log("deducted");
      console.log(response);

    })

    await helper.addBooking(resp).then((inserted) => {
      console.log("booking confirmed");
      response.payWithWallet = true
      res.json(response)
      response.payWithWallet = false
      var oldPath = './public/temp-id/' + req.session.userId + '.jpeg'
      var newPath = './public/id-Proof/' + inserted.insertedId + '.jpeg'
      if (resp.couponName) {
        helper.addCouponUser(resp.userId, resp.couponName)
      }
      fs.rename(oldPath, newPath, function (err) {
        if (err) throw err
      })
    })

  } else {

    if (req.body.payment) {

      resp.payment = "Pay at Hotel"

      console.log(req.body);
      console.log(resp);

      await helper.addBooking(resp).then((inserted) => {
        console.log("booking confirmed");
        response.payAtHotel = true
        res.json(response)
        response.payAtHotel = false
        var oldPath = './public/temp-id/' + req.session.userId + '.jpeg'
        var newPath = './public/id-Proof/' + inserted.insertedId + '.jpeg'
        if (resp.couponName) {
          helper.addCouponUser(resp.userId, resp.couponName)
        }
        fs.rename(oldPath, newPath, function (err) {
          if (err) throw err
        })
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
                "price": parseInt(parseInt(grandTotal) / 75),
                "currency": "USD",
                "quantity": 1
              }]
            },
            "amount": {
              "currency": "USD",
              "total": parseInt(parseInt(grandTotal) / 75),
            },
            "description": "This is the payment description."
          }]
        };


        paypal.payment.create(create_payment_json, function (error, payment) {
          let response = {}
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
        let response = {}
        var options = {
          amount: parseInt(grandTotal) * 100,  // amount in the smallest currency unit
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
    resp.couponName = req.body['details[couponName]']
    resp.couponPercentage = req.body['details[couponPercentage]']
    resp.status = "upcoming"
    resp.payment = "Razorpay"

    console.log(req.body);
    console.log(resp);

    await helper.addBooking(resp).then((response) => {
      console.log("booking confirmed");
      var oldPath = './public/temp-id/' + req.session.userId + '.jpeg'
      var newPath = './public/id-Proof/' + response.insertedId + '.jpeg'
      if (resp.couponName) {
        console.log("yessss");
        helper.addCouponUser(resp.userId, resp.couponName)
      }
      fs.rename(oldPath, newPath, function (err) {
        if (err) throw err
      })
    })


    res.json({ paymentsuccess: true })
  } else {
    res.json({ paymentsuccess: false })
  }



})
router.get('/myBookings',loginVerify, async (req, res) => {
  let id = req.session.userId
  console.log(id);
  await helper.getUserBookings(id).then((response) => {
    let today = response.today
    let checkedIn = response.checkedIn
    let checkedOut = response.checkedOut
    let upcoming = response.upcoming
    console.log(response);
    res.render('user/mybookings', { usertemp: true, loggedIn: req.session.user, username: req.session.username, today, checkedIn, checkedOut, upcoming })

  })
})
router.get('/cancelRoom/',loginVerify,isBlocked, async (req, res) => {
  let id = req.query.id
  let amt = req.query.amt
  let payOption
  console.log(amt);
  let userId = req.session.userId
  helper.getBookingDetails(id).then((response) => {
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
  res.redirect('/myBookings')
})
router.get('/addReview', loginVerify,isBlocked,(req, res) => {
  let id = req.query.id
  res.render('user/addReview', { usertemp: true, loggedIn: req.session.user, username: req.session.username, id })
})

router.post('/addReview',loginVerify,isBlocked, (req, res) => {
  console.log(req.body);
  let id = ObjectId(req.body.roomId)
  let review = {}
  review.userId = ObjectId(req.session.userId)
  review.review = req.body.review  
  helper.addReview(id, review)
  res.redirect('/myBookings')
})



module.exports = router;
