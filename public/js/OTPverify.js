$(document).ready(function(){
    jQuery.validator.addMethod('mypassword', function(value, element) 
{
   return this.optional(element) || (value.match(/[a-zA-Z]/) && value.match(/[0-9]/));
});
jQuery.validator.addMethod('myemail', function(value, element) 
{
   return this.optional(element) || /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test( value );
});
        $("#otpverify").validate({
            rules:{
                otp:{
                    required:true,
                    minlength:6,
                    maxlength:6,
                    digits:true
                }
                
            },
            messages:{
               
                otp:{
                    required:"Enter your OTP",
                    digits:"Must be numbers",
                    minlength:"Must be 6 digits",
                    maxlength:"Must be 6 digits",
                    
                }
              
            }
            
        })
      })