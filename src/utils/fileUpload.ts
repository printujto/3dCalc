import axios from 'axios'
import JSZip from 'jszip'

const fileUpload = async (model: File, firstName: string, lastName: string) => {
    const upload = new FormData()
    const zip = new JSZip()

    if (!model) return

    zip.file(model.name, model)

    const zipBlob = await zip.generateAsync({ type: 'blob' })
    upload.append('file', zipBlob, `${model.name}_${firstName}_${lastName}.zip`)

    const response = await axios.post(
        'https://printujtoserver.onrender.com/upload',
        upload,
        {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        }
    )

    console.log(response)
    return response
}

export default fileUpload
