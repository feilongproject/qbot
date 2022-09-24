import { init } from './init';
import { findOpts } from './libs/findOpts';
import { IMessageEx } from './libs/IMessageEx';
import { findChannel } from './libs/findChannel';



init().then(() => {

    global.ws.on('GUILD_MESSAGES', async (data: IntentMessage) => {

        if (data.eventType == 'MESSAGE_CREATE') {
            const msg = new IMessageEx(data.msg, "GUILD");// = data.msg as any;
            global.redis.set("lastestMsgId", msg.id, { EX: 5 * 60 });
            //if (msg.author.id != adminId) return;//break debug

            var _content = msg.content ? msg.content.replace(/<@!\d*>/g, "").trim() : null;
            if (!_content) return;
            while (_content.includes("  ")) _content = _content.replace("  ", " ");
            const content = _content;
            const opts = content.trim().split(" ");
            const opt = await findOpts(opts[0]);
            if (opt.path == "err") return;
            log.debug(`./plugins/${opt.path}:${opt.fnc}`);

            try {
                if (findChannel(msg.channel_id) || msg.author.username == adminId || msg.guild_id == "5237615478283154023") {
                    const plugin = await import(`./plugins/${opt.path}.ts`);
                    if (typeof plugin[opt.fnc] == "function") {
                        (plugin[opt.fnc] as PluginFnc)(msg, opt.data).catch(err => {
                            log.error(err);
                        });
                        /* if (opt.data) (plugin[opt.fnc] as PluginFnc)(msg, opt.data).catch(err => {
                            log.error(err);
                        });
                        else (plugin[opt.fnc] as PluginFnc)(msg).catch(err => {
                            log.error(err);
                        }); */
                    } else {
                        log.error(`not found function ${opt.fnc}() at "${global._path}/src/plugins/${opt.path}.ts"`);
                    }
                }
            } catch (err) {
                log.error(err);
            }
        }
    });
});

type PluginFnc = (msg: IMessageEx, data?: string | number) => Promise<any>