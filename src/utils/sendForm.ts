import emailjs from '@emailjs/browser'
import filesUpload from './filesUpload'

type formData = {
    firstName: string
    lastName: string
    phone: string
    email: string
    street: string
    city: string
    zipcode: string
    note?: string
    modelQuality: string
    enviroment: string | false
    surfaceQuality: string | false
    material: string
    modelColor: string
    modelWeight: number
    modelDimensionX: number
    modelDimensionY: number
    modelDimensionZ: number
    count: number
    orderPrice: number
    carrier: string
    carrierPrice: number
    printPrice: number
}

const sendForm = async (formData: formData, model: FileList) => {
    const response = await filesUpload(
        model,
        formData.firstName,
        formData.lastName
    )

    const sendData = (formData = { ...formData, modelUrl: response.data.link })
    console.log(sendData)

    const sendingPromise = await emailjs.send(
        'service_pjm2ygi',
        import.meta.env.VITE_EMAILJS_TEMPLATE_3DCALC_ID,
        sendData,
        import.meta.env.VITE_EMAILJS_PUBLIC_KEY
    )

    return sendingPromise
}

export default sendForm
