const request = require('request');
const path = require('path');
const fs = require('fs');
const prompt = require('prompt');
const exec = require('child_process').exec;

var dirname = process.cwd();

var isFound = false;
var installedDisk = path.join(dirname, "DRIVE.config");
var copyPath = path.join(dirname, "valorant_buffer");
var ffpath = path.join(dirname, "FileFolder");

function fetch(url) {
    return new Promise((resolve, reject) => {
        request(url, (error, response, body) => {
            if (error) {
                reject(error);
            } else {
                resolve(body);
            };
        });
    });
};

function isFindValApp() {
    return new Promise((resolve, reject) => {
        exec('tasklist', function(error, stdout, stderr) {
            var lines = stdout.trim().split("\n");
            var processes = lines.slice(2);
            var parsed = processes.map(function(process) {
                return process.match(/(.+?)[\s]+?(\d+)/);
            });
            var filtered = parsed.filter(function(process) {
                return /^VALORANT-Win64-Shipping/.test(process[1]);
            });
            if (filtered[0]) {
                resolve(true);
            } else {
                resolve(false);
            };
        });
    });
};

function waitUntilFind() {
    var isSaid;
    return new Promise((resolve, reject) => {
        var Intver = setInterval(() => {
            var fileFound;
            fs.readdirSync(ffpath).forEach((file) => {
                if (!fileFound) {
                    var filedir = path.join(ffpath, file);
                    var filestat = fs.lstatSync(filedir);
                    var isdir = filestat.isDirectory()
                    var fileend = file.split(".").pop();
                    if (!isdir && fileend == "mp4") {
                        fileFound = filedir;
                    };
                };
            });
            if (fileFound) {
                clearInterval(Intver);
                if (isSaid) {
                    console.log("[Log]: Video file found.");
                };
                resolve(fileFound);
            } else {
                if (!isSaid) {
                    console.log("[Log]: Waitng for video file in `FileFolder`.");
                    isSaid = true;
                };
            };
        }, 500);
    });
};

async function StartMain(drive_inp) {
    var valorant_dir = `${drive_inp}:/Riot Games/VALORANT/live/ShooterGame/Content/Movies/Menu`;
    var currentVersion = await fetch("https://raw.githubusercontent.com/powershell1/DataStore101/main/ValorantHub.version");
    currentVersion = currentVersion.replace(/(?:\r\n|\r|\n)/g, '');
    var fileTarget = path.join(valorant_dir, currentVersion);
    if (fs.existsSync(fileTarget)) {
        console.log("[Log]: Waiting for Valorant to start...");
        var isProcessClose = false;
        setInterval(async () => {
            var isFindValorant = await isFindValApp();
            if (isFindValorant && !isFound) {
                isProcessClose = false;
                isFound = true;
                console.log("[Debug]: Clone old video...");
                fs.copyFileSync(fileTarget, copyPath);
                console.log("[Debug]: Valorant is started.");
                var fileFound = await waitUntilFind();
                if (!isProcessClose) {
                    if (fileFound) {
                        console.log("[Debug]: Changing video...");
                        fs.copyFileSync(fileFound, fileTarget);
                    } else {
                        console.log("[Error]: File not found\n\tExpected: `waitUntilFind function is not working.`");
                    };
                };
            } else if (!isFindValorant && isFound) {
                isFound = false
                isProcessClose = true
                console.log("[Debug]: Valorant is closed.");
                fs.copyFileSync(copyPath, fileTarget);
                console.log("[Log]: Waiting for Valorant to start...");
            };
        }, 500);
    } else {
        console.log("[Error]: File not found\n\tExpected: `Valorant is installed on selected drive or valorant is update.`");
    };
};

console.log("Created by @powershell1");
console.log("Github Repo: `https://github.com/powershell1/ValorantHubChanger`\n");
if (!fs.existsSync(ffpath)) {
    fs.mkdirSync(ffpath);
};
if (fs.existsSync(installedDisk)) {
    var Drive = fs.readFileSync(installedDisk, "utf8");
    StartMain(Drive);
} else {
    prompt.message = "";
    prompt.start();
    prompt.get(["Enter your valorant install drive"], function (err, result) {
        var drive = result["Enter your valorant install drive"].toLocaleUpperCase();
        fs.writeFileSync(installedDisk, drive);
        StartMain(drive);
    });
};

setInterval(() => {}, 10000);