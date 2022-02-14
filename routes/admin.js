var express = require('express');
const { response } = require('../app');
var router = express.Router();
var helper=require('../helper/adminHelper')
var fs=require('fs')


var nodemailer = require('nodemailer');

/* GET users listing. */
router.get('/', function(req, res, next) {
  if(req.session.admin){
    res.redirect('/admin/adminHotel')
  }else{
  res.render ('admin/adminLogin',{admin:true,adminerr:req.session.adminerr});
  req.session.adminerr=false
} 
});
router.get('/adminHotel', function(req, res) {
  helper.getHotel().then((hotel)=>{
    console.log(hotel)
    res.render ('admin/adminHotel',{hotel,admintemp:true});
  })

  
});
router.get('/admintemp',(req,res)=>{
  res.render('admin/adminTest',{admintemp:true})
})

router.post('/adminLogin',(req,res)=>{
  helper.doLogin(req.body).then((response)=>{
    if(response.admin){
      req.session.admin=true
      res.redirect('/admin/adminHotel')
    }else{
      req.session.adminerr=true
      res.redirect('/admin')
    }
    

  })
})
router.get('/hotelView/',async(req,res)=>{
  let id = req.query.id 
  
  let hotel = await helper.getOneData(id)
  let rooms = await helper.getRooms(id)
  console.log(rooms);
  res.render('admin/hotelView',{hotel,rooms,admintemp:true})
})
router.get('/roomView/',async(req,res)=>{
  let id = req.query.id 
  let rooms=await helper.getOneRoom(id)
  let hotel = await helper.getOneData(rooms.hotelId)
  console.log(rooms);
  res.render('admin/roomView',{hotel,rooms,admintemp:true})
  
})
router.get('/deleteHotel/',(req,res)=>{
  let id = req.query.id
  console.log(id);
  helper.deleteHotel(id).then(()=>{
    fs.unlinkSync('./public/vendor-license/'+id+'.jpeg')
    res.redirect('/admin/adminHotel')
  })
})
router.get('/rejectHotel',async (req,res)=>{
  let response={}
  let id = req.query.id
  console.log(id);
  await helper.getOneData(id).then((resp)=>{
    response=resp
  })
  console.log(response);
  helper.sendRejectMail(response.Email)

  helper.deleteHotel(id).then(()=>{
    res.redirect('/admin/hotelRequest')
  })
})
router.get('/blockHotel/',(req,res)=>{
  let id= req.query.id
  helper.blockHotel(id).then(()=>{
    res.redirect('/admin/adminHotel')
  })
})
router.get('/unblockHotel/',(req,res)=>{
  let id= req.query.id
  helper.unblockHotel(id).then(()=>{
    res.redirect('/admin/adminHotel')
  })
})
router.get('/hotelRequest',(req,res)=>{

  helper.getRequest().then((hotel)=>{
    console.log(hotel);
    res.render('admin/hotelRequest',{hotel,admintemp:true})
  })
  
})
router.get('/requestAccept/',(req,res)=>{
  let id= req.query.id
  helper.requestAccept(id).then(()=>{
    res.redirect('/admin/hotelRequest')
  })
})
router.get('/adminLogout',(req,res)=>{
  req.session.admin=false
  res.redirect('/admin')
})
module.exports = router;
