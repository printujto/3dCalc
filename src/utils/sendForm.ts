import emailjs from '@emailjs/browser'
import fileUpload from './fileUpload'

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

const sendForm = async (formData: formData, model: File) => {
    const emailjsServiceID = import.meta.env.VITE_EMAILJS_SERVICE_ID
    const emailjsTemplateID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID
    const emailjsSecret = import.meta.env.VITE_EMAILJS_SECRET

    if (!emailjsServiceID || !emailjsTemplateID || !emailjsSecret) return

    const response = await fileUpload(
        model,
        formData.firstName,
        formData.lastName
    )

    const sendData = (formData = { ...formData, modelUrl: response.data.link })
    console.log(sendData)

    const sendingPromise = await emailjs.send(
        'service_9itde3s',
        emailjsTemplateID,
        sendData,
        emailjsSecret
    )

    return sendingPromise
}

export default sendForm
