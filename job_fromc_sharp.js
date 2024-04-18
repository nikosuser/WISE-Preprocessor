/**
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License
 * as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
 */
"use strict";
/**
 * An example that creates and runs a job through W.I.S.E. Builder with command line exports.
 * 
 * Example Usage:
 * node ./dist/example_job_generalized.js -BG burn_grid_file 2001-10-16T13:00:00-05:00 2001-10-16T21:00:00-05:00
 * This will produce an outputs file with a single burn_grid_file.tif file if there is data for the entered time.
 * 
 * Command Line argument standard for non-MAP types:
 * -[non-MAP type] [filename] [ISO time] [ISO time (optional)]
 * 
 * Command Line Input Expectations for non-MAP types:
 * - Non-MAP types are indicated by a flag, valid flags are as follows:
 *      FI: Fire Intensity
 *      FL: Flame Length
 *      ROS: Rate of Spread
 *      SFC: Surface Fuel Consumption
 *      CFC: Crown Fuel Consumption
 *      TFC: Total Fuel Consumption
 *      CFB: Crown Fraction Burned
 *      RAZ: Direction the fire burned at the location
 *      BG: Burn Grid
 *      HROS: Potential Head Rate of Spread
 *      FROS: Potential Flank Rate of Spread
 *      BROS: Potential Back Rate of Spread
 *      AT: Arrival Time
 *      ATMIN: Minimum Arrival Time
 *      ATMAX: Maximum Arrival Time
 * 
 * Command Line argument standard for MAP types:
 * -[MAP type] [filename] [ISO time]
 * 
 * Command Line Input Expectations for MAP types:
 * - MAP types are indicated by a flag, valid flags are as follows:
 *      BROS_MAP
 *      CBH_MAP
 *      CFB_MAP
 *      CFC_MAP
 *      CFL_MAP
 *      FI_MAP
 *      FL_MAP
 *      FMC_MAP
 *      FROS_MAP
 *      HROS_MAP
 *      PC_MAP
 *      PDF_MAP
 *      RAZ_MAP
 *      RSS_MAP
 *      SFC_MAP
 *      TFC_MAP
 *      CURINGDEGREE_MAP
 *      DIRVECTOR_MAP
 *      FUELLOAD_MAP
 *      GRASSPHENOLOGY_MAP
 *      GREENUP_MAP
 *      ROSVECTOR_MAP
 *      TREEHEIGHT_MAP
 * 
 *   NOTE: There is a known issue with the current version of W.I.S.E. regarding generation of these MAP type grid exports.
 *         Hence adding these as exports may not work.
 * 
 * - File names have the following restrictions:
 *      May or may not include a file extension. If included, the extension must be ".tif"
 *      Cannot contain the characters <>:"/\|?*"
 *      Cannot contain any spaces or periods
 *      Must follow all Windows restrictions on file naming which can be found at:
 *          https://learn.microsoft.com/en-us/windows/win32/fileio/naming-a-file
 *      
 * - Times must be entered in the ISO format:
 *      YYYY-MM-DDTHH:mm:ss
 *          Y = year
 *          M = month
 *          D = day
 *          H = hours (in military time / 24 hour clock)
 *          m = minutes
 *          s = seconds
 * 
 * - The first time parameter is required. This time indicates the exact time for the export.
 *      If the second time parameter is included, this parameter represents the start time.
 * 
 * - The second time parameter is optional. This time represents the end time and therefore must be occur after the first time parameter.
 *      If included, both times will be used to form a range.
 * 
 * File Input Expectations:
 * - This example script utilizes the Dogrib example inputs.
 *      These inputs can be found with the W.I.S.E. API as mentioned in the
 *          W.I.S.E. Prerequisite and Setup document.
 *      This set of inputs must be placed in the jobs directory in: jobs/test/
 *      This set of inputs must include kml converted versions of all kmz files.
 *      Files affected by this include:
 *          - access_gravel_road
 *          - access_unimproved_road
 *          - hydrology_river
 *          - hydrology_stream
 *          - ignition_point_20011016_1300
 *          - ignition_point_20011016_1600
 *          - perimeter_20011016_1300
 *          - perimeter_20011016_1300to1942
 *          - perimeter_20011024_0700
 *          - weather_patch_wd270
 */

Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const index_1 = require("./index");
const luxon_1 = require("luxon");
const path = require("path");
const { start } = require("repl");

let serverConfig = new index_1.defaults.ServerConfiguration();
let localDir = serverConfig.exampleDirectory;

var simulationSetupFile = "C:/jobs/test/SimulationDictionary.txt";

const stringArray = readStringArrayFromFile(simulationSetupFile);

//simulation parameters:

let ignitionTime = luxon_1.DateTime.fromISO(stringArray[6]);
let simulationEndTime = luxon_1.DateTime.fromISO(stringArray[8]);
let weatherStationHeight = parseFloat(stringArray[9]);
let weatherStationLatLong = new index_1.globals.LatLon(textToCoords(stringArray[10])[0], textToCoords(stringArray[10])[1]);
let ignitionLatLong = new index_1.globals.LatLon(textToCoords(stringArray[7])[0], textToCoords(stringArray[7])[1]);
let weatherStartTime = luxon_1.DateTime.fromISO(stringArray[11]);
let weatherEndTime = luxon_1.DateTime.fromISO(stringArray[12]);

// *******************************************************

/*
var inputDataFolder = stringArray[0];
for (let i = 1; i <= 5; i++) {
    copyFile(inputDataFolder, localDir + "/test/", stringArray[1], (err) => {
        if (err) {
            console.error(err);
        } else {
            console.log(stringArray[1] + 'copied successfully!');
        }
    });
}
*/

/*
 * *******************************************************
 * Prepare list of exports based on command line arguments
 * *******************************************************
*/

// global variable to hold all outputs based on CLI flags
const sceneExports = {};
// global constant of all export types
const exportTypes = ["-FI","-FL","-ROS","-SFC","-CFC","-TFC","-CFB","-RAZ","-BG","-HROS","-FROS","-BROS","-AT","-ATMIN","-ATMAX"];
const exportMapTypes = ["-BROS_MAP","-CBH_MAP","-CFB_MAP","-CFC_MAP","-CFL_MAP","-FI_MAP","-FL_MAP","-FMC_MAP","-FROS_MAP","-HROS_MAP",
                        "-PC_MAP","-PDF_MAP","-RAZ_MAP","-RSS_MAP","-SFC_MAP","-TFC_MAP","-CURINGDEGREE_MAP","-DIRVECTOR_MAP",
                        "-FUELLOAD_MAP","-GRASSPHENOLOGY_MAP","-GREENUP_MAP","-ROSVECTOR_MAP","-TREEHEIGHT_MAP"];

// function to collect command line arguments, ran immediately
(function collectExports() {
    // read in command line arguments
    const args = process.argv.slice(2);

    // process arguments into sceneExports
    let currentFlag = null;
    args.forEach(arg => {
        if (arg.startsWith("-")){
            currentFlag = arg;
            sceneExports[currentFlag] = [];
        } else if (currentFlag) {
            sceneExports[currentFlag].push(arg);
        }
    });

    // variable to hold all file names to ensure unique file names are used
    let filenames = [];

    // validate the sceneExports
    Object.keys(sceneExports).forEach(key => {
        // Validate type
        if(!exportTypes.includes(key) && !exportMapTypes.includes(key)){
            throw Error("Unknown export type "+key.slice(1));
        }
        // Validate number of arguments if its an non-map export type
        if(exportTypes.includes(key) && (sceneExports[key].length > 3 || sceneExports[key].length < 2)){
            throw Error("Incorrect number of arguments for "+key.slice(1));
        }
        // Validate number of arguments if its map export type
        else if(exportMapTypes.includes(key) && sceneExports[key].length != 2){
            throw Error("Incorrect number of arguments for "+key.slice(1));
        }
        // Validate unique filename
        if(filenames.includes(sceneExports[key][0])){
            throw Error("The export filename \""+sceneExports[key][0]+"\" is used more than once");
        } else {
            filenames.push(sceneExports[key][0]);
        }
    });
})();

/*
 * *******************************************************
 * Initialize connections to WISE, MQTT broker, and jobs folder
 * *******************************************************
*/

// initialize the connection settings for W.I.S.E. Builder
index_1.globals.SocketHelper.initialize(serverConfig.builderAddress, serverConfig.builderPort);
// turn on debug messages
index_1.globals.WISELogger.getInstance().setLogLevel(index_1.globals.WISELogLevel.DEBUG);
// set the default MQTT broker to use when listening for W.I.S.E. events
index_1.client.JobManager.setDefaults({
    host: serverConfig.mqttAddress,
    port: serverConfig.mqttPort,
    topic: serverConfig.mqttTopic,
    username: serverConfig.mqttUsername,
    password: serverConfig.mqttPassword
});

// uncomment this line for exceptions to be thrown when invalid values are set
// globals.SocketMsg.inlineThrowOnError = true;

// the directory of the test files

// make sure the local directory has been configured
if (localDir.includes('@JOBS@')) {
    console.log("The job directory has not been configured. Please edit the job directory before running the example server.");
    process.exit();
}

/*
 * *******************************************************
 * Define helper functions
 * *******************************************************
*/

/**
 * Async
 * @param t The timeout in milliseconds
 * @param callback The function that will be called when the delay is up.
 */
function delay(t) {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve();
        }, t);
    });
}

/**
 * Recursively handle nodes of the validation tree and
 * print relevant ones to the console.
 * @param node The node of the validation tree to handle.
 */
function handleErrorNode(node) {
    //leaf node
    if (node.children.length == 0) {
        console.error(`'${node.getValue()}' is invalid for '${node.propertyName}': "${node.message}"`);
    }
    //branch node
    else {
        node.children.forEach(child => {
            handleErrorNode(child);
        });
    }
}

/**
 * Creates grid exports based on command line arguments
 * @param prom The prometheus object
 * @param scene The scene that the exports will be added to
 * @param filepath The relative file path location within the outputs folder where the exports will be saved to (ex: "scen0/")
 * @param sceneExports The sceneExports object containing all listed exports to create
 */
function createGridExports(prom, scene, filepath, sceneExports) {
    Object.keys(sceneExports).forEach(key => {

        // identify the type of export
        let type;
        if (key === "-FI") {type = index_1.globals.GlobalStatistics.MAX_FI;}
        else if (key === "-FL") {type = index_1.globals.GlobalStatistics.MAX_FL;}
        else if (key === "-ROS") {type = index_1.globals.GlobalStatistics.MAX_ROS;}
        else if (key === "-SFC") {type = index_1.globals.GlobalStatistics.MAX_SFC;}
        else if (key === "-CFC") {type = index_1.globals.GlobalStatistics.MAX_CFC;}
        else if (key === "-TFC") {type = index_1.globals.GlobalStatistics.MAX_TFC;}
        else if (key === "-CFB") {type = index_1.globals.GlobalStatistics.MAX_CFB;}
        else if (key === "-RAZ") {type = index_1.globals.GlobalStatistics.RAZ;}
        else if (key === "-BG") {type = index_1.globals.GlobalStatistics.BURN_GRID;}
        else if (key === "-HROS") {type = index_1.globals.GlobalStatistics.HROS;}
        else if (key === "-FROS") {type = index_1.globals.GlobalStatistics.FROS;}
        else if (key === "-BROS") {type = index_1.globals.GlobalStatistics.BROS;}
        else if (key === "-AT") {type = index_1.globals.GlobalStatistics.FIRE_ARRIVAL_TIME;}
        else if (key === "-ATMIN") {type = index_1.globals.GlobalStatistics.FIRE_ARRIVAL_TIME_MIN;}
        else if (key === "-ATMAX") {type = index_1.globals.GlobalStatistics.FIRE_ARRIVAL_TIME_MAX;}
        else if (key === "-BROS_MAP") {type = index_1.globals.GlobalStatistics.BROS_MAP;}
        else if (key === "-CBH_MAP") {type = index_1.globals.GlobalStatistics.CBH_MAP;}
        else if (key === "-CFB_MAP") {type = index_1.globals.GlobalStatistics.CFB_MAP;}
        else if (key === "-CFC_MAP") {type = index_1.globals.GlobalStatistics.CFC_MAP;}
        else if (key === "-CFL_MAP") {type = index_1.globals.GlobalStatistics.CFL_MAP;}
        else if (key === "-FI_MAP") {type = index_1.globals.GlobalStatistics.FI_MAP;}
        else if (key === "-FL_MAP") {type = index_1.globals.GlobalStatistics.FL_MAP;}
        else if (key === "-FMC_MAP") {type = index_1.globals.GlobalStatistics.FMC_MAP;}
        else if (key === "-FROS_MAP") {type = index_1.globals.GlobalStatistics.FROS_MAP;}
        else if (key === "-HROS_MAP") {type = index_1.globals.GlobalStatistics.HROS_MAP;}
        else if (key === "-PC_MAP") {type = index_1.globals.GlobalStatistics.PC_MAP;}
        else if (key === "-PDF_MAP") {type = index_1.globals.GlobalStatistics.PDF_MAP;}
        else if (key === "-RAZ_MAP") {type = index_1.globals.GlobalStatistics.RAZ_MAP;}
        else if (key === "-RSS_MAP") {type = index_1.globals.GlobalStatistics.RSS_MAP;}
        else if (key === "-SFC_MAP") {type = index_1.globals.GlobalStatistics.SFC_MAP;}
        else if (key === "-TFC_MAP") {type = index_1.globals.GlobalStatistics.TFC_MAP;}
        else if (key === "-CURINGDEGREE_MAP") {type = index_1.globals.GlobalStatistics.CURINGDEGREE_MAP;}
        else if (key === "-DIRVECTOR_MAP") {type = index_1.globals.GlobalStatistics.DIRVECTOR_MAP;}
        else if (key === "-FUELLOAD_MAP") {type = index_1.globals.GlobalStatistics.FUEL_LOAD_MAP;}
        else if (key === "-GRASSPHENOLOGY_MAP") {type = index_1.globals.GlobalStatistics.GRASSPHENOLOGY_MAP;}
        else if (key === "-GREENUP_MAP") {type = index_1.globals.GlobalStatistics.GREENUP_MAP;}
        else if (key === "-ROSVECTOR_MAP") {type = index_1.globals.GlobalStatistics.ROSVECTOR_MAP;}
        else if (key === "-TREEHEIGHT_MAP") {type = index_1.globals.GlobalStatistics.TREE_HEIGHT_MAP;}
        
        // add .tif extension if required
        let fullFilePath = filepath+sceneExports[key][0];
        if(!fullFilePath.endsWith(".tif")){
            fullFilePath = fullFilePath + ".tif";
        }

        // create simulation time, either single time or range.
        let simTime;
        if(sceneExports[key][2]) {
            simTime = new index_1.globals.TimeRange(luxon_1.DateTime.fromISO(sceneExports[key][1]), luxon_1.DateTime.fromISO(sceneExports[key][2]));
        }
        else {
            simTime = luxon_1.DateTime.fromISO(sceneExports[key][1]);
        }

        // add the export
        prom.addOutputGridFileToScenario(type, fullFilePath, simTime, index_1.wise.Output_GridFileInterpolation.IDW, scene);
    });
}

/**
 * Builds fuel definitions from the Dogrib example.
 * @returns An array of fuel definitions.
 */
function buildDogribLUT() {
    const fuelDefinitions = new Array();
    let fuel = new index_1.fuels.FuelDefinition("C-1 Spruce-Lichen Woodland", "C-1", 1);
    fuel.color = new index_1.fuels.RGBColor({ red: 209, green: 255, blue: 115 });
    fuelDefinitions.push(fuel);
    fuel = new index_1.fuels.FuelDefinition("C-2 Boreal Spruce", "C-2", 2);
    fuel.color = new index_1.fuels.RGBColor({ red: 34, green: 102, blue: 51 });
    fuelDefinitions.push(fuel);
    fuel = new index_1.fuels.FuelDefinition("C-3 Mature Jack or Lodgepole Pine", "C-3", 3);
    fuel.color = new index_1.fuels.RGBColor({ red: 131, green: 199, blue: 149 });
    fuelDefinitions.push(fuel);
    fuel = new index_1.fuels.FuelDefinition("C-4 Immature Jack or Lodgepole Pine", "C-4", 4);
    fuel.color = new index_1.fuels.RGBColor({ red: 112, green: 168, blue: 0 });
    fuelDefinitions.push(fuel);
    fuel = new index_1.fuels.FuelDefinition("C-5 Red and White Pine", "C-5", 5);
    fuel.color = new index_1.fuels.RGBColor({ red: 223, green: 184, blue: 230 });
    fuelDefinitions.push(fuel);
    fuel = new index_1.fuels.FuelDefinition("C-6 Conifer Plantation", "C-6", 6);
    fuel.color = new index_1.fuels.RGBColor({ red: 172, green: 102, blue: 237 });
    fuelDefinitions.push(fuel);
    fuel = new index_1.fuels.FuelDefinition("C-7 Ponderosa Pine - Douglas-Fir", "C-7", 7);
    fuel.color = new index_1.fuels.RGBColor({ red: 112, green: 12, blue: 242 });
    fuelDefinitions.push(fuel);
    fuel = new index_1.fuels.FuelDefinition("D-1 Leafless Aspen", "D-1", 11);
    fuel.color = new index_1.fuels.RGBColor({ red: 196, green: 189, blue: 151 });
    fuelDefinitions.push(fuel);
    fuel = new index_1.fuels.FuelDefinition("D-2 Green Aspen (with BUI Thresholding)", "D-2", 12);
    fuel.color = new index_1.fuels.RGBColor({ red: 137, green: 112, blue: 68 });
    fuelDefinitions.push(fuel);
    fuel = new index_1.fuels.FuelDefinition("D-1/D-2 Aspen", "D-1/D-2", 13);
    fuel.color = new index_1.fuels.RGBColor({ red: 196, green: 189, blue: 151 });
    fuelDefinitions.push(fuel);
    fuel = new index_1.fuels.FuelDefinition("S-1 Jack or Lodgepole Pine Slash", "S-1", 21);
    fuel.color = new index_1.fuels.RGBColor({ red: 251, green: 190, blue: 185 });
    fuelDefinitions.push(fuel);
    fuel = new index_1.fuels.FuelDefinition("S-2 White Spruce - Balsam Slash", "S-2", 22);
    fuel.color = new index_1.fuels.RGBColor({ red: 247, green: 104, blue: 161 });
    fuelDefinitions.push(fuel);
    fuel = new index_1.fuels.FuelDefinition("S-3 Coastal Cedar - Hemlock - Douglas-Fir Slash", "S-3", 23);
    fuel.color = new index_1.fuels.RGBColor({ red: 174, green: 1, blue: 126 });
    fuelDefinitions.push(fuel);
    fuel = new index_1.fuels.FuelDefinition("O-1a Matted Grass", "O-1a", 31);
    fuel.color = new index_1.fuels.RGBColor({ red: 255, green: 255, blue: 190 });
    fuelDefinitions.push(fuel);
    fuel = new index_1.fuels.FuelDefinition("O-1b Standing Grass", "O-1b", 32);
    fuel.color = new index_1.fuels.RGBColor({ red: 230, green: 230, blue: 0 });
    fuelDefinitions.push(fuel);
    fuel = new index_1.fuels.FuelDefinition("M-1 Boreal Mixedwood - Leafless", "M-1", 40);
    fuel.color = new index_1.fuels.RGBColor({ red: 255, green: 211, blue: 127 });
    fuelDefinitions.push(fuel);
    fuel = new index_1.fuels.FuelDefinition("M-1 Boreal Mixedwood - Leafless (05% Conifer)", "M-1", 405);
    fuel.color = new index_1.fuels.RGBColor({ red: 255, green: 211, blue: 127 });
    fuel.spreadParms = new index_1.fuels.MixedSpread({ pc: 5 });
    fuelDefinitions.push(fuel);
    fuel = new index_1.fuels.FuelDefinition("M-1 Boreal Mixedwood - Leafless (10% Conifer)", "M-1", 410);
    fuel.color = new index_1.fuels.RGBColor({ red: 255, green: 211, blue: 127 });
    fuel.spreadParms = new index_1.fuels.MixedSpread({ pc: 10 });
    fuelDefinitions.push(fuel);
    fuel = new index_1.fuels.FuelDefinition("M-1 Boreal Mixedwood - Leafless (15% Conifer)", "M-1", 415);
    fuel.color = new index_1.fuels.RGBColor({ red: 255, green: 211, blue: 127 });
    fuel.spreadParms = new index_1.fuels.MixedSpread({ pc: 15 });
    fuelDefinitions.push(fuel);
    fuel = new index_1.fuels.FuelDefinition("M-1 Boreal Mixedwood - Leafless (20% Conifer)", "M-1", 420);
    fuel.color = new index_1.fuels.RGBColor({ red: 255, green: 211, blue: 127 });
    fuel.spreadParms = new index_1.fuels.MixedSpread({ pc: 20 });
    fuelDefinitions.push(fuel);
    fuel = new index_1.fuels.FuelDefinition("M-1 Boreal Mixedwood - Leafless (25% Conifer)", "M-1", 425);
    fuel.color = new index_1.fuels.RGBColor({ red: 255, green: 211, blue: 127 });
    fuel.spreadParms = new index_1.fuels.MixedSpread({ pc: 25 });
    fuelDefinitions.push(fuel);
    fuel = new index_1.fuels.FuelDefinition("M-1 Boreal Mixedwood - Leafless (30% Conifer)", "M-1", 430);
    fuel.color = new index_1.fuels.RGBColor({ red: 255, green: 211, blue: 127 });
    fuel.spreadParms = new index_1.fuels.MixedSpread({ pc: 30 });
    fuelDefinitions.push(fuel);
    fuel = new index_1.fuels.FuelDefinition("M-1 Boreal Mixedwood - Leafless (35% Conifer)", "M-1", 435);
    fuel.color = new index_1.fuels.RGBColor({ red: 255, green: 211, blue: 127 });
    fuel.spreadParms = new index_1.fuels.MixedSpread({ pc: 35 });
    fuelDefinitions.push(fuel);
    fuel = new index_1.fuels.FuelDefinition("M-1 Boreal Mixedwood - Leafless (40% Conifer)", "M-1", 440);
    fuel.color = new index_1.fuels.RGBColor({ red: 255, green: 211, blue: 127 });
    fuel.spreadParms = new index_1.fuels.MixedSpread({ pc: 40 });
    fuelDefinitions.push(fuel);
    fuel = new index_1.fuels.FuelDefinition("M-1 Boreal Mixedwood - Leafless (45% Conifer)", "M-1", 445);
    fuel.color = new index_1.fuels.RGBColor({ red: 255, green: 211, blue: 127 });
    fuel.spreadParms = new index_1.fuels.MixedSpread({ pc: 45 });
    fuelDefinitions.push(fuel);
    fuel = new index_1.fuels.FuelDefinition("M-1 Boreal Mixedwood - Leafless (50% Conifer)", "M-1", 450);
    fuel.color = new index_1.fuels.RGBColor({ red: 255, green: 211, blue: 127 });
    fuel.spreadParms = new index_1.fuels.MixedSpread({ pc: 50 });
    fuelDefinitions.push(fuel);
    fuel = new index_1.fuels.FuelDefinition("M-1 Boreal Mixedwood - Leafless (55% Conifer)", "M-1", 455);
    fuel.color = new index_1.fuels.RGBColor({ red: 255, green: 211, blue: 127 });
    fuel.spreadParms = new index_1.fuels.MixedSpread({ pc: 55 });
    fuelDefinitions.push(fuel);
    fuel = new index_1.fuels.FuelDefinition("M-1 Boreal Mixedwood - Leafless (60% Conifer)", "M-1", 460);
    fuel.color = new index_1.fuels.RGBColor({ red: 255, green: 211, blue: 127 });
    fuel.spreadParms = new index_1.fuels.MixedSpread({ pc: 60 });
    fuelDefinitions.push(fuel);
    fuel = new index_1.fuels.FuelDefinition("M-1 Boreal Mixedwood - Leafless (65% Conifer)", "M-1", 465);
    fuel.color = new index_1.fuels.RGBColor({ red: 255, green: 211, blue: 127 });
    fuel.spreadParms = new index_1.fuels.MixedSpread({ pc: 65 });
    fuelDefinitions.push(fuel);
    fuel = new index_1.fuels.FuelDefinition("M-1 Boreal Mixedwood - Leafless (70% Conifer)", "M-1", 470);
    fuel.color = new index_1.fuels.RGBColor({ red: 255, green: 211, blue: 127 });
    fuel.spreadParms = new index_1.fuels.MixedSpread({ pc: 70 });
    fuelDefinitions.push(fuel);
    fuel = new index_1.fuels.FuelDefinition("M-1 Boreal Mixedwood - Leafless (75% Conifer)", "M-1", 475);
    fuel.color = new index_1.fuels.RGBColor({ red: 255, green: 211, blue: 127 });
    fuel.spreadParms = new index_1.fuels.MixedSpread({ pc: 75 });
    fuelDefinitions.push(fuel);
    fuel = new index_1.fuels.FuelDefinition("M-1 Boreal Mixedwood - Leafless (80% Conifer)", "M-1", 480);
    fuel.color = new index_1.fuels.RGBColor({ red: 255, green: 211, blue: 127 });
    fuel.spreadParms = new index_1.fuels.MixedSpread({ pc: 80 });
    fuelDefinitions.push(fuel);
    fuel = new index_1.fuels.FuelDefinition("M-1 Boreal Mixedwood - Leafless (85% Conifer)", "M-1", 485);
    fuel.color = new index_1.fuels.RGBColor({ red: 255, green: 211, blue: 127 });
    fuel.spreadParms = new index_1.fuels.MixedSpread({ pc: 85 });
    fuelDefinitions.push(fuel);
    fuel = new index_1.fuels.FuelDefinition("M-1 Boreal Mixedwood - Leafless (90% Conifer)", "M-1", 490);
    fuel.color = new index_1.fuels.RGBColor({ red: 255, green: 211, blue: 127 });
    fuel.spreadParms = new index_1.fuels.MixedSpread({ pc: 90 });
    fuelDefinitions.push(fuel);
    fuel = new index_1.fuels.FuelDefinition("M-1 Boreal Mixedwood - Leafless (95% Conifer)", "M-1", 495);
    fuel.color = new index_1.fuels.RGBColor({ red: 255, green: 211, blue: 127 });
    fuel.spreadParms = new index_1.fuels.MixedSpread({ pc: 95 });
    fuelDefinitions.push(fuel);
    fuel = new index_1.fuels.FuelDefinition("M-2 Boreal Mixedwood - Green", "M-2", 50);
    fuel.color = new index_1.fuels.RGBColor({ red: 255, green: 170, blue: 0 });
    fuelDefinitions.push(fuel);
    fuel = new index_1.fuels.FuelDefinition("M-2 Boreal Mixedwood - Green (05% Conifer)", "M-2", 505);
    fuel.color = new index_1.fuels.RGBColor({ red: 255, green: 170, blue: 0 });
    fuel.spreadParms = new index_1.fuels.MixedSpread({ pc: 5 });
    fuelDefinitions.push(fuel);
    fuel = new index_1.fuels.FuelDefinition("M-2 Boreal Mixedwood - Green (10% Conifer)", "M-2", 510);
    fuel.color = new index_1.fuels.RGBColor({ red: 255, green: 170, blue: 0 });
    fuel.spreadParms = new index_1.fuels.MixedSpread({ pc: 10 });
    fuelDefinitions.push(fuel);
    fuel = new index_1.fuels.FuelDefinition("M-2 Boreal Mixedwood - Green (15% Conifer)", "M-2", 515);
    fuel.color = new index_1.fuels.RGBColor({ red: 255, green: 170, blue: 0 });
    fuel.spreadParms = new index_1.fuels.MixedSpread({ pc: 15 });
    fuelDefinitions.push(fuel);
    fuel = new index_1.fuels.FuelDefinition("M-2 Boreal Mixedwood - Green (20% Conifer)", "M-2", 520);
    fuel.color = new index_1.fuels.RGBColor({ red: 255, green: 170, blue: 0 });
    fuel.spreadParms = new index_1.fuels.MixedSpread({ pc: 20 });
    fuelDefinitions.push(fuel);
    fuel = new index_1.fuels.FuelDefinition("M-2 Boreal Mixedwood - Green (25% Conifer)", "M-2", 525);
    fuel.color = new index_1.fuels.RGBColor({ red: 255, green: 170, blue: 0 });
    fuel.spreadParms = new index_1.fuels.MixedSpread({ pc: 25 });
    fuelDefinitions.push(fuel);
    fuel = new index_1.fuels.FuelDefinition("M-2 Boreal Mixedwood - Green (30% Conifer)", "M-2", 530);
    fuel.color = new index_1.fuels.RGBColor({ red: 255, green: 170, blue: 0 });
    fuel.spreadParms = new index_1.fuels.MixedSpread({ pc: 30 });
    fuelDefinitions.push(fuel);
    fuel = new index_1.fuels.FuelDefinition("M-2 Boreal Mixedwood - Green (35% Conifer)", "M-2", 535);
    fuel.color = new index_1.fuels.RGBColor({ red: 255, green: 170, blue: 0 });
    fuel.spreadParms = new index_1.fuels.MixedSpread({ pc: 35 });
    fuelDefinitions.push(fuel);
    fuel = new index_1.fuels.FuelDefinition("M-2 Boreal Mixedwood - Green (40% Conifer)", "M-2", 540);
    fuel.color = new index_1.fuels.RGBColor({ red: 255, green: 170, blue: 0 });
    fuel.spreadParms = new index_1.fuels.MixedSpread({ pc: 40 });
    fuelDefinitions.push(fuel);
    fuel = new index_1.fuels.FuelDefinition("M-2 Boreal Mixedwood - Green (45% Conifer)", "M-2", 545);
    fuel.color = new index_1.fuels.RGBColor({ red: 255, green: 170, blue: 0 });
    fuel.spreadParms = new index_1.fuels.MixedSpread({ pc: 45 });
    fuelDefinitions.push(fuel);
    fuel = new index_1.fuels.FuelDefinition("M-2 Boreal Mixedwood - Green (50% Conifer)", "M-2", 550);
    fuel.color = new index_1.fuels.RGBColor({ red: 255, green: 170, blue: 0 });
    fuel.spreadParms = new index_1.fuels.MixedSpread({ pc: 50 });
    fuelDefinitions.push(fuel);
    fuel = new index_1.fuels.FuelDefinition("M-2 Boreal Mixedwood - Green (55% Conifer)", "M-2", 555);
    fuel.color = new index_1.fuels.RGBColor({ red: 255, green: 170, blue: 0 });
    fuel.spreadParms = new index_1.fuels.MixedSpread({ pc: 55 });
    fuelDefinitions.push(fuel);
    fuel = new index_1.fuels.FuelDefinition("M-2 Boreal Mixedwood - Green (60% Conifer)", "M-2", 560);
    fuel.color = new index_1.fuels.RGBColor({ red: 255, green: 170, blue: 0 });
    fuel.spreadParms = new index_1.fuels.MixedSpread({ pc: 60 });
    fuelDefinitions.push(fuel);
    fuel = new index_1.fuels.FuelDefinition("M-2 Boreal Mixedwood - Green (65% Conifer)", "M-2", 565);
    fuel.color = new index_1.fuels.RGBColor({ red: 255, green: 170, blue: 0 });
    fuel.spreadParms = new index_1.fuels.MixedSpread({ pc: 65 });
    fuelDefinitions.push(fuel);
    fuel = new index_1.fuels.FuelDefinition("M-2 Boreal Mixedwood - Green (70% Conifer)", "M-2", 570);
    fuel.color = new index_1.fuels.RGBColor({ red: 255, green: 170, blue: 0 });
    fuel.spreadParms = new index_1.fuels.MixedSpread({ pc: 70 });
    fuelDefinitions.push(fuel);
    fuel = new index_1.fuels.FuelDefinition("M-2 Boreal Mixedwood - Green (75% Conifer)", "M-2", 575);
    fuel.color = new index_1.fuels.RGBColor({ red: 255, green: 170, blue: 0 });
    fuel.spreadParms = new index_1.fuels.MixedSpread({ pc: 75 });
    fuelDefinitions.push(fuel);
    fuel = new index_1.fuels.FuelDefinition("M-2 Boreal Mixedwood - Green (80% Conifer)", "M-2", 580);
    fuel.color = new index_1.fuels.RGBColor({ red: 255, green: 170, blue: 0 });
    fuel.spreadParms = new index_1.fuels.MixedSpread({ pc: 80 });
    fuelDefinitions.push(fuel);
    fuel = new index_1.fuels.FuelDefinition("M-2 Boreal Mixedwood - Green (85% Conifer)", "M-2", 585);
    fuel.color = new index_1.fuels.RGBColor({ red: 255, green: 170, blue: 0 });
    fuel.spreadParms = new index_1.fuels.MixedSpread({ pc: 85 });
    fuelDefinitions.push(fuel);
    fuel = new index_1.fuels.FuelDefinition("M-2 Boreal Mixedwood - Green (90% Conifer)", "M-2", 590);
    fuel.color = new index_1.fuels.RGBColor({ red: 255, green: 170, blue: 0 });
    fuel.spreadParms = new index_1.fuels.MixedSpread({ pc: 90 });
    fuelDefinitions.push(fuel);
    fuel = new index_1.fuels.FuelDefinition("M-2 Boreal Mixedwood - Green (95% Conifer)", "M-2", 595);
    fuel.color = new index_1.fuels.RGBColor({ red: 255, green: 170, blue: 0 });
    fuel.spreadParms = new index_1.fuels.MixedSpread({ pc: 95 });
    fuelDefinitions.push(fuel);
    fuel = new index_1.fuels.FuelDefinition("M-1/M-2 Boreal Mixedwood", "M-1/M-2", 60);
    fuel.color = new index_1.fuels.RGBColor({ red: 255, green: 211, blue: 127 });
    fuelDefinitions.push(fuel);
    fuel = new index_1.fuels.FuelDefinition("M-1/M-2 Boreal Mixedwood (05% Conifer)", "M-1/M-2", 605);
    fuel.color = new index_1.fuels.RGBColor({ red: 255, green: 211, blue: 127 });
    fuel.spreadParms = new index_1.fuels.MixedSpread({ pc: 5 });
    fuelDefinitions.push(fuel);
    fuel = new index_1.fuels.FuelDefinition("M-1/M-2 Boreal Mixedwood (10% Conifer)", "M-1/M-2", 610);
    fuel.color = new index_1.fuels.RGBColor({ red: 255, green: 211, blue: 127 });
    fuel.spreadParms = new index_1.fuels.MixedSpread({ pc: 10 });
    fuelDefinitions.push(fuel);
    fuel = new index_1.fuels.FuelDefinition("M-1/M-2 Boreal Mixedwood (15% Conifer)", "M-1/M-2", 615);
    fuel.color = new index_1.fuels.RGBColor({ red: 255, green: 211, blue: 127 });
    fuel.spreadParms = new index_1.fuels.MixedSpread({ pc: 15 });
    fuelDefinitions.push(fuel);
    fuel = new index_1.fuels.FuelDefinition("M-1/M-2 Boreal Mixedwood (20% Conifer)", "M-1/M-2", 620);
    fuel.color = new index_1.fuels.RGBColor({ red: 255, green: 211, blue: 127 });
    fuel.spreadParms = new index_1.fuels.MixedSpread({ pc: 20 });
    fuelDefinitions.push(fuel);
    fuel = new index_1.fuels.FuelDefinition("M-1/M-2 Boreal Mixedwood (25% Conifer)", "M-1/M-2", 625);
    fuel.color = new index_1.fuels.RGBColor({ red: 255, green: 211, blue: 127 });
    fuel.spreadParms = new index_1.fuels.MixedSpread({ pc: 25 });
    fuelDefinitions.push(fuel);
    fuel = new index_1.fuels.FuelDefinition("M-1/M-2 Boreal Mixedwood (30% Conifer)", "M-1/M-2", 630);
    fuel.color = new index_1.fuels.RGBColor({ red: 255, green: 211, blue: 127 });
    fuel.spreadParms = new index_1.fuels.MixedSpread({ pc: 30 });
    fuelDefinitions.push(fuel);
    fuel = new index_1.fuels.FuelDefinition("M-1/M-2 Boreal Mixedwood (35% Conifer)", "M-1/M-2", 635);
    fuel.color = new index_1.fuels.RGBColor({ red: 255, green: 211, blue: 127 });
    fuel.spreadParms = new index_1.fuels.MixedSpread({ pc: 35 });
    fuelDefinitions.push(fuel);
    fuel = new index_1.fuels.FuelDefinition("M-1/M-2 Boreal Mixedwood (40% Conifer)", "M-1/M-2", 640);
    fuel.color = new index_1.fuels.RGBColor({ red: 255, green: 211, blue: 127 });
    fuel.spreadParms = new index_1.fuels.MixedSpread({ pc: 40 });
    fuelDefinitions.push(fuel);
    fuel = new index_1.fuels.FuelDefinition("M-1/M-2 Boreal Mixedwood (45% Conifer)", "M-1/M-2", 645);
    fuel.color = new index_1.fuels.RGBColor({ red: 255, green: 211, blue: 127 });
    fuel.spreadParms = new index_1.fuels.MixedSpread({ pc: 45 });
    fuelDefinitions.push(fuel);
    fuel = new index_1.fuels.FuelDefinition("M-1/M-2 Boreal Mixedwood (50% Conifer)", "M-1/M-2", 650);
    fuel.color = new index_1.fuels.RGBColor({ red: 255, green: 211, blue: 127 });
    fuel.spreadParms = new index_1.fuels.MixedSpread({ pc: 50 });
    fuelDefinitions.push(fuel);
    fuel = new index_1.fuels.FuelDefinition("M-1/M-2 Boreal Mixedwood (55% Conifer)", "M-1/M-2", 655);
    fuel.color = new index_1.fuels.RGBColor({ red: 255, green: 211, blue: 127 });
    fuel.spreadParms = new index_1.fuels.MixedSpread({ pc: 55 });
    fuelDefinitions.push(fuel);
    fuel = new index_1.fuels.FuelDefinition("M-1/M-2 Boreal Mixedwood (60% Conifer)", "M-1/M-2", 660);
    fuel.color = new index_1.fuels.RGBColor({ red: 255, green: 211, blue: 127 });
    fuel.spreadParms = new index_1.fuels.MixedSpread({ pc: 60 });
    fuelDefinitions.push(fuel);
    fuel = new index_1.fuels.FuelDefinition("M-1/M-2 Boreal Mixedwood (65% Conifer)", "M-1/M-2", 665);
    fuel.color = new index_1.fuels.RGBColor({ red: 255, green: 211, blue: 127 });
    fuel.spreadParms = new index_1.fuels.MixedSpread({ pc: 65 });
    fuelDefinitions.push(fuel);
    fuel = new index_1.fuels.FuelDefinition("M-1/M-2 Boreal Mixedwood (70% Conifer)", "M-1/M-2", 670);
    fuel.color = new index_1.fuels.RGBColor({ red: 255, green: 211, blue: 127 });
    fuel.spreadParms = new index_1.fuels.MixedSpread({ pc: 70 });
    fuelDefinitions.push(fuel);
    fuel = new index_1.fuels.FuelDefinition("M-1/M-2 Boreal Mixedwood (75% Conifer)", "M-1/M-2", 675);
    fuel.color = new index_1.fuels.RGBColor({ red: 255, green: 211, blue: 127 });
    fuel.spreadParms = new index_1.fuels.MixedSpread({ pc: 75 });
    fuelDefinitions.push(fuel);
    fuel = new index_1.fuels.FuelDefinition("M-1/M-2 Boreal Mixedwood (80% Conifer)", "M-1/M-2", 680);
    fuel.color = new index_1.fuels.RGBColor({ red: 255, green: 211, blue: 127 });
    fuel.spreadParms = new index_1.fuels.MixedSpread({ pc: 80 });
    fuelDefinitions.push(fuel);
    fuel = new index_1.fuels.FuelDefinition("M-1/M-2 Boreal Mixedwood (85% Conifer)", "M-1/M-2", 685);
    fuel.color = new index_1.fuels.RGBColor({ red: 255, green: 211, blue: 127 });
    fuel.spreadParms = new index_1.fuels.MixedSpread({ pc: 85 });
    fuelDefinitions.push(fuel);
    fuel = new index_1.fuels.FuelDefinition("M-1/M-2 Boreal Mixedwood (90% Conifer)", "M-1/M-2", 690);
    fuel.color = new index_1.fuels.RGBColor({ red: 255, green: 211, blue: 127 });
    fuel.spreadParms = new index_1.fuels.MixedSpread({ pc: 90 });
    fuelDefinitions.push(fuel);
    fuel = new index_1.fuels.FuelDefinition("M-1/M-2 Boreal Mixedwood (95% Conifer)", "M-1/M-2", 695);
    fuel.color = new index_1.fuels.RGBColor({ red: 255, green: 211, blue: 127 });
    fuel.spreadParms = new index_1.fuels.MixedSpread({ pc: 95 });
    fuelDefinitions.push(fuel);
    fuel = new index_1.fuels.FuelDefinition("M-3 Dead Balsam Fir Mixedwood - Leafless", "M-3", 70);
    fuel.color = new index_1.fuels.RGBColor({ red: 99, green: 0, blue: 0 });
    fuelDefinitions.push(fuel);
    fuel = new index_1.fuels.FuelDefinition("M-3 Dead Balsam Fir Mixedwood - Leafless (05% Dead Fir)", "M-3", 705);
    fuel.color = new index_1.fuels.RGBColor({ red: 99, green: 0, blue: 0 });
    fuel.spreadParms = new index_1.fuels.MixedDeadSpread({ pdf: 5 });
    fuelDefinitions.push(fuel);
    fuel = new index_1.fuels.FuelDefinition("M-3 Dead Balsam Fir Mixedwood - Leafless (10% Dead Fir)", "M-3", 710);
    fuel.color = new index_1.fuels.RGBColor({ red: 99, green: 0, blue: 0 });
    fuel.spreadParms = new index_1.fuels.MixedDeadSpread({ pdf: 10 });
    fuelDefinitions.push(fuel);
    fuel = new index_1.fuels.FuelDefinition("M-3 Dead Balsam Fir Mixedwood - Leafless (15% Dead Fir)", "M-3", 715);
    fuel.color = new index_1.fuels.RGBColor({ red: 99, green: 0, blue: 0 });
    fuel.spreadParms = new index_1.fuels.MixedDeadSpread({ pdf: 15 });
    fuelDefinitions.push(fuel);
    fuel = new index_1.fuels.FuelDefinition("M-3 Dead Balsam Fir Mixedwood - Leafless (20% Dead Fir)", "M-3", 720);
    fuel.color = new index_1.fuels.RGBColor({ red: 99, green: 0, blue: 0 });
    fuel.spreadParms = new index_1.fuels.MixedDeadSpread({ pdf: 20 });
    fuelDefinitions.push(fuel);
    fuel = new index_1.fuels.FuelDefinition("M-3 Dead Balsam Fir Mixedwood - Leafless (25% Dead Fir)", "M-3", 725);
    fuel.color = new index_1.fuels.RGBColor({ red: 99, green: 0, blue: 0 });
    fuel.spreadParms = new index_1.fuels.MixedDeadSpread({ pdf: 25 });
    fuelDefinitions.push(fuel);
    fuel = new index_1.fuels.FuelDefinition("M-3 Dead Balsam Fir Mixedwood - Leafless (30% Dead Fir)", "M-3", 730);
    fuel.color = new index_1.fuels.RGBColor({ red: 99, green: 0, blue: 0 });
    fuel.spreadParms = new index_1.fuels.MixedDeadSpread({ pdf: 30 });
    fuelDefinitions.push(fuel);
    fuel = new index_1.fuels.FuelDefinition("M-3 Dead Balsam Fir Mixedwood - Leafless (35% Dead Fir)", "M-3", 735);
    fuel.color = new index_1.fuels.RGBColor({ red: 99, green: 0, blue: 0 });
    fuel.spreadParms = new index_1.fuels.MixedDeadSpread({ pdf: 35 });
    fuelDefinitions.push(fuel);
    fuel = new index_1.fuels.FuelDefinition("M-3 Dead Balsam Fir Mixedwood - Leafless (40% Dead Fir)", "M-3", 740);
    fuel.color = new index_1.fuels.RGBColor({ red: 99, green: 0, blue: 0 });
    fuel.spreadParms = new index_1.fuels.MixedDeadSpread({ pdf: 40 });
    fuelDefinitions.push(fuel);
    fuel = new index_1.fuels.FuelDefinition("M-3 Dead Balsam Fir Mixedwood - Leafless (45% Dead Fir)", "M-3", 745);
    fuel.color = new index_1.fuels.RGBColor({ red: 99, green: 0, blue: 0 });
    fuel.spreadParms = new index_1.fuels.MixedDeadSpread({ pdf: 45 });
    fuelDefinitions.push(fuel);
    fuel = new index_1.fuels.FuelDefinition("M-3 Dead Balsam Fir Mixedwood - Leafless (50% Dead Fir)", "M-3", 750);
    fuel.color = new index_1.fuels.RGBColor({ red: 99, green: 0, blue: 0 });
    fuel.spreadParms = new index_1.fuels.MixedDeadSpread({ pdf: 50 });
    fuelDefinitions.push(fuel);
    fuel = new index_1.fuels.FuelDefinition("M-3 Dead Balsam Fir Mixedwood - Leafless (55% Dead Fir)", "M-3", 755);
    fuel.color = new index_1.fuels.RGBColor({ red: 99, green: 0, blue: 0 });
    fuel.spreadParms = new index_1.fuels.MixedDeadSpread({ pdf: 55 });
    fuelDefinitions.push(fuel);
    fuel = new index_1.fuels.FuelDefinition("M-3 Dead Balsam Fir Mixedwood - Leafless (60% Dead Fir)", "M-3", 760);
    fuel.color = new index_1.fuels.RGBColor({ red: 99, green: 0, blue: 0 });
    fuel.spreadParms = new index_1.fuels.MixedDeadSpread({ pdf: 60 });
    fuelDefinitions.push(fuel);
    fuel = new index_1.fuels.FuelDefinition("M-3 Dead Balsam Fir Mixedwood - Leafless (65% Dead Fir)", "M-3", 765);
    fuel.color = new index_1.fuels.RGBColor({ red: 99, green: 0, blue: 0 });
    fuel.spreadParms = new index_1.fuels.MixedDeadSpread({ pdf: 65 });
    fuelDefinitions.push(fuel);
    fuel = new index_1.fuels.FuelDefinition("M-3 Dead Balsam Fir Mixedwood - Leafless (70% Dead Fir)", "M-3", 770);
    fuel.color = new index_1.fuels.RGBColor({ red: 99, green: 0, blue: 0 });
    fuel.spreadParms = new index_1.fuels.MixedDeadSpread({ pdf: 70 });
    fuelDefinitions.push(fuel);
    fuel = new index_1.fuels.FuelDefinition("M-3 Dead Balsam Fir Mixedwood - Leafless (75% Dead Fir)", "M-3", 775);
    fuel.color = new index_1.fuels.RGBColor({ red: 99, green: 0, blue: 0 });
    fuel.spreadParms = new index_1.fuels.MixedDeadSpread({ pdf: 75 });
    fuelDefinitions.push(fuel);
    fuel = new index_1.fuels.FuelDefinition("M-3 Dead Balsam Fir Mixedwood - Leafless (80% Dead Fir)", "M-3", 780);
    fuel.color = new index_1.fuels.RGBColor({ red: 99, green: 0, blue: 0 });
    fuel.spreadParms = new index_1.fuels.MixedDeadSpread({ pdf: 80 });
    fuelDefinitions.push(fuel);
    fuel = new index_1.fuels.FuelDefinition("M-3 Dead Balsam Fir Mixedwood - Leafless (85% Dead Fir)", "M-3", 785);
    fuel.color = new index_1.fuels.RGBColor({ red: 99, green: 0, blue: 0 });
    fuel.spreadParms = new index_1.fuels.MixedDeadSpread({ pdf: 85 });
    fuelDefinitions.push(fuel);
    fuel = new index_1.fuels.FuelDefinition("M-3 Dead Balsam Fir Mixedwood - Leafless (90% Dead Fir)", "M-3", 790);
    fuel.color = new index_1.fuels.RGBColor({ red: 99, green: 0, blue: 0 });
    fuel.spreadParms = new index_1.fuels.MixedDeadSpread({ pdf: 90 });
    fuelDefinitions.push(fuel);
    fuel = new index_1.fuels.FuelDefinition("M-3 Dead Balsam Fir Mixedwood - Leafless (95% Dead Fir)", "M-3", 795);
    fuel.color = new index_1.fuels.RGBColor({ red: 99, green: 0, blue: 0 });
    fuel.spreadParms = new index_1.fuels.MixedDeadSpread({ pdf: 95 });
    fuelDefinitions.push(fuel);
    fuel = new index_1.fuels.FuelDefinition("M-4 Dead Balsam Fir Mixedwood - Green", "M-4", 80);
    fuel.color = new index_1.fuels.RGBColor({ red: 170, green: 0, blue: 0 });
    fuelDefinitions.push(fuel);
    fuel = new index_1.fuels.FuelDefinition("M-4 Dead Balsam Fir Mixedwood - Green (05% Dead Fir)", "M-4", 805);
    fuel.color = new index_1.fuels.RGBColor({ red: 170, green: 0, blue: 0 });
    fuel.spreadParms = new index_1.fuels.MixedDeadSpread({ pdf: 5 });
    fuelDefinitions.push(fuel);
    fuel = new index_1.fuels.FuelDefinition("M-4 Dead Balsam Fir Mixedwood - Green (10% Dead Fir)", "M-4", 810);
    fuel.color = new index_1.fuels.RGBColor({ red: 170, green: 0, blue: 0 });
    fuel.spreadParms = new index_1.fuels.MixedDeadSpread({ pdf: 10 });
    fuelDefinitions.push(fuel);
    fuel = new index_1.fuels.FuelDefinition("M-4 Dead Balsam Fir Mixedwood - Green (15% Dead Fir)", "M-4", 815);
    fuel.color = new index_1.fuels.RGBColor({ red: 170, green: 0, blue: 0 });
    fuel.spreadParms = new index_1.fuels.MixedDeadSpread({ pdf: 15 });
    fuelDefinitions.push(fuel);
    fuel = new index_1.fuels.FuelDefinition("M-4 Dead Balsam Fir Mixedwood - Green (20% Dead Fir)", "M-4", 820);
    fuel.color = new index_1.fuels.RGBColor({ red: 170, green: 0, blue: 0 });
    fuel.spreadParms = new index_1.fuels.MixedDeadSpread({ pdf: 20 });
    fuelDefinitions.push(fuel);
    fuel = new index_1.fuels.FuelDefinition("M-4 Dead Balsam Fir Mixedwood - Green (25% Dead Fir)", "M-4", 825);
    fuel.color = new index_1.fuels.RGBColor({ red: 170, green: 0, blue: 0 });
    fuel.spreadParms = new index_1.fuels.MixedDeadSpread({ pdf: 25 });
    fuelDefinitions.push(fuel);
    fuel = new index_1.fuels.FuelDefinition("M-4 Dead Balsam Fir Mixedwood - Green (30% Dead Fir)", "M-4", 830);
    fuel.color = new index_1.fuels.RGBColor({ red: 170, green: 0, blue: 0 });
    fuel.spreadParms = new index_1.fuels.MixedDeadSpread({ pdf: 30 });
    fuelDefinitions.push(fuel);
    fuel = new index_1.fuels.FuelDefinition("M-4 Dead Balsam Fir Mixedwood - Green (35% Dead Fir)", "M-4", 835);
    fuel.color = new index_1.fuels.RGBColor({ red: 170, green: 0, blue: 0 });
    fuel.spreadParms = new index_1.fuels.MixedDeadSpread({ pdf: 35 });
    fuelDefinitions.push(fuel);
    fuel = new index_1.fuels.FuelDefinition("M-4 Dead Balsam Fir Mixedwood - Green (40% Dead Fir)", "M-4", 840);
    fuel.color = new index_1.fuels.RGBColor({ red: 170, green: 0, blue: 0 });
    fuel.spreadParms = new index_1.fuels.MixedDeadSpread({ pdf: 40 });
    fuelDefinitions.push(fuel);
    fuel = new index_1.fuels.FuelDefinition("M-4 Dead Balsam Fir Mixedwood - Green (45% Dead Fir)", "M-4", 845);
    fuel.color = new index_1.fuels.RGBColor({ red: 170, green: 0, blue: 0 });
    fuel.spreadParms = new index_1.fuels.MixedDeadSpread({ pdf: 45 });
    fuelDefinitions.push(fuel);
    fuel = new index_1.fuels.FuelDefinition("M-4 Dead Balsam Fir Mixedwood - Green (50% Dead Fir)", "M-4", 850);
    fuel.color = new index_1.fuels.RGBColor({ red: 170, green: 0, blue: 0 });
    fuel.spreadParms = new index_1.fuels.MixedDeadSpread({ pdf: 50 });
    fuelDefinitions.push(fuel);
    fuel = new index_1.fuels.FuelDefinition("M-4 Dead Balsam Fir Mixedwood - Green (55% Dead Fir)", "M-4", 855);
    fuel.color = new index_1.fuels.RGBColor({ red: 170, green: 0, blue: 0 });
    fuel.spreadParms = new index_1.fuels.MixedDeadSpread({ pdf: 55 });
    fuelDefinitions.push(fuel);
    fuel = new index_1.fuels.FuelDefinition("M-4 Dead Balsam Fir Mixedwood - Green (60% Dead Fir)", "M-4", 860);
    fuel.color = new index_1.fuels.RGBColor({ red: 170, green: 0, blue: 0 });
    fuel.spreadParms = new index_1.fuels.MixedDeadSpread({ pdf: 60 });
    fuelDefinitions.push(fuel);
    fuel = new index_1.fuels.FuelDefinition("M-4 Dead Balsam Fir Mixedwood - Green (65% Dead Fir)", "M-4", 865);
    fuel.color = new index_1.fuels.RGBColor({ red: 170, green: 0, blue: 0 });
    fuel.spreadParms = new index_1.fuels.MixedDeadSpread({ pdf: 65 });
    fuelDefinitions.push(fuel);
    fuel = new index_1.fuels.FuelDefinition("M-4 Dead Balsam Fir Mixedwood - Green (70% Dead Fir)", "M-4", 870);
    fuel.color = new index_1.fuels.RGBColor({ red: 170, green: 0, blue: 0 });
    fuel.spreadParms = new index_1.fuels.MixedDeadSpread({ pdf: 70 });
    fuelDefinitions.push(fuel);
    fuel = new index_1.fuels.FuelDefinition("M-4 Dead Balsam Fir Mixedwood - Green (75% Dead Fir)", "M-4", 875);
    fuel.color = new index_1.fuels.RGBColor({ red: 170, green: 0, blue: 0 });
    fuel.spreadParms = new index_1.fuels.MixedDeadSpread({ pdf: 75 });
    fuelDefinitions.push(fuel);
    fuel = new index_1.fuels.FuelDefinition("M-4 Dead Balsam Fir Mixedwood - Green (80% Dead Fir)", "M-4", 880);
    fuel.color = new index_1.fuels.RGBColor({ red: 170, green: 0, blue: 0 });
    fuel.spreadParms = new index_1.fuels.MixedDeadSpread({ pdf: 80 });
    fuelDefinitions.push(fuel);
    fuel = new index_1.fuels.FuelDefinition("M-4 Dead Balsam Fir Mixedwood - Green (85% Dead Fir)", "M-4", 885);
    fuel.color = new index_1.fuels.RGBColor({ red: 170, green: 0, blue: 0 });
    fuel.spreadParms = new index_1.fuels.MixedDeadSpread({ pdf: 85 });
    fuelDefinitions.push(fuel);
    fuel = new index_1.fuels.FuelDefinition("M-4 Dead Balsam Fir Mixedwood - Green (90% Dead Fir)", "M-4", 890);
    fuel.color = new index_1.fuels.RGBColor({ red: 170, green: 0, blue: 0 });
    fuel.spreadParms = new index_1.fuels.MixedDeadSpread({ pdf: 90 });
    fuelDefinitions.push(fuel);
    fuel = new index_1.fuels.FuelDefinition("M-4 Dead Balsam Fir Mixedwood - Green (95% Dead Fir)", "M-4", 895);
    fuel.color = new index_1.fuels.RGBColor({ red: 170, green: 0, blue: 0 });
    fuel.spreadParms = new index_1.fuels.MixedDeadSpread({ pdf: 95 });
    fuelDefinitions.push(fuel);
    fuel = new index_1.fuels.FuelDefinition("M-3/M-4 Dead Balsam Fir Mixedwood", "M-3/M-4", 90);
    fuel.color = new index_1.fuels.RGBColor({ red: 99, green: 0, blue: 0 });
    fuelDefinitions.push(fuel);
    fuel = new index_1.fuels.FuelDefinition("M-3/M-4 Dead Balsam Fir Mixedwood (05% Dead Fir)", "M-3/M-4", 905);
    fuel.color = new index_1.fuels.RGBColor({ red: 99, green: 0, blue: 0 });
    fuel.spreadParms = new index_1.fuels.MixedDeadSpread({ pdf: 5 });
    fuelDefinitions.push(fuel);
    fuel = new index_1.fuels.FuelDefinition("M-3/M-4 Dead Balsam Fir Mixedwood (10% Dead Fir)", "M-3/M-4", 910);
    fuel.color = new index_1.fuels.RGBColor({ red: 99, green: 0, blue: 0 });
    fuel.spreadParms = new index_1.fuels.MixedDeadSpread({ pdf: 10 });
    fuelDefinitions.push(fuel);
    fuel = new index_1.fuels.FuelDefinition("M-3/M-4 Dead Balsam Fir Mixedwood (15% Dead Fir)", "M-3/M-4", 915);
    fuel.color = new index_1.fuels.RGBColor({ red: 99, green: 0, blue: 0 });
    fuel.spreadParms = new index_1.fuels.MixedDeadSpread({ pdf: 15 });
    fuelDefinitions.push(fuel);
    fuel = new index_1.fuels.FuelDefinition("M-3/M-4 Dead Balsam Fir Mixedwood (20% Dead Fir)", "M-3/M-4", 920);
    fuel.color = new index_1.fuels.RGBColor({ red: 99, green: 0, blue: 0 });
    fuel.spreadParms = new index_1.fuels.MixedDeadSpread({ pdf: 20 });
    fuelDefinitions.push(fuel);
    fuel = new index_1.fuels.FuelDefinition("M-3/M-4 Dead Balsam Fir Mixedwood (25% Dead Fir)", "M-3/M-4", 925);
    fuel.color = new index_1.fuels.RGBColor({ red: 99, green: 0, blue: 0 });
    fuel.spreadParms = new index_1.fuels.MixedDeadSpread({ pdf: 25 });
    fuelDefinitions.push(fuel);
    fuel = new index_1.fuels.FuelDefinition("M-3/M-4 Dead Balsam Fir Mixedwood (30% Dead Fir)", "M-3/M-4", 930);
    fuel.color = new index_1.fuels.RGBColor({ red: 99, green: 0, blue: 0 });
    fuel.spreadParms = new index_1.fuels.MixedDeadSpread({ pdf: 30 });
    fuelDefinitions.push(fuel);
    fuel = new index_1.fuels.FuelDefinition("M-3/M-4 Dead Balsam Fir Mixedwood (35% Dead Fir)", "M-3/M-4", 935);
    fuel.color = new index_1.fuels.RGBColor({ red: 99, green: 0, blue: 0 });
    fuel.spreadParms = new index_1.fuels.MixedDeadSpread({ pdf: 35 });
    fuelDefinitions.push(fuel);
    fuel = new index_1.fuels.FuelDefinition("M-3/M-4 Dead Balsam Fir Mixedwood (40% Dead Fir)", "M-3/M-4", 940);
    fuel.color = new index_1.fuels.RGBColor({ red: 99, green: 0, blue: 0 });
    fuel.spreadParms = new index_1.fuels.MixedDeadSpread({ pdf: 40 });
    fuelDefinitions.push(fuel);
    fuel = new index_1.fuels.FuelDefinition("M-3/M-4 Dead Balsam Fir Mixedwood (45% Dead Fir)", "M-3/M-4", 945);
    fuel.color = new index_1.fuels.RGBColor({ red: 99, green: 0, blue: 0 });
    fuel.spreadParms = new index_1.fuels.MixedDeadSpread({ pdf: 45 });
    fuelDefinitions.push(fuel);
    fuel = new index_1.fuels.FuelDefinition("M-3/M-4 Dead Balsam Fir Mixedwood (50% Dead Fir)", "M-3/M-4", 950);
    fuel.color = new index_1.fuels.RGBColor({ red: 99, green: 0, blue: 0 });
    fuel.spreadParms = new index_1.fuels.MixedDeadSpread({ pdf: 50 });
    fuelDefinitions.push(fuel);
    fuel = new index_1.fuels.FuelDefinition("M-3/M-4 Dead Balsam Fir Mixedwood (55% Dead Fir)", "M-3/M-4", 955);
    fuel.color = new index_1.fuels.RGBColor({ red: 99, green: 0, blue: 0 });
    fuel.spreadParms = new index_1.fuels.MixedDeadSpread({ pdf: 55 });
    fuelDefinitions.push(fuel);
    fuel = new index_1.fuels.FuelDefinition("M-3/M-4 Dead Balsam Fir Mixedwood (60% Dead Fir)", "M-3/M-4", 960);
    fuel.color = new index_1.fuels.RGBColor({ red: 99, green: 0, blue: 0 });
    fuel.spreadParms = new index_1.fuels.MixedDeadSpread({ pdf: 60 });
    fuelDefinitions.push(fuel);
    fuel = new index_1.fuels.FuelDefinition("M-3/M-4 Dead Balsam Fir Mixedwood (65% Dead Fir)", "M-3/M-4", 965);
    fuel.color = new index_1.fuels.RGBColor({ red: 99, green: 0, blue: 0 });
    fuel.spreadParms = new index_1.fuels.MixedDeadSpread({ pdf: 65 });
    fuelDefinitions.push(fuel);
    fuel = new index_1.fuels.FuelDefinition("M-3/M-4 Dead Balsam Fir Mixedwood (70% Dead Fir)", "M-3/M-4", 970);
    fuel.color = new index_1.fuels.RGBColor({ red: 99, green: 0, blue: 0 });
    fuel.spreadParms = new index_1.fuels.MixedDeadSpread({ pdf: 70 });
    fuelDefinitions.push(fuel);
    fuel = new index_1.fuels.FuelDefinition("M-3/M-4 Dead Balsam Fir Mixedwood (75% Dead Fir)", "M-3/M-4", 975);
    fuel.color = new index_1.fuels.RGBColor({ red: 99, green: 0, blue: 0 });
    fuel.spreadParms = new index_1.fuels.MixedDeadSpread({ pdf: 75 });
    fuelDefinitions.push(fuel);
    fuel = new index_1.fuels.FuelDefinition("M-3/M-4 Dead Balsam Fir Mixedwood (80% Dead Fir)", "M-3/M-4", 980);
    fuel.color = new index_1.fuels.RGBColor({ red: 99, green: 0, blue: 0 });
    fuel.spreadParms = new index_1.fuels.MixedDeadSpread({ pdf: 80 });
    fuelDefinitions.push(fuel);
    fuel = new index_1.fuels.FuelDefinition("M-3/M-4 Dead Balsam Fir Mixedwood (85% Dead Fir)", "M-3/M-4", 985);
    fuel.color = new index_1.fuels.RGBColor({ red: 99, green: 0, blue: 0 });
    fuel.spreadParms = new index_1.fuels.MixedDeadSpread({ pdf: 85 });
    fuelDefinitions.push(fuel);
    fuel = new index_1.fuels.FuelDefinition("M-3/M-4 Dead Balsam Fir Mixedwood (90% Dead Fir)", "M-3/M-4", 990);
    fuel.color = new index_1.fuels.RGBColor({ red: 99, green: 0, blue: 0 });
    fuel.spreadParms = new index_1.fuels.MixedDeadSpread({ pdf: 90 });
    fuelDefinitions.push(fuel);
    fuel = new index_1.fuels.FuelDefinition("M-3/M-4 Dead Balsam Fir Mixedwood (95% Dead Fir)", "M-3/M-4", 995);
    fuel.color = new index_1.fuels.RGBColor({ red: 99, green: 0, blue: 0 });
    fuel.spreadParms = new index_1.fuels.MixedDeadSpread({ pdf: 95 });
    fuelDefinitions.push(fuel);
    fuel = new index_1.fuels.FuelDefinition("Not Available", "Non-Fuel", 100);
    fuel.color = new index_1.fuels.RGBColor({ red: 255, green: 255, blue: 255 });
    fuelDefinitions.push(fuel);
    fuel = new index_1.fuels.FuelDefinition("Non-fuel", "Non-Fuel", 101);
    fuel.color = new index_1.fuels.RGBColor({ red: 130, green: 130, blue: 130 });
    fuelDefinitions.push(fuel);
    fuel = new index_1.fuels.FuelDefinition("Water", "Non-Fuel", 102);
    fuel.color = new index_1.fuels.RGBColor({ red: 115, green: 223, blue: 255 });
    fuelDefinitions.push(fuel);
    fuel = new index_1.fuels.FuelDefinition("Unknown", "Non-Fuel", 103);
    fuel.color = new index_1.fuels.RGBColor({ red: 0, green: 0, blue: 0 });
    fuelDefinitions.push(fuel);
    fuel = new index_1.fuels.FuelDefinition("Unclassified", "Non-Fuel", 104);
    fuel.color = new index_1.fuels.RGBColor({ red: 166, green: 166, blue: 166 });
    fuelDefinitions.push(fuel);
    fuel = new index_1.fuels.FuelDefinition("Vegetated Non-Fuel", "Non-Fuel", 105);
    fuel.color = new index_1.fuels.RGBColor({ red: 204, green: 204, blue: 204 });
    fuelDefinitions.push(fuel);
    return fuelDefinitions;
}

/*
 * *******************************************************
 * Create job
 * *******************************************************
*/

// an asynchronous function for creating a job and listening for status messages, ran immediately
(async function () {
    // fetch the default settings for some parameters from W.I.S.E. Builder
    let jDefaults = await new index_1.defaults.JobDefaults().getDefaultsPromise();
    index_1.globals.WISELogger.getInstance().info('Building W.I.S.E. job.');

    // set this to the location of the test files folder.
    let prom = new index_1.wise.WISE();

    // add the projection and elevation files as attachments
    let projContents = fs.readFileSync(localDir + '/test/elevation.prj');
    let elevContents = fs.readFileSync(localDir + '/test/elevation.asc');
    let projAttachment = prom.addAttachment('elevation.prj', projContents);
    let elevAttachment = prom.addAttachment('elevation.asc', elevContents);
    if (!projAttachment || !elevAttachment) {
        throw Error("Cannot add attachment");
    }
    prom.setProjectionFile('' + projAttachment);
    prom.setElevationFile('' + elevAttachment);

    // add the rest of the files as paths to locations on disk

    prom.setFuelmapFile(localDir + '/test/fbp_fuel_type.asc');
    prom.setLutFile(localDir + '/test/fbp_lookup_table.lut');
    prom.setTimezoneByValue(25); //hard coded to CDT, see example_timezone.js for an example getting the IDs
    let ws = prom.addWeatherStation(weatherStationHeight, weatherStationLatLong);
    
    var hffmc_value = parseFloat(stringArray[13]);
    var hffmc_time = parseFloat(stringArray[14]);
    var ffmc_start = parseFloat(stringArray[15]);
    var dmc_start = parseFloat(stringArray[16]);
    var dc_start = parseFloat(stringArray[17]);
    var start_precip = parseFloat(stringArray[18]);
    
    let b3Yaha = ws.addWeatherStream(localDir + '/test/weather_B3_hourly_Sep25toOct30_2001.txt', hffmc_value, hffmc_time, index_1.wise.HFFMCMethod.LAWSON, ffmc_start, dmc_start, dc_start, start_precip, weatherStartTime, weatherEndTime);

    // create the ignition points
    let ig3 = prom.addPointIgnition(ignitionLatLong, ignitionTime);

    // emit some statistics at the end of timesteps
    prom.timestepSettings.addStatistic(index_1.globals.GlobalStatistics.TOTAL_BURN_AREA);
    prom.timestepSettings.addStatistic(index_1.globals.GlobalStatistics.DATE_TIME);
    prom.timestepSettings.addStatistic(index_1.globals.GlobalStatistics.SCENARIO_NAME);

    // create a scenario
    let scen1 = prom.addScenario(ignitionTime, simulationEndTime);
    scen1.setName('scen0');
    let burnDates = getAllDatesWithoutTimeBetween(ignitionTime,simulationEndTime);

    var fwi_min = parseFloat(stringArray[19]);
    var windspeed_min = parseFloat(stringArray[20]);
    var humid_max = parseFloat(stringArray[21]);
    var isi_min = parseFloat(stringArray[22]);

    for (const burndate of burnDates){
        scen1.addBurningCondition(luxon_1.DateTime.fromISO(burndate), 0, 24, fwi_min, windspeed_min, humid_max, isi_min);
    }

    var max_accel_time_step = parseFloat(stringArray[23]);
    var dist_res = parseFloat(stringArray[24]);
    var perim_res = parseFloat(stringArray[25]);
    var ros_min = parseFloat(stringArray[26]);
    var boundary_stop = Boolean(stringArray[27]);
    var breaching = Boolean(stringArray[28]);
    var dynamic_threshold = Boolean(stringArray[29]);
    var spotting = Boolean(stringArray[30]);
    var retain_hidden_steps = Boolean(stringArray[31]);
    var growth_percentile_bool = Boolean(stringArray[32]);
    var growth_percentile = parseFloat(stringArray[33]);

    scen1.setFgmOptions(index_1.globals.Duration.createTime(0, max_accel_time_step, 0, false), dist_res, perim_res, ros_min, boundary_stop, breaching, dynamic_threshold, spotting, retain_hidden_steps, growth_percentile_bool, growth_percentile);

    // optionally set dx, dy, and dt

    var ignition_dx = parseFloat(stringArray[34]);
    var ignition_dy = parseFloat(stringArray[35]);
    var ignition_dt = textToCoords(stringArray[36]);
    var terrain_bool = Boolean(stringArray[37]);
    var wind_bool = Boolean(stringArray[38]);
    var fmc_override = parseFloat(stringArray[39]);
    var NODATA_elevation = parseFloat(stringArray[40]);
    var fwi_spatial_interp = Boolean(stringArray[41]);
    var fwi_temporal_weather = Boolean(stringArray[42]);
    var fwi_history = Boolean(stringArray[43]);
    var burning_conditions_bool = Boolean(stringArray[44]);
    var fwi_temporal_interp = Boolean(stringArray[45]);

    scen1.setProbabilisticValues(ignition_dx, ignition_dy, index_1.globals.Duration.createTime(0, ignition_dt[0], ignition_dt[1], false));
    scen1.setFbpOptions(terrain_bool, wind_bool);
    scen1.setFmcOptions(fmc_override, NODATA_elevation, true, false);
    scen1.setFwiOptions(fwi_spatial_interp, fwi_temporal_weather, fwi_history, burning_conditions_bool, fwi_temporal_interp);

    scen1.addIgnitionReference(ig3);
    scen1.addWeatherStreamReference(b3Yaha);
    
    // create sceneExports
    let filepath = "scen0/";
    createGridExports(prom, scen1, filepath, sceneExports);
    
    // test to see if all required parameters have been set
    let errors = prom.checkValid();
    if (errors.length > 0) {
        // write the errors to the console
        errors.forEach(node => {
            handleErrorNode(node);
        });
    }
    else {
        // assume we will always have a backend that is capable of using validation now, as the versioning is no longer compatible with server

        let wrapper = null;
        wrapper = await prom.validateJobPromise();
        if (serverConfig.mqttUsername) {
            // trim the name of the newly started job
            let jobName = wrapper.name.replace(/^\s+|\s+$/g, '');

            // a manager for listening for status messages
            let manager = new index_1.client.JobManager(jobName);

            // start the job manager
            await manager.start();

            // if possible the job will first be validated, catch the validation response
            manager.on('validationReceived', (args) => {
                // the FGM could not be validated. It's possible that the W.I.S.E. version used doesn't support validation
                if (!args.validation.success) {
                    // this probably means that the W.I.S.E. Manager and W.I.S.E. versions are different, the job may be able to be started without validation
                    // at this point in time but we'll just exit and consider this an unexpected setup
                    args.manager.dispose(); // close the connection that is listening for status updates
                    console.log("Validation could not be run, check your W.I.S.E. version");
                }
                // errors were found in the FGM
                else if (!args.validation.valid) {
                    args.manager.dispose(); // close the connection that is listening for status updates
                    console.log("The submitted FGM is not valid");
                    // just dump the error list, let the user sort through it
                    console.log(args.validation.error_list);
                }
                // the FGM is valid, start it running
                else {
                    console.log("FGM valid, starting job");
                    // add a delay, shouldn't be needed but it's here so the user can see the process happening
                    delay(1000)
                        .then(() => {
                        // use rerun to start the job. Rerun can be used on any job that is in
                        // the finished job list in W.I.S.E. Manager.
                        args.manager.broadcastJobRerun(jobName);
                    });
                }
            });

            // when the W.I.S.E. job triggers that it is complete, shut down the listener
            manager.on('simulationComplete', (args) => {
                args.manager.dispose(); // close the connection that is listening for status updates
                if (args.hasOwnProperty("time") && args.time != null) {
                    console.log(`Simulation complete at ${args.time.toISOString()}.`);
                }
                else {
                    console.log("Simulation complete.");
                }
            });

            // catch scenario failure
            manager.on('scenarioComplete', (args) => {
                if (!args.success) {
                    if (args.hasOwnProperty("time") && args.time != null) {
                        console.log(`At ${args.time.toISOString()} a scenario failed: ${args.errorMessage}`);
                    }
                    else {
                        console.log(`A scenario failed: ${args.errorMessage}`);
                    }
                }
            });

            // listen for statistics at the end of timesteps
            manager.on('statisticsReceived', (args) => {
                if (args.hasOwnProperty("time") && args.time != null) {
                    console.log(`Received statistics at ${args.time.toISOString()}`);
                    for (const stat of args.statistics) {
                        console.log("    Statistic " + stat.key + " with value " + stat.value);
                    }
                }
                else {
                    for (const stat of args.statistics) {
                        console.log("Received statistic " + stat.key + " with value " + stat.value);
                    }
                }
            });
        }
    }
})().then(x => console.log("Job created, waiting for results."));
//# sourceMappingURL=example_job.js.map


function readStringArrayFromFile(filePath) {
    try {
        // Read the contents of the file synchronously
        const contents = fs.readFileSync(filePath, 'utf8');
        
        // Split the contents into an array of strings (assuming each line is a separate string)
        const stringArray = contents.split('\n').map(line => line.trim()); // Remove leading/trailing whitespaces

        return stringArray;
    } catch (error) {
        console.error("Error occurred while reading the file:", error.message);
        return []; // Return an empty array in case of error
    }
}

function textToCoords(textVariable) {
    // Split the text variable into two parts based on the comma
    let parts = textVariable.split(',');

    // Convert each part to a float and return as an array
    return parts.map(parseFloat);
}

function getAllDatesWithoutTimeBetween(start, end) {
    // Array to store all the dates
    const dates = [];

    // Copy the start date to avoid modifying the original date
    let currentDate = new Date(start);

    // Loop until currentDate is less than or equal to end date
    while (currentDate <= end) {
        // Format the current date to only include the date component
        const formattedDate = currentDate.toISOString().split('T')[0];

        // Add the formatted date to the array
        dates.push(formattedDate);

        // Increment the currentDate by one day
        currentDate.setDate(currentDate.getDate() + 1);
    }

    return dates;
}