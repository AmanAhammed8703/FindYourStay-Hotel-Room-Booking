var express = require('express');
const help = require('nodemon/lib/help');
const { response } = require('../app');
var router = express.Router();
var helper = require('../helper/vendorHelper')



/* GET users listing. */
router.get('/', function (req, res, next) {
    if (req.session.vendor) {
        res.redirect('vendor/vendorHome');
    } else {
        res.render('vendor/vendorLogin',{vendorlogErr:req.session.vendorLogErr,notApproved:req.session.notApproved,vendorBlock:req.session.vendorBlock})
        req.session.vendorLogErr=false
        req.session.notApproved=false
        req.session.vendorBlock=false
    }

});
router.get('/Dash',(req,res)=>{
    res.render('vendor/vendorDash',{admintemp:true})
})
router.get('/vendorHome', function (req, res, next) {
    if (req.session.vendor) {
        res.render('vendor/vendorDash',{vendortemp:true});
    } else {
        res.render('vendor/vendorLogin')
    }
    
});
router.get('/addRoom/', function (req, res, next) {
    let type=req.query.type
    console.log(type);

    if (req.session.vendor) {
        helper.matchRooms(req.session.vendorId,type).then((response)=>{
            if(response=="empty"){
                res.render('vendor/addRoom',{vendortemp:true,type});
            }else{
                console.log(response);
                res.render('vendor/addCount',{vendortemp:true,roomData:response})
            }
        })
        
        
    } else {
        res.render('vendor/vendorLogin',{vendorLogErr:req.session.vendorLogErr})
        req.session.vendorLogErr=false
    }
  
    
});
router.post('/addCount/',(req,res)=>{
    roomid=req.query.id
    
    console.log(req.body);
    
    helper.addCount(req.session.vendorId,roomid,req.body).then(()=>{
        res.redirect('/vendor/vendorHome')
        if(req.files){
        if(req.files.roomImage1){
            let image1=req.files.roomImage1
            image1.mv('./public/vendor-room-images/' + roomid + '1.jpeg')
        }
        if(req.files.roomImage2){
            let image2=req.files.roomImage2
            image2.mv('./public/vendor-room-images/' + roomid + '2.jpeg')
        }
        if(req.files.roomImage3){
            let image3=req.files.roomImage3
            image3.mv('./public/vendor-room-images/' + roomid + '3.jpeg')
        }
        if(req.files.roomImage4){
            let image4=req.files.roomImage4
            image4.mv('./public/vendor-room-images/' + roomid + '4.jpeg')
        }
    }
    })
})
router.get('/showRooms',async(req,res)=>{
    let rooms={}
    await helper.getRooms(req.session.vendorId).then((response)=>{
        rooms=response
    })
    res.render('vendor/showRooms',{rooms,vendortemp:true})
})
router.get('/vendorSignup', function (req, res, next) {
    if (req.session.vendor) {
        res.render('vendor/vendorHom');
    } else {
        res.render('vendor/vendorSignup',{vendorErr:req.session.vendorErr})
        req.session.vendorErr=false
    }

    
});
router.post('/vendorSignup', function (req, res, next) {
    helper.doSignup(req.body).then((response) => {
        if (response.exist) {
            req.session.vendorErr=true
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
            req.session.vendorId =response.id
            console.log("done")
            req.session.vendor = true
            res.redirect('/vendor/vendorHome')
        }else{
            req.session.vendorLogErr=response.vendorLogErr
            req.session.notApproved=response.notApproved
            req.session.vendorBlock=response.vendorBlock
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
router.get('/roomView/',(req,res)=>{
    let id=req.query.id
    helper.getRoomDetails(id).then((response)=>{
        
        res.render('vendor/vendorRoomView',{rooms:response,vendortemp:true})
    })
})


module.exports = router;
