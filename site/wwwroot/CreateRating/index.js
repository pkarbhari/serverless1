const rp = require('request-promise');
const uuidv4 = require('uuid/v4');
const https = require ('https');

module.exports = function (context, req) {
  let accessKey = '510fbd146e0a49a597fed0391c779927' //process.env.SentimentAccessKey;

  
  let uri = 'westus.api.cognitive.microsoft.com';
  let path = '/text/analytics/v2.0/sentiment';
  //https://westus.api.cognitive.microsoft.com/text/analytics/v2.0
  

  context.log('JavaScript HTTP trigger function processed a request.');
  if (!(req.body && req.body.userid && req.body.productid && req.body.timestamp && req.body.locationname && req.body.usernotes)) {
    context.res = {
      status: 400,
      body: 'Need all 5 objects in body'
    };
    context.done();
  } else {
    let userId = req.body.userid;
    let productId = req.body.productid;
    let returnBody = req.body;
    context.log("user "+ userId + ", product " + productId);
    //https://serverlessohuser.trafficmanager.net/api/GetUser?userId=cc20a6fb-a91f-4192-874d-132493685376
    rp.get('https://serverlessohuser.trafficmanager.net/api/GetUser?userId=' + userId)
      .then(result => { // this should get the status code of the return so we don't have to check strings
        let res =  JSON.parse(result);
        context.log(res);
        if (!res.userId) {
          context.res = {
            status: 400,
            body: 'User Id did not work'
          };
          context.done();
        } else {
            //https://serverlessohproduct.trafficmanager.net/api/GetProduct?productId=4c25613a-a3c2-4ef3-8e02-9c335eb23204
          rp.get('https://serverlessohproduct.trafficmanager.net/api/GetProduct?productId=' + productId, {
              "simple": false
            })
            .then(result2 => {
              let response =  JSON.parse(result2);              
              if (!response.productId) {
                context.res = {
                  status: 400,
                  body: 'Product Id did not work'
                };
                context.done();
              } else {
                let userNotes = returnBody.usernotes;
                context.log('usernotes: ' + userNotes);
                let response_handler = function (response) {
                  let body = '';
                  response.on ('data', function (d) {
                      body += d;
                  });
                  response.on ('end', function () {
                      let body_ = JSON.parse (body);
                      let body__ = JSON.stringify (body_, null, '  ');
                      console.log (body__);
                      returnBody.sentimentScore =  body_.documents[0].score;
                      returnBody.id = uuidv4();
                      context.bindings.ratingDocuments = returnBody;
                      context.res = {
                        status: 200,
                        body: returnBody
                      };
                      context.done();
                  });
                  response.on ('error', function (e) {
                      console.log ('Error: ' + e.message);
                  });
              };
              
              let get_sentiments = function (userNotes) {
                  let body = JSON.stringify (userNotes);
              
                  let request_params = {
                      method : 'POST',
                      hostname : uri,
                      path : path,
                      headers : {
                          'Ocp-Apim-Subscription-Key' : accessKey,
                      }
                  };
                  context.log('calling sentiment');
                  let req = https.request (request_params, response_handler);
                  req.write (body);
                  req.end ();

              }
              
              let documents = { 'documents': [
                { 'id': '1', 'language': 'en', 'text': '' },      
              ]};
            
              documents.documents[0].text = userNotes;


              sentimentResponse = get_sentiments(documents); 
                
              }
            })
        }
      })
      .catch(err => {
        context.res = {
          status: 400,
          body: 'An API call did not work: ' + err
        };
        context.done();
      });
  }
};

/* input:
{
    "userid": "cc20a6fb-a91f-4192-874d-132493685376",
    "productid": "4c25613a-a3c2-4ef3-8e02-9c335eb23204",
    "timestamp": "Wed, 21 Mar 2018 13:00:38 GMT",
    "locationname": "Mary's ice cream shop",
    "usernotes": "I really like the subtle notes of orange in this ice cream, great to see this very different flavor!"
} */