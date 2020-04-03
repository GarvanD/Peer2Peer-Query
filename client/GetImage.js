let net = require('net');
let fs = require('fs');
let opn = require('open');
let ITPpacket = require('./ITPpacketRequest')

// call as GetImage -s <serverIP>:<port> -q <image> [-v <version>]

let hostserverIPandPort = process.argv[3].split(':');
let imageName = process.argv[5];

let PORT = hostserverIPandPort[1];
let HOST = hostserverIPandPort[0];

ITPpacket.init(imageName);
console.log(imageName)

var imageFound;

let client = new net.Socket();
client.connect(PORT, HOST, function () {
    console.log('Connected to ImageDB server on: ' + HOST +":" +PORT);
    client.write(ITPpacket.getpacket());
});

// Add a 'data' event handler for the client socket
// data is what the server sent to this socket

const chunks = [];
client.on('data', function(chunk){
    if(chunk.slice(0, 15)[3] == 2)
    {
        console.log('Image not found');
        imageFound = false;
        client.end();
    }
    else
    {
        chunks.push(chunk);
        imageFound = true;
    }
});
    
client.on('end', () => {
    if(imageFound)
    {
        const responsePacket = Buffer.concat(chunks);
        let header = responsePacket.slice(0, 15);
        let image = responsePacket.slice(16);

        fs.writeFile('receivedImage.jpg', image, 'binary', function (err, written) {
            if (err) console.log(err);
            else {
                // Opens a image in the default system image viewer
                opn('receivedImage.jpg');
            }
        });
        console.log('Server sent: \n');
        console.log("    --ITP version = " + (header[0] << 16 ^ header[1] << 8 ^ header[2]));
        console.log("    --Response Type = " + header[3]);
        console.log("    --Sequence Number = " + (header[4] << 24 ^ header[5] << 16 ^ header[6] << 8 ^ header[7]));
        console.log("    --Timestamp = " + (header[8] << 24 ^ header[9] << 16 ^ header[10] << 8 ^ header[11]));
        console.log("    --Image size = " + (header[12] << 24 ^ header[13] << 16 ^ header[14] << 8 ^ header[15]));
        client.end();

    }
    
    

});

// Add a 'close' event handler for the client socket
client.on('close', function () {
    console.log('Connection closed');
});

client.on('end', () => {
    console.log('Disconnected from the server');
});