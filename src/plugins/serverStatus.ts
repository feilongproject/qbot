import fetch from "node-fetch";
import { settingUserConfig } from "../libs/common";
import { IMessageGUILD } from "../libs/IMessageEx";



export async function baServerStatus(msg: IMessageGUILD) {

    // const settingServer = (await settingUserConfig(msg.author.id, "GET", ["server"])).server as "jp" | "global" | undefined;

    return fetch("https://prod-noticeindex.bluearchiveyostar.com/prod/index.json").then(res => res.json()).then((json: ServerStatusJP) => {

        return msg.sendMsgEx({
            content: `日服状态:` +
                `\n开始维护时间: ${json.Maintenance.StartDate}` +
                `\n终止维护时间: ${json.Maintenance.EndDate}` +
                `\n原因: ${json.Maintenance.Text}`
        });
    });

}

interface ServerStatusJP {
    Notices: {
        NoticeId: number;
        StartDate: string;
        EndDate: string;
        Url: string;
        Title: string;
    }[];
    Events: {
        NoticeId: number;
        StartDate: string;
        EndDate: string;
        Url: string;
        Title: string;
    }[];
    Maintenance: {
        StartDate: string;
        EndDate: string;
        Text: string;
    };
    Banners: {
        BannerId: number;
        StartDate: string;
        EndDate: string;
        Url: string;
        FileName: string[];
        LinkedLobbyBannerId: number;
        BannerType?: number;
    }[];
    ServerStatus: number;
    LatestClientVersion: string;
    GachaProbabilityDisplay: {
        GachaProbabilityDisplayId: number;
        Url: string;
        LinkedLobbyBannerId: number;
    }[];
    NotificationBeforeMaintenance: {
        PopupType: number;
        StartDate: string;
        EndDate: string;
        Text: string;
    };
    ContentLock: [];
    GachaPeriodDisplay: {
        GachaPeriodDisplayId: number;
        Text: string;
    }[];
    Survey: {
        SurveyId: number;
        PopupType: number;
        StartDate: string;
        EndDate: string;
        FileName: string;
        Url: string;
        Text: string;
    };
}


/* 
https://prod-noticeindex.bluearchiveyostar.com/prod/index.json
.Maintenance



*/