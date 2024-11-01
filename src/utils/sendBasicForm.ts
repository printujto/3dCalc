import FilesUpload from './filesUpload'
import emailjs from '@emailjs/browser'

type formData = {
    firstName: string
    lastName: string
    email: string
    phone: string
    description: string
    formFiles?: FileList
}

const SendBasicForm = async (formData: formData) => {
    if (formData.formFiles && formData.formFiles.length > 0) {
        const response = await FilesUpload(
            formData.formFiles,
            formData.firstName,
            formData.lastName
        )

        if (response?.status === 200) {
            console.log('success')

            console.log(response)

            const formDataWLink = {
                ...formData,
                url: response.data.link,
            }
            console.log(formDataWLink)

            const sendingPromise = emailjs.send(
                'service_pjm2ygi',
                import.meta.env.VITE_EMAILJS_TEMPLATE_BASIC_FORM_ID,
                formDataWLink,
                import.meta.env.VITE_EMAILJS_PUBLIC_KEY
            )
            return sendingPromise
        } else {
            console.log('Something went wrong')
        }
    } else {
        const sendingPromise = emailjs.send(
            'service_pjm2ygi',
            import.meta.env.VITE_EMAILJS_TEMPLATE_BASIC_FORM_ID,
            formData,
            import.meta.env.VITE_EMAILJS_PUBLIC_KEY
        )

        return sendingPromise
    }
}

export default SendBasicForm
