﻿// See https://aka.ms/new-console-template for more information
using System;
using System.Collections;
using System.Collections.Generic;
using System.Diagnostics;
using System.Runtime.Intrinsics.X86;
using System.Xml.Linq;

class WISE_setup
{
    static void Main(string[] args)
    {
        List<string> outputs = new List<string>();
        Dictionary<string, string> simulationSetup = new Dictionary<string, string>();          //dictionary because it is easier to see the value pairs when debugging. 

        string testFolder = "C:/jobs/test/";
        string apiFolder = @"C:\WISE_JS_API-main";      //WISE API, also contains the dist folder, and in that is the ./dist/job_fromc_sharp.js file. 

        //Select Outputs
        outputs.Add("ROS");  //Rate of Spread Magnitude
        outputs.Add("RAZ");  //Rate of Spread Direction
        outputs.Add("AT");   //Arrival Time

        //Folder with all the data
        simulationSetup.Add("Input Directory", "C:/jobs/five cases/windy/");

        //Landscape and weather data names 
        simulationSetup.Add("FBP Fuel Map File Name", "fbp_fuel_type.asc");
        simulationSetup.Add("FBP Fuel Map Lookup Table File Name", "fbp_lookup_table.lut");
        simulationSetup.Add("Elevation File Name", "elevation.asc");
        simulationSetup.Add("Elevation Projection File Name", "elevation.prj");
        simulationSetup.Add("Weather File Name", "weather_B3_hourly_Sep25toOct30_2001.txt");

        //Ignition Data
        simulationSetup.Add("Ignition Time", "2001-10-01T13:00:00-05:00");
        simulationSetup.Add("Ignition Coords", "51.635991,-115.570094");


        //Simulation Data
        simulationSetup.Add("Simulation End Time", "2001-10-16T22:00:00-05:00");

        //Weather Station Data
        simulationSetup.Add("Weather Station Height", "2000");
        simulationSetup.Add("Weather Station Coords", "51.647837,-115.564756");
        simulationSetup.Add("Weather Station Start Date", "2001-09-25");
        simulationSetup.Add("Weather Station End Date", "2001-10-30");

        //Additional Parameters

        //Weather:
        simulationSetup.Add("HFFMC Value", "94.0");
        simulationSetup.Add("HFFMC Hour", "17");
        simulationSetup.Add("Starting FFMC", "89.0");
        simulationSetup.Add("Starting DMC", "58.0");
        simulationSetup.Add("Starting DC", "482.0");
        simulationSetup.Add("Starting Precipitation", "0.0");

        //Burning Condition (Conditions that prevent or allow burning):
        simulationSetup.Add("Minimum FWI", "19");
        simulationSetup.Add("Minimum Wind Speed", "0");
        simulationSetup.Add("Maximum Relative Humidity", "95.0");
        simulationSetup.Add("Minimum ISI", "0.0");

        //FMG Options:
        simulationSetup.Add("Maximum Acceleration Time Step (minutes)", "2");
        simulationSetup.Add("Distance Resolution", "1.0");
        simulationSetup.Add("Perimeter Resolution", "1.0");
        simulationSetup.Add("Minimum Spread ROS", "1.0");
        simulationSetup.Add("Stop Simulation if Boundary Reached", "false");
        simulationSetup.Add("Breaching", "true");
        simulationSetup.Add("Use Dynamic Spatial Threshold algorithm", "true");
        simulationSetup.Add("Use Spotting", "true");
        simulationSetup.Add("Retain hidden time steps", "false");
        simulationSetup.Add("Apply growth percentile value", "true");
        simulationSetup.Add("Growth percentile", "50.0");

        //Probabilistic Values Options:
        simulationSetup.Add("Ignition dx", "1.0");
        simulationSetup.Add("Ignition dy", "1.0");
        simulationSetup.Add("Ignition dt (minutes, seconds)", "0,10");

        //FBP Options
        simulationSetup.Add("Use Terrain Effects", "true");
        simulationSetup.Add("Use Wind Effects", "true");

        //FMC Options
        simulationSetup.Add("FMC Override Value", "-1");
        simulationSetup.Add("NODATA Elevation", "0.0");

        //FWI Options
        simulationSetup.Add("Apply FWI Spatial Interpolation", "false");
        simulationSetup.Add("FWI from temporal weather", "true");
        simulationSetup.Add("apply history to FWI values", "false");
        simulationSetup.Add("Use burning conditions", "false");
        simulationSetup.Add("Apply FWI Temporal Interpolation", "false");

        using (StreamWriter file = new StreamWriter(testFolder + "SimulationDictionary.txt"))
        {
            foreach (var entry in simulationSetup)
            {
                //file.WriteLine("{0} {1}", entry.Key, entry.Value);
                file.WriteLine("{0}", entry.Value);
            }
        }
        string outputString = "";
        foreach (var arg in outputs) 
        {
            outputString += "-" + arg + " " + arg + " " + simulationSetup["Simulation End Time"] + " ";
        }

        var inputDataFolder = simulationSetup["Input Directory"];
        for (int i = 1; i <= 5; i++)
        {
            CopyFile(inputDataFolder, testFolder, simulationSetup.Values.ElementAt(i));
        }
        /*
        RunCommand("java -jar WISE_Builder.jar -s -j C:/jobs", @"C:\WISE_Builder-1.0.6-beta.5");
        Thread.Sleep(2000);
        RunCommand("java -jar WISE_Manager_Ui.jar", @"C:\WISE_Manager-0.6.beta.5");
        Thread.Sleep(2000);
        */

        RunCommand("node ./dist/job_fromc_sharp.js " + outputString, apiFolder);

    }

    static void CopyFile(string inputFolder, string destinationFolder, string fileName)
    {
        string sourceFile = Path.Combine(inputFolder, fileName);
        string destinationFile = Path.Combine(destinationFolder, fileName);

        // Check if source file exists
        if (!File.Exists(sourceFile))
        {
            throw new FileNotFoundException($"Source file '{sourceFile}' does not exist.");
        }

        // Check if destination file exists
        if (File.Exists(destinationFile))
        {
            // Delete the destination file if it exists
            File.Delete(destinationFile);
        }

        // Create destination directory if it doesn't exist
        Directory.CreateDirectory(destinationFolder);

        // Copy the file
        File.Copy(sourceFile, destinationFile);
    }

    static void RunCommand(string command, string workingDirectory)
    {
        try
        {
            // Create process start info
            ProcessStartInfo startInfo = new ProcessStartInfo();
            startInfo.FileName = "cmd.exe"; // The command prompt
            startInfo.Arguments = $"/c cd /d \"{workingDirectory}\" && {command}"; // Change directory and then execute the main command
            startInfo.UseShellExecute = false;
            startInfo.CreateNoWindow = false;

            // Start the process without waiting for it to finish
            Process.Start(startInfo);
        }
        catch (Exception ex)
        {
            Console.WriteLine("Error occurred: " + ex.Message);
        }
    }

}

