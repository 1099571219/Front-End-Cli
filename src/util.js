const symbol = require('log-symbols')
const chalk = require('chalk')
const fs = require('fs-extra')
const { exec } = require('child_process')
const ora = require('ora')
const inquirer = require('inquirer')
const templateOrigin = require('./templateOrigin')

const templateFileName = 'front-end-templates'
const templatesListConfig = `templatesListConfig`

const selectTemplateOrigin = async () => {
  await cover(process.cwd(), templateFileName)
  await cover(process.cwd(), templatesListConfig)
  const { origin } = await inquirer.prompt({
    type: 'list',
    name: 'origin',
    message: '请选择模板源',
    choices: templateOrigin,
  })
  console.log(origin)
  const loadingBranch = ora('加载模板列表...')
  loadingBranch.start()
  const branchesList = await getBranchesList(origin)
  loadingBranch.succeed('模板列表加载完成!')
  return [branchesList,origin]
}

const getBranchesList = async (origin) => {
  const dest = process.cwd()
  await new Promise((resolve) => {
    exec(`git clone -b ${origin.branch} ${origin.project_url}`, (error) => {
      if (error) {
        console.log(error)
        process.exit(1)
      }
      resolve()
    })
  })
  await new Promise((resolve) => {
    fs.rename(`${dest}\\${templateFileName}`, templatesListConfig, (error) => {
      if (error) {
        console.log(symbol.error, chalk.red(`err: ${error}`))
        process.exit(1)
      }
      resolve()
    })
  })

  return await require(`${dest}\\${templatesListConfig}\\templates.json`)
}

const inputFileName = async () => {
  const { name } = await inquirer.prompt({
    type: 'input',
    name: 'name',
    message: '请输入项目名称:',
  })
  if (!name) console.log(symbol.error, chalk.red('项目名称不能为空'))
  const dest = process.cwd()
  await cover(dest, name)
  await cover(dest, templateFileName)
  return name
}

const selectTemplate = async (branches) => {
  // 新增选择模版代码;
  const { template } = await inquirer.prompt({
    type: 'list',
    name: 'template',
    message: '请选择模版：',
    choices: branches, // 模版列表
  })
  return template
}

// 文件是否存在
const cover = async (directory, fileName) => {
  if (fs.existsSync(`${directory}\\${fileName}`)) {
    const { force } = await inquirer.prompt({
      type: 'confirm',
      name: 'force',
      message: `${fileName} 目录已存在，是否覆盖?`,
    })
    force ? fs.removeSync(`${directory}\\${fileName}`) : process.exit(1)
  }
  return
}

const cloneLibrary = async (branch, fileName,origin) => {
  const directory = process.cwd()
  // console.log(`${directory}\\${fileName}`);
  const loading = ora('正在下载模板...')
  loading.start()
  await new Promise((resolve) => {
    exec(`git clone -b ${branch} ${origin.project_url}`, (error, stdout, stderr) => {
      if (error) {
        console.log(`error: ${error}`)
        loading.fail(`创建模板失败: ${error}`)
      }
      loading.succeed('创建模板成功!')
      resolve()
    })
  })

  const loadPackage = ora('下载依赖中....')
  loadPackage.start()
  await new Promise((resolve) => {
    fs.rename(
      `${directory}\\${templateFileName}`,
      `${directory}\\${fileName}`,
      (error) => {
        error && console.log(symbol.error, chalk.red(error))
        resolve()
      },
    )
  })

  await new Promise((resolve) => {
    fs.removeSync(`${directory}\\${templatesListConfig}`)
    console.log(`移除模板列表`)
    resolve()
  })

  await new Promise((resolve) => {
    exec(
      `cd ${fileName} && git remote remove origin && git branch -M main  && npm install`,
      (error, stdout, stderr) => {
        error &&
          (console.log(`error: ${error}`), loadPackage.fail('依赖下载失败'))
        stdout && console.log(`stdout: ${stdout}`)
        stderr && console.log(`stderr: ${stderr}`)
        resolve()
      },
    )
  })
  loadPackage.succeed('依赖安装完成！')

  return
}

module.exports = {
  cloneLibrary,
  selectTemplate,
  inputFileName,
  selectTemplateOrigin,
}
