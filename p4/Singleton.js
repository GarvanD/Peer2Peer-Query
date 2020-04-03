
var randomInt = require('random-int');
var time = 0;
var sequence = 0;
var peer_table = [];
var max_peers;
var peering_declined = [];
var thisPort;
var imgRequests = [];
var thisImageDBPort;
var busy = false;
var clientSock;
var found;

module.exports = {
    
    init: function() {
       time = randomInt(1,999);
       sequence = randomInt(1,999);
       this.updateTime();
       setInterval(this.updateTime,10)
    },

    //addImgRequest: addImgRequestToMemory
    addImgRequest: function(img)
    {
        imgRequests.push(img);

    },

    //setPort: sets the port
    setPort: function(port)
    {
        thisPort = port;
    },

    //getPort: gets the port
    getPort: function()
    {
        return thisPort;
    },

    //isInPeerTable: returns true if given port is in peer table
    isInPeerTable: function(port)
    {
        if(peer_table.findIndex(x => x.port == port) != -1)
        {
            return true;
        }
        else
        {
            return false
        }
    },

    //isInPeerTable: returns true if given port is in declined peer table
    isInDeclinedTable: function(port)
    {
        if(peering_declined.findIndex(x => x.port == port) != -1)
        {
            return true;
        }
        else
        {
            return false
        }

    },

    //getPeerDeclined: returns the peering_declined table
    getPeerDeclined: function()
    {
        return peering_declined;
    },

    //addDeclinedPeer: adds declined peer to table
    addDeclinedPeer: function(peer)
    {
        if(peering_declined.length >= max_peers)
        {
            peering_declined.pop();
        }
        peering_declined.push(peer);
    },

    changePeerStatus: function(port, status)
    {
        var foundIndex = peer_table.findIndex(x => x.port == port);
        if(foundIndex != -1)
        {
            peer_table[foundIndex]['port'] = parseInt(port); 
        }
        
    },

    //updateTime: checks to see if time has reached 2^32 and resets
    updateTime: function() {
        if (time == Math.pow(2,32))
        {
            time = 0
        }
        time += 1;
    },

    //setMaxPeers: sets the max number of peers in the peer table
    setMaxPeers: function(n){
        max_peers = n;
    },

    //getSequenceNumber: return the current sequence number + 1
    getSequenceNumber: function() {
        return sequence++;
    },

    //getTimestamp: return the current timer value
    getTimestamp: function() {
        return time;
    },

    // Add peer in the form of json with IP and PORT
    addPeer: function(peer) {
        if(peer_table.length <= max_peers)
        {
            peer_table.push(peer);
        }
    },

    // Return peer table
    getPeerTable: function() {return peer_table},


    // Boolean for peer table
    peerTableIsFull: function()
    {
        if(peer_table.length == max_peers){return true}
        else{return false}
    },

    // Set ImageDB Port Number
    setImageDBPort: function(port)
    {
        thisImageDBPort = port;
    },

    // Get ImageDB Port Number
    getImageDBPort: function()
    {
        return thisImageDBPort;
    },

    // Boolean if the node is busy
    isBusy: function()
    {
        return busy;
    },

    //
    setBusy: function(val)
    {
        busy = val;
    },

    setClientSock(sock)
    {
        clientSock = sock;
    },

    getClientSock()
    {
        return clientSock;
    },

    wasFound()
    {
        return found;
    },

    setFound(val)
    {
        found = val;
    }


};