import { IMessageGUILD, IMessageDIRECT, MessageType } from "./IMessageEx";

export async function findOpts(msg: IMessageGUILD | IMessageDIRECT): Promise<{ path: string; fnc: string; data?: string } | string | null> {
    if (!msg.content) return null;

    const configOpt = await import("../../config/opts.json");
    const commandFathers: {
        [keyFather: string]: {
            [keyChild: string]: {
                reg: string;
                fnc: string;
                channelAllows?: string[];
                data?: string;
                type: string[],
                describe: string;
            }
        }
    } = configOpt.command;
    const channelAllows: {
        [allowKeys: string]: {
            id: string;
            name: string;
        }[];
    } = configOpt.channelAllows;

    for (const keyFather in commandFathers)
        for (const keyChild in commandFathers[keyFather]) {
            const opt = commandFathers[keyFather][keyChild];
            const allowChannels = opt.channelAllows || ["common"];
            // if (devEnv) allowKeys.push("dev");
            if (!opt.type.includes(msg.messageType)) continue;
            if (!RegExp(opt.reg).test(msg.content.replace(/<@!\d*>/g, "").trim())) continue;
            const channelAllow = () => {
                for (const allowChannelKey of allowChannels) for (const channel of channelAllows[allowChannelKey]) if (channel.id == msg.channel_id) return true;
            }
            if (devEnv || msg.guild_id == "5237615478283154023" || msg.messageType == MessageType.DIRECT || allowChannels[0] == "all" || channelAllow()) {
                return { path: keyFather, ...opt };
            }
        }

    return null;
}
