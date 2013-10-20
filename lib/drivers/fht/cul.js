(function() {
  var SerialPortModule = require("serialport");
  var SerialPort = SerialPortModule.SerialPort;
  var culPacket = require('./culPacket');
  var fs20Packet = require('./fs20Packet')
  var util = require('util');
  var eventEmitter = require('events').EventEmitter;
  var delimiter = "\r\n";
  
  function cul(portName) {
    eventEmitter.call(this);
    this.packet = {};
    this.devices = {};
    this.serialPort = {};
    this.portName = portName;
  }

  util.inherits(cul,eventEmitter);
  
  cul.PACKET_EVENT = "packet";
  
  cul.prototype.start = function() {
    var that = this;    
    this.serialPort = new SerialPort(this.portName, { parser: SerialPortModule.parsers.readline(delimiter), baudrate: 38400 });

    this.serialPort.on("open", function() {
      console.log("opened port");
      that.packet = new culPacket();
      that.serialPort.on("data",function(data) {
        that.packet.parse(data,function(ok) { that.receivePacket(ok); });
      });
      // Initialise the COC
      that.writePacket("X61");
    });
  };
  
  cul.prototype.getDevices = function() {
    return this.devices;
  };
  
  cul.prototype.receivePacket = function(ok) {
    if (ok) {
      console.log("---------------------------------------------");
      var packetString = this.packet.toString();
      console.log(packetString);

      var fsPacket = new fs20Packet();
      fsPacket.fromCUL(packetString);

      this.emit(cul.PACKET_EVENT,(new Date()).getTime(), fsPacket);
                        
      console.log("---------------------------------------------");
    } else { 
      console.log("packet invalid");
    }
  };
  
  cul.prototype.writePacket = function(pkt) {
    this.serialPort.write(pkt + delimiter);
  };
  
  cul.prototype.writeFHT = function(pkt) {
    this.serialPort.write("T" + pkt + delimiter);
  };

  module.exports = cul;
})();