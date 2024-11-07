import { Button, Input, Textarea } from '@nextui-org/react'
import { useState } from 'react'
import Dropzone from 'react-dropzone'

import FormFileCard from '../FormFileCard'
import React from 'react'
import SendBasicForm from '../../utils/sendBasicForm'
import toast from 'react-hot-toast'

const BasicForm = () => {
    const [formFiles, setFormFiles] = useState<FileList>()
    const [formErr, setFormErr] = useState('')
    const [isUploading, setIsUploading] = useState(false)

    const [firstName, setFirstName] = useState('')
    const [lastName, setLastName] = useState('')
    const [phone, setPhone] = useState('')
    const [email, setEmail] = useState('')
    const [description, setDescription] = useState('')

    const sendForm: React.MouseEventHandler<HTMLButtonElement> = (e) => {
        e.preventDefault()
        setIsUploading(true)
        if (
            firstName === '' ||
            lastName === '' ||
            phone === '' ||
            email === '' ||
            description === ''
        ) {
            setFormErr('Prosíme, vyplňte povinné údaje')
        } else {
            const formData = {
                firstName: firstName,
                lastName: lastName,
                email: email,
                phone: phone,
                description: description,
                formFiles: formFiles,
            }

            const sendingPromise = SendBasicForm(formData)

            toast.promise(sendingPromise, {
                loading: 'Odesílám formulář',
                success: 'Formulář odeslán!',
                error: 'Někde se stala chyba',
            })

            sendingPromise.then(() => {
                setFirstName('')
                setLastName('')
                setEmail('')
                setPhone('')
                setDescription('')
                setFormErr('')
                setIsUploading(false)
            })
        }
    }

    return (
        <form className='gap-2 w-full'>
            <section className='flex flex-col gap-2'>
                <section className='flex gap-2'>
                    <Input
                        isRequired
                        className='w-full'
                        classNames={{
                            label: 'text-gray-600',
                            inputWrapper:
                                'bg-gray-300/50 data-[hover=true]:bg-gray-300/60 data-[focus=true]:!bg-gray-300/70',
                        }}
                        onChange={(e) => setFirstName(e.target.value)}
                        value={firstName}
                        type='text'
                        label='Křestní jméno'
                    />
                    <Input
                        isRequired
                        className='w-full'
                        classNames={{
                            label: 'text-gray-600',
                            inputWrapper:
                                'bg-gray-300/50 data-[hover=true]:bg-gray-300/60 data-[focus=true]:!bg-gray-300/70',
                        }}
                        onChange={(e) => setLastName(e.target.value)}
                        value={lastName}
                        type='text'
                        label='Přijmení'
                    />
                </section>

                <Input
                    isRequired
                    className='w-full'
                    classNames={{
                        label: 'text-gray-600',
                        inputWrapper:
                            'bg-gray-300/50 data-[hover=true]:bg-gray-300/60 data-[focus=true]:!bg-gray-300/70',
                    }}
                    onChange={(e) => setEmail(e.target.value)}
                    value={email}
                    type='text'
                    label='email'
                />
                <Input
                    isRequired
                    className='w-full'
                    classNames={{
                        label: 'text-gray-600',
                        inputWrapper:
                            'bg-gray-300/50 data-[hover=true]:bg-gray-300/60 data-[focus=true]:!bg-gray-300/70',
                    }}
                    onChange={(e) => setPhone(e.target.value)}
                    value={phone}
                    type='text'
                    label='telefon'
                />

                <Textarea
                    label='Popis'
                    placeholder='Zde rozepište váš požadavek'
                    isRequired
                    classNames={{
                        label: 'text-gray-600',
                        inputWrapper:
                            'bg-gray-300/50 data-[hover=true]:bg-gray-300/60 data-[focus=true]:!bg-gray-300/70',
                    }}
                    onChange={(e) => setDescription(e.target.value)}
                    value={description}
                />
                <p className='text-sm'>
                    Pro přesnější zadání můžete vložit fotky a soubory...
                </p>
                <div className='flex items-center justify-center w-full'>
                    <Dropzone
                        onDrop={(e) => {
                            const extension = e[0].name
                                .split('.')
                                .pop()
                                .toLowerCase()
                                .toString()

                            if (
                                extension === 'jpg' ||
                                extension === 'jpeg' ||
                                extension === 'png' ||
                                extension === 'gif' ||
                                extension === 'pdf'
                            ) {
                                setFormErr('')

                                if (!formFiles || formFiles.length < 1) {
                                    setFormFiles(e)
                                } else {
                                    const filesArray = Array.from(formFiles)
                                    const newItems = Array.from(e)

                                    newItems.forEach((item: File) => {
                                        filesArray.push(item)
                                    })

                                    const dataTransfer = new DataTransfer()

                                    filesArray.forEach((file) => {
                                        dataTransfer.items.add(file)
                                    })

                                    const newFileList = dataTransfer.files

                                    setFormFiles(newFileList)
                                }
                            } else {
                                setFormErr('Formát souboru není povolen')
                            }
                        }}
                    >
                        {({ getRootProps, getInputProps }) => (
                            <div
                                {...getRootProps()}
                                className='w-full h-52 border-2 border-gray-700/50 border-dashed rounded-lg cursor-pointer bg-gray-300/50 hover:bg-gray-200/50 duration-200'
                            >
                                <>
                                    <div
                                        className={`${
                                            !formFiles || formFiles.length < 1
                                                ? 'items-center justify-center w-full h-full'
                                                : 'items-start justify-start p-2 gap-2 overflow-y-scroll h-full'
                                        } select-none flex flex-col`}
                                    >
                                        <input
                                            {...getInputProps()}
                                            required
                                            type='file'
                                            accept='.jpg, .jpeg, .png, .gif, .pdf'
                                            name='file'
                                            id='dropzone-file'
                                            className='hidden'
                                        />
                                        {!formFiles || formFiles.length < 1 ? (
                                            <>
                                                <svg
                                                    className='w-8 h-8 mb-4  '
                                                    aria-hidden='true'
                                                    xmlns='http://www.w3.org/2000/svg'
                                                    fill='none'
                                                    viewBox='0 0 20 16'
                                                >
                                                    <path
                                                        stroke='currentColor'
                                                        d='M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2'
                                                    />
                                                </svg>
                                                <p className='mb-2 text-sm '>
                                                    <span className='font-semibold'>
                                                        Nahrát soubory
                                                    </span>
                                                </p>
                                                <p className='text-xs '>
                                                    .JPG .JPEG .PNG .GIF .PDF
                                                </p>
                                            </>
                                        ) : (
                                            <>
                                                {Array.from(formFiles).map(
                                                    (file, i) => (
                                                        <React.Fragment key={i}>
                                                            <FormFileCard
                                                                id={i}
                                                                file={file}
                                                                handleDelete={(
                                                                    id: number,
                                                                    event: React.MouseEvent
                                                                ) => {
                                                                    event.preventDefault()
                                                                    event.stopPropagation()

                                                                    const fileListArray =
                                                                        Array.from(
                                                                            formFiles
                                                                        )
                                                                    fileListArray.splice(
                                                                        id,
                                                                        1
                                                                    )

                                                                    const dataTransfer =
                                                                        new DataTransfer()

                                                                    fileListArray.forEach(
                                                                        (
                                                                            file
                                                                        ) => {
                                                                            dataTransfer.items.add(
                                                                                file
                                                                            )
                                                                        }
                                                                    )

                                                                    const newFileList =
                                                                        dataTransfer.files

                                                                    setFormFiles(
                                                                        newFileList
                                                                    )
                                                                }}
                                                            ></FormFileCard>
                                                        </React.Fragment>
                                                    )
                                                )}
                                            </>
                                        )}
                                    </div>
                                </>
                            </div>
                        )}
                    </Dropzone>
                </div>
            </section>
            <div className='h-5'>
                {formErr.length > 0 && (
                    <p className='text-sm text-red-500 text-right'>{formErr}</p>
                )}
            </div>

            <Button
                onClick={(e) => sendForm(e)}
                type='submit'
                className='w-full mt-2 bg-gradient-to-tr from-violet from-30% to-pink text-white shadow-lg flex-1 text-lg font-semibold py-1'
            >
                {isUploading ? <p>Odesílání</p> : <p>Odeslat poptávku</p>}
            </Button>
        </form>
    )
}

export default BasicForm
