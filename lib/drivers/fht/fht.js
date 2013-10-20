(function () {
  function fht(deviceCode) {
    this.device = deviceCode;
    this.displayName = deviceCode;
    this.actuatorPos = 0;
    this.desiredTemp = 0;
    this.lowTemp = 0;
    this.highTemp = 0;
    this.dayTemp = 0;
    this.nightTemp = 0;
    this.actuatorThreshold = 1;
  }
  
  fht.prototype.getDevice = function() {
    return this.device ? this.device : '';
  }
  
  fht.prototype.setDevice = function(val) {
    this.device = val;
  }
  fht.prototype.getDisplayName = function() {
    return this.displayName;
  }
  
  fht.prototype.setDisplayName = function(val) {
    this.displayName = val;
  }
  
  fht.prototype.getValvePosition = function() {
    return this.actuatorPos;
  }

  fht.prototype.setValvePosition = function(val) {
    this.actuatorPos = val;
  }
  
  fht.prototype.getMeasuredTemp = function() {
    return (this.highTemp * 256 + this.lowTemp)/10;
  }
  
  fht.prototype.getLowTemp = function() { 
    return this.lowTemp;
  }
  
  fht.prototype.setLowTemp = function(val) { 
    this.lowTemp = val;
  }
  
  fht.prototype.getHighTemp = function() { 
    return this.highTemp;
  }

  fht.prototype.setHighTemp = function(val) { 
    this.highTemp = val;
  }

  fht.prototype.getDesiredTemp = function() {
    return this.desiredTemp;
  }
  
  fht.prototype.setDesiredTemp = function(val) {
    this.desiredTemp = val;
  }
  
  fht.prototype.getDayTemp = function() {
    return this.dayTemp;
  }
  
  fht.prototype.setDayTemp = function(val) {
    this.dayTemp = val;
  }
  
  fht.prototype.getNightTemp = function() {
    return this.nightTemp;
  }
  
  fht.prototype.setNightTemp = function(val) {
    this.nightTemp = val;
  }  
  
  fht.prototype.getThreshold = function() {
    return this.actuatorThreshold;
  }
  
  fht.prototype.setThreshold = function(val) {
    this.actuatorThreshold = val;
  }

  module.exports = fht;
})();