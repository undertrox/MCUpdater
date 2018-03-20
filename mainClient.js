/**
 * Created by silas on 20.03.2018.
 */
const {dialog} = require('electron').remote;
import fs from 'fs';
import path from 'path';
import {lstatSync, readdirSync} from 'fs';
import {join} from 'path';

let settingsPath = "updater_settings.json";
let multimcPath;
let modsPath;

const isDirectory = source => lstatSync(source).isDirectory();

const getDirectories = source =>
    readdirSync(source).map(name => join(source, name)).filter(isDirectory);

function configObject() {
    return {
        multiPath: multimcPath,
        modsPath: modsPath
    }
}

function reloadConfig() {
    let data = fs.readFileSync(settingsPath, {encoding: 'utf-8', flag: 'a+'});
    let err;
    let conf;
    if (err) {
        alert("An error ocurred reading the file :" + err.message);
        return;
    }
    if (data) {
        conf = JSON.parse(data);
    } else {
        conf = {}
    }
    multimcPath = conf.multiPath ? conf.multiPath : "";
    modsPath = conf.modsPath ? conf.modsPath : "https://mc-mods.herokuapp.com/mods.json";
    saveConfig();
    return configObject();
}

function saveConfig() {
    fs.writeFile(settingsPath, JSON.stringify(configObject()), {flag: "w"}, (err) => {
        if (err) {
            alert("Ein Fehler ist beim Speichern der Konfigurationsdatei aufgetreten: " + err.message);
            console.log(err);
        }

    });
}

function updateDropdown() {
    let instancesPath = path.resolve(path.dirname(multimcPath) + '\\instances');
    let instances = getDirectories(instancesPath);
    let dropdownSettings = {
        placeholder: "Instanz auswählen",
        values: []
    };
    instances.forEach(instance => {
        if (instance.substr(instance.lastIndexOf('\\')+1, instance.lastIndex) !== '_MMC_TEMP') {
            dropdownSettings.values.push({
                name: instance.substr(instance.lastIndexOf('\\')+1, instance.lastIndex),
                value: instance
            });

        }
    })
    $('#instance-dropdown').dropdown(dropdownSettings);
}

$(() => {
    let conf = reloadConfig();
    updateDropdown();
    $('#mc-path').on('click', () => {
        dialog.showOpenDialog({
            title: "MultiMC-Pfad",
            defaultPath: "%userprofile%/Downloads",
            buttonLabel: "MultiMC auswählen",
            filters: [
                {
                    name: "Ausführbare Dateien",
                    extensions: [
                        "exe"
                    ]
                }
            ],
            properties: [
                "openFile"
            ]
        }, (filePaths) => {
            if (filePaths === undefined) {

            } else {
                let file = filePaths[0];
                $('#txt-path').val(file);
                multimcPath = file;
                saveConfig();
                updateDropdown();
            }
        });
    });
    $('#btn-lock-mod-path').on('click', () => {
        if (!$('#txt-mod-path').prop('disabled')) {
            $('#txt-mod-path').prop('disabled', true);
            $('#icn-lock').prop("class", "lock icon");
        } else {
            $('#txt-mod-path').prop('disabled', false);
            $('#icn-lock').prop("class", "open lock icon");
        }
    });

    $('#txt-path').val(conf.multiPath);
    $('#txt-mod-path').val(conf.modsPath);
});
