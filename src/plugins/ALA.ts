import sharp from "sharp";
import { IMessageGROUP, IMessageGUILD } from "../libs/IMessageEx";
import config from "../../config/config";
import { sendToAdmin } from "../libs/common";

const allowLen = 20;

export async function generateALA(msg: IMessageGUILD | IMessageGROUP) {

    const alaQueue = buildALA(msg.content.replace(/\/?奥利奥/, "").replace(`<@!${meId}>`, "").trim());
    const authLen = Number(await redis.hGet(`pay:ALALimit`, msg.author.id)) || 0;
    // log.debug(alaQueue.length);
    if (alaQueue.length <= (allowLen + authLen)) {

        if (alaQueue.length == 0) return msg.sendMsgExRef({ content: `未找到奥利奥，在本指令后输入"爱丽丝"三个字符中其中任意一个字符即可生成（可重复）` });
        if (alaQueue.length > 100) return msg.sendMsgExRef({ content: `奥利奥过长，内存不足!` });

        try {
            const fileName = `ala-${new Date().getTime()}.png`;
            const outFilePath = `${config.imagesOut}/${fileName}`;
            await buildImage(outFilePath, alaQueue);
            return msg.sendMsgEx({
                content: (msg instanceof IMessageGROUP ? "" : `<@${msg.author.id}>`),
                imageUrl: `https://ip.arona.schale.top/p/gacha/${fileName}`,
            });
        } catch (err) {
            await sendToAdmin(`generateALA\n${JSON.stringify(err).replaceAll(".", ",")}`);
            return msg.sendMsgExRef({ content: `发送图片异常! \n${JSON.stringify(err).replaceAll(".", ",")}` });
        }
    }

    return msg.sendMsgExRef({
        content: `奥利奥过长(${alaQueue.length}字符),最长可允许长度为${allowLen + authLen}字符` +
            `\n含${allowLen}字符基础长度${authLen == 0 ? `(赞助可以获得更多长度)` : `+${authLen}字符赞助长度`}`
    });

}

function buildALA(content: string) {

    var sp = content.split("");
    const alaQueue: ("01" | "10" | "02" | "20" | "12" | "21")[] = [];

    for (const word of sp) {
        var pop = alaQueue.pop();
        switch (word) {
            case "艾":
            case "爱":
            case "愛":
                if (pop == "12" || pop == "21" || pop == "01" || pop == "02") {
                    alaQueue.push(pop, "10");
                } else if (pop == "10" || pop == "20") {
                    alaQueue.push(pop, "01");
                } else {
                    alaQueue.push("01");
                }
                break;
            case "莉":
            case "丽":
            case "麗":
                if (pop)
                    alaQueue.push(pop, "12");
                else
                    alaQueue.push("12");
                break;
            case "丝":
            case "絲":
                if (pop == "12" || pop == "21" || pop == "01" || pop == "02") {
                    alaQueue.push(pop, "20");
                } else if (pop == "10" || pop == "20") {
                    alaQueue.push(pop, "02");
                } else {
                    alaQueue.push("02");
                }
                break;
            default:
                if (pop) {
                    alaQueue.push(pop);
                }
                log.error(`error word${word}`);
        }
    }
    return alaQueue;
}

async function buildImage(tmpOutPath: string, alaQueue: ("01" | "10" | "02" | "20" | "12" | "21")[]): Promise<sharp.OutputInfo> {
    var files: { input: string, top: number, left: number, }[] = [];
    for (const [iv, id] of alaQueue.entries()) {
        files.push({
            input: `${config.images.cutAris}/${id}.jpg`,
            top: iv * 200,
            left: Math.max((alaQueue.length * 20) / 2 - 100, 0),
        });
    }

    return sharp({
        create: {
            width: Math.max(20 * alaQueue.length, 200),
            height: Math.max(200 * alaQueue.length, 200),
            channels: 3,
            background: "#FFFFFF",
        }
    }).composite(files)
        .png({ compressionLevel: 6, quality: 5, })
        .toFile(tmpOutPath);
}