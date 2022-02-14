$(document).ready(function(){
    jQuery.validator.addMethod('mypassword', function(value, element) 
{
   return this.optional(element) || (value.match(/[a-zA-Z]/) && value.match(/[0-9]/));
});
jQuery.validator.addMethod('myemail', function(value, element) 
{
   return this.optional(element) || /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test( value );
});
        $("#adminLogin").validate({
            rules:{
               
                Email:{
                    required:true,
                    myemail:true
                },
                Password:{
                    required:true,
                   
                },
              
            },
            messages:{
               
                Email:{
                    required:"Enter your email address",
                    myemail:"Enter a valid emai Id"
                },
                Password:{
                    required:"Enter the password",
                   
                },
              
            }
            
        })
      })