
/* 
   This module talks to Network Manager using the command line tool nmcli.
   Since it looks like no-one has written a usable Network Manager node module
*/

var async = require('async');
var exec = require('child_process').exec;

function run(cmd, cb) {
    exec("nmcli " + cmd, function(err, stdout, stderr) {
        if(err) return cb(err + "\n" + stderr);
        cb(null, stdout);
    });
}

function getIfaceInfo(name, cb) {
    var info = {};
    run("dev list iface " + name, function(err, data) {
        if(err) return cb(err);

        var m = data.match(/^GENERAL\.TYPE:\s+(.*)$/m);
        if(!m) return cb("Network device has no type");
        info.type = m[1];

        info.addresses = [];
        var lines = data.split("\n");
        var i;
        for(i=1; i < lines.length; i++) {

            m = lines[i].match(/^IP4\.ADDRESS\[\d+\]:.+ip\s+=\s+([\d\.]+)\/([\d]+)/);
            if(!m) continue;
            info.addresses.push({ip: m[1], netmask: m[2]})
        }

        cb(null, info);
    });
}

// GENERAL.TYPE:                           802-3-ethernet

function getIfaces(cb) {
    var ifaces = {};
    run("device", function(err, data) {
        if(err) return cb(err);
        var lines = data.split("\n");
        var ifaceNames = [];
        var i, fields, ifaceName;
        for(i=1; i < lines.length; i++) {
            fields = lines[i].split(/\s+/);
            if(!fields.length) continue;
            ifaceName = fields[0].replace(/\s+/, '');
            if(!ifaceName) continue;
            ifaceNames.push(ifaceName);
        }
        if(!ifaceNames.length) return cb(null, {});

        async.eachSeries(ifaceNames, function(ifaceName, cb) {
            getIfaceInfo(ifaceName, function(err, info) {
                if(err) return cb(err);
                ifaces[ifaceName] = info;
                cb();
            });
        }, function(err) {
            if(err) return cb(err);
            cb(ifaces);
        });
    });
}


module.exports = {

    getInterfaces: function(cb) {

    }

};

getIfaces(console.error);