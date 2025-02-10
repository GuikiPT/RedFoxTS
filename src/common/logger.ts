import betterLogging from "better-logging";
import moment from "moment";
import chalk from "chalk";

betterLogging(console, {
    format: (ctx) => {
        const time = `${chalk.gray('[')}${chalk.keyword('orange')(moment().format('HH:mm:ss'))}${chalk.gray(']')}`;
        const date = `${chalk.gray('[')}${chalk.keyword('orange')(moment().format('YYYY-MM-DD'))}${chalk.gray(']')}`;
        return `${time} ${date} ${ctx.type} >> ${ctx.msg}`;
    },
    saveToFile: `./logs/${moment().format("YYYY-MM-DD")}.log`,
    color: {
        base: chalk.gray,
        type: {
            debug: chalk.cyan,
            info: chalk.blue,
            log: chalk.keyword('orange'),
            error: chalk.red,
            warn: chalk.yellow,
        },
    },
});
