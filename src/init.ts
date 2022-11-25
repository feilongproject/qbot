import fs from 'fs';
import { createClient } from 'redis';
import schedule from "node-schedule";
import { createOpenAPI, createWebsocket, OpenAPI } from 'qq-guild-bot';
import _log, { setDevLog } from './libs/logger';
import config from '../config/config.json';

export async function init() {

    console.log(`机器人准备运行，正在初始化`);

    global.adminId = ["7681074728704576201", "9540810258706627170"];
    global._path = process.cwd();
    global.log = _log;
    global.botStatus = {
        startTime: new Date(),
        msgSendNum: 0,
        imageRenderNum: 0,
    }
    global.hotLoadStatus = false;

    if (process.argv.includes("--dev")) {
        log.mark("当前环境处于开发环境，请注意！");
        global.devEnv = true;
        setDevLog();
    } else global.devEnv = false;

    //log.info(`初始化：正在创建定时任务`);
    //schedule.scheduleJob("0 * * * * ? ", async () => (await import("./plugins/biliDynamic")).taskPushBili());
    schedule.scheduleJob("0 * * * * ? ", async () => {
        await redis.save();
        log.mark(`保存数据库中`);
    });

    log.info(`初始化：正在创建插件热加载监听`);
    fs.watch(`${global._path}/src/plugins/`, async (event, filename) => {
        //log.debug(event, filename);
        if (event != "change") return;
        if (!devEnv && !hotLoadStatus) return;
        if (require.cache[`${global._path}/src/plugins/${filename}`]) {
            log.mark(`文件${global._path}/src/plugins/${filename}正在进行热更新`);
            delete require.cache[`${global._path}/src/plugins/${filename}`];
            if (!devEnv) return client.directMessageApi.postDirectMessage((await redis.hGet(`directUid->Gid`, adminId[0]))!, {
                content: `文件${global._path}/src/plugins/${filename}正在进行热更新`.replaceAll(".", ". "),
                msg_id: await redis.get("lastestMsgId") || undefined,
            });
        }
    });

    log.info(`初始化：正在创建指令文件热加载监听`);
    const optFile = `${global._path}/config/opts.json`;
    fs.watchFile(optFile, async () => {
        if (!devEnv && !hotLoadStatus) return;
        if (require.cache[optFile]) {
            log.mark(`指令配置文件正在进行热更新`);
            delete require.cache[optFile];
            if (!devEnv) return client.directMessageApi.postDirectMessage((await redis.hGet(`directUid->Gid`, adminId[0]))!, {
                content: `指令配置文件正在进行热更新`,
                msg_id: await redis.get("lastestMsgId") || undefined,
            });
        }
    });

    log.info(`初始化：正在连接数据库`);
    global.redis = createClient({
        socket: { host: "127.0.0.1", port: 6379, },
        database: 0,
    });
    await global.redis.connect().then(() => {
        log.info(`初始化：redis数据库连接成功`);
    }).catch(err => {
        log.error(`初始化：redis数据库连接失败，正在退出程序\n${err}`);
        process.exit();
    });

    log.info(`初始化：正在创建client与ws`);
    global.client = createOpenAPI(config.initConfig);
    global.ws = createWebsocket(config.initConfig as any);

    log.info(`初始化：正在创建频道树`);
    await loadGuildTree(true);

    global.client.meApi.me().then(res => {
        global.meId = res.data.id;
    });
}

export async function loadGuildTree(init?: boolean) {
    global.saveGuildsTree = [];
    for (const guild of (await global.client.meApi.meGuilds()).data) {
        if (init) log.mark(`${guild.name}(${guild.id})`);
        var _guild: SaveChannel[] = [];
        for (const channel of (await global.client.channelApi.channels(guild.id)).data) {
            if (init) log.mark(`${guild.name}(${guild.id})-${channel.name}(${channel.id})-father:${channel.parent_id}`);
            _guild.push({ name: channel.name, id: channel.id });
        }
        global.saveGuildsTree.push({ name: guild.name, id: guild.id, channel: _guild });
    }
}