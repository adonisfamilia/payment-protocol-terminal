var bitcore = require('bitcore');
var PaymentProtocol = require('bitcore-payment-protocol');
var explorers = require('bitcore-explorers');
var express = require('express');
var bodyParser = require('body-parser');
var qrcode = require('qrcode-terminal');

var app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

bitcore.Networks.defaultNetwork = bitcore.Networks.testnet;

var insight = new explorers.Insight();
var Script = bitcore.Script;

var privKey = new bitcore.PrivateKey();
var address = privKey.toAddress();

var uri = "http://example.com/";
var qrUri = "bitcoin:?r=" + uri;

var rawbody;

app.get("/", function(req, res){
  res.send('Payment Protocol Terminal');
});

app.post("/total", function(req, res){
  var now = Date.now() / 1000 | 0;
  var script = Script.buildPublicKeyHashOut(address);

  var amountBTC =  req.body['amount'];

  var outputs = new PaymentProtocol.Output({
    amount: amountBTC,
    script: script.toBuffer()
  });

  var details = new PaymentProtocol().makePaymentDetails();

  details.set('network', 'test');
  details.set('outputs', outputs);
  details.set('time', now);
  details.set('expires', now + 60 * 60 * 24);
  details.set('memo', 'A payment request from the merchant.');
  details.set('payment_url', uri);


  var request = new PaymentProtocol().makePaymentRequest();
  request.set('payment_details_version', 1);
  request.set('pki_type', "none");
  request.set('pki_data', "Test Payment Server")
  request.set('serialized_payment_details', details.serialize());

  rawbody = request.serialize();

  console.log("Your total is " + amountBTC + " BTC");
  qrcode.generate(qrUri);

  res.send("Total of " + amountBTC);

});

app.get("/invoice", function(req, res){
  res.set({
  'Content-Type': PaymentProtocol.PAYMENT_REQUEST_CONTENT_TYPE,
  'Content-Length': rawbody.length,
  });
  res.send(rawbody);
});

app.listen(3000, function(){
  console.log("Server listening on port 3000");
});
