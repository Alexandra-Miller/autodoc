#!/usr/bin/env node
/*

@filename: autodoc
@repository: https://github.com/Alexandra-Miller/autodoc
@creator: Alexandra Marie Miller

@description
A basic program designed to automatically generate documentation for typescript
code in the form of dependency trees as well as function requirementsii.
@description

@dependencies: "child_process", "fs", "readline"
*/

import * as child_process from "child_process";
import * as fs from "fs";
import * as readline from "readline";

// ################ DATA #######################################################
interface IFunction {
    name: string;
    description: string;
    dependencies: string;
    args: string[];
    sideEffects: string[];
    returns: string[];
}

interface IClass {
    name: string;
    description: string;
    dependencies: string;
    methods: IFunction[];
}

interface IFile {
    filename: string;
    repository: string;
    creator: string;
    description: string;
    dependencies: string;
    classes: IClass[];
    functions: IFunction[];
}

// ################ FUNCTIONAL CODE ############################################

// Code to create file JSONs
const getLines = (text: string, designator: string): string[] =>
    text.split("\n").filter((line: string): boolean =>
        line.includes(designator)).map((line: string): string =>
            line.split(designator)[1]);

const inBlock = (element: any, index: number, array: any[]): boolean =>
    (index % 2 === 1);

const outOfBlock = (element: any, index: number, array: any[]): boolean =>
    (index % 2 === 0);

const getBlocks = (text: string, delim: string): string[] =>
    text.split(delim).filter(inBlock);

const excludeBlocks = (text: string, delim: string): string =>
    (text.split(delim).filter(outOfBlock).join(" "));

const jsonifyFunction = (text: string): IFunction => ({
    name: getLines(text, "@name:")[0],
    description: getBlocks(text, "@description")[0],
    dependencies: getLines(text, "@dependencies:")[0],
    args: getLines(text, "@args:"),
    sideEffects: getLines(text, "@sideEffects:"),
    returns: getLines(text, "@returns:"),
});

const jsonifyFunctions = (text: string): IFunction[] =>
    getBlocks(excludeBlocks(text, "@class"), "@function" ).map(jsonifyFunction);

const jsonifyClass = (text: string): IClass => ({
    name: getLines(text, "@name")[0],
    description: getBlocks(text, "@description")[0],
    dependencies: getLines(text, "@dependencies:")[0],
    methods: jsonifyFunctions(text),
});

const jsonifyClasses = (text: string): IClass[] =>
    getBlocks(text, "@class").map(jsonifyClass);

const jsonifyFile = (fileText: string): IFile => ({
    filename: getLines(fileText, "@filename:")[0],
    repository: getLines(fileText, "@repository:")[0],
    creator: getLines(fileText, "@creator:")[0],
    description: getBlocks(fileText, "@description")[0],
    dependencies: getLines(fileText, "@dependencies:")[0],
    classes: jsonifyClasses(fileText),
    functions: jsonifyFunctions(fileText),
});

// TODO: convert JSONs into dependency trees

// Functions to JSON into text documentation
const functionToText = (functionJson: IFunction): string =>
    "### NAME: " + functionJson.name + "\n" +
    "#### DESCRIPTION:" +
    functionJson.description +
    "DEPENDENCIES: " + functionJson.dependencies + "\n" +
    "#### ARGUMENTS: \n" +
    functionJson.args.join("\n") + "\n" +
    "#### SIDE EFFECTS:\n" +
    functionJson.sideEffects.join("\n") + "\n" +
    "#### RETURNS:\n" +
    functionJson.returns.join("\n") + "\n";

const classToText = (classJson: IClass): string =>
    "### NAME: " + classJson.name +
    "#### DESCRIPTION:" +
    classJson.description +
    "#### DEPENDENCIES: " + classJson.dependencies + "\n" +
    "#### METHODS: \n" +
    classJson.methods.map(functionToText).join("\n");

const fileToText = (fileJson: IFile): string =>
    "# FILE NAME: " + fileJson.filename + "\n" +
    "### REPOSITORY: " + fileJson.repository + "\n" +
    "### CREATOR: " + fileJson.creator + "\n" +
    "### DESCRIPTION:" +
    fileJson.description +
    "###DEPENDENCIES: \n" + fileJson.dependencies + "\n\n\n\n" +
    "## CLASSES:\n" +
    fileJson.classes.map(classToText).join("\n\n\n\n") + "\n" +
    "## FUNCTIONS: \n" +
    fileJson.functions.map(functionToText).join("\n\n\n\n") + "\n";

// IO functions
const readFile = (filename: string): string =>
    fs.readFileSync(filename, "utf8").toString();

const filesToText = (files: string[]): string =>
    files.map(readFile).map(jsonifyFile).map(fileToText).join("\n");

// ################ IMPERATIVE CODE ############################################
const args = process.argv.slice(2);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Place trees and documentation into ./.README.md.tmp file
fs.writeFile(".DOCS.md.tmp",
    filesToText(args),
    () => {
        rl.question("Commit changes? (y/n): ",
        (answer: string) => {
            switch (answer.toLowerCase()) {
                // Commit changes to documentation
                case "y":
                    child_process.exec("mv .DOCS.md.tmp DOCS.md && rm .DOCS.md.tmp", () =>
                        console.log("Write sucessful."));
                    break;
                default:
                    child_process.exec("rm .DOCS.md.tmp", () =>
                        console.log("User chose not to commit, exiting and cleaning up."));
            }
            rl.close();
        });
    });
