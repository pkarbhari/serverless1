module.exports = function(context, req) {
  context.log('JavaScript HTTP trigger function processed a request.');
  context.log(req);
  context.res = {
    // status: 200, /* Defaults to 200 */
    body: context.bindings.ratingDocuments
  };

  context.done();
};
