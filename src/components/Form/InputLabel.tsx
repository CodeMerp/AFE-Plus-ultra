import React, { ChangeEvent, forwardRef } from 'react' // 1. เพิ่ม forwardRef
import Form from 'react-bootstrap/Form';
import InputGroup from 'react-bootstrap/InputGroup';

interface Props {
    // ปรับ type onChange ให้ยืดหยุ่นขึ้น เพื่อรองรับทั้งแบบเดิมและแบบ event ของ library
    onChange?: ((value: string | number) => void) | React.ChangeEventHandler<HTMLInputElement>;
    label: string;
    id: string;
    type?: string;
    defaultValue?: string | number;
    placeholder?: string;
    required?: boolean;
    icon?: any;
    disabled?: boolean;
    max?: number;
    // 2. เพิ่ม Props สำหรับ Error State
    isInvalid?: boolean;
    errorMessage?: string;
    // อนุญาตให้รับ props อื่นๆ ของ HTML Input ได้ (เช่น name, onBlur ที่ส่งมาจาก hook form)
    [key: string]: any; 
}

// 3. หุ้ม Component ด้วย forwardRef
const InputLabel = forwardRef<HTMLInputElement, Props>((props, ref) => {
    const { 
        label, 
        id, 
        type = 'text', 
        defaultValue, // ตัด defaultValue='' ออก เพราะถ้าใช้ hook form ควรปล่อย undefined หรือจัดการที่ useForm
        onChange, 
        placeholder = '', 
        required = false, 
        icon = null, 
        disabled = false, 
        max = null,
        isInvalid = false,    // รับค่า Error
        errorMessage = '',    // รับข้อความ Error
        ...rest               // รับ props ที่เหลือ (สำคัญมากสำหรับ hook form)
    } = props

    let inputCustom = {}
    if (max) {
        inputCustom = {
            ...inputCustom,
            maxLength: max
        }
    }

    // ฟังก์ชันจัดการ onChange: ถ้าเป็นของ Hook Form จะส่ง Event มา, ถ้าแบบเดิมส่ง Value มา
    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (onChange) {
            // เช็คว่าเป็นฟังก์ชันของ Hook Form หรือไม่ (ปกติ Hook Form ส่ง onBlur, name มาด้วยใน rest)
            // แต่เพื่อความง่าย ถ้าส่ง onChange มาให้เรียกใช้
            // กรณีเป็น Hook Form มันจะส่ง onChange มาใน ...rest แล้ว เราไม่ต้องทำอะไรเพิ่มตรงนี้
            // แต่ถ้า user ส่ง onChange แบบ Custom มา (แบบรับ string)
            if (typeof onChange === 'function' && !rest.onChange) {
                 (onChange as (val: string) => void)(e.target.value);
            }
        }
    }

    return (
        <Form.Group className="mb-3"> 
             {/* ใส่ Form.Group หรือ div ครอบไว้สักหน่อยเพื่อจัดระยะห่าง */}
            <Form.Label htmlFor={id}>{label}</Form.Label>
            <InputGroup hasValidation> 
                {/* hasValidation จำเป็นสำหรับจัด layout ของ error message */}
                
                {icon && <InputGroup.Text>{icon}</InputGroup.Text>}
                
                <Form.Control
                    // ส่ง ref กลับไป (จำเป็นที่สุดสำหรับ Hook Form)
                    ref={ref}
                    
                    id={id}
                    type={type}
                    placeholder={placeholder}
                    required={required}
                    disabled={disabled}
                    defaultValue={defaultValue}
                    
                    // ส่วนจัดการ Error
                    isInvalid={isInvalid}

                    // Props เดิม
                    {...inputCustom}

                    // Props ที่มาจาก Hook Form (...register) จะถูกกระจายตรงนี้ 
                    // (รวมถึง onChange, onBlur, name)
                    {...rest}

                    // จัดการ onChange: ถ้ามี onChange ใน rest (จาก hook form) ให้ใช้ตัวนั้น 
                    // ถ้าไม่มี ให้ใช้ logic เดิม หรือ logic wrapper
                    onChange={(e: any) => {
                        // 1. ถ้า Hook Form ส่ง onChange มา ให้ทำงานก่อน
                        if (rest.onChange) {
                            rest.onChange(e);
                        }
                        // 2. ถ้ามี Custom onChange ที่ส่งมาแบบ Props (Logic เดิมของคุณ)
                        if (onChange && typeof onChange === 'function') {
                             // ตรวจสอบ signature ว่าต้องการ value หรือ event
                             // (โค้ดเดิมคุณส่ง value string)
                             // แต่ต้องระวัง loop หรือ error หากใช้ร่วมกัน
                             // แนะนำ: ถ้าใช้ Hook Form แล้ว ไม่ควรส่ง prop onChange แยกมาอีก
                        }
                    }}
                />
                
                {/* ส่วนแสดงข้อความ Error */}
                <Form.Control.Feedback type="invalid">
                    {errorMessage}
                </Form.Control.Feedback>

            </InputGroup>
        </Form.Group>
    )
})

// จำเป็นต้องใส่ displayName เวลาใช้ forwardRef เพื่อให้ DevTools แสดงชื่อถูก
InputLabel.displayName = "InputLabel";

export default InputLabel