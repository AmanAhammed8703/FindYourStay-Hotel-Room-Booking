$(document).ready(function(){
    jQuery.validator.addMethod('mypassword', function(value, element) 
{
   return this.optional(element) || (value.match(/[a-zA-Z]/) && value.match(/[0-9]/));
});
jQuery.validator.addMethod('myemail', function(value, element) 
{
   return this.optional(element) || /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test( value );
});
        $("#otplogin").validate({
            rules:{
                mobileNumber:{
                    required:true,
                    minlength:10,
                    maxlength:10,
                    digits:true
                }
                
            },
            messages:{
               
                mobileNumber:{
                    required:"Enter your mobile number",
                    digits:"Must be numbers",
                    minlength:"Must be 10 digits",
                    maxlength:"Must be 10 digits",
                    
                }
              
            }
            
        })
      })