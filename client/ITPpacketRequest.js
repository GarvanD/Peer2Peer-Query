//size of the request packet:
let HEADER_SIZE = 4;

//Fields that compose the RTP header
let version,
    requestType,
    imageFileName;

module.exports = {
    rquestHeader: '', //Bitstream of the request packet
    payloadSize: 0, //size of the ITP payload
    payload: '', //Bitstream of the ITP payload

    init: function( fileName) {
        //fill by default packet fields:
        version = 3314;
        requestType = 0;
        imageFileName = fileName;

        //build the header bistream:
        //--------------------------
        this.rquestHeader = new Buffer.alloc(HEADER_SIZE);

        //fill the header array of bytes
        let v1 = version << 8;
        this.rquestHeader[0] = (v1 >>> (8*3)) ;
        let v2 = version << 16;
        this.rquestHeader[1] = (v2 >>> (8*3));
        let v3 = version << 24;
        this.rquestHeader[2] = (v3 >>> (8*3));
        this.rquestHeader[3] = (requestType);

        let ifname = stringToBytes(imageFileName);

        this.payload_size = ifname.length;
        this.payload = new Buffer.alloc(ifname.length);

        for (var Ni = 0; Ni < ifname.length; Ni++)
            this.payload[Ni] = ifname[Ni] ;
    },

    //--------------------------
    //getpacket: returns the entire packet
    //--------------------------
    getpacket: function() {
        let packet = new Buffer.alloc(this.payload_size + HEADER_SIZE);
        //construct the packet = header + payload
        for (var Hi = 0; Hi < HEADER_SIZE; Hi++)
            packet[Hi] = this.rquestHeader[Hi];
        for (var Pi = 0; Pi < this.payload_size; Pi++)
            packet[Pi + HEADER_SIZE] = this.payload[Pi];

        return packet;

    }


};


function stringToBytes(str) {
    var ch, st, re = [];
    for (var i = 0; i < str.length; i++ ) {
        ch = str.charCodeAt(i);  // get char
        st = [];                 // set up "stack"
        do {
            st.push( ch & 0xFF );  // push byte to stack
            ch = ch >> 8;          // shift value down by 1 byte
        }
        while ( ch );
        // add stack contents to result
        // done because chars have "wrong" endianness
        re = re.concat( st.reverse() );
    }
    // return an array of bytes
    return re;
}