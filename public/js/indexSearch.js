$(document).ready(function(){
    jQuery.validator.addMethod('mypassword', function(value, element) 
{
   return this.optional(element) || (value.match(/[a-zA-Z]/) && value.match(/[0-9]/));
});
jQuery.validator.addMethod('myemail', function(value, element) 
{
   return this.optional(element) || /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test( value );
});
        $("#indexsearch").validate({
            rules:{
               
                location:{
                    required:true,
                    
                },
                from:{
                    required:true,
                   
                },
                to:{
                    required:true,
                   
                },
              
            },
            messages:{
               
                location:{
                    required:"Enter a location",
                    
                },
                from:{
                    required:"Enter Check in date",
                   
                },
                to:{
                    required:"Enter Check Out date",
                   
                },
              
            }
            
        })
      })