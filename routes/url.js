'use strict';
const express = require('express');
const random = require('randomstring');

var router = express.Router();

module.exports = function (db, config){
  
  router.get('/:code', function(req,res,next){
    let sites = db.collection('sites');
    sites.findOne({code: req.params.code})
      .then((result) => {res.redirect(result.url)})
      .catch((err)=>{throw err;})
  });

  router.get('/new/:URL*', function(req, res, next){
    let url = req.url.slice(5);
    if(!validateUrl(url)){
      res.send({"error": "URL Invalid"});
      return;
    }
    let sites = db.collection('sites');
    sites.findOne({url: url})
      .then((result) => {
        if (result){
          res.send({ "original_url": url, "short_url": '' + config.appURL + '/' + result.code });
          next();
        }
        return genCode();
      })
      .then((newCode) => {
        sites.findOne({code: newCode}, function(err, result){
          if (err) throw err;
          if (result){
            sites.updateOne({code: newCode}, {$set: {url: url}});
          }else{
            sites.insertOne({url: url, code:newCode});
          }
          res.send({ "original_url": url, "short_url": '' + config.appURL + '/' + newCode })
        })
      })
      .catch((err) => {throw err;})
  });
  
  return router;

}

function validateUrl(value) {
  return /^(?:(?:(?:https?|ftp):)?\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:[/?#]\S*)?$/i.test(value);
}

function genCode(){
  return random.generate(4);
}
