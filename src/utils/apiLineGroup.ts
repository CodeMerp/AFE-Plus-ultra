import axios from 'axios';
import moment from 'moment';
import prisma from '@/lib/prisma'
const WEB_API = process.env.WEB_API_URL;
const LINE_INFO_API = 'https://api.line.me/v2/bot/info';
const LINE_GROUP_API = 'https://api.line.me/v2/bot/group/'
const LINE_PUSH_MESSAGING_API = 'https://api.line.me/v2/bot/message/push';
const LINE_PROFILE_API = 'https://api.line.me/v2/bot/profile';
const LINE_HEADER = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${process.env.CHANNEL_ACCESS_TOKEN_LINE}`, // Replace with your LINE Channel Access Token
};

interface ReplyNotification {
    resUser: {
        users_related_borrow: string;
        users_fname: string;
        users_sname: string;
        users_tel1: string;
        users_line_id: string;
    };
    resTakecareperson: {
        takecare_fname: string;
        takecare_sname: string;
        takecare_tel1: string;
        takecare_id: number;
    };
    resSafezone: {};
    extendedHelpId: number;
    locationData: {
        locat_latitude: number;
        locat_longitude: number;
    };
}
interface ReplyNoti {
    replyToken: string;
    message: string;
    userIdAccept: string;
}
export const getUserProfile = async (userId: string) => {
    try {
        const response = await axios.get(`${LINE_PROFILE_API}/${userId}`, { headers: LINE_HEADER });
        return response.data;
    } catch (error) {
        if (error instanceof Error) {
            console.log(error.message);
        }
    }
}

//ปรับ
const layoutBoxBaseline = (label: string, text: string) => {
    return {
        type: "box",
        layout: "baseline",
        contents: [
            {
                type: "text",
                text: label,
                size: "sm",
                color: "#6B7280", // สีเทาเข้มขึ้นตามดีไซน์ใหม่
                flex: 2
            },
            {
                type: "text",
                text: text,
                size: "sm",
                color: "#1F2937", // สีเกือบดำ ตัวหนา
                weight: "bold",
                flex: 4,
                wrap: true
            }
        ],
        spacing: "sm"
    }
}

const header1 = () => {
    const h1 = {
        type: "text",
        text: " ",
        contents: [
            {
                type: "span",
                text: "แจ้งเตือนช่วยเหลือเพิ่มเติม",
                color: "#FC0303",
                size: "xl",
                weight: "bold",
                decoration: "none"
            },
            {
                type: "span",
                text: " ",
                size: "xxl",
                decoration: "none"
            }
        ]
    }
    const h2 = {
        type: "separator",
        margin: "md"
    }
    return [h1, h2]
}

export const replyNotification = async ({
    resUser,
    resTakecareperson,
    resSafezone,
    extendedHelpId,
    locationData,
}: ReplyNotification) => {
    try {
        const latitude = Number(locationData.locat_latitude);
        const longitude = Number(locationData.locat_longitude);

        // ค้นหากลุ่มที่เปิดใช้งานจากฐานข้อมูล
        const groupLine = await prisma.groupLine.findFirst({
            where: {
                group_status: 1,  // ค้นหากลุ่มที่เปิดใช้งาน
            },
        });

        if (groupLine) {
            const groupLineId = groupLine.group_line_id;  // ดึง group_line_id ที่ต้องการ

            const requestData = {
                to: groupLineId,  // ใช้ groupLineId ในการส่งข้อความไปยังไลน์กลุ่ม
                messages: [
                    {
                        type: 'location',
                        title: `ตำแหน่งปัจจุบันของผู้สูงอายุ ${resTakecareperson.takecare_fname} ${resTakecareperson.takecare_sname}`,
                        address: 'สถานที่ตั้งปัจจุบันของผู้สูงอายุ',
                        latitude: latitude,
                        longitude: longitude,
                    },
                    {
                        type: 'flex',
                        altText: 'แจ้งเตือน',
                        contents: {
                            type: "bubble",
                            size: "mega",
                            hero: {
                                type: "box",
                                layout: "vertical",
                                contents: [
                                    {
                                        type: "box",
                                        layout: "horizontal",
                                        contents: [
                                            {
                                                type: "box",
                                                layout: "vertical",
                                                contents: [],
                                                width: "6px",
                                                backgroundColor: "#DC2626"
                                            },
                                            {
                                                type: "box",
                                                layout: "vertical",
                                                contents: [
                                                    {
                                                        type: "box",
                                                        layout: "horizontal",
                                                        contents: [
                                                            {
                                                                type: "box",
                                                                layout: "vertical",
                                                                contents: [
                                                                    {
                                                                        type: "box",
                                                                        layout: "vertical",
                                                                        contents: [],
                                                                        width: "16px",
                                                                        height: "16px",
                                                                        cornerRadius: "8px",
                                                                        borderWidth: "semi-bold",
                                                                        backgroundColor: "#DC2626",
                                                                        borderColor: "#FFFFFF"
                                                                    }
                                                                ],
                                                                margin: "none",
                                                                flex: 0,
                                                                borderWidth: "bold",
                                                                borderColor: "#DC2626",
                                                                cornerRadius: "xl"
                                                            },
                                                            {
                                                                type: "text",
                                                                text: "แจ้งเตือนช่วยเหลือเพิ่มเติม",
                                                                size: "xl",
                                                                color: "#FFFFFF",
                                                                weight: "bold",
                                                                flex: 1,
                                                                margin: "xs"
                                                            }
                                                        ],
                                                        alignItems: "center",
                                                        spacing: "xs"
                                                    }
                                                ],
                                                paddingAll: "20px",
                                                flex: 1
                                            }
                                        ],
                                        backgroundColor: "#EF4444",
                                        background: {
                                            type: "linearGradient",
                                            angle: "135deg",
                                            startColor: "#F87171",
                                            endColor: "#EF4444"
                                        }
                                    }
                                ],
                                paddingAll: "0px",
                                spacing: "none"
                            },
                            body: {
                                type: "box",
                                layout: "vertical",
                                contents: [
                                    // --- ส่วนที่ 1: ข้อมูลผู้ดูแล ---
                                    {
                                        type: "box",
                                        layout: "vertical",
                                        contents: [
                                            {
                                                type: "text",
                                                text: "👨‍⚕️ ข้อมูลผู้ดูแล",
                                                size: "md",
                                                color: "#1F2937",
                                                weight: "bold"
                                            }
                                        ],
                                        backgroundColor: "#F3F4F6",
                                        paddingAll: "12px",
                                        cornerRadius: "8px"
                                    },
                                    {
                                        type: "box",
                                        layout: "vertical",
                                        contents: [
                                            layoutBoxBaseline('ชื่อ-สกุล', `${resUser.users_fname} ${resUser.users_sname}`),
                                            { type: "separator", margin: "sm" },
                                            {
                                                ...layoutBoxBaseline('เบอร์โทร', `${resUser.users_tel1}`),
                                                margin: "md"
                                            }
                                        ],
                                        margin: "md",
                                        paddingAll: "12px",
                                        backgroundColor: "#FAFAFA",
                                        cornerRadius: "8px"
                                    },

                                    // --- ส่วนที่ 2: ข้อมูลผู้สูงอายุ ---
                                    {
                                        type: "box",
                                        layout: "vertical",
                                        contents: [
                                            {
                                                type: "text",
                                                text: "👴 ข้อมูลผู้สูงอายุ",
                                                size: "md",
                                                color: "#1F2937",
                                                weight: "bold"
                                            }
                                        ],
                                        backgroundColor: "#F3F4F6",
                                        paddingAll: "12px",
                                        cornerRadius: "8px",
                                        margin: "lg"
                                    },
                                    {
                                        type: "box",
                                        layout: "vertical",
                                        contents: [
                                            layoutBoxBaseline('ชื่อ-สกุล', `${resTakecareperson.takecare_fname} ${resTakecareperson.takecare_sname}`),
                                            {
                                                ...layoutBoxBaseline('เบอร์โทร', `${resTakecareperson.takecare_tel1}`),
                                                margin: "md"
                                            }
                                        ],
                                        margin: "md",
                                        paddingAll: "12px",
                                        backgroundColor: "#FAFAFA",
                                        cornerRadius: "8px"
                                    },

                                    // --- ส่วนปุ่ม Action ---
                                    {
                                        type: "separator",
                                        margin: "xl"
                                    },
                                    {
                                        type: "button",
                                        style: "primary",
                                        color: "#10B981", // สีเขียวใหม่
                                        height: "sm",
                                        margin: "lg",
                                        action: {
                                            type: 'postback',
                                            label: '✅ ตอบรับเคสช่วยเหลือ',
                                            data: `type=accept&takecareId=${resTakecareperson.takecare_id}&extenId=${extendedHelpId}&userLineId=${resUser.users_line_id}`
                                        }
                                    },
                                    {
                                        type: "button",
                                        style: "primary",
                                        color: "#6366F1", // สีม่วง Indigo ใหม่
                                        height: "sm",
                                        margin: "md",
                                        action: {
                                            type: 'postback',
                                            label: '🚫 ปิดเคสช่วยเหลือ',
                                            data: `type=close&takecareId=${resTakecareperson.takecare_id}&extenId=${extendedHelpId}&userLineId=${resUser.users_line_id}`
                                        }
                                    },
                                    {
                                        type: "separator",
                                        margin: "lg"
                                    },
                                    {
                                        type: "button",
                                        style: "primary",
                                        color: "#1167B1", // สีฟ้าใหม่
                                        height: "md",
                                        margin: "xl",
                                        action: {
                                            type: 'uri',
                                            label: '📞 โทรผู้ดูแล',
                                            uri: `tel:${resUser.users_tel1}`
                                        }
                                    }
                                ],
                                paddingAll: "20px"
                            }
                        }
                    },
                ],
            };

            // ส่งข้อความไปยังกลุ่ม
            await axios.post(LINE_PUSH_MESSAGING_API, requestData, { headers: LINE_HEADER });
        } else {
            console.log('ไม่พบกลุ่มไลน์ที่ต้องการส่งข้อความไป');
        }
    } catch (error) {
        if (error instanceof Error) {
            console.log(error.message);
        }
    }
};


export const replyNoti = async ({
    replyToken,
    userIdAccept,
    message
}: ReplyNoti) => {
    try {
        const profile = await getUserProfile(userIdAccept);
        const requestData = {
            to: replyToken,
            messages: [
                {
                    type: "flex",
                    altText: "แจ้งเตือน",
                    contents: {
                        type: "bubble",
                        size: "mega",
                        hero: {
                            type: "box",
                            layout: "vertical",
                            contents: [
                                {
                                    type: "box",
                                    layout: "horizontal",
                                    contents: [
                                        {
                                            type: "box",
                                            layout: "vertical",
                                            contents: [],
                                            width: "6px",
                                            backgroundColor: "#DC2626"
                                        },
                                        {
                                            type: "box",
                                            layout: "vertical",
                                            contents: [
                                                {
                                                    type: "box",
                                                    layout: "horizontal",
                                                    contents: [
                                                        {
                                                            type: "box",
                                                            layout: "vertical",
                                                            contents: [
                                                                {
                                                                    type: "box",
                                                                    layout: "vertical",
                                                                    contents: [],
                                                                    width: "16px",
                                                                    height: "16px",
                                                                    cornerRadius: "8px",
                                                                    borderWidth: "semi-bold",
                                                                    backgroundColor: "#DC2626",
                                                                    borderColor: "#FFFFFF"
                                                                }
                                                            ],
                                                            margin: "none",
                                                            flex: 0,
                                                            borderWidth: "bold",
                                                            borderColor: "#DC2626",
                                                            cornerRadius: "xl"
                                                        },
                                                        {
                                                            type: "text",
                                                            text: "แจ้งเตือนช่วยเหลือเพิ่มเติม",
                                                            size: "lg",
                                                            color: "#FFFFFF",
                                                            weight: "bold",
                                                            flex: 1,
                                                            margin: "xs"
                                                        }
                                                    ],
                                                    alignItems: "center",
                                                    spacing: "xs"
                                                }
                                            ],
                                            paddingAll: "20px",
                                            flex: 1
                                        }
                                    ],
                                    backgroundColor: "#EF4444",
                                    background: {
                                        type: "linearGradient",
                                        angle: "135deg",
                                        startColor: "#F87171",
                                        endColor: "#EF4444"
                                    }
                                }
                            ],
                            paddingAll: "0px",
                            spacing: "none"
                        },
                        body: {
                            type: "box",
                            layout: "vertical",
                            contents: [
                                {
                                    type: "text",
                                    text: `คุณ ${profile.displayName}`, // ใส่ชื่อผู้ใช้ตรงนี้
                                    weight: "bold",
                                    size: "lg",
                                    color: "#1F2937",
                                    wrap: true
                                },
                                {
                                    type: "text",
                                    text: message, // ใส่ข้อความแจ้งเตือนตรงนี้
                                    margin: "md",
                                    size: "md",
                                    color: "#4B5563",
                                    wrap: true,
                                    lineSpacing: "5px"
                                }
                            ],
                            paddingAll: "20px"
                        }
                    }
                }
            ],
        };
        await axios.post(LINE_PUSH_MESSAGING_API, requestData, { headers: LINE_HEADER });
    } catch (error) {
        if (error instanceof Error) {
            console.log(error.message);
        }
    }
}