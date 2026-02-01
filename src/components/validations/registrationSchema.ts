import * as z from 'zod';

// --- 1. กฎพื้นฐาน ---
export const phoneRule = z
  .string()
  .min(1, "กรุณากรอกเบอร์โทรศัพท์")
  .length(10, "เบอร์โทรศัพท์ต้องมี 10 หลัก")
  .regex(/^[0-9]+$/, "ต้องเป็นตัวเลขเท่านั้น");

export const zipCodeRule = z
  .string()
  .min(1, "กรุณากรอกรหัสไปรษณีย์")
  .length(5, "รหัสไปรษณีย์ต้องมี 5 หลัก")
  .regex(/^[0-9]+$/, "ต้องเป็นตัวเลขเท่านั้น");

// --- 2. Schema หลัก ---
export const registrationSchema = z.object({
  users_fname: z.string().min(1, "กรุณากรอกชื่อ"),
  users_sname: z.string().min(1, "กรุณากรอกนามสกุล"),
  
  users_passwd: z.string().optional(),
  users_passwd_comfirm: z.string().optional(),
  
  users_pin: z.string()
    .length(4, "PIN ต้องมี 4 หลัก")
    .regex(/^[0-9]+$/, "ต้องเป็นตัวเลขเท่านั้น"),

  users_number: z.string().optional(),
  users_moo: z.string().optional(),
  users_road: z.string().optional(),
  users_tubon: z.string().min(1, "กรุณากรอกตำบล"),
  users_amphur: z.string().min(1, "กรุณากรอกอำเภอ"),
  users_province: z.string().min(1, "กรุณากรอกจังหวัด"),

  users_postcode: zipCodeRule, 
  users_tel1: phoneRule,
}).superRefine((data, ctx) => {
  // เช็ค Password ตรงกัน
  if (data.users_passwd && data.users_passwd !== data.users_passwd_comfirm) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "รหัสผ่านไม่ตรงกัน",
      path: ["users_passwd_comfirm"],
    });
  }
});

// 3. Export Type
export type RegistrationFormData = z.infer<typeof registrationSchema>;