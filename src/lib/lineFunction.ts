import { encrypt, parseQueryString } from "@/utils/helpers";
import * as api from "@/lib/listAPI";
import axios from "axios";

import { replyNotification, replyNoti } from "@/utils/apiLineGroup";

interface PostbackSafezoneProps {
  userLineId: string;
  takecarepersonId: number;
  extenId?: number; // เพิ่ม extenId เพื่อใช้เช็คสถานะจากปุ่มเดิม
}

const getLocation = async (
  takecare_id: number,
  users_id: number,
  safezone_id: number
) => {
  const response = await axios.get(
    `${process.env.WEB_DOMAIN}/api/location/getLocation?takecare_id=${takecare_id}&users_id=${users_id}&safezone_id=${safezone_id}`
  );
  if (response.data?.data) {
    return response.data.data;
  } else {
    return null;
  }
};

// ฟังก์ชันสำหรับเช็คสถานะก่อนเริ่มทำงาน (ใช้ร่วมกันทุกฟังก์ชันเพื่อลด code ซ้ำ)
const checkCaseStatus = async (extenId?: number) => {
  if (!extenId) return null; // ถ้าไม่มี ID ส่งมา ให้ข้ามไปเช็คแบบปกติ

  const currentCase = await api.getExtendedHelpById(extenId);
  if (currentCase) {
    // 1. ปิดเคสไปแล้ว
    if (currentCase.exted_closed_date) {
      return "case_closed";
    }
    // 2. มีคนรับงานแล้ว
    if (currentCase.exten_received_date || currentCase.exten_received_user_id) {
      return "case_received";
    }
    // 3. ยังไม่ปิดและยังไม่รับ (รออยู่) -> ห้ามกดซ้ำ
    return "already_sent";
  }
  return null;
};

export const postbackHeartRate = async ({
  userLineId,
  takecarepersonId,
  extenId,
}: PostbackSafezoneProps) => {
  try {
    // 1. เช็คสถานะจากปุ่ม (ถ้ามี extenId)
    const statusCheck = await checkCaseStatus(extenId);
    if (statusCheck) return statusCheck;

    const resUser = await api.getUser(userLineId);
    const resTakecareperson = await api.getTakecareperson(
      takecarepersonId.toString()
    );

    if (resUser && resTakecareperson) {
      const resSafezone = await api.getSafezone(
        resTakecareperson.takecare_id,
        resUser.users_id
      );
      if (resSafezone) {
        const resExtendedHelp = await api.getExtendedHelp(
          resTakecareperson.takecare_id,
          resUser.users_id
        );

        if (resExtendedHelp && !resExtendedHelp.exted_closed_date) {
           if (resExtendedHelp.exten_received_date || resExtendedHelp.exten_received_user_id) {
             return "case_received";
           }
          console.log(`Heart rate case still open. exten_id: ${resExtendedHelp.exten_id}`);
          return "already_sent";
        }

        let extendedHelpId = null;
        const data = {
          takecareId: resTakecareperson.takecare_id,
          usersId: resUser.users_id,
          typeStatus: "save",
          safezLatitude: resSafezone.safez_latitude,
          safezLongitude: resSafezone.safez_longitude,
        };
        const resNewId = await api.saveExtendedHelp(data);
        extendedHelpId = resNewId;

        const responseLocation = await getLocation(
          resTakecareperson.takecare_id,
          resUser.users_id,
          resSafezone.safezone_id
        );

        await replyNotification({
          resUser,
          resTakecareperson,
          resSafezone,
          extendedHelpId,
          locationData: responseLocation,
        });

        return resUser.users_line_id;
      } else {
        console.log(`NO SAFEZONE FOUND for takecare_id: ${resTakecareperson.takecare_id}, users_id: ${resUser.users_id}`);
      }
    } else {
      console.log(`USER or TAKECAREPERSON NOT FOUND.`);
    }
    return null;
  } catch (error) {
    console.log("🚨 ~ postbackHeartRate ~ error:", error);
    return null;
  }
};

export const postbackFall = async ({
  userLineId,
  takecarepersonId,
  extenId,
}: PostbackSafezoneProps) => {
  try {
    // 1. เช็คสถานะจากปุ่ม (ถ้ามี extenId)
    const statusCheck = await checkCaseStatus(extenId);
    if (statusCheck) return statusCheck;

    const resUser = await api.getUser(userLineId);
    const resTakecareperson = await api.getTakecareperson(
      takecarepersonId.toString()
    );

    if (resUser && resTakecareperson) {
      const resSafezone = await api.getSafezone(
        resTakecareperson.takecare_id,
        resUser.users_id
      );
      if (resSafezone) {
        const resExtendedHelp = await api.getExtendedHelp(
          resTakecareperson.takecare_id,
          resUser.users_id
        );

        if (resExtendedHelp && !resExtendedHelp.exted_closed_date) {
           if (resExtendedHelp.exten_received_date || resExtendedHelp.exten_received_user_id) {
             return "case_received";
           }
          console.log(`Fall case still open. exten_id: ${resExtendedHelp.exten_id}`);
          return "already_sent";
        }

        let extendedHelpId = null;
        const data = {
          takecareId: resTakecareperson.takecare_id,
          usersId: resUser.users_id,
          typeStatus: "save",
          safezLatitude: resSafezone.safez_latitude,
          safezLongitude: resSafezone.safez_longitude,
        };
        const resNewId = await api.saveExtendedHelp(data);
        extendedHelpId = resNewId;

        const responseLocation = await getLocation(
          resTakecareperson.takecare_id,
          resUser.users_id,
          resSafezone.safezone_id
        );

        await replyNotification({
          resUser,
          resTakecareperson,
          resSafezone,
          extendedHelpId,
          locationData: responseLocation,
        });

        return resUser.users_line_id;
      } else {
        console.log(`NO SAFEZONE FOUND for takecare_id: ${resTakecareperson.takecare_id}, users_id: ${resUser.users_id}`);
      }
    } else {
      console.log(`USER or TAKECAREPERSON NOT FOUND.`);
    }
    return null;
  } catch (error) {
    console.log("🚨 ~ postbackFall ~ error:", error);
    return null;
  }
};

export const postbackTemp = async ({
  userLineId,
  takecarepersonId,
  extenId,
}: PostbackSafezoneProps) => {
  try {
    // 1. เช็คสถานะจากปุ่ม (ถ้ามี extenId)
    const statusCheck = await checkCaseStatus(extenId);
    if (statusCheck) return statusCheck;

    const resUser = await api.getUser(userLineId);
    const resTakecareperson = await api.getTakecareperson(
      takecarepersonId.toString()
    );

    if (resUser && resTakecareperson) {
      const resSafezone = await api.getSafezone(
        resTakecareperson.takecare_id,
        resUser.users_id
      );
      if (resSafezone) {
        const resExtendedHelp = await api.getExtendedHelp(
          resTakecareperson.takecare_id,
          resUser.users_id
        );

        if (resExtendedHelp && !resExtendedHelp.exted_closed_date) {
           if (resExtendedHelp.exten_received_date || resExtendedHelp.exten_received_user_id) {
             return "case_received";
           }
          console.log(`Temperature case still open. exten_id: ${resExtendedHelp.exten_id}`);
          return "already_sent";
        }

        let extendedHelpId = null;
        const data = {
          takecareId: resTakecareperson.takecare_id,
          usersId: resUser.users_id,
          typeStatus: "save",
          safezLatitude: resSafezone.safez_latitude,
          safezLongitude: resSafezone.safez_longitude,
        };
        const resNewId = await api.saveExtendedHelp(data);
        extendedHelpId = resNewId;

        const responseLocation = await getLocation(
          resTakecareperson.takecare_id,
          resUser.users_id,
          resSafezone.safezone_id
        );

        await replyNotification({
          resUser,
          resTakecareperson,
          resSafezone,
          extendedHelpId,
          locationData: responseLocation,
        });

        return resUser.users_line_id;
      } else {
        console.log(`NO SAFEZONE FOUND for takecare_id: ${resTakecareperson.takecare_id}, users_id: ${resUser.users_id}`);
      }
    } else {
      console.log(`USER or TAKECAREPERSON NOT FOUND.`);
    }
    return null;
  } catch (error) {
    console.log("🚨 ~ postbackTemp ~ error:", error);
    return null;
  }
};

export const postbackSafezone = async ({
  userLineId,
  takecarepersonId,
  extenId,
}: PostbackSafezoneProps) => {
  try {
    // 1. เช็คสถานะจากปุ่ม (ถ้ามี extenId)
    const statusCheck = await checkCaseStatus(extenId);
    if (statusCheck) return statusCheck;

    const resUser = await api.getUser(userLineId);
    const resTakecareperson = await api.getTakecareperson(
      takecarepersonId.toString()
    );

    if (resUser && resTakecareperson) {
      const resSafezone = await api.getSafezone(
        resTakecareperson.takecare_id,
        resUser.users_id
      );
      if (resSafezone) {
        const resExtendedHelp = await api.getExtendedHelp(
          resTakecareperson.takecare_id,
          resUser.users_id
        );

        if (resExtendedHelp && !resExtendedHelp.exted_closed_date) {
           if (resExtendedHelp.exten_received_date || resExtendedHelp.exten_received_user_id) {
             return "case_received";
           }
          console.log(`Safezone case still open. exten_id: ${resExtendedHelp.exten_id}`);
          return "already_sent";
        }

        let extendedHelpId = null;
        const data = {
          takecareId: resTakecareperson.takecare_id,
          usersId: resUser.users_id,
          typeStatus: "save",
          safezLatitude: resSafezone.safez_latitude,
          safezLongitude: resSafezone.safez_longitude,
        };
        const resExtendedHelpId = await api.saveExtendedHelp(data);
        extendedHelpId = resExtendedHelpId;

        const responeLocation = await getLocation(
          resTakecareperson.takecare_id,
          resUser.users_id,
          resSafezone.safezone_id
        );

        await replyNotification({
          resUser,
          resTakecareperson,
          resSafezone,
          extendedHelpId,
          locationData: responeLocation,
        });
        return resUser.users_line_id;
      } else {
        console.log(`NO SAFEZONE FOUND for takecare_id: ${resTakecareperson.takecare_id}, users_id: ${resUser.users_id}`);
      }
    } else {
      console.log(`USER or TAKECAREPERSON NOT FOUND. userLineId: ${userLineId}, takecarepersonId: ${takecarepersonId}`);
    }
    return null;
  } catch (error) {
    console.log("🚀 ~ postbackSafezone ~ error:", error);
    return null;
  }
};

export const postbackAccept = async (data: any) => {
  try {
    const resUser = await api.getUser(data.userIdAccept);
    if (!resUser) {
      await replyNoti({
        replyToken: data.groupId,
        userIdAccept: data.userIdAccept,
        message: "ไม่พบข้อมูลของคุณไม่สามารถรับเคสได้",
      });
      return null;
    } else {
      const resExtendedHelp = await api.getExtendedHelpById(data.extenId);
      if (resExtendedHelp) {
        if (
          resExtendedHelp.exten_received_date &&
          resExtendedHelp.exten_received_user_id
        ) {
          await replyNoti({
            replyToken: data.groupId,
            userIdAccept: data.userIdAccept,
            title: "สถานะเคส",
            titleColor: "#1976D2",
            message: "มีผู้รับเคสช่วยเหลือแล้ว",
          });
          return null;
        } else {
          await api.updateExtendedHelp({
            extenId: data.extenId,
            typeStatus: "received",
            extenReceivedUserId: resUser.users_id,
          });
          await replyNoti({
            replyToken: data.groupId,
            userIdAccept: data.userIdAccept,
            title: "สถานะเคส",
            titleColor: "#1976D2",
            message: "รับเคสช่วยเหลือแล้ว",
            buttons: [
              {
                type: "postback",
                label: "ปิดเคสช่วยเหลือ",
                data: `type=close&takecareId=${data.takecareId}&extenId=${data.extenId}&userLineId=${data.userLineId}`,
              },
            ],
          });
          return data.userLineId;
        }
      }
    }
    return null;
  } catch (error) {
    return error;
  }
};

export const postbackClose = async (data: any) => {
  try {
    const resUser = await api.getUser(data.userIdAccept);
    if (!resUser) {
      await replyNoti({
        replyToken: data.groupId,
        userIdAccept: data.userIdAccept,
        message: "ไม่พบข้อมูลของคุณไม่สามารถปิดเคสได้",
      });
      return null;
    } else {
      const resExtendedHelp = await api.getExtendedHelpById(data.extenId);
      if (resExtendedHelp) {
        if (
          resExtendedHelp.exted_closed_date &&
          resExtendedHelp.exten_closed_user_id
        ) {
          await replyNoti({
            replyToken: data.groupId,
            userIdAccept: data.userIdAccept,
            title: "สถานะเคส",
            titleColor: "#1976D2",
            message: "มีผู้ปิดเคสช่วยเหลือแล้ว",
          });
          return null;
        }
        if (
          !resExtendedHelp.exten_received_date &&
          !resExtendedHelp.exten_received_user_id
        ) {
          await replyNoti({
            replyToken: data.groupId,
            userIdAccept: data.userIdAccept,
            message: "ไม่สามารถปิดเคสได้ เนื่องจากยังไม่ได้ตอบรับการช่วยเหลือ",
          });
          return null;
        } else {
          await api.updateExtendedHelp({
            extenId: data.extenId,
            typeStatus: "close",
            extenClosedUserId: resUser.users_id,
          });
          await replyNoti({
            replyToken: data.groupId,
            userIdAccept: data.userIdAccept,
            title: "สถานะเคส",
            titleColor: "#1976D2",
            message: "ปิดเคสช่วยเหลือแล้ว",
          });
          return data.userLineId;
        }
      }
    }
    return null;
  } catch (error) {
    return error;
  }
};