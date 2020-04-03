let net = require('net'),
    singleton = require('./Singleton'),
    handler = require('./ClientsHandler'),
    packet = require('./cPTP_packet');
    ITP = require('./ITP_response_packet');

//Set host to loopback or localhost ip
let HOST = '127.0.0.1';
net.bytesWritten = 300000;
net.bufferSize = 300000;

//Create ImageDB Server
let imgageDBserver = net.createServer();
imgageDBserver.listen(0,HOST);
imgageDBserver.on('listening', function(){
    console.log("[ImageServer] @ " + imgageDBserver.address().address +":" + imgageDBserver.address().port);
    singleton.setImageDBPort(imgageDBserver.address().port);
})

//Handle Image Requests
imgageDBserver.on('connection', function(sock){
    handler.handleImageRequest(sock)
})

imgageDBserver.on('end', function(){
    console.log('[ImageServer] Client Disconnected')
})

//Create P2P server and listen on empty port
let P2Pserver = net.createServer();
P2Pserver.listen(0,HOST);
singleton.init();
let p = process.argv[process.argv.indexOf('-p') + 1];
let n = process.argv[process.argv.indexOf('-n') + 1];
let v = process.argv[process.argv.indexOf('-v') + 1];


if(n < 1)
{
    throw('n must be greater than 0')
}
//Set max_peers
if(process.argv.indexOf(('-n') != -1) && (n >= 1))
{singleton.setMaxPeers(n)}
else{singleton.setMaxPeers(6)}


//Throw error if version is not given
if(process.argv.indexOf('-v') == -1)
{
    throw('Invalid Version Number!')
}


//When server has emitted 'listening' event, report selected port number back to user
P2Pserver.on('listening', function() {
    
    singleton.setPort(P2Pserver.address().port)
    
    //Save peer information & connect to peer
    if(process.argv.indexOf('-p') != -1)
    {
        console.log("[P2Pserver] @ " + P2Pserver.address().address +":" + P2Pserver.address().port)
        handler.connectToPeer(p.split(':')[0],parseInt(p.split(':')[1]), P2Pserver);
    }
    else
    {
        console.log("[P2Pserver] @ " + P2Pserver.address().address +":" + P2Pserver.address().port);
    }
});


//Handle peers that attempt to connect
P2Pserver.on('connection', function(sock) {    
    handler.handlePeerJoining(sock) 
});


