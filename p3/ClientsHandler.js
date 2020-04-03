var Packet = require('./cPTP_packet');
var net = require('net');
var singleton = require('./Singleton');
var ITP = require('./ITP_response_packet');
var fs = require("fs");
var randomint = require('random-int')


//Helper functions
function bytes2string(array) {
    var result = "";
    for (var i = 0; i < array.length; ++i) {
        result += (String.fromCharCode(array[i]));
    }
    return result;
}

function bytes2number(array) {
    var result = "";
    for (var i = 0; i < array.length; ++i) {
        result ^= array[array.length-i-1] << 8*i ;
    }
    return result;
}


module.exports = {
    /*
        This function attempts to join all peers in the ack packet
    */
   automaticRedirect: function(a,p,s)
   {
       if(!singleton.peerTableIsFull())
       {
           if(p != undefined)
           {
               p.forEach(port => {
                   if((!singleton.isInDeclinedTable(port)) && (!singleton.isInPeerTable(port)) && (port != singleton.getPort()))
                   {
                        module.exports.connectToPeer(a,port,s);
                   }
               });
           }
       }
   },

   /*
        function: handleImageRequest(socket object)
        Controls server side component of image DB
    */
   handleImageRequest: function(sock)
   {
       var respond = function(p) {
           sock.write(p);
           sock.end();
       }

       var askNetwork = function(request)
       {
            var peer_table = singleton.getPeerTable();
            var keys = Object.keys( peer_table );
            var search_id = randomint(1000,100000);
            var packet = Packet.createSearchPacketRequest(bytes2number(request.slice(0, 3)),3,sock.address().address.split('.'),search_id,singleton.getImageDBPort(),sock.address().address.split('.'),bytes2string(request.slice(4)));
            for( var i = 0,length = keys.length; i < length; i++ ) {
                if(peer_table[keys[i]]['status'] == "connected")
                {
                    peer_table[keys[i]]['socket'].write(packet);
                }
            }
       }
       sock.on('data', function(d){
        let version = bytes2number(d.slice(0, 3));
        let requestType = bytes2number(d.slice(3, 4));
        if((requestType == 0) && (version == 3314) && (singleton.isBusy() == true))
        {
            ITP.init(3,singleton.getSequenceNumber(),singleton.getTimestamp(),0,0);
            sock.write(ITP.getPacket());
        }
        if((requestType == 0) && (version == 3314) && (singleton.isBusy() == false))
        {
            singleton.setClientSock(sock);
            singleton.setBusy(true);
            setTimeout(function(){
                if(singleton.wasFound() == false)
                {
                    singleton.setBusy(false);
                    ITP.init(2,singleton.getSequenceNumber(),singleton.getTimestamp(),0,0);
                    singleton.getClientSock().write(ITP.getPacket());
                    console.log('Not Found')
                }
            },5000);
            let imageFilename = bytes2string(d.slice(4));
            fs.readFile('img/' + imageFilename, (err, data) => {
                if (!err) {
                    var infile = fs.createReadStream('img/' + imageFilename);
                    const imageChunks = [];
                    infile.on('data', function (chunk) {
                        imageChunks.push(chunk);
                    });
        
                    infile.on('close', function () {
                        let image = Buffer.concat(imageChunks);
                        ITP.init(1,singleton.getSequenceNumber(),singleton.getTimestamp(),image,image.length);
                        let packet = ITP.getPacket();
                        respond(packet);
                    });
                } else {
                    askNetwork(d)
                }
            });
        }
        else if((requestType == 1) && (version == 3314))
        {
            singleton.setFound(true);
            console.log('Found the image')
            singleton.getClientSock().write(d);
            singleton.getClientSock().end();
        }
        
       })
       sock.on('error', function(err){
           
       })
   },

    /*
        function: handlePeerJoining(socket object)
        Controls server side component of P2P node
    */
    handlePeerJoining: function(sock) 
    {
        // Handle disconnect
        sock.on('error', function(err){
            
        })

        ip = sock.address()['address'].split('.');

        // Get Server Port From Connecting Peer
        sock.on('data', function(data){
            let response_type = data.readUIntLE(3,1);
            if(response_type == 1)
            {
                console.log(port + ' accepted the connection')
                singleton.changePeerStatus(port, 'connected')
                module.exports.automaticRedirect(packet.peer_ipv4,packet.peer_port_number,server);
            }
            else if(response_type == 2)
            {
                console.log(port + ' declined the connection')
                singleton.changePeerStatus(port, 'redirected')
                singleton.addDeclinedPeer(port);
                module.exports.automaticRedirect(packet.peer_ipv4,packet.peer_port_number,server);
            }
            else if(response_type == 3)
            {
                var respond = function(p){
                    const s = net.Socket();
                    s.connect(parseInt(packet['originating_port']), parseInt(packet['originating_ip']), function(){
                        console.log('Connecting to Originating Peer: ' + packet['originating_ip'] + ':' + packet['originating_port']);
                    })
                    s.write(p);
                    s.end();
                    
                    
                };
                var askNetwork = function()
                {
                    var peer_table = singleton.getPeerTable();
                    var keys = Object.keys( peer_table );
                    for( var i = 0,length = keys.length; i < length; i++ ) {
                        if(peer_table[keys[i]]['status'] == "connected")
                        {
                            peer_table[keys[i]]['socket'].write(data);
                        }
                    }
                };
                packet = Packet.readSearchPacketRequest(data);
                if(singleton.getImgRequest().indexOf(packet['search_id']) == -1)
                {
                    singleton.addImgRequest(packet['search_id'])
                    fs.readFile('img/' + packet['image_name'], (err, data) => {
                        if (!err) {
                            console.log('Found Image!')
                            var infile = fs.createReadStream('img/' + packet['image_name']);
                            const imageChunks = [];
                            infile.on('data', function (chunk) {
                                imageChunks.push(chunk);
                            });
                
                            infile.on('close', function () {
                                let image = Buffer.concat(imageChunks);
                                ITP.init(1,singleton.getSequenceNumber(),singleton.getTimestamp(), image, image.length);
                                let p = ITP.getPacket();
                                respond(p);
                            });
                        } else {
                            askNetwork();                      
                        }
                    });
                }
                
            }
            if(response_type == 4)
            {
                port = Packet.readPacket(data)['peer_port_number'][0];
                // Handle redirect packet
                if(singleton.peerTableIsFull()){
                    console.log('Peer table now full: ' + ip.join('.') + ':' + port + ' redirected')
                    
                    sock.write(Packet.createPacket(3314,2,ip,singleton.getPeerTable().length,singleton.getPeerTable(),ip));
                }
                // Handle peer connection
                else{

                    sock.write(Packet.createPacket(3314,1,ip,singleton.getPeerTable().length,singleton.getPeerTable(),ip));
                    singleton.addPeer({'port': port, status: 'connected', 'socket': sock})
                    console.log('Connected from peer ' + ip.join('.') + ':' + port)
                }
            }

            
            

        })
    },  
    /*
        function: connectToPeer(peer, directory, address, port)
        manages functionality to connect to a TCP peer
    */
    connectToPeer: function(ip, port, server)
    {
        const client = net.Socket();
        // Connect to peer
        client.connect(port,ip, function(){
            console.log("Connecting to peer: " + port + " at timestamp: " + singleton.getTimestamp())
            singleton.addPeer({'port': port, 'status': 'pending', 'socket': client})
            var p = Packet.createPacket(3314,4,['127','0','0','1'],1,[server.address()],['127','0','0','1']);
            client.write(p);
        });

        client.on('error',function(err){
            
        })
        
        // Remote peer sends data to this peer
        client.on('data',function(data){
            var packet = Packet.readPacket(data);
            // Only handle versions 3314
            if(packet.version = 3314)
            {
                if(packet.message_type == 1)
                {
                    console.log(port + ' accepted the connection')
                    singleton.changePeerStatus(port, 'connected')
                    module.exports.automaticRedirect(packet.peer_ipv4,packet.peer_port_number,server);
                }
                else if(packet.message_type == 2)
                {
                    console.log(port + ' declined the connection')
                    singleton.changePeerStatus(port, 'redirected')
                    
                    module.exports.automaticRedirect(packet.peer_ipv4,packet.peer_port_number,server);
                }
                else if(packet.message_type == 3)
                {
                    var respond = function(p){
                        const s = net.Socket();
                        s.connect(parseInt(packet['originating_port']), parseInt(packet['originating_ip']), function(){
                            console.log('Connecting to Originating Peer: ' + packet['originating_ip'] + ':' + packet['originating_port']);
                        })
                        s.write(p);
                        s.end();
                        
                        
                    };
                    var askNetwork = function()
                    {
                        var peer_table = singleton.getPeerTable();
                        var keys = Object.keys( peer_table );
                        for( var i = 0,length = keys.length; i < length; i++ ) {
                            if(peer_table[keys[i]]['status'] == "connected")
                            {
                                peer_table[keys[i]]['socket'].write(data);
                            }
                        }
                    };
                    packet = Packet.readSearchPacketRequest(data);
                    fs.readFile('img/' + packet['image_name'], (err, data) => {
                        if (!err) {
                            console.log('Found Image!')
                            var infile = fs.createReadStream('img/' + packet['image_name']);
                            const imageChunks = [];
                            infile.on('data', function (chunk) {
                                imageChunks.push(chunk);
                            });
                
                            infile.on('close', function () {
                                let image = Buffer.concat(imageChunks);
                                ITP.init(1,singleton.getSequenceNumber(),singleton.getTimestamp(), image, image.length);
                                let p = ITP.getPacket();
                                respond(p);
                            });
                        } else {
                            askNetwork();                      
                        }
                    });
                }
                else if(packet.message_type == 4)
                {
                    port = Packet.readPacket(data)['peer_port_number'][0];
                    // Handle redirect packet
                    if(singleton.peerTableIsFull()){
                        console.log('Peer table now full: ' + ip.join('.') + ':' + port + ' redirected')
                        
                        sock.write(Packet.createPacket(3314,2,ip,singleton.getPeerTable().length,singleton.getPeerTable(),ip));
                    }
                    // Handle peer connection
                    else{

                        sock.write(Packet.createPacket(3314,1,ip,singleton.getPeerTable().length,singleton.getPeerTable(),ip));
                        singleton.addPeer({'port': port, status: 'connected', 'socket': sock})
                        console.log('Connected from peer ' + ip.join('.') + ':' + port)
                    }
                }
            }
            else{console.log('Invalid version number')}

        });
    },
    


}


