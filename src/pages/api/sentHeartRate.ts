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

            // อ่านค่าการตั้งค่า HR
            const settingHR = await prisma.heartrate_settings.findFirst({
                where: {
                    takecare_id: takecareperson.takecare_id,
                    users_id: user.users_id
                }
            });

            // เปรียบเทียบค่า HR กับที่ตั้งไว้ (เช็คแค่ max_bpm)
            const bpmValue = Number(body.bpm);
            let calculatedStatus = Number(body.status);

            // เช็คเฉพาะค่าที่เกิน max_bpm เท่านั้น
            if (settingHR && bpmValue > settingHR.max_bpm) {
                calculatedStatus = 1; // เกิน max_bpm ถือว่าผิดปกติ
            } else {
                calculatedStatus = 0; // ปกติ
            }

            const status = calculatedStatus;

            // ดึงข้อมูล record ล่าสุด
            const lastHR = await prisma.heartrate_records.findFirst({
                where: {
                    users_id: user.users_id,
                    takecare_id: takecareperson.takecare_id
                },
                orderBy: {
                    heartrate_id: 'desc'
                }
            });

            // ตรวจสอบว่าควรส่ง notification หรือไม่
            let shouldSendNotification = false;
            if (status === 1) {
                // กรณีไม่มี record เก่า หรือ status เก่าไม่ผิดปกติ -> ส่งได้เลย
                if (!lastHR || lastHR.noti_status !== 1) {
                    shouldSendNotification = true;
                } 
                // กรณี status เก่าผิดปกติ -> เช็คว่าผ่านมา 5 นาทีหรือยัง
                else if (lastHR.noti_time && moment().diff(moment(lastHR.noti_time), 'minutes') >= 5) {
                    shouldSendNotification = true;
                }
            }

            // ส่ง notification ถ้าจำเป็น
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

            // เตรียมข้อมูลสำหรับ update/create
            const recordData: any = {
                bpm: bpmValue,
                record_date: new Date(),
                status: status
            };

            // อัพเดท noti_time และ noti_status เฉพาะตอนที่ส่ง notification
            if (shouldSendNotification) {
                recordData.noti_time = new Date();
                recordData.noti_status = 1;
            } else if (status === 0) {
                // ถ้ากลับมาปกติ ให้รีเซ็ต noti_status
                recordData.noti_status = 0;
                recordData.noti_time = null;
            }
            // ถ้า status = 1 แต่ไม่ถึงเวลาส่ง notification -> ไม่แก้ noti_time/noti_status

            // บันทึกข้อมูล
            if (lastHR) {
                const updateData: any = { ...recordData };
                
                // ถ้าไม่ควรส่ง notification และ status ยังเป็น 1 -> เก็บค่า noti_time/noti_status เดิมไว้
                if (!shouldSendNotification && status === 1) {
                    delete updateData.noti_time;
                    delete updateData.noti_status;
                }

                await prisma.heartrate_records.update({
                    where: {
                        heartrate_id: lastHR.heartrate_id
                    },
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

            if (status === 0) {
                console.log("อัตราการเต้นของหัวใจอยู่ในระดับปกติ");
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