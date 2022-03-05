var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var session=require('express-session')
var MongoDBStore = require('connect-mongodb-session')(session);
var db=require('./config/connection')
var fileupload=require('express-fileupload')
require('dotenv').config()
var userRouter = require('./routes/user');
var adminRouter = require('./routes/admin');
var vendorRouter = require('./routes/vendor');
const hbs = require('hbs');


var app = express();
var store = new MongoDBStore({
  uri: 'mongodb+srv://aman_ahammed:Encrypted1@findyourstay.xyxdl.mongodb.net/project?retryWrites=true&w=majority',
  collection: 'Sessions'
});
store.on('error', function(error) {
  console.log(error);
});
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');
hbs.registerHelper('ifEquals', function(arg1, arg2, options) {
  return (arg1 == arg2) ? options.fn(this) : options.inverse(this);
});
hbs.registerPartials(__dirname + '/views/partials', function (err) {});

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({secret:"key",cookie:{maxAge:2628002880,sameSite:'lax'}, store: store,
// Boilerplate options, see:
// * https://www.npmjs.com/package/express-session#resave
// * https://www.npmjs.com/package/express-session#saveuninitialized
resave: true,
saveUninitialized: true}))
app.use(function(req, res, next) { res.header('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0'); next(); });
app.use(fileupload())

db.connect((err)=>{
  if(err) console.log("connection error!")
  else console.log("Database connected") 
})



app.use('/', userRouter);
app.use('/admin', adminRouter);
app.use('/vendor', vendorRouter);


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
