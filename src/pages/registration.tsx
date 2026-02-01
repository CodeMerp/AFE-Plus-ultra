import withCommonData from '@/lib/withCommonData';
import { GetServerSideProps } from 'next';
import Image from 'next/image';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';
import Container from 'react-bootstrap/Container';
import Form from 'react-bootstrap/Form';
import ButtonState from '@/components/Button/ButtonState';
import InputLabel from '@/components/Form/InputLabel'; // ตัวที่คุณแก้ใหม่แล้ว
import ModalAlert from '@/components/Modals/ModalAlert';
import axios from 'axios';
import md5 from 'md5';

// --- เพิ่ม Import ---
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registrationSchema, RegistrationFormData } from '@/components/validations/registrationSchema';

import styles from '@/styles/page.module.css';

interface UserData {
    isLogin: boolean;
    data: any | null
}

const Registration = () => {
    const router = useRouter();
    const [alert, setAlert] = useState({ show: false, message: '' });
    const [displayName, setDisplayName] = useState<string>("");
    const [dataUser, setDataUser] = useState<UserData>({ isLogin: true, data: null });

    // --- Setup React Hook Form ---
    const { 
        register, 
        handleSubmit, 
        reset, 
        formState: { errors, isSubmitting } 
    } = useForm<RegistrationFormData>({
        resolver: zodResolver(registrationSchema),
        defaultValues: {
            users_pin: "",
            users_tel1: "",
            users_postcode: ""
        }
    });

    useEffect(() => {
        const auToken = router.query.auToken
        if (auToken) {
            onGetUserProfile(auToken as string)
            onGetUserData(auToken as string)
        }
    }, [router.query.auToken])

    const onGetUserProfile = async (auToken: string) => {
        try {
            const response = await axios.get(`${process.env.WEB_DOMAIN}/api/getProfile?id=${auToken}`);
            if (response.data) {
                setDisplayName(response.data.data?.displayName)
            }
        } catch (error) {
            setAlert({ show: true, message: 'ระบบไม่สามารถดึงข้อมูล LINE ของท่านได้ กรุณาลองใหม่อีกครั้ง' })
        }
    }

    const onGetUserData = async (auToken: string) => {
        try {
            const responseUser = await axios.get(`${process.env.WEB_DOMAIN}/api/user/getUser/${auToken}`);
            if (responseUser.data?.data) {
                const userData = responseUser.data.data;
                setDataUser({ isLogin: false, data: userData });
                
                // --- Reset ข้อมูลเข้า Form เมื่อดึงข้อมูลสำเร็จ ---
                reset({
                    users_fname: userData.users_fname,
                    users_sname: userData.users_sname,
                    users_pin: userData.users_pin,
                    users_number: userData.users_number,
                    users_moo: userData.users_moo,
                    users_road: userData.users_road,
                    users_tubon: userData.users_tubon,
                    users_amphur: userData.users_amphur,
                    users_province: userData.users_province,
                    users_postcode: userData.users_postcode,
                    users_tel1: userData.users_tel1,
                    // Password ไม่ต้อง reset กลับมา
                });

            } else {
                setDataUser({ isLogin: false, data: null })
            }
        } catch (error) {
            setDataUser({ isLogin: false, data: null })
            setAlert({ show: true, message: 'ระบบไม่สามารถดึงข้อมูลของท่านได้ กรุณาลองใหม่อีกครั้ง' })
        }
    }

    // --- Submit Function ---
    const onSubmit = async (formData: RegistrationFormData) => {
        try {
            // เช็คกรณีสร้างใหม่ (ไม่มี dataUser) ต้องกรอก Password
            if (!dataUser.data && (!formData.users_passwd || !formData.users_passwd_comfirm)) {
                setAlert({ show: true, message: 'กรุณากรอกรหัสผ่าน' });
                return;
            }

            const data = {
                users_line_id: router.query.auToken,
                users_fname: formData.users_fname,
                // Hash Password ถ้ามีการกรอก
                users_passwd: formData.users_passwd ? md5(formData.users_passwd) : undefined,
                users_pin: formData.users_pin,
                status_id: 1,
                users_sname: formData.users_sname,
                users_number: formData.users_number,
                users_moo: formData.users_moo,
                users_road: formData.users_road,
                users_tubon: formData.users_tubon,
                users_amphur: formData.users_amphur,
                users_province: formData.users_province,
                users_postcode: formData.users_postcode,
                users_tel1: formData.users_tel1,
            }

            await axios.post(`${process.env.WEB_DOMAIN}/api/registration/create`, data)
            
            if (typeof router.query.auToken === 'string') {
                onGetUserData(router.query.auToken);
            }
            setAlert({ show: true, message: 'บันทึกข้อมูลสำเร็จ' })

        } catch (error) {
            setAlert({ show: true, message: 'ไม่สามารถบันทึกข้อมูลได้' })
        }
    };

    return (
        <Container>
            <div className={styles.main}>
                <Image src={'/images/Logo.png'} width={100} height={100} alt="Logo" priority />
                <h1 className="py-2">ลงทะเบียน</h1>
            </div>
            <div className="px-5">
                <Form noValidate onSubmit={handleSubmit(onSubmit)}>
                    <Form.Group>
                        <InputLabel label="LINE-USER" id="lineUser" defaultValue={displayName} disabled required />
                    </Form.Group>
                    
                    <InputLabel 
                        label="ชื่อ" 
                        id="users_fname" 
                        placeholder="กรอกชื่อ" 
                        disabled={!!dataUser.data}
                        {...register("users_fname")}
                        isInvalid={!!errors.users_fname}
                        errorMessage={errors.users_fname?.message}
                    />

                    <InputLabel 
                        label="นามสกุล" 
                        id="users_sname" 
                        placeholder="กรอกนามสกุล" 
                        disabled={!!dataUser.data}
                        {...register("users_sname")}
                        isInvalid={!!errors.users_sname}
                        errorMessage={errors.users_sname?.message}
                    />

                    {
                        !dataUser.data && (
                            <>
                                <InputLabel 
                                    label="รหัสผ่าน" 
                                    id="users_passwd" 
                                    placeholder="กรอกรหัสผ่าน" 
                                    type="password" 
                                    {...register("users_passwd")}
                                    isInvalid={!!errors.users_passwd}
                                    errorMessage={errors.users_passwd?.message}
                                />
                                <InputLabel 
                                    label="รหัสผ่าน (อีกครั้ง)" 
                                    id="users_passwd_comfirm" 
                                    type="password" 
                                    placeholder="ยืนยันรหัสผ่าน" 
                                    {...register("users_passwd_comfirm")}
                                    isInvalid={!!errors.users_passwd_comfirm}
                                    errorMessage={errors.users_passwd_comfirm?.message}
                                />
                            </>
                        )
                    }

                    <InputLabel 
                        label="Pin 4 หลัก" 
                        id="users_pin" 
                        placeholder="1234" 
                        type="text" 
                        max={4}
                        disabled={!!dataUser.data}
                        {...register("users_pin")}
                        isInvalid={!!errors.users_pin}
                        errorMessage={errors.users_pin?.message}
                    />

                    <InputLabel label="เลขที่บ้าน" id="users_number" placeholder="123/12" disabled={!!dataUser.data} {...register("users_number")} />
                    <InputLabel label="หมู่" id="users_moo" placeholder="1" disabled={!!dataUser.data} {...register("users_moo")} />
                    <InputLabel label="ถนน" id="users_road" placeholder="-" disabled={!!dataUser.data} {...register("users_road")} />
                    
                    <InputLabel 
                        label="ตำบล" 
                        id="users_tubon" 
                        placeholder="กรอกตำบล" 
                        disabled={!!dataUser.data} 
                        {...register("users_tubon")}
                        isInvalid={!!errors.users_tubon}
                        errorMessage={errors.users_tubon?.message}
                    />
                    <InputLabel 
                        label="อำเภอ" 
                        id="users_amphur" 
                        placeholder="กรอกอำเภอ" 
                        disabled={!!dataUser.data} 
                        {...register("users_amphur")}
                        isInvalid={!!errors.users_amphur}
                        errorMessage={errors.users_amphur?.message}
                    />
                    <InputLabel 
                        label="จังหวัด" 
                        id="users_province" 
                        placeholder="กรอกจังหวัด" 
                        disabled={!!dataUser.data} 
                        {...register("users_province")}
                        isInvalid={!!errors.users_province}
                        errorMessage={errors.users_province?.message}
                    />
                    
                    {/* ใช้ ZipCode Rule จาก Schema */}
                    <InputLabel 
                        label="รหัสไปรษณีย์" 
                        id="users_postcode" 
                        placeholder="กรอกรหัสไปรษณีย์" 
                        type="number" 
                        max={5}
                        disabled={!!dataUser.data} 
                        {...register("users_postcode")}
                        isInvalid={!!errors.users_postcode}
                        errorMessage={errors.users_postcode?.message}
                    />
                    
                    {/* ใช้ Phone Rule จาก Schema */}
                    <InputLabel 
                        label="เบอร์โทรศัพท์" 
                        id="users_tel1" 
                        placeholder="กรอกเบอร์โทรศัพท์" 
                        type="number" 
                        max={10}
                        disabled={!!dataUser.data} 
                        {...register("users_tel1")}
                        isInvalid={!!errors.users_tel1}
                        errorMessage={errors.users_tel1?.message}
                    />

                    {
                        !dataUser.data && (
                            <Form.Group className="d-flex justify-content-center py-3">
                                <ButtonState 
                                    type="submit" 
                                    className={styles.button} 
                                    text={'บันทึก'} 
                                    icon="fas fa-save" 
                                    isLoading={isSubmitting} // ใช้ State ของ Hook Form
                                />
                            </Form.Group>
                        )
                    }

                </Form>
            </div>
            <ModalAlert show={alert.show} message={alert.message} handleClose={() => setAlert({ show: false, message: '' })} />
        </Container>
    )
}

export const getServerSideProps: GetServerSideProps = withCommonData({
    title: 'ลงทะเบียน',
    description: 'ลงทะเบียน',
    slug: '',
    titleBar: 'ลงทะเบียน'
});

export default Registration