/*******************************************************************************
 *  Code contributed to the webinos project
 * 
 * Licensed under the Apache License, Version 2.0 (the 'License');
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *  
 *     http://www.apache.org/licenses/LICENSE-2.0
 *  
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an 'AS IS' BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * 
 * Copyright 2013 Toby Ealden
 * 
 ******************************************************************************/


(function () {
  'use strict';

  var fs = require("fs");
  var path = require("path");
  var driverId = null;
  var registerFunc = null;
  var removeFunc = null;
  var callbackFunc = null;
  var CONFIG_PATH = "./fht-config.json";
  var configData;
  var fhtMonitor;
  var fhtAdapter = require("./fht/fhtAdapter");
  var fht = require("./fht/fht");
  var started = false;
  var liveDeviceMap = { devices: {}, data: {}};


  function initialiseDeviceMap(deviceMap) {
    for (var i in configData.devices) {
      var deviceCode = parseInt(i.substr(0,2)).toString(16) + parseInt(i.substr(2)).toString(16);
      deviceMap.devices[deviceCode] = new fht(deviceCode);
      deviceMap.devices[deviceCode].setDisplayName(configData.devices[i].name);
      deviceMap.devices[deviceCode].setThreshold(configData.devices[i].threshold);
      deviceMap.data[deviceCode] = [];
    }
  }

  function onPacketReceived(timestamp,packet) {
    // Received a new packet - store it.
    var packetDate = new Date(timestamp);

    // Add packet to log file.
    var d = new Date(packetDate.getUTCFullYear(), packetDate.getUTCMonth(), packetDate.getUTCDate(),  packetDate.getUTCHours(), packetDate.getUTCMinutes(), packetDate.getUTCSeconds());
    var logFile = './logs/fhz-' + d.getDate() + '-' + d.getMonth() + '-' + d.getFullYear() + '.log';
    fs.appendFileSync(logFile,d.getTime() + " " + packet.toString() + "\n");

    var adapter = new fhtAdapter(packet);
    var deviceCode = adapter.getDeviceCode();
    var deviceList = liveDeviceMap.devices;
    if (deviceCode in deviceList) {
      var fhtInst = deviceList[deviceCode];
      if (adapter.applyTo(fhtInst) === 0) {
        var device = deviceList[deviceCode];
        callbackFunc('data', device.temperatureSensorServiceId, fhtInst.getMeasuredTemp().toFixed(1) );
        callbackFunc('data', device.valveSensorServiceId, fhtInst.getValvePosition().toFixed(1) );
      }
    } else {
      console.log("ignoring packet for unknown device: " + deviceCode);
    }
  }

  function start() {
    if (!started) {
      started = true;
      switch (configData.type) {
        case "fhz":
          fhtMonitor = new (require('./fht/fhz'))(configData.port);
          break;
        case "cul":
          fhtMonitor = new (require('./fht/cul'))(configData.port);
          break;
        default:
          throw new Error("unknown transceiver type in config.json!");
          break;
      }

      fhtMonitor.on("packet", onPacketReceived);
      fhtMonitor.start();
    }
  }

  exports.init = function(dId, regFunc, remFunc, cbkFunc) {
        console.log('FHT driver init - id is ' + dId);
        driverId = dId;
        registerFunc = regFunc;
        removeFunc = remFunc;
        callbackFunc = cbkFunc;
       intReg();
    };

    exports.execute = function(cmd, eId, data, errorCB, successCB) {
        console.log('FHT driver data - element is ' + eId + ', data is ' + data);
        switch(cmd) {
            case 'cfg':
                //In this case cfg data are transmitted to the sensor/actuator
                //this data is in json(???) format
                console.log('Received cfg for element '+eId+', cfg is '+data);
                successCB(eId);
                break;
            case 'start':
                //In this case the sensor should start data acquisition
                console.log('Received start for element ' + eId + ', mode is '+data);
                for(var dev in configData.devices) {
                    if (configData.devices[dev].temperatureSensorServiceId === eId) {
                      configData.devices[dev].running = true;
                      break;
                    }
                }
                break;
            case 'stop':
                //In this case the sensor should stop data acquisition
                //the parameter data can be ignored
                console.log('Received stop for element '+eId);
                for(var dev in configData.devices) {
                  if (configData.devices[dev].temperatureSensorServiceId === eId) {
                    configData.devices[dev].running = false;
                    break;
                  }
                }
                break;
            case 'value':
                //In this case the actuator should store the value
                //the parameter data is the value to store
                console.log('Received value for element ' + eId + '; value is '+data);
                break;
            default:
                console.log('FHT driver - unrecognized cmd');
        }
    }

    function intReg() {
        console.log('FHT driver - register sensors');
	      var existsSync = fs.existsSync || path.existsSync;
        if (existsSync(CONFIG_PATH)) {
          configData = JSON.parse(fs.readFileSync(CONFIG_PATH));

          initialiseDeviceMap(liveDeviceMap);

          for (var dev in configData.devices) {
            // Convert device code to hexadecimal
            var deviceCode = parseInt(dev.substr(0,2)).toString(16) + parseInt(dev.substr(2)).toString(16);
            var device = liveDeviceMap.devices[deviceCode];
            console.log("Adding FHT device: " + configData.devices[dev].name);
            var actuator_info = { type:"valve", name: configData.devices[dev].name + " valve", description:configData.devices[dev].name + " valve [" + dev + "]"};
            device.valveSensorServiceId = registerFunc(driverId, 1, actuator_info);
            var sensor_info = { type:"temperature", name: configData.devices[dev].name + " temperature", description:configData.devices[dev].name + " temperature [" + dev + "]"};
            device.temperatureSensorServiceId = registerFunc(driverId, 0, sensor_info);
          }

          start();

        } else {
          console.log("FHT driver - config file not found, no services registered.");
        }
    }

}());
