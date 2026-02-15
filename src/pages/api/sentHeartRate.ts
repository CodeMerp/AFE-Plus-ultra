import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import _ from 'lodash';
import { replyNotificationPostbackHeart } from '@/utils/apiLineReply';
import moment from 'moment';

type Data = {
    message: string;
    data?: any;
};

export default async function handle(req: NextApiRequest, res: NextApiResponse<Data>) {
    if (req.method === 'PUT' || req.method === 'POST') {
        try {
            const body = req.body;
            if (!body.uId || !body.takecare_id || !body.bpm) {
                return res.status(400).json({ message: 'error', data: 'ไม่พบพารามิเตอร์ uId, takecare_id, bpm' });
            }

            if (_.isNaN(Number(body.uId)) || _.isNaN(Number(body.takecare_id)) || _.isNaN(Number(body.status))) {
                return res.status(400).json({ message: 'error', data: 'พารามิเตอร์ uId, takecare_id, status ไม่ใช่ตัวเลข' });
            }

            const user = await prisma.users.findFirst({
                where: { users_id: Number(body.uId) },
                include: {
                    users_status_id: { select: { status_name: true } }
                }
            });

            const takecareperson = await prisma.takecareperson.findFirst({
                where: {
                    takecare_id: Number(body.takecare_id),
                    takecare_status: 1
                }
            });

            if (!user || !takecareperson) {
                return res.status(200).json({ message: 'error', data: 'ไม่พบข้อมูล user หรือ takecareperson' });
            }

            // อ่านค่าการตั้งค่า HR [cite: 9]
            const settingHR = await prisma.heartrate_settings.findFirst({
                where: {
                    takecare_id: takecareperson.takecare_id,
                    users_id: user.users_id
                }
            });

            const bpmValue = Number(body.bpm);
            let calculatedStatus = 0;

            // เช็คเฉพาะค่าที่เกิน max_bpm [cite: 12, 13]
            if (settingHR && bpmValue > settingHR.max_bpm) {
                calculatedStatus = 1;
            } else {
                calculatedStatus = 0;
            }

            const status = calculatedStatus;

            // ดึงข้อมูล record ล่าสุดเพื่อตรวจสอบสถานะก่อนหน้า [cite: 15, 16]
            const lastHR = await prisma.heartrate_records.findFirst({
                where: {
                    users_id: user.users_id,
                    takecare_id: takecareperson.takecare_id
                },
                orderBy: {
                    heartrate_id: 'desc'
                }
            });

            let shouldSendNotification = false;

            // ปรับ Logic: แจ้งเตือนครั้งเดียวเมื่อผิดปกติ [cite: 18]
            if (status === 1) {
                // ถ้าไม่มีข้อมูลเก่า หรือ ข้อมูลเก่าสถานะปกติ (noti_status != 1) ให้ส่งแจ้งเตือน [cite: 18]
                if (!lastHR || lastHR.noti_status !== 1) {
                    shouldSendNotification = true;
                }
                // ถ้า lastHR.noti_status เป็น 1 อยู่แล้ว จะไม่ส่งซ้ำ (ตัดการเช็ค 5 นาทีออก) 
            }

            // ส่ง notification [cite: 21, 22]
            if (shouldSendNotification) {
                const message = `คุณ ${takecareperson.takecare_fname} ${takecareperson.takecare_sname}\nชีพจรเกินค่าที่กำหนด: ${bpmValue} bpm`;
                const replyToken = user.users_line_id || '';
                if (replyToken) {
                    await replyNotificationPostbackHeart({
                        replyToken,
                        userId: user.users_id,
                        takecarepersonId: takecareperson.takecare_id,
                        type: 'heartrate',
                        message
                    });
                }
            }

            // เตรียมข้อมูลสำหรับ update/create [cite: 23]
            const recordData: any = {
                bpm: bpmValue,
                record_date: new Date(),
                status: status
            };

            if (shouldSendNotification) {
                recordData.noti_time = new Date();
                recordData.noti_status = 1;
            } else if (status === 0) {
                // เมื่อสถานะกลับมาปกติ ให้รีเซ็ตค่า เพื่อให้แจ้งเตือนได้ใหม่ในครั้งหน้า 
                recordData.noti_status = 0;
                recordData.noti_time = null;
            }

            // บันทึกข้อมูลลงฐานข้อมูล [cite: 27, 28]
            if (lastHR) {
                const updateData: any = { ...recordData };
                
                // หากยังผิดปกติแต่ไม่ส่งแจ้งเตือนซ้ำ ให้คงค่า noti เดิมไว้ [cite: 27, 28]
                if (!shouldSendNotification && status === 1) {
                    delete updateData.noti_time;
                    delete updateData.noti_status;
                }

                await prisma.heartrate_records.update({
                    where: { heartrate_id: lastHR.heartrate_id },
                    data: updateData
                });
            } else {
                await prisma.heartrate_records.create({
                    data: {
                        users_id: user.users_id,
                        takecare_id: takecareperson.takecare_id,
                        ...recordData
                    }
                });
            }

            return res.status(200).json({ message: 'success', data: 'บันทึกข้อมูลเรียบร้อย' });

        } catch (error) {
            console.error("🚀 ~ API /sentHeartRate error:", error);
            return res.status(400).json({ message: 'error', data: error });
        }
    } else {
        res.setHeader('Allow', ['PUT', 'POST']);
        return res.status(405).json({ message: 'error', data: `วิธี ${req.method} ไม่อนุญาต` });
    }
}