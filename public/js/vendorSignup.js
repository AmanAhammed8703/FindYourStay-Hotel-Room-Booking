$(document).ready(function(){
    

    jQuery.validator.addMethod('mypassword', function(value, element) 
{
   return this.optional(element) || (value.match(/[a-zA-Z]/) && value.match(/[0-9]/));
});
jQuery.validator.addMethod('myemail', function(value, element) 
{
   return this.optional(element) || /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test( value );
});
        $("#vendorsignup").validate({
            rules:{
                propertyName:{
                    required:true,
                    minlength:4
                },
                Email:{
                    required:true,
                    myemail:true
                },
                Password:{
                    required:true,
                    mypassword:true,
                    minlength:4
                },
                confirmPassword:{
                    required:true,
                    equalTo:'#pw'
                }, 
                mobileNumber:{
                    required:true,
                    minlength:10,
                    maxlength:10,
                    digits:true
                },
                Location:{
                    required:true,
                    minlength:4
                },
                Address:{
                    required:true,
                    
                },
                License:{
                    required:true,
                    
                },
                
            },
            messages:{
                propertyName:{
                    required:"Enter property name",
                    minlength:"Should have atleast 4 characters"
                },
                Email:{
                    required:"Enter your email address",
                    myemail:"Please enter a valid email address"
                },
                Password:{
                    required:"Enter the password",
                    mypassword:"Should contain numbers and alphabets",
                    minlength:"shoul have atleast 6 characters"
                },
                confirmPassword:{
                    required:"Confirm your password",
                    equalTo:"Password doesnt match"
                },
                mobileNumber:{
                    required:"Enter your mobile number",
                    digits:"Must be numbers",
                    minlength:"Must be 10 digits",
                    maxlength:"Must be 10 digits",
                    
                },
                Location:{
                    required:"Enter location",
                    minlength:"Should have atleast 4 characters"
                },
                Address:{
                    required:"Enter address",
                    
                },
                License:{
                    required:"Upload your license",
                    
                },
                
            },
            
            
        })
        
    }) 
