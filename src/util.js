const symbol = require("log-symbols");
const chalk = require("chalk");
const fs = require("fs-extra");
const { exec, spawn } = require("child_process");
const ora = require("ora");
const path = require("path");
const inquirer = require("inquirer");
const templates = require("./templates");

const templateRoot =
  "http://10.10.16.211:8181/digital-twin-project-team-of-xinda-group/front-end-templates.git";

const templateFileName = templateRoot.substring(
  templateRoot.lastIndexOf("/") + 1,
  templateRoot.lastIndexOf(".")
);

const inputFileName = async () => {
  const { name } = await inquirer.prompt({
    type: "input",
    name: "name",
    message: "请输入项目名称:",
  });
  if (!name) console.log(symbol.error, chalk.red("项目名称不能为空"));
  return name;
};

const selectTemplate = async () => {
  // 新增选择模版代码;
  const { template } = await inquirer.prompt({
    type: "list",
    name: "template",
    message: "请选择模版：",
    choices: templates, // 模版列表
  });
  return template;
};

const cover = async (directory, fileName) => {
  if (fs.existsSync(`${directory}\\${fileName}`)) {
    const { force } = await inquirer.prompt({
      type: "confirm",
      name: "force",
      message: `${fileName} 目录已存在，是否覆盖?`,
    });
    force ? fs.removeSync(`${directory}\\${fileName}`) : process.exit(1);
  }
};

// 文件是否存在
let notExistFolder = async (directory, fileName) => {
  await cover(directory, templateFileName);
  await cover(directory, fileName);
  return;
};

async function cloneLibrary(branch, directory, fileName) {
  process.chdir(directory);
  // console.log(`${directory}\\${fileName}`);
  return new Promise((resolve) => {
    const loading = ora("正在下载模板...");
    loading.start();
    exec(`git clone -b ${branch} ${templateRoot}`, (error, stdout, stderr) => {
      if (error) {
        console.log(`error: ${error}`);
        loading.fail(`创建模板失败: ${error}`);
      }
      stdout && console.log(`stdout: ${stdout}`);
      stderr && console.log(`stderr: ${stderr}`);
      loading.succeed("创建模板成功!");

      const loadPackage = ora("下载依赖中....");
      loadPackage.start();
      fs.rename(
        `${directory}\\${templateFileName}`,
        `${directory}\\${fileName}`,
        (error) => {
          error && console.log(symbol.error, chalk.red(error));
          exec(`cd ${fileName} && npm install`, (error, stdout, stderr) => {
            error &&
              (console.log(`error: ${error}`),
              loadPackage.fail("依赖下载失败"));
            stdout && console.log(`stdout: ${stdout}`);
            stderr && console.log(`stderr: ${stderr}`);
            loadPackage.succeed("依赖安装完成！");
            resolve()
          });
        }
      );
    });
  });
}

module.exports = {
  notExistFolder,
  cloneLibrary,
  selectTemplate,
  inputFileName,
};
