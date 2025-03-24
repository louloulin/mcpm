import { Command } from 'commander';
import chalk from 'chalk';
import i18n from '../i18n';

export function languageCommand(program: Command): void {
  program
    .command('language')
    .description(i18n.t('commands.language.description'))
    .option('-l, --list', i18n.t('commands.language.listOption'))
    .option('-s, --set <language>', i18n.t('commands.language.setOption'))
    .option('-c, --current', i18n.t('commands.language.currentOption'))
    .action((options) => {
      try {
        // 列出可用语言
        if (options.list) {
          const availableLanguages = i18n.getAvailableLanguages();
          console.log(chalk.bold(i18n.t('commands.language.availableLanguages')));
          availableLanguages.forEach(lang => {
            const current = lang === i18n.getLanguage() ? chalk.green(` (${i18n.t('commands.language.current')})`) : '';
            let langName = '';
            switch(lang) {
              case 'en': langName = 'English'; break;
              case 'zh-CN': langName = '简体中文'; break;
              case 'zh-TW': langName = '繁體中文'; break;
              case 'ja': langName = '日本語'; break;
              case 'ko': langName = '한국어'; break;
              default: langName = lang;
            }
            console.log(`  ${lang} - ${langName}${current}`);
          });
          return;
        }
        
        // 显示当前语言
        if (options.current) {
          const currentLang = i18n.getLanguage();
          let langName = '';
          switch(currentLang) {
            case 'en': langName = 'English'; break;
            case 'zh-CN': langName = '简体中文'; break;
            case 'zh-TW': langName = '繁體中文'; break;
            case 'ja': langName = '日本語'; break;
            case 'ko': langName = '한국어'; break;
            default: langName = currentLang;
          }
          console.log(chalk.bold(i18n.t('commands.language.currentLanguage')));
          console.log(`  ${currentLang} - ${langName}`);
          return;
        }
        
        // 设置新语言
        if (options.set) {
          const newLang = options.set;
          try {
            i18n.setLanguage(newLang);
            const langName = (() => {
              switch(newLang) {
                case 'en': return 'English';
                case 'zh-CN': return '简体中文';
                case 'zh-TW': return '繁體中文';
                case 'ja': return '日本語';
                case 'ko': return '한국어';
                default: return newLang;
              }
            })();
            console.log(chalk.green(i18n.t('commands.language.languageChanged').replace('{0}', `${newLang} - ${langName}`)));
            console.log(chalk.yellow(i18n.t('commands.language.restartRequired')));
          } catch (error: any) {
            console.error(chalk.red(i18n.t('commands.language.setError').replace('{0}', error.message)));
            console.log(chalk.yellow(i18n.t('commands.language.availableOptions')));
            console.log('  en, zh-CN, zh-TW, ja, ko');
          }
          return;
        }
        
        // 默认显示帮助
        if (!options.list && !options.current && !options.set) {
          console.log(chalk.bold(i18n.t('commands.language.commandTitle')));
          console.log(`  --list, -l    ${i18n.t('commands.language.listOption')}`);
          console.log(`  --set, -s     ${i18n.t('commands.language.setOption')}`);
          console.log(`  --current, -c ${i18n.t('commands.language.currentOption')}`);
          console.log();
          console.log(chalk.bold(i18n.t('cli.exampleHeader')));
          console.log('  mcpm language --list');
          console.log('  mcpm language --set zh-CN');
          console.log('  mcpm language --current');
        }
      } catch (error: any) {
        console.error(chalk.red(i18n.t('commands.language.operationError').replace('{0}', error.message)));
      }
    });
} 