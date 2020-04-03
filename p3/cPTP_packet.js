var singleton = require('./Singleton');
module.exports = {
    /*
        function: createPacket(packet params)
        returns: Buffer(12 + 8 x # of peers in peer table) 
        Packet Type: cPTP
    */
    createPacket: function(v,m,s,np,ppn,ipv4){
        packet = Buffer.allocUnsafe(12 + (8*np))
        packet.writeUIntLE(v,0,3);
        packet.writeUIntLE(m,3,1);
        packet.writeUIntLE(parseInt(s[0]),4,1)
        packet.writeUIntLE(parseInt(s[1]),5,1)
        packet.writeUIntLE(parseInt(s[2]),6,1)
        packet.writeUIntLE(parseInt(s[3]),7,1)
        packet.writeUIntLE(np,8,4);
        for(let i = 0; i < np; i++)
        {
            packet.writeUIntLE(ppn[i].port,14+(6*i),2)
            packet.writeUIntLE(parseInt(ipv4[0]),16,1)
            packet.writeUIntLE(parseInt(ipv4[1]),17,1)
            packet.writeUIntLE(parseInt(ipv4[2]),18,1)
            packet.writeUIntLE(parseInt(ipv4[3]),19,1)
        }   
        return packet;
    },
    /*
        function: readSearchPacketRequest(packet params)
        returns: Buffer(20 bytes + size of img filename) 
        Packet Type: cPTP search request
    */
    readSearchPacketRequest: function(packet){
        p = {};
        p['version'] = packet.readUIntLE(0,3);
        p['message'] = packet.readUIntLE(3,1);
        p['sender'] = packet.readUIntLE(4,1) + '.' + packet.readUIntLE(5,1) + '.' + packet.readUIntLE(6,1) + '.' + packet.readUIntLE(7,1);
        p['search_id'] = packet.readUIntLE(8,4);
        p['originating_port'] = packet.readUIntLE(12,2);
        p['originating_ip'] = packet.readUIntLE(14,1) + '.' + packet.readUIntLE(15,1) + '.' + packet.readUIntLE(16,1) + '.' + packet.readUIntLE(17,1)
        p['image_name'] = packet.toString('utf8',18);
        return p
    },

    /*
        function: readPacket()
        returns: JSON version of packet
        Packet Type: cPTP
    */
    readPacket: function(p){
        let packet = {}
        packet['version'] = p.readUIntLE(0,3);
        packet['message_type'] = p.readUIntLE(3,1);
        packet['sender'] = p.readUIntLE(4,1) + '.' + p.readUIntLE(5,1) + '.' + p.readUIntLE(6,1) + '.' + p.readUIntLE(7,1);
        packet['number_of_peers'] = p.readUIntLE(8,4);
        if(p.readUIntLE(8,4) > 0)
        {
            packet['peer_port_number'] = []
            packet['peer_ipv4'] = []
            for(let i = 0; i < p.readUIntLE(8,4); i++)
            {
                packet['peer_port_number'].push(p.readUIntLE(14+(6*i),2));
                packet['peer_ipv4'].push(p.readUIntLE(16,1) + '.' + p.readUIntLE(17,1) + '.' + p.readUIntLE(18,1) + '.' + p.readUIntLE(19,1));
            }
        }
        return packet;
    },

     /*
        function: createResponsePacket(packet params)
        returns: Buffer(16 + img_size Bytes ITP packet encapsulating img) 
        Packet Type: cPTP response
    */
   createResponsePacket: function(v,r,img_sz,img){   
       let s = singleton.getSequenceNumber();
       let t = singleton.getTimestamp();
        packet = Buffer.allocUnsafe(16+img_sz);
        packet.writeUIntLE(v,0,3);
        packet.writeUIntLE(r,3,1);
        packet.writeUIntLE(s,4,4);
        packet.writeUIntLE(t,8,4);
        packet.writeUIntLE(img_sz,12,4);
        packet.writeUIntLE(img,16,img_sz);
        
        return this.packet;
    },

    /*
        function: createSearchPacketRequest(packet params)
        returns: Buffer(28) 
        Packet Type: cPTP request
    */
    createSearchPacketRequest: function(v, m, s, s_id, o_port, o_ip, img_name)
    {
        packet = Buffer.allocUnsafe(18+img_name.length);
        packet.writeUIntLE(v,0,3);
        packet.writeUIntLE(m,3,1);
        packet.writeUIntLE(s,4,4);
        packet.writeUIntLE(s_id[0],8,1);
        packet.writeUIntLE(s_id[1],9,1);
        packet.writeUIntLE(s_id[2],10,1);
        packet.writeUIntLE(s_id[3],11,1);
        packet.writeUIntLE(o_port,12,2);
        packet.writeUIntLE(o_ip[0],14,1);
        packet.writeUIntLE(o_ip[1],15,1);
        packet.writeUIntLE(o_ip[2],16,1);
        packet.writeUIntLE(o_ip[3],17,1);
        packet.write(img_name, 18);
        return packet;
    },



}




