console.log('Loading event');
var AWS = require('aws-sdk');
var dynamodb = new AWS.DynamoDB({apiVersion: '2012-08-10'});

exports.handler = (event, context, callback) => {
    // TODO implement
    
    var tableName = "user";
    dynamodb.scan({
        TableName : tableName,
        Limit : 2
    }, function(err, data) {
        if (err) {
            context.done('error','reading dynamodb failed: '+err);
        }
        for (var i in data.Items) {
            var x = data.Items[i]["meds"].L;
            // console.log(x);
            
            for(var a in x){
                var temp = x[a].M;
                console.log(temp.next_med.S);
            }
            context.done(null, "Ciao!");
        }
    });
    
    
    callback(null, 'Hello from Lambda');
};