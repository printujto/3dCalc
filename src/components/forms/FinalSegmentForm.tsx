import { Button, Input } from '@nextui-org/react'
import axios from 'axios'
import { useState } from 'react'
import emailjs from '@emailjs/browser'
import toast from 'react-hot-toast'

const FinalSegmentForm = () => {
    const [formErr, setFormErr] = useState('')

    const [firstName, setFirstName] = useState('')
    const [lastName, setLastName] = useState('')
    const [phone, setPhone] = useState('')
    const [email, setEmail] = useState('')
    const [street, setStreet] = useState('')
    const [city, setCity] = useState('')
    const [zipCode, setZipCode] = useState('')

    const sendOrder: React.FormEventHandler<HTMLFormElement> = async (e) => {
        //TODO: tady jeste jedno overovani, jestli jsou vsechny potrebne data zadane a posilas
        e.preventDefault()
        if (model) {
            const uploadData = new FormData()
            uploadData.append('upload_preset', 'file_upload_preset')
            uploadData.append('public_id', model.name.split('.')[0])
            uploadData.append('file', model)
            // uploadData.append('from_name', 'Pavel novotny')

            try {
                const result = await axios.post(
                    'https://api.cloudinary.com/v1_1/dlhgypwnv/raw/upload', // správná adresa pro soubory
                    uploadData
                )

                const formData = {
                    from_user: 'Test user',
                    message: 'Zprava od uzivatele',
                    modelUrl: result.data.secure_url,
                }

                const sendPromise = emailjs
                    .send(
                        'service_9itde3s',
                        'template_mef5ebc',
                        formData,
                        'wZ-guyfVuBq-M1VSk'
                    )
                    .then(
                        () => {
                            console.log('SUCCESS!')
                        },
                        (error) => {
                            console.log(error)

                            console.log('FAILED...', error.text)
                        }
                    )

                toast.promise(sendPromise, {
                    loading: 'Sending',
                    success: 'Formulář odeslán',
                    error: 'Někde se stala chyba',
                })
            } catch (error) {
                if (error) {
                    console.log(error)
                }
            }
        } else {
            console.log('neni model')
        }
    }

    return (
        <section className='flex flex-col gap-2'>
            <p>Kontaktní údaje:</p>
            <section className='flex gap-2'>
                <Input
                    className='w-full'
                    classNames={{
                        inputWrapper:
                            'bg-gray-200 data-[hover=true]:bg-gray-300 data-[focus=true]:!bg-gray-300',
                    }}
                    type='text'
                    label='Křestní jméno'
                />
                <Input
                    className='w-full'
                    classNames={{
                        inputWrapper:
                            'bg-gray-200 data-[hover=true]:bg-gray-300 data-[focus=true]:!bg-gray-300',
                    }}
                    type='text'
                    label='Přijmení'
                />
            </section>

            <Input
                className='w-full'
                classNames={{
                    inputWrapper:
                        'bg-gray-200 data-[hover=true]:bg-gray-300 data-[focus=true]:!bg-gray-300',
                }}
                type='text'
                label='email'
            />
            <Input
                className='w-full'
                classNames={{
                    inputWrapper:
                        'bg-gray-200 data-[hover=true]:bg-gray-300 data-[focus=true]:!bg-gray-300',
                }}
                type='text'
                label='telefon'
            />
            <p>Adresa:</p>
            <Input
                className='w-full'
                classNames={{
                    inputWrapper:
                        'bg-gray-200 data-[hover=true]:bg-gray-300 data-[focus=true]:!bg-gray-300',
                }}
                type='text'
                label='Ulice'
            />
            <section className='flex gap-2'>
                <Input
                    className='w-full'
                    classNames={{
                        inputWrapper:
                            'bg-gray-200 data-[hover=true]:bg-gray-300 data-[focus=true]:!bg-gray-300',
                    }}
                    type='text'
                    label='Město'
                />
                <Input
                    className='w-full'
                    classNames={{
                        inputWrapper:
                            'bg-gray-200 data-[hover=true]:bg-gray-300 data-[focus=true]:!bg-gray-300',
                    }}
                    type='text'
                    label='PSČ'
                />
            </section>
            <div className='h-5'>
                {formErr.length > 0 && (
                    <p className='text-sm text-red-500 text-right'>{formErr}</p>
                )}
            </div>

            <Button
                type='submit'
                className='mt-2 bg-gradient-to-tr from-violet from-30% to-pink text-white shadow-lg flex-1 text-lg font-semibold py-1'
            >
                Nezávazně objednat
            </Button>
        </section>
    )
}

export default FinalSegmentForm
