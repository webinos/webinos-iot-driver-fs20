(function () {

  //
  // Private constants
  // -----------------
  
  // States
  var ST_UNKNOWN = -1;
  var ST_WAITING_DATA = 0;
  var ST_WAITING_END = 1;
  var ST_COMPLETE = 999;

  // Parsing constants
  var START_BYTE = 'T';

  // Constructor
  function culPacket() {
    this.state = ST_UNKNOWN;
    this.headerLength = 0;
    this.packet = [];
    this.bytes = [];
  }
 
  //
  // Public instance methods
  // -----------------------
  
  // Parse method
  culPacket.prototype.parse = function(data,cb) {
    this.packet = [];
    this.bytes = [];
    this.state = ST_UNKNOWN;
    for (var i = 0; i < data.length; i++) {
      this.doParse(data[i]);
    }

    cb(true);
  };
  
  culPacket.prototype.parseString = function(data,cb) {
    return this.parse(data + "\r\n",cb);
  }

  // Parse helper - this should really be private.
  culPacket.prototype.doParse = function(bufByte) {
    switch (this.state) {
      case ST_UNKNOWN:
      case ST_COMPLETE:
        if (bufByte === START_BYTE) {
          this.state = ST_WAITING_DATA;
          this.headerLength = this.packet.length+1;  
          this.packet = [bufByte.charCodeAt(0)];
        } else {
          console.log("unexpected start byte: " + bufByte);
        }
        break;
      case ST_WAITING_DATA:
        if (bufByte == 0x0d) {
          this.state = ST_WAITING_END;
        } else {
          this.bytes.push(bufByte);
        }
        break;
      case ST_WAITING_END:
        if (bufByte != 0x0a) {
          console.log("unexpected end byte: " + bufByte);
        }
        this.state = ST_COMPLETE;
        break;
      default:
        console.log("invalid datagram - bad state!");
        break;
    }
    
    if (this.bytes.length == 2) {    
      this.packet.push((parseInt(this.bytes[0],16) << 4) + parseInt(this.bytes[1],16));
      this.bytes = [];
    }    
  };
    
  culPacket.prototype.getRaw = function() {
    return new Buffer(this.packet);
  }

  culPacket.prototype.get = function(idx) {
    return this.packet[this.headerLength + idx];
  };

  culPacket.prototype.getData = function() {
    return this.packet.slice(this.headerLength);
  };
  
  culPacket.prototype.fromString = function(str) {
    this.packet = [START_BYTE.charCodeAt(0)];
    this.headerLength = this.packet.length;
    
    for (var i = 0; i < str.length; i+=2) {
      var val = (parseInt(str[i],16) << 4) + parseInt(str[i+1],16);
      this.packet.push(val);
    }    
  };
  
  culPacket.prototype.toString = function() {
    var str = "T";
    for (var i = 1; i < this.packet.length; i++) {
      // Zero-pad as 2-digit hex value
      str = str + ("00" + this.packet[i].toString(16)).substr(-2);
    }
    return str;
  };
  
  module.exports = culPacket;

})();