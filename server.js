const express = require('express');
const app = express();
const bodyParser= require('body-parser')
var url = require("url");



const MongoClient = require('mongodb').MongoClient

var db



MongoClient.connect('mongodb://127.0.0.1:27017', (err, client) => {

if (err) return console.log(err)
db = client.db('database') 

var passport = require('passport')
, LocalStrategy = require('passport-local').Strategy;

app.use(passport.initialize());
app.use(passport.session());
passport.serializeUser(function(user, done) {
    done(null, user);
  });
  
passport.deserializeUser(function(user, done) {
done(null, user);
});
  
  passport.use(new LocalStrategy(
    function(username, password, done) {
        db.collection('user').findOne({ username: username }, function(err, user) {
        if (err) { return done(err); }
        if (!user) {
          return done(null, false, { message: 'Incorrect username.' });
        }
        if (user.password!=(password)) {
          return done(null, false, { message: 'Incorrect password.' });
        }
        return done(null, user);
      });
    }
  ));

app.set('view engine', 'ejs')
app.use(bodyParser.urlencoded({extended: true}))
app.use(bodyParser.json())
app.listen(3000, function() {
    console.log('listening on 3000')
  })

app.get('/login', (req, res) => {
    res.sendFile(__dirname + '/login.html')
    // Note: __dirname is directory that contains the JavaScript source code. Try logging it and see what you get!
    // Mine was '/Users/zellwk/Projects/demo-repos/crud-express-mongo' for this app.
  })


  app.post('/login',
    passport.authenticate('local' , {failureRedirect:'/login', failureFlash: false}),
    function(req, res) {
      console.log(req.user.username);
      res.redirect('/?name=' + req.user.username);
});





app.get('/', (req, res) => {
    var url_parts = url.parse(req.url, true); 
    var who=url_parts.query['name'];

    db.collection('user').findOne({ username: who }, function(err, user) {
        if(user.right=="student"){
          console.log(user.attendance)
          res.render('studentindex.ejs', {quotes: user.attendance})
        }
        else if(user.right=="teacher"){
          db.collection('user').find({  "attendance.class" : user.admin}).toArray((err, result) => {
            // renders index.ejs
            res.render('index.ejs', {data: result, course:user.admin})
          })

          
        }



    })

    db.collection('quotes').find().toArray((err, result) => {
      if (err) return console.log(err)
      // renders index.ejs
      //res.render('index.ejs', {quotes: result})
    })
  })
app.post('/quotes', (req, res) => {
    db.collection('quotes').save(req.body, (err, result) => {
        if (err) return console.log(err)
    
        console.log('saved to database')
        res.redirect('/')
      })
})

app.put('/users', (req, res) => {
    console.log(req.body.name)
    db.collection('users')
    .findOneAndUpdate({name: req.body.name}, {
      $set: {
        grade: req.body.grade
      }
    }, {
      sort: {_id: -1},
      upsert: true
    }, (err, result) => {
      if (err) return res.send(err)
      res.send(result)
    })
  })

  app.delete('/quotes', (req, res) => {
    db.collection('quotes').findOneAndDelete({name: req.body.name},
    (err, result) => {
      if (err) return res.send(500, err)
      res.send({message: 'A darth vadar quote got deleted'})
    })
  })


})