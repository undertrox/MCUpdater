var request = require('request');
var fs = require('fs');

function download(file_url , targetPath, onProgress, onFinish){
    // Save variable to know progress
    var received_bytes = 0;
    var total_bytes = 0;

    var req = request({
        method: 'GET',
        uri: file_url
    });

    var out = fs.createWriteStream(targetPath);
    req.pipe(out);

    req.on('response', function ( data ) {
        // Change the total bytes value to get progress later.
        total_bytes = parseInt(data.headers['content-length' ]);
    });

    req.on('data', function(chunk) {
        // Update the received bytes
        received_bytes += chunk.length;

        onProgress(received_bytes, received_bytes/total_bytes*100, total_bytes);
    });

    req.on('end', function() {
        onFinish();
    });
}
