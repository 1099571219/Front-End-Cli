#! /usr/bin/env node
const symbol = require("log-symbols");
const program = require("commander");
const inquirer = require("inquirer");
const package = require("../package.json");
const templates = require("./templates");
const downloadGitRepo = require("download-git-repo");
const path = require("path");
const { exec } = require("child_process");
const { notExistFolder, cloneLibrary, selectTemplate, inputFileName } = require("./util");
const chalk = require("chalk");
const fs = require('fs-extra')

program
  .command("create [projectName]")
  .description("创建模板")
  .option("-t,--template <template>", "模板名称")
  .action(async (projectName, options) => {
    let project = templates.find(
      (template) => template.name === options.template
    );
    let projectTemplate = project ? project.value : undefined;

    if (!projectName) {
      projectName = await inputFileName()
    }
    console.log("项目名称:", projectName);
    const directory = process.cwd();

    await notExistFolder(directory, projectName);

    if (!projectTemplate) {
      projectTemplate = await selectTemplate();
    }

    // 目标文件夹 = 用户命令行所在目录 + 项目名称
    await cloneLibrary(projectTemplate, directory, projectName);
    console.log("同步");
    console.log("异步", projectName);
  });

program.on("--help", () => {});
program.version(`v${package.version}`);

//解析用户执行命令行传入的参数
program.parse(process.argv);
