const bcrypt = require('bcrypt')
var db = require('../config/connection')
var collection = require('../config/collection')
const { reject } = require('bcrypt/promises')
var ObjectId = require('mongodb').ObjectId;
const nodemailer = require("nodemailer");
const { getMaxListeners } = require('../app');
const smtpTransport = require('nodemailer-smtp-transport');
module.exports={
    doLogin: (data) => {
        let response = {}
        return new Promise(async (resolve, reject) => {

            let user = await db.get().collection(collection.ADMIN_COLLECTION).findOne({ Email: data.Email })
            if (user) {
                bcrypt.compare(data.Password, user.Password).then((status) => {

                    if (status) {
                        response.admin=true
                        
                        console.log("login success")
                        resolve(response)
                    }
                    else {
                        console.log("login failed2")
                        response.status = false
                        resolve(response)
                    }
                })
            }else{
                response.status = false
                console.log("login failed")
                resolve(response)
                
            }
            })
    
        
    },
    getHotel:()=>{
        return new Promise(async(resolve,reject)=>{
            let hotel=await db.get().collection(collection.VENDOR_COLLECTION).find({approved:true}).toArray()
            console.log(hotel);
            resolve(hotel)
        })
    }, getRequest:()=>{
        return new Promise(async(resolve,reject)=>{
            let hotel=await db.get().collection(collection.VENDOR_COLLECTION).find({approved:false}).toArray()
            resolve(hotel)
        })
    },getOneData:(id)=>{
        
        return new Promise(async(resolve,reject)=>{
            
            let oneData=await db.get().collection(collection.VENDOR_COLLECTION).findOne({_id:ObjectId(id)})
            
            
            resolve(oneData)
        })
    
    },getRooms:(id)=>{
        return new Promise(async(resolve,reject)=>{
            console.log(id);
            let rooms=await db.get().collection(collection.ROOM_COLLECTION).find({hotelId:ObjectId(id)}).toArray()
            resolve(rooms)
        })
    },getOneRoom:(id)=>{
        return new Promise(async(resolve,reject)=>{
            console.log(id);
            let room=await db.get().collection(collection.ROOM_COLLECTION).findOne({_id:ObjectId(id)})
            console.log(room)
            resolve(room)
            
        })
    },
    deleteHotel:(id)=>{
        return new Promise((resolve,reject)=>{
            console.log(id);
             
            db.get().collection(collection.VENDOR_COLLECTION).deleteOne({_id:ObjectId(id)}).then(()=>{
                console.log("deleted");
                resolve()
            })
            db.get().collection(collection.ROOM_COLLECTION).deleteMany({hotelId:id}).then(()=>{
                console.log("rooms deleted")
                resolve()
            })

        })
    },
    blockHotel:(id)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.VENDOR_COLLECTION).updateOne({_id:ObjectId(id)},{$set:{Block:true}}).then(()=>{
                resolve()
            })
        })
    },
    unblockHotel:(id)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.VENDOR_COLLECTION).updateOne({_id:ObjectId(id)},{$set:{Block:false}}).then(()=>{
                console.log("done");
                resolve()
            })
        })
    },
    requestAccept:(id)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.VENDOR_COLLECTION).updateOne({_id:ObjectId(id)},{$set:{approved:true}}).then(()=>{
                resolve()
            })
        })
    },
    sendRejectMail:async(mail)=>{
        const output=`
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
    tls:{
        rejectUnauthorized:false
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

}