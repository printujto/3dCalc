import axios from 'axios'
import JSZip from 'jszip'

const FilesUpload = async (
    data: FileList,
    firstName: string,
    lastName: string
) => {
    const upload = new FormData()
    const zip = new JSZip()

    console.log(data)

    if (!data) return

    Array.from(data).forEach((file) => {
        zip.file(file.name, file) // Přidá každý soubor do ZIP pod jeho jménem
    })

    const zipBlob = await zip.generateAsync({ type: 'blob' })
    upload.append('file', zipBlob, `${firstName}_${lastName}.zip`)

    const response = await axios.post(
        'https://printujtoserver.onrender.com/upload',
        upload,
        {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        }
    )

    return response
}

export default FilesUpload
