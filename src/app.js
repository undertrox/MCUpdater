/**
 * Created by silas on 20.03.2018.
 */
const {dialog} = require('electron').remote;
import fs from 'fs';
import path from 'path';
import {lstatSync, readdirSync} from 'fs';
import {join} from 'path';
import glob from 'glob';
/*
import download from './downloader.js';
import $ from '../app/jquery.js';
*/
let settingsPath = "updater_settings.json";
let multimcPath;
let modsPath;
let instancePath;

const isDirectory = source => {
  try {
    return lstatSync(source).isDirectory();
  } catch (e) {
    return false;
  }
};

const getDirectories = source =>
  readdirSync(source).map(name => join(source, name)).filter(isDirectory);

function configObject() {
  return {
    multiPath: multimcPath,
    modsPath: modsPath,
    instancePath: instancePath
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
  instancePath = conf.instancePath ? conf.instancePath : "";
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
  let dropdownSettings;
  let selVal = '';
  try {
    let instancesPath = path.resolve(path.dirname(multimcPath) + '\\instances');
    let instances = getDirectories(instancesPath);
    dropdownSettings = {
      placeholder: "Instanz auswählen",
      values: []
    };
    instances.forEach(instance => {
      if (instance.substr(instance.lastIndexOf('\\') + 1, instance.lastIndex) !== '_MMC_TEMP') {
        let instanceP;
        if (isDirectory(instance + '\\.minecraft')) {
          instanceP = instance + '\\.minecraft\\mods\\'
        } else {
          instanceP = instance + '\\minecraft\\mods\\'
        }
        if (instanceP === instancePath) {
          selVal = instanceP;
          dropdownSettings.values.push({
            name: instance.substr(instance.lastIndexOf('\\') + 1, instance.lastIndex),
            value: instanceP,
            selected: true
          });
        } else {
          dropdownSettings.values.push({
            name: instance.substr(instance.lastIndexOf('\\') + 1, instance.lastIndex),
            value: instanceP
          });
        }

      }
    });
  } catch (e) {
    dropdownSettings = {
      placeholder: "Ungültiger MultiMC-Pfad",
      values: []
    };
    console.log(e);
  }
  $('#instance-dropdown').dropdown('setup menu', dropdownSettings).dropdown('set selected', selVal);
}

function updateButton() {
  let c = configObject();
  let mmcp = c.multiPath;
  let mpp = c.modsPath;
  let instance = $('#instance-dropdown').dropdown('get value');
  let validInputs = '';
  if (instance) {
    validInputs += 'i';
  }
  if (mmcp) {
    validInputs += 'c';
  }
  if (mpp) {
    validInputs += 'm';
  }
  if (validInputs == 'icm') {
    $('#btn-update').prop('disabled', false);
  }
  return validInputs;
}

function showErrors() {
  let inp = updateButton();
  if (!inp.includes('i')) {
    $('#instance-dropdown').addClass('error');
  } else {
    $('#instance-dropdown').removeClass('error');
  }
  if (!inp.includes('c')) {
    $('#txt-path').parent().addClass('error');
  } else {
    $('#txt-path').parent().removeClass('error');
  }
  if (!inp.includes('m')) {
    $('#txt-mod-path').parent().addClass('error');
  } else {
    $('#txt-mod-path').parent().removeClass('error');
  }
}

$(() => {
  let conf = reloadConfig();
  $('#instance-dropdown input').on('change', (event) => {
    updateButton();
    showErrors();
    instancePath = event.target.value;
    saveConfig();
  });
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
        updateButton();
        showErrors();
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
    updateButton();
    showErrors();
  });

  $('#btn-update').on('click', () => {
    if (updateButton() === 'icm') {
      // Minecraft Updaten
      $('#btn-update').addClass('loading').addClass('disabled');
      $('#instance-dropdown').addClass('disabled');
      $('#txt-mod-path').prop('disabled', true);
      $('#txt-path').prop('disabled', true);
      download(modsPath, "mods.json", (bytes, perc) => console.log(perc), () => {
        let modsObject = JSON.parse(fs.readFileSync('mods.json'));
        $('.progress.mods').removeClass('invisible').progress({
          total: modsObject.mods.length,
          text: {
            active: "Mod {value} von {total}"
          }
        });
        let downloadMod = (modID, callback) => {
          if (modID < modsObject.mods.length) {
            let mod = modsObject.mods[modID];
            $('.progress').removeClass('invisible');
            $('.progress.mods').progress('increment');
            $('.progress.mod').progress({
              text: {
                active: mod.name + " wird auf Version " + mod.version + " geupdatet."
              },
              percent: 0,
              autoSuccess: false
            });
            if (!fs.existsSync(instancePath + mod.name + "-" + mod.version + ".jar")) {
              let files = glob.sync(instancePath + mod.name + '*.jar');
              files.forEach(fs.unlinkSync);
              download(mod.download, instancePath + mod.name + "-" + mod.version + ".jar", (bytes, perc, totalbytes) => {
                $('.progress.mod').progress('set percent', perc)
              }, () => {
                callback(modID + 1, callback);
              });
            } else {
              callback(modID + 1, callback);
            }

          } else {
            $('.progress').addClass('invisible');
            $('#btn-update').removeClass('loading').off('click').removeClass('disabled').addClass('success').on('click', () => {
              window.close();
            }).html('<i class="checkmark icon"></i> Fertig')
          }

        };
        downloadMod(0, downloadMod);
        // Forge updaten
        let forgeVersion = modsObject.forge;
        let instanceSettingsPath = instancePath.split("\\");
        instanceSettingsPath.pop();
        instanceSettingsPath.pop();
        instanceSettingsPath.pop();
        instanceSettingsPath = instanceSettingsPath.join("\\") + "\\mmc-pack.json";
        fs.move(instanceSettingsPath, instanceSettingsPath + ".backup");
        let instanceSettings = JSON.parse(fs.readFileSync(instanceSettingsPath));
        for (let i = 0; i< instanceSettings.components.length; i++) {
          if (instanceSettings.components[i].uid == "net.minecraftforge") {
            instanceSettings.components[i].version = forgeVersion;
          }
        }
        fs.writeFile(instanceSettingsPath, JSON.stringify(instanceSettings), {flag: "w"}, (err) => {
          if (err) {
            alert("Ein Fehler ist beim Speichern der Versionsdatei aufgetreten: " + err.message);
            console.log(err);
          }
        });
      });


    }
  }).on('mouseover', showErrors);
  $('#header-update').on('mouseover', showErrors);
  $('#txt-path')
    .val(conf.multiPath)
    .on('click', () => {
      updateButton();
      showErrors();
    });
  $('#txt-mod-path')
    .val(conf.modsPath)
    .on('click', () => {
      updateButton();
      showErrors();
    });
  updateButton();
});
