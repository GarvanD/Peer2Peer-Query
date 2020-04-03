//size of the response packet header:
var HEADER_SIZE = 16;

//Fields that compose the header
var version,
    responseType,
    sequenceNumber,
    timeStamp,
    imageSize;

module.exports = {
    responseHeader: '', //Bitstream of the ITP header
    payloadSize: 0, //size of the ITP payload
    payload: '', //Bitstream of the ITP payload

    init: function(resType, sequenceNum, currentTime, data, data_length) {
        //fill by default header fields:
        version = 3314;


        //fill changing header fields:
        sequenceNumber = sequenceNum;
        // sequence number. SHOULD be random (32 bits)
        timeStamp = currentTime;
        responseType = resType;
        imageSize = data_length;

        //build the header bistream:
        //--------------------------
        this.responseHeader = new Buffer.alloc(HEADER_SIZE);

        //fill the header array of byte with ITP header fields
        this.responseHeader[0] = (version >> 16);
        this.responseHeader[1] = (version >> 8);
        this.responseHeader[2] = (version );
        this.responseHeader[3] = (responseType);
        for (var Si = 0; Si < 4; Si++)
            this.responseHeader[7 - Si] = (sequenceNumber >> (8 * Si));
        for (var Ti = 0; Ti < 4; Ti++)
            this.responseHeader[11 - Ti] = (timeStamp >> (8 * Ti));
        for (var Ii = 0; Ii < 4; Ii++)
            this.responseHeader[15 - Ii] = (imageSize >> (8 * Ii));


        //fill the payload bitstream:
        //--------------------------
        this.payload_size = data_length;
        this.payload = new Buffer.alloc(data_length);

        //fill payload array of byte from data (given in parameter of the constructor)
        //......
        for (var Pi = 0; Pi < data_length; Pi++)
            this.payload[Pi] = data[Pi];
    },
    //--------------------------
    //getlength: return the total length of the ITP packet
    //--------------------------
    getLength: function() {
        return (this.payload_size + HEADER_SIZE);
    },

    //--------------------------
    //getpacket: returns the entire packet
    //--------------------------
    getPacket: function() {
        let packet = new Buffer.alloc(this.payload_size + HEADER_SIZE);
        //construct the packet = header + payload
        for (var Hi = 0; Hi < HEADER_SIZE; Hi++)
            packet[Hi] = this.responseHeader[Hi];
        for (var Pi = 0; Pi < this.payload_size; Pi++)
            packet[Pi + HEADER_SIZE] = this.payload[Pi];

        return packet;
    }
};