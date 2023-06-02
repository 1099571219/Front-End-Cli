#! /usr/bin/env node
const program = require('commander')
const {
  cloneLibrary,
  selectTemplate,
  inputFileName,
  selectTemplateOrigin,
} = require('./util')

program
  .command('create [projectName]')
  .description('创建模板')
  .option('-t,--template <template>', '模板名称')
  .action(async (projectName, options) => {
    let [branches, origin] = await selectTemplateOrigin()

    console.log(branches, origin)
    let project = branches.find(
      (template) => template.name === options.template,
    )
    let projectTemplate = project ? project.value : undefined

    if (!projectName) {
      projectName = await inputFileName()
    }
    console.log('项目名称:', projectName)

    if (!projectTemplate) {
      projectTemplate = await selectTemplate(branches)
    }
    // 目标文件夹 = 用户命令行所在目录 + 项目名称
    await cloneLibrary(projectTemplate, projectName, origin)
    console.log('项目创建完成！')
  })

program.on('--help', () => {})

//解析用户执行命令行传入的参数
program.version(require('../package.json').version,'-v --version').parse(process.argv)
