$(document).ready(function(){
    

    jQuery.validator.addMethod('mypassword', function(value, element) 
{
   return this.optional(element) || (value.match(/[a-zA-Z]/) && value.match(/[0-9]/));
});
jQuery.validator.addMethod('myemail', function(value, element) 
{
   return this.optional(element) || /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test( value );
});
        $("#addroom").validate({
            rules:{
                price:{
                    required:true,
                    
                },
                quantity:{
                    required:true,
                    
                },
                bed:{
                    required:true,
                   
                }
                
            },
            messages:{ 
               
                price:{
                    required:"should add price",
                    
                },
                quantity:{
                    required:"Should add number of rooms",
                    
                },
                bed:{
                    required:"should add price per extra bed",
                   
                }
            },
            
            
        })
        
    }) 
